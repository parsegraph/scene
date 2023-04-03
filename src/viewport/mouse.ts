import { makeInverse3x3, matrixTransform2D } from "parsegraph-matrix";
import { BasicMouseController } from "parsegraph-input";
import { logc } from "parsegraph-log";

import InputViewport, { MIN_CAMERA_SCALE } from "./InputViewport";

export default class ViewportMouseController extends BasicMouseController {
  _dragging: boolean;
  _mouseVersion: number;
  _mousePos: [number, number];
  _viewport: InputViewport;

  constructor(viewport: InputViewport) {
    super();
    this._mousePos = [0, 0];
    this._mouseVersion = 0;
    this._viewport = viewport;
    this._dragging = false;
  }

  viewport() {
    return this._viewport;
  }

  savePos(x: number, y: number) {
    this._mousePos[0] = x;
    this._mousePos[1] = y;
  }

  update(_: Date) {
    const needsUpdate = this.viewport().mouseVersion() !== this.mouseVersion();
    if (needsUpdate) {
      logc("Schedule updates", "Mouse needs update");
    }
    return needsUpdate;
  }

  mouseDrag(_: number, _2: number, dx: number, dy: number) {
    this.mouseChanged();
    const camera = this.viewport().camera();
    camera.adjustOrigin(dx / camera.scale(), dy / camera.scale());
    this.scheduleRepaint();
    return true;
  }

  mousedown(button: any, downTime: number, x: number, y: number): boolean {
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

  mousemove(x: number, y: number): boolean {
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

  scheduleRepaint() {
    this.viewport().scheduleRepaint();
  }

  mouseup(button: any, downTime: number, x: number, y: number) {
    super.mouseup(button, downTime, x, y);
    this._dragging = false;
    return false;
  }

  wheel(mag: number, x: number, y: number): boolean {
    super.wheel(mag, x, y);

    // Adjust the scale.
    const numSteps = mag > 0 ? -1 : 1;
    const camera = this.viewport().camera();
    if (numSteps > 0 || camera.scale() >= MIN_CAMERA_SCALE) {
      console.log("Zooming to", x, y);
      camera.zoomToPoint(Math.pow(1.1, numSteps), x, y);
      /* camera.zoomToPoint(
        Math.pow(1.1, numSteps),
        this.viewport().camera().width() / 2,
        this.viewport().camera().height() / 2
      );*/
    }
    this.mouseChanged();
    this.scheduleRepaint();
    return true;
  }

  mouseVersion() {
    return this._mouseVersion;
  }

  mouseChanged() {
    ++this._mouseVersion;
  }
}
