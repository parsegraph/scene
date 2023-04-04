import { Projector, BasicProjector } from "parsegraph-projector";
import TimingBelt from "parsegraph-timingbelt";
import AbstractScene from "./AbstractScene";
import { WorldLabels } from "./WorldLabel";
import Color from "parsegraph-color";
import { InputViewport, Viewport} from "./viewport";

import Camera, {containsAny} from "parsegraph-camera";
import {BasicMouseController, KeyController, Keystroke} from "parsegraph-input";
import ViewportKeyController from "./viewport/key";

const font = "96px sans-serif";

interface TileMap {
  get(x: number, y:number): Tile;
  movePlayer(dx: number): void;
  jumpPlayer(dy: number): void;
  contains(x: number, y:number): boolean;
  tileSize(): number;
  tileWidth(): number;
  tileHeight(): number;
  camera(): Camera;
  markDirty(): void;
}

interface TileType {
  color(): Color;
}

class Tile {
  _x: number;
  _y: number;
  _map: TileMap;
  _tileType: TileType;

  map() {
    return this._map;
  }

  constructor(tileMap: TileMap, x: number, y: number, tileType: TileType) {
    this._map = tileMap;
    this._x = x;
    this._y = y;
    this._tileType = tileType;
  }

  type() {
    return this._tileType;
  }

  setType(tileType: TileType) {
    if (this._tileType === tileType) {
      return;
    }
    this._tileType = tileType;
    this.map().markDirty();
  }

  x() {
    return this._x;
  }

  y() {
    return this._y;
  }
}

class BasicTileType implements TileType {
  _color: Color;
  constructor(color: Color) {
    this._color = color;
  }

  color() {
    return this._color;
  }

  setColor(color: Color) {
    this._color = color;
  }
}

const SKY = new BasicTileType(new Color(0, 0, 1, 1));
const GROUND = new BasicTileType(new Color(0.5, 0.5, 0, 1));

class TileScene extends AbstractScene implements TileMap {
  _camera: Camera;

  _tiles: Tile[][];
  _tileSize: number;

  _playerPos: [number, number];

  _lastTick: number;

  constructor(projector: Projector, tileSize: number, tileWidth: number, tileHeight: number) {
    super(projector);

    this._camera = null;
    this._tiles = [];
    this._tileSize = tileSize;
    for(let x = 0; x < tileWidth; ++x) {
      const column:Tile[] = [];
      this._tiles.push(column);
      for(let y = 0; y < tileHeight; ++y) {
        column.push(new Tile(this, x, y, (x % 5 === 0 || y % 2 === 0) ? SKY : GROUND));
      }
    }
    this._playerPos = [0, 0];

    this._lastTick = null;
  }

  movePlayer(dx: number) {
    if (dx > 0) {
      if (this.getPlayerForward()?.type() === GROUND) {
        return;
      }
      this._playerPos[0] += dx;
      if (this.getPlayerForward()?.type() === GROUND) {
        this._playerPos[0] -= this._playerPos[0] - Math.floor(this._playerPos[0]);
      }
    }
    if (dx < 0) {
      if (this.getPlayerBackward()?.type() === GROUND) {
        return;
      }
      this._playerPos[0] += dx;
      if (this.getPlayerBackward()?.type() === GROUND) {
        this._playerPos[0] += Math.ceil(this._playerPos[0]) - this._playerPos[0];
      }
    }
    this.markDirty();
  }

  jumpPlayer(dy: number) {
    if (dy > 0) {
      dy = Math.min(dy, this.getPlayerCeiling());
      if (dy === 0) {
        console.log("CEILING HIT");
        return;
      }
    }
    this._playerPos[1] += -dy;
    this.markDirty();
  }

  tileWidth() {
    return this._tiles.length;
  }

  tileHeight() {
    return this._tiles[0].length;
  }

  camera() {
    return this._camera;
  }

  tileSize() {
    return this._tileSize;
  }

  contains(px: number, py: number) {
    if (px < 0 || py < 0) {
      return false;
    }
    if (px >= this.tileWidth()  || py >= this.tileHeight()) {
      return false;
    }
    return true;
  }

  get(x: number, y:number) {
    return this._tiles[x]?.[y];
  }

  set(x: number, y:number, type: TileType) {
    this.get(x, y).setType(type);
    this.scheduleUpdate();
  }

  getPlayerCeiling() {
    let d = 0;
    if (this.get(Math.floor(this._playerPos[0]), Math.floor(this._playerPos[1]))?.type() === SKY) {
      d += this._playerPos[1] % 1;
    } else {
      return 0;
    }
    for(let i = 0; (this.get(Math.floor(this._playerPos[0]), Math.floor(this._playerPos[1] - i))?.type() === SKY) ; --i) {
      d += 1;
    }
    return d;
  }

  getPlayerForward() {
    return this.get(Math.floor(this._playerPos[0]) + 1, Math.floor(this._playerPos[1]));
  }

  getPlayerBackward() {
    return this.get(Math.ceil(this._playerPos[0]) - 1, Math.ceil(this._playerPos[1]));
  }

  getPlayerGround() {
    return this.get(Math.floor(this._playerPos[0]), Math.floor(this._playerPos[1]) + 1);
  }

  tick() {
    const now = Date.now();
    if (!this._lastTick) {
      this._lastTick = now;
      return false;
    }
    const elapsed = now - this._lastTick;
    this._lastTick = now;
    if (this.getPlayerGround()?.type() === SKY) {
      this.jumpPlayer(-elapsed / 1000);
      if (this.getPlayerGround()?.type() === GROUND) {
        this.jumpPlayer(this._playerPos[1] - Math.floor(this._playerPos[1]));
      }
    }
    return false;
  }

  paint() {
    const needsUpdate = super.paint();
    return needsUpdate;
  }

  render() {
    const needsUpdate = super.render();
    const proj = this.projector();

    const ctx = proj.overlay();
    const wt = this.worldTransform();
    const ts = this.tileSize();

    this._tiles.forEach(column => {
      column.forEach(tile => {
        const cx = tile.x() * ts;
        const cy = tile.y() * ts;

        if (!containsAny(
          -wt.x() + wt.width()/2/wt.scale(),
          -wt.y() + wt.height()/2/wt.scale(),
          wt.width()/wt.scale(),
          wt.height()/wt.scale(),
          cx + ts/2, cy + ts/2, ts, ts)) {
          return;
        }
        ctx.fillStyle = tile.type().color().asRGBA();
        ctx.fillRect(tile.x() * ts, tile.y() * ts, ts, ts);
      });
    });

    const [playerX, playerY] = this._playerPos;
    ctx.fillStyle = "green";
    ctx.fillRect(ts * playerX, ts * playerY, ts, ts);

    ctx.resetTransform();
    ctx.font = "24px mono";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.fillText(`Player: ${this._playerPos[0]}, ${this._playerPos[1]}`, 0, 0);
    ctx.fillText(`Ceiling: ${this.getPlayerCeiling()}`, 0, 28 * 1);
    ctx.fillText(`Ground: ${this.getPlayerGround()?.type() === SKY ? "SKY" : "GROUND"}`, 0, 28 * 2);
    ctx.fillText(`Backward: ${this.getPlayerBackward()?.type() === SKY ? "SKY" : "GROUND"}`, 0, 28 * 3);
    ctx.fillText(`Forward: ${this.getPlayerForward()?.type() === SKY ? "SKY" : "GROUND"}`, 0, 28 * 4);

    return needsUpdate;
  }

  setCamera(camera: Camera) {
    this._camera = camera;
  }
}

const distance = (ax:number, ay:number, bx:number, by:number) => {
  return Math.sqrt(
    Math.pow(bx - ax, 2) + Math.pow(by - ay, 2)
  );
}

class ScrollerKeyController extends ViewportKeyController {
  constructor(viewport: InputViewport, map: TileMap) {
    super(viewport);
    this._map = map;
  }
  map() {
    return this._map;
  }
  _map: TileMap;
  update(t: Date) {
    let needsUpdate = super.update(t);
    const speed = 2;
    if (this.getKey("a")) {
      this.map().movePlayer(-speed * this.keyElapsed("a", t));
    }
    if (this.getKey("d")) {
      this.map().movePlayer(speed * this.keyElapsed("d", t));
    }
    if (this.getKey(" ")) {
      this.map().jumpPlayer(speed * this.keyElapsed(" ", t));
    }
    return needsUpdate;
  }
}

class ScrollerMouseController extends BasicMouseController {
  _map: TileMap;

  constructor(map: TileMap) {
    super();
    this._map = map;
  }

  map() {
    return this._map;
  }

  mousemove(x: number, y: number): boolean {
    return false;
  }

  mouseup() {
    return false;
  }

  mousedown(button: any, downStart: number, x: number, y: number) {
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("demo");

  const belt = new TimingBelt();
  const proj = new BasicProjector();
  proj.container().tabIndex = 0;
  const scene = new TileScene(proj, 100, 256, 64);

  const viewport = new Viewport(new Color(0.2, 0.2, 0.2, 1));

  const mouse = new ScrollerMouseController(scene);
  viewport.mouse().setNext(mouse);
  const key = new ScrollerKeyController(viewport, scene);
  viewport.key().setNext(key);
  viewport.setScene(scene);
  scene.setCamera(viewport.camera());

  setInterval(()=>{
    scene.markDirty();
  }, 100);

  belt.addRenderable(viewport);
  root.appendChild(proj.container());
});
