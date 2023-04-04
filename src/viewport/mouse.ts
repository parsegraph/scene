import { makeInverse3x3, matrixTransform2D } from "parsegraph-matrix";
import { BasicMouseController, MouseController } from "parsegraph-input";
import { logc } from "parsegraph-log";

import InputViewport, { MIN_CAMERA_SCALE } from "./InputViewport";

export default class ViewportMouseController extends BasicMouseController {
  _dragging: boolean;
  _mouseVersion: number;
  _viewport: InputViewport;
  _next: MouseController;

  constructor(viewport: InputViewport) {
    super();
    this._mouseVersion = 0;
    this._next = null;
    this._viewport = viewport;
    this._dragging = false;
  }

  viewport() {
    return this._viewport;
  }

  scheduleRepaint() {
    this.viewport().scheduleRepaint();
  }

  mouseVersion() {
    return this._mouseVersion;
  }

  mouseChanged() {
    ++this._mouseVersion;
  }

  update(t: Date) {
    let needsUpdate = this.next()?.update(t);
    needsUpdate =
      needsUpdate || this.viewport().mouseVersion() !== this.mouseVersion();
    if (needsUpdate) {
      logc("Schedule updates", "Mouse needs update");
    }
    return needsUpdate;
  }

  next() {
    return this._next;
  }

  setNext(next: MouseController) {
    this._next = next;
  }

  mouseDrag(_: number, _2: number, dx: number, dy: number) {
    this.mouseChanged();
    const camera = this.viewport().camera();
    // console.log("Adjust orig", dx, dx / camera.scale(), dy / camera.scale());
    camera.adjustOrigin(dx / camera.scale(), dy / camera.scale());
    this.scheduleRepaint();
    return true;
  }

  mousedown(button: any, downTime: number, x: number, y: number): boolean {
    if (this.next()?.mousedown(button, downTime, x, y)) {
      return true;
    }

    super.mousedown(button, downTime, x, y);

    const mouseInWorld = matrixTransform2D(
      makeInverse3x3(this.viewport().camera().worldMatrix()),
      x,
      y
    );

    this._dragging = true;
    this.mouseDrag(mouseInWorld[0], mouseInWorld[1], 0, 0);
    return true;
  }

  lastMouseX() {
    return this.next()?.lastMouseX() ?? super.lastMouseX();
  }

  lastMouseY() {
    return this.next()?.lastMouseY() ?? super.lastMouseX();
  }

  mousemove(x: number, y: number): boolean {
    if (this.next()?.mousemove(x, y)) {
      return true;
    }

    const dx = x - this.lastMouseX();
    const dy = y - this.lastMouseY();
    super.mousemove(x, y);

    // Moving during a mousedown i.e. dragging (or zooming)
    if (this._dragging && !isNaN(dx) && !isNaN(dy)) {
      const mouseInWorld = matrixTransform2D(
        makeInverse3x3(this.viewport().camera().worldMatrix()),
        x,
        y
      );
      return this.mouseDrag(mouseInWorld[0], mouseInWorld[1], dx, dy);
    }

    this.mouseChanged();
    return true;
  }

  mouseup(button: any, downTime: number, x: number, y: number) {
    if (this.next()?.mouseup(button, downTime, x, y)) {
      return true;
    }

    super.mouseup(button, downTime, x, y);
    this._dragging = false;
    return false;
  }

  wheel(mag: number, x: number, y: number): boolean {
    if (this.next()?.wheel(mag, x, y)) {
      return true;
    }

    super.wheel(mag, x, y);

    // Adjust the scale.
    const numSteps = mag > 0 ? -1 : 1;
    const camera = this.viewport().camera();
    if (numSteps > 0 || camera.scale() >= MIN_CAMERA_SCALE) {
      // console.log("Zooming to", x, y, camera.transform(x, y), camera.scale());
      camera.zoomToPoint(Math.pow(1.1, numSteps), x, y);
    }
    this.mouseChanged();
    this.scheduleRepaint();
    return true;
  }
}
