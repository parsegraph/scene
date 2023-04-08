import { Projector, BasicProjector } from "parsegraph-projector";
import TimingBelt from "parsegraph-timingbelt";
import Color from "parsegraph-color";
import Camera, {containsAny} from "parsegraph-camera";
import {BasicMouseController, KeyController, Keystroke} from "parsegraph-input";

import Viewport from "../viewport/Viewport";
import CameraScene from "../CameraScene";
import AllInputs from "../input/AllInputs";
import Background from "../viewport/Background";

interface Brush {
  draw(map: TileMap, selectedX: number, selectedY: number, c: Color): void;
}

class PaintBrush implements Brush {
  _brushSize: number;
  _color: Color;

  constructor(brushSize: number = 16, color: Color = null) {
    this._brushSize = brushSize;
    this._color = color;
  }

  draw(map: TileMap, selectedX: number, selectedY: number, c: Color): void {
    map.get(selectedX, selectedY).setColor(c);

    const brushSize = this._brushSize;
    for(let bx = 0; bx < 2 * brushSize; ++bx) {
      for(let by = 0; by < 2 * brushSize; ++by) {
        const px = selectedX - brushSize + bx;
        const py = selectedY - brushSize + by;

        if (!map.contains(px, py)) {
          continue;
        }

        const lerp = (distance(selectedX, selectedY, px, py) / brushSize);
        const mixed = (this._color ?? c).clone().interpolate(map.get(px, py).color(), lerp);
        map.get(px, py).setColor(mixed);
      }
    }
  }
}

class PencilBrush implements Brush {
  _brushSize: number;
  _color: Color;

  constructor(brushSize: number = 1, color: Color = null) {
    this._brushSize = brushSize;
    this._color = color;
  }

  draw(map: TileMap, selectedX: number, selectedY: number, c: Color): void {
    const brushSize = this._brushSize;
    for(let bx = 0; bx < 2 * brushSize; ++bx) {
      for(let by = 0; by < 2 * brushSize; ++by) {
        const px = selectedX - brushSize + bx;
        const py = selectedY - brushSize + by;

        if (!map.contains(px, py)) {
          continue;
        }

        map.get(px, py).setColor(this._color ?? c);
      }
    }
  }
}

interface TileMap {
  get(x: number, y:number): Tile;
  contains(x: number, y:number): boolean;
  tileSize(): number;
  tileWidth(): number;
  tileHeight(): number;
  camera(): Camera;
  markDirty(): void;
}

class Tile {
  _color: Color;
  _x: number;
  _y: number;
  _map: TileMap;

  color() {
    return this._color;
  }

  setColor(color: Color) {
    this._color = color;
    this.map().markDirty();
  }

  map() {
    return this._map;
  }

  constructor(tileMap: TileMap, x: number, y: number) {
    this._map = tileMap;
    this._x = x;
    this._y = y;
    this._color = Color.random(0.5, 1);
  }

  x() {
    return this._x;
  }

  y() {
    return this._y;
  }
}

class TileScene extends CameraScene implements TileMap {

  _tiles: Tile[][];
  _tileSize: number;

  constructor(projector: Projector, tileSize: number, tileWidth: number, tileHeight: number) {
    super(projector, new Camera());

    this._tiles = [];
    this._tileSize = tileSize;
    for(let x = 0; x < tileWidth; ++x) {
      const column:Tile[] = [];
      this._tiles.push(column);
      for(let y = 0; y < tileHeight; ++y) {
        column.push(new Tile(this, x, y));
      }
    }
  }

  tileWidth() {
    return this._tiles.length;
  }

  tileHeight() {
    return this._tiles[0].length;
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
    return this._tiles[x][y];
  }

  set(x: number, y:number, color: Color) {
    this.get(x, y).setColor(color);
    this.scheduleUpdate();
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

    this._tiles.forEach(column => {
      column.forEach(tile => {
        const ts = this.tileSize();
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
        ctx.fillStyle = tile.color().asRGBA();
        ctx.fillRect(tile.x() * ts, tile.y() * ts, ts, ts);
      });
    });

    return needsUpdate;
  }
}

const distance = (ax:number, ay:number, bx:number, by:number) => {
  return Math.sqrt(
    Math.pow(bx - ax, 2) + Math.pow(by - ay, 2)
  );
}

interface BrushSink {
  setBrush(brush: Brush): void;
}

class ScrollerKeyController implements KeyController {
  _paintBrush: Brush;
  _pencilBrush: Brush;

  _sink: BrushSink;

  constructor(sink: BrushSink) {
    // A map of keyName's to a true value.
    this._sink = sink;

    this._paintBrush = new PaintBrush();
    this._pencilBrush = new PencilBrush();
  }

  sink() {
    return this._sink;
  }

  keydown(event: Keystroke) {
    switch(event.key()) {
    case "1":
      this.sink().setBrush(this._paintBrush);
      return true;
    case "2":
      this.sink().setBrush(this._pencilBrush);
      return true;
    case "3":
      this.sink().setBrush(new PencilBrush(1, new Color(0, 0, 0, 1)));
      return true;
    case "4":
      this.sink().setBrush(new PaintBrush(8, new Color(1, 1, 1, 1)));
      return true;
    }
    return false;
  }

  keyup(_event: Keystroke) {
    return false;
  }

  tick(_cycleStart: number) {
    return false;
  }
}

class ScrollerMouseController extends BasicMouseController {
  _map: TileMap;

  _drawing: boolean;

  constructor(map: TileMap) {
    super();
    this._map = map;
    this._drawing = false;
    this._brush = new PaintBrush(1);
  }

  map() {
    return this._map;
  }

  mousemove(x: number, y: number): boolean {
    if (!this._drawing) {
      return false;
    }
    this.draw(x, y);
  }

  _brush: Brush;
  setBrush(brush: Brush) {
    this._brush = brush;
  }

  draw(x: number, y: number): boolean {
    const ts = this.map().tileSize();

    const [worldX, worldY] = this.map().camera().transform(x, y);

    const tw = this.map().tileWidth();
    const th = this.map().tileHeight();

    if (!containsAny(
      ts * tw/2,
      ts * th/2,
      ts * tw,
      ts * th,
      worldX,
      worldY,
      1,1
    )) {
      return false;
    }

    const selectedX = Math.floor(worldX / ts);
    const selectedY = Math.floor(worldY / ts);
    const c = Color.random(1, 1);
    this._brush.draw(this.map(), selectedX, selectedY, c);
    return true;
  }

  mouseup() {
    if (!this._drawing) {
      return false;
    }
    this._drawing = false;
    return true;
  }

  mousedown(button: any, downStart: number, x: number, y: number) {
    if (button != "2") {
      console.log("Not handled");
      return false;
    }

    super.mousedown(button, downStart, x, y);
    if (this.draw(x, y)) {
      this._drawing = true;
      return true;
    }
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("demo");

  const belt = new TimingBelt();
  const proj = new BasicProjector();
  proj.container().tabIndex = 0;
  const inputs = new AllInputs(
    proj.container(),
    proj.container()
  );

  const viewport = new Viewport(inputs);
  const bg = new Background(proj, new Color(0.2, 0.2, 0.2, 1));
  viewport.scene().addToBack(bg);

  const scene = new TileScene(proj, 100, 500, 300);
  viewport.scene().addToFront(scene);

  const mouse = new ScrollerMouseController(scene);
  viewport.mouse().addToFront(mouse);
  const key = new ScrollerKeyController(mouse);
  viewport.key().addToFront(key);

  belt.addRenderable(viewport);
  root.appendChild(proj.container());
});
