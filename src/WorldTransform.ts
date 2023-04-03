import Camera from "parsegraph-camera";
import {
  Matrix3x3,
  matrixIdentity3x3,
} from "parsegraph-matrix";
import { Projector } from "parsegraph-projector";
import { WorldLabels } from "./WorldLabel";

export default class WorldTransform {
  _world: Matrix3x3;
  _scale: number;
  _width: number;
  _height: number;
  _x: number;
  _y: number;
  _labels: WorldLabels;

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
    this._labels = null;
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
    this.setLabels(other.labels());
  }

  setLabels(labels: WorldLabels) {
    this._labels = labels;
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

  labels() {
    return this._labels;
  }

  render(proj: Projector) {
    this._labels.render(proj, this);
  }

  applyTransform(
    proj: Projector,
    camScale: number = 1
  ):void {
    if (proj.hasOverlay()) {
      const overlay = proj.overlay();
      overlay.resetTransform();
      overlay.clearRect(0, 0, proj.width(), proj.height());

      overlay.translate(this.x(), this.y());
      overlay.scale(camScale, camScale);
    }
    if (proj.hasDOMContainer()) {
      const camScaleTx = `scale(${camScale}, ${camScale})`;
      const translate = `translate(${this.x()}px, ${this.y()}px)`;
      proj.getDOMContainer().style.transform = [
        translate,
        camScaleTx,
      ].join(" ");
    }
  }

  static fromPos(
    x: number,
    y: number,
    scale: number,
    width: number,
    height: number
  ): WorldTransform {
    const cam = new Camera();
    cam.setSize(width, height);
    cam.setOrigin(x, y);
    cam.setScale(scale);
    return new WorldTransform(cam.project(), scale, width, height, x, y);
  }

  static fromCamera(cam: Camera): WorldTransform {
    return new WorldTransform(
      cam.canProject() ? cam.project() : matrixIdentity3x3(),
      cam.scale(),
      cam.width(),
      cam.height(),
      cam.x(),
      cam.y()
    );
  }
}
