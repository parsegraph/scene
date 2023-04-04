import { Keystroke } from "parsegraph-input";
import { KeyController } from "parsegraph-input";
import InputViewport, { MIN_CAMERA_SCALE } from "./InputViewport";

const RESET_CAMERA_KEY = "Escape";

const MOVE_UPWARD_KEY = "ArrowUp";
const MOVE_DOWNWARD_KEY = "ArrowDown";
const MOVE_BACKWARD_KEY = "ArrowLeft";
const MOVE_FORWARD_KEY = "ArrowRight";

const ZOOM_IN_KEY = "ZoomIn";
const ZOOM_OUT_KEY = "ZoomOut";

export default class ViewportKeyController implements KeyController {
  keydowns: { [id: string]: Date };
  _viewport: InputViewport;
  _next: KeyController;

  constructor(viewport: InputViewport) {
    // A map of keyName's to a true value.
    this.keydowns = {};
    this._viewport = viewport;
  }

  next() {
    return this._next;
  }

  setNext(next: KeyController) {
    this._next = next;
  }

  lastMouseX() {
    return this.next()
      ? this.next().lastMouseX()
      : this.viewport().lastMouseX();
  }

  lastMouseY() {
    return this.next()
      ? this.next().lastMouseY()
      : this.viewport().lastMouseY();
  }

  getKey(key: string) {
    return this.keydowns[key] ? 1 : 0;
  }

  keyElapsed(key: string, t: Date) {
    const v = this.keydowns[key];
    if (!v) {
      return 0;
    }
    const elapsed = (t.getTime() - v.getTime()) / 1000;
    this.keydowns[key] = t;
    return elapsed;
  }

  scheduleRepaint() {
    this.viewport().scheduleRepaint();
  }

  keydown(event: Keystroke) {
    if (this.next()?.keydown(event)) {
      return true;
    }

    if (!event.name().length) {
      return false;
    }

    if (this.keydowns[event.name()]) {
      // Already processed.
      return true;
    }
    this.keydowns[event.name()] = new Date();

    return false;
  }

  keyup(event: Keystroke) {
    if (this.next()?.keydown(event)) {
      return true;
    }

    if (!this.keydowns[event.name()]) {
      // Already processed.
      return;
    }
    delete this.keydowns[event.name()];

    return false;
  }

  viewport() {
    return this._viewport;
  }

  camera() {
    return this.viewport().camera();
  }

  update(t: Date) {
    const cam = this.camera();
    const xSpeed = 1000 / cam.scale();
    const ySpeed = 1000 / cam.scale();
    const scaleSpeed = 20;

    let needsUpdate = this.next()?.update(t);

    if (this.getKey(RESET_CAMERA_KEY)) {
      this.viewport().resetCamera(false);
      needsUpdate = true;
    }

    if (
      this.getKey(MOVE_BACKWARD_KEY) ||
      this.getKey(MOVE_FORWARD_KEY) ||
      this.getKey(MOVE_UPWARD_KEY) ||
      this.getKey(MOVE_DOWNWARD_KEY)
    ) {
      // console.log("Moving");
      const x =
        cam.x() +
        (this.keyElapsed(MOVE_BACKWARD_KEY, t) * xSpeed +
          this.keyElapsed(MOVE_FORWARD_KEY, t) * -xSpeed);
      const y =
        cam.y() +
        (this.keyElapsed(MOVE_UPWARD_KEY, t) * ySpeed +
          this.keyElapsed(MOVE_DOWNWARD_KEY, t) * -ySpeed);
      cam.setOrigin(x, y);
      needsUpdate = true;
    }

    if (this.getKey(ZOOM_OUT_KEY)) {
      // console.log("Continuing to zoom out");
      needsUpdate = true;
      cam.zoomToPoint(
        Math.pow(1.1, scaleSpeed * this.keyElapsed(ZOOM_OUT_KEY, t)),
        cam.width() / 2,
        cam.height() / 2
      );
    }
    if (this.getKey(ZOOM_IN_KEY)) {
      // console.log("Continuing to zoom in");
      needsUpdate = true;
      if (cam.scale() >= MIN_CAMERA_SCALE) {
        cam.zoomToPoint(
          Math.pow(1.1, -scaleSpeed * this.keyElapsed(ZOOM_IN_KEY, t)),
          cam.width() / 2,
          cam.height() / 2
        );
      }
    }

    return needsUpdate;
  }
}
