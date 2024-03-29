import { Projector } from "parsegraph-projector";
import Rect from "parsegraph-rect";
import { containsAny } from "parsegraph-camera";
import Color from "parsegraph-color";
import WorldTransform from "./WorldTransform";

export class Occluder {
  _rects: Rect[];
  _bbox: Rect;

  constructor(x: number, y: number, width: number, height: number) {
    this._bbox = new Rect(x, y, width, height);
    this.clear();
  }

  clear() {
    this._rects = [];
  }

  occlude(x: number, y: number, w: number, h: number) {
    if (
      !containsAny(
        this._bbox.x(),
        this._bbox.y(),
        this._bbox.width(),
        this._bbox.height(),
        x,
        y,
        w,
        h
      )
    ) {
      // console.log("Occluded outside bbox", this._bbox.toString(), x, y, w, h);
      return false;
    }
    if (
      this._rects.some((rect) => {
        return containsAny(rect.x(), rect.y(), rect.w(), rect.h(), x, y, w, h);
      })
    ) {
      return false;
    }
    const newRect = new Rect(x, y, w, h);
    this._rects.push(newRect);
    return true;
  }
}

const DEFAULT_COLOR = new Color(0, 0, 0, 1);

export class WorldLabel {
  _text: string;
  _x: number;
  _y: number;
  _size: number;
  _scale: number;
  _color: Color;
  _strokeColor: Color;

  text() {
    return this._text;
  }

  constructor(
    text: string,
    x: number,
    y: number,
    size: number,
    scale: number,
    color: Color,
    strokeColor: Color
  ) {
    this._text = text;
    this._x = x;
    this._y = y;
    this._size = size;
    this._scale = scale;
    this._color = color;
    this._strokeColor = strokeColor;
  }

  x() {
    return this._x;
  }

  scale() {
    return this._scale;
  }

  y() {
    return this._y;
  }

  size() {
    return this._size;
  }

  color() {
    return this._color ?? DEFAULT_COLOR;
  }

  strokeColor() {
    return this._strokeColor;
  }
}

export class WorldLabels {
  _lineWidth: number;
  _font: string;
  _scaleMultiplier: number;

  constructor() {
    this.clear();
    this._lineWidth = 2;
    this._scaleMultiplier = 1;
    this._font = "sans-serif";
  }

  _labels: WorldLabel[];

  draw(
    text: string,
    x: number,
    y: number,
    size: number,
    scale: number = 1,
    color: Color = null,
    strokeColor: Color = null
  ) {
    this._labels.push(
      new WorldLabel(text, x, y, size, scale, color, strokeColor)
    );
  }

  clear() {
    this._labels = [];
  }

  lineWidth() {
    return this._lineWidth;
  }

  setLineWidth(width: number) {
    this._lineWidth = width;
  }

  font() {
    return this._font;
  }

  setFont(font: string) {
    this._font = font;
  }

  setScaleMultiplier(multiplier: number) {
    this._scaleMultiplier = multiplier;
  }

  render(proj: Projector, wt: WorldTransform) {
    const x = wt.x();
    const y = wt.y();
    const scale = wt.scale();
    const w = wt.width() / scale;
    const h = wt.height() / scale;
    this._labels = this._labels.sort((a, b) => b.size() - a.size());
    const occluder = new Occluder(-x + w / 2, -y + h / 2, w, h);
    const drawnLabels = this._labels.filter((label) => {
      if (label.scale() <= scale / this._scaleMultiplier) {
        return false;
      }
      proj.overlay().font = `${Math.round(
        label.size() / scale
      )}px ${this.font()}`;
      const metrics = proj.overlay().measureText(label.text());
      const height =
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      const width = metrics.width;
      return occluder.occlude(label.x(), label.y(), width, height);
    });
    drawnLabels.forEach((label) => {
      const overlay = proj.overlay();
      overlay.font = `${Math.round(label.size() / scale)}px ${this.font()}`;
      overlay.strokeStyle = label.strokeColor()
        ? label.strokeColor().asRGB()
        : label.color().luminance() < 0.1
        ? "white"
        : "black";
      overlay.miterLimit = this.lineWidth();
      overlay.lineWidth = this.lineWidth() / scale;
      overlay.lineCap = "round";
      overlay.textAlign = "center";
      overlay.textBaseline = "middle";
      proj.overlay().strokeText(label.text(), label.x(), label.y());
      proj.overlay().fillStyle = label.color().asRGB();
      proj.overlay().fillText(label.text(), label.x(), label.y());
    });
  }
}
