import Camera from "parsegraph-camera";
import {
  makeScale3x3I,
  makeTranslation3x3I,
  matrixMultiply3x3I,
  Matrix3x3,
  matrixIdentity3x3,
} from "parsegraph-matrix";
import {Projector} from "parsegraph-projector";
import {LayoutNode} from "parsegraph-layout";

const scaleMat = matrixIdentity3x3();
const transMat = matrixIdentity3x3();
const worldMat = matrixIdentity3x3();
export default class WorldTransform {
  _world: Matrix3x3;
  _scale: number;
  _width: number;
  _height: number;
  _x: number;
  _y: number;

  constructor(
    world: Matrix3x3 = matrixIdentity3x3(),
    scale: number = 1.0,
    width: number = NaN,
    height: number = NaN,
    x: number = NaN,
    y: number = NaN
  ) {
    this._world = world;
    this._scale = scale;
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
  }

  setMatrix(world: Matrix3x3, scale: number) {
    this._world = world;
    this._scale = scale;
  }

  setOrigin(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  setSize(w: number, h: number) {
    this._width = w;
    this._height = h;
  }

  set(other: WorldTransform) {
    const otherMat = other.matrix();
    for (let i = 0; i < 9; ++i) {
      this._world[i] = otherMat[i];
    }
    this._scale = other.scale();
    this._width = other.width();
    this._height = other.height();
    this._x = other.x();
    this._y = other.y();
  }

  matrix() {
    return this._world;
  }

  scale() {
    return this._scale;
  }

  x() {
    return this._x;
  }

  y() {
    return this._y;
  }

  width() {
    return this._width;
  }

  height() {
    return this._height;
  }

  apply(proj: Projector, rootNode: LayoutNode, camScale: number = 1):void {
    const layout = rootNode.value().getLayout();
    const rootScale = rootNode.state().scale();
    if (proj.hasOverlay()) {
      const overlay = proj.overlay();
      overlay.resetTransform();
      overlay.clearRect(0, 0, proj.width(), proj.height());

      overlay.translate(
        this.x(),
        this.y()
      );
      overlay.scale(camScale, camScale);
      overlay.scale(rootScale * layout.absoluteScale(), rootScale * layout.absoluteScale());
    }
    if (proj.hasDOMContainer()) {
      const camScaleTx = `scale(${camScale}, ${camScale})`;
      const translate = `translate(${this.x()}px, ${this.y()}px)`;
      const nodeScale = `scale(${layout.absoluteScale()}, ${layout.absoluteScale()})`;
      proj.getDOMContainer().style.transform = [
        translate,
        camScaleTx,
        nodeScale,
      ].join(" ");
    }
  }

  static fromCamera(rootNode: LayoutNode, cam:Camera):WorldTransform {
    const layout = rootNode.value().getLayout();
    const project = () => {
      const world: Matrix3x3 = cam.project();
      makeScale3x3I(scaleMat, layout.absoluteScale());
      makeTranslation3x3I(transMat, layout.absoluteX(), layout.absoluteY());
      matrixMultiply3x3I(worldMat, scaleMat, transMat);
      matrixMultiply3x3I(worldMat, worldMat, world);
      return world;
    };
    return new WorldTransform(
      cam.canProject() ? project() : matrixIdentity3x3(),
      cam.scale() * rootNode.state().scale(),
      cam.width(),
      cam.height(),
      cam.x() + layout.absoluteX(),
      cam.y() + layout.absoluteY()
    );
  }
}
