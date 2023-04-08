import { makeInverse3x3, matrixTransform2D } from "parsegraph-matrix";
import { BasicMouseController } from "parsegraph-input";

import { MIN_CAMERA_SCALE } from "./constants";
import Method from 'parsegraph-method';
import Camera from 'parsegraph-camera';

export default class CameraMouseController extends BasicMouseController {
  _dragging: boolean;
  _update: Method;
  _camera: Camera;

  constructor(camera: Camera) {
    super();
    this._camera = camera;
    this._dragging = false;
    this._update = new Method();
  }

  scheduleUpdate() {
    this._update.call();
  }

  setOnScheduleUpdate(update: ()=>void) {
    this._update.set(update);
  }

  tick() {
    return false;
  }

  camera() {
    return this._camera;
  }

  mouseDrag(_x: number, _y: number, dx: number, dy: number) {
    const camera = this.camera();
    // console.log("Adjust orig", dx, dx / camera.scale(), dy / camera.scale());
    camera.adjustOrigin(dx / camera.scale(), dy / camera.scale());
    this.scheduleUpdate();
    return true;
  }

  mousedown(button: any, downTime: number, x: number, y: number): boolean {
    super.mousedown(button, downTime, x, y);

    const mouseInWorld = matrixTransform2D(
      makeInverse3x3(this.camera().worldMatrix()),
      x,
      y
    );

    this._dragging = true;
    return this.mouseDrag(mouseInWorld[0], mouseInWorld[1], 0, 0);
  }

  mousemove(x: number, y: number): boolean {
    const dx = x - this.lastMouseX();
    const dy = y - this.lastMouseY();
    super.mousemove(x, y);

    // Moving during a mousedown i.e. dragging (or zooming)
    if (this._dragging && !isNaN(dx) && !isNaN(dy)) {
      const mouseInWorld = matrixTransform2D(
        makeInverse3x3(this.camera().worldMatrix()),
        x,
        y
      );
      return this.mouseDrag(mouseInWorld[0], mouseInWorld[1], dx, dy);
    }

    return false;
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
    const camera = this.camera();
    if (numSteps > 0 || camera.scale() >= MIN_CAMERA_SCALE) {
      // console.log("Zooming to", x, y, camera.transform(x, y), camera.scale());
      camera.zoomToPoint(Math.pow(1.1, numSteps), x, y);
      this.scheduleUpdate();
      return true;
    }
    return false;
  }
}
