import { Projector } from "parsegraph-projector";
import Rect from 'parsegraph-rect';
import {containsAny} from 'parsegraph-camera'

export class Occluder {
  _rects: Rect[];

  constructor() {
    this.clear();
  }

  clear() {
    this._rects = [];
  }

  occlude(x: number, y: number, w: number, h: number) {
    const newRect = new Rect(x, y, w, h);
    if (this._rects.some(rect => {
      return containsAny(rect.x(), rect.y(), rect.w(), rect.h(), x, y, w, h);
    })) {
      return false;
    }
    this._rects.push(newRect);
    return true;
  }
}

export class WorldLabel {
  _text: string;
  _x: number;
  _y: number;
  _size: number;
  _scale: number;

  text() {
    return this._text;
  }

  constructor(text: string, x: number, y: number, size: number, scale: number) {
    this._text = text;
    this._x = x;
    this._y = y;
    this._size = size;
    this._scale = scale;
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
}

export class WorldLabels {
  constructor() {
    this.clear();
  }

  _labels: WorldLabel[];

  draw(text: string, x: number, y: number, size: number, scale: number = 1) {
    this._labels.push(new WorldLabel(text, x, y, size, scale));
  }

  clear() {
    this._labels = [];
  }

  render(proj: Projector, scale: number = 1) {
    this._labels = this._labels.sort((a, b) => b.size() - a.size());
    const occluder = new Occluder();
    const drawnLabels = this._labels.filter((label) => {
      if (label.scale() <= scale) {
        return false;
      }
      proj.overlay().font = `${Math.round(label.size()/scale)}px sans`;
      const metrics = proj.overlay().measureText(label.text());
      const height =
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      const width = metrics.width;
      return occluder.occlude(scale * label.x(), scale * label.y(), width, height);
    });
    drawnLabels.forEach((label) => {
      proj.overlay().font = `${Math.round(label.size()/scale)}px sans`;
      proj.overlay().fillText(label.text(), label.x(), label.y());
    });
  }
}
