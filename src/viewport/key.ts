import Camera from "parsegraph-camera";
import { Keystroke, MouseController } from "parsegraph-input";
import { KeyController } from "parsegraph-input";
import { MIN_CAMERA_SCALE } from "./InputViewport";
import Method from 'parsegraph-method';

const RESET_CAMERA_KEY = "Escape";

const MOVE_UPWARD_KEY = "ArrowUp";
const MOVE_DOWNWARD_KEY = "ArrowDown";
const MOVE_BACKWARD_KEY = "ArrowLeft";
const MOVE_FORWARD_KEY = "ArrowRight";

const ZOOM_IN_KEY = "ZoomIn";
const ZOOM_OUT_KEY = "ZoomOut";

export default class ViewportKeyController implements KeyController {
  keydowns: { [id: string]: number };
  _camera: Camera;
  _mouse: MouseController;
  _update: Method;

  constructor(camera: Camera, mouse?: MouseController) {
    // A map of keyName's to a true value.
    this.keydowns = {};
    this._camera = camera;
    this._mouse = mouse;
    this._update = new Method();
  }

  lastMouseX() {
    return this._mouse?.lastMouseX();
  }

  lastMouseY() {
    return this._mouse?.lastMouseY();
  }

  getKey(key: string) {
    return this.keydowns[key] ? 1 : 0;
  }

  keyElapsed(key: string, cycleStart: number) {
    const v = this.keydowns[key];
    if (!v) {
      return 0;
    }
    const elapsed = (cycleStart - v) / 1000;
    this.keydowns[key] = cycleStart;
    return elapsed;
  }

  scheduleUpdate() {
    this._update.call();
  }

  setOnScheduleUpdate(update: ()=>void) {
    this._update.set(update);
  }

  resetCamera(complete?: boolean) {
    const defaultScale = 0.25;
    const cam = this.camera();
    if (!cam.canProject()) {
      return;
    }
    let x = cam.width() / 2;
    let y = cam.height() / 2;
    if (!complete && cam.x() === x && cam.y() === y) {
      cam.setScale(defaultScale);
    } else {
      if (complete) {
        cam.setScale(defaultScale);
      }
      x = cam.width() / (2 * defaultScale);
      y = cam.height() / (2 * defaultScale);
      cam.setOrigin(x, y);
    }
    this.scheduleUpdate();
  }

  keydown(event: Keystroke) {
    if (!event.name().length) {
      return false;
    }

    if (this.keydowns[event.name()]) {
      // Already processed.
      return true;
    }
    this.keydowns[event.name()] = Date.now();

    return true;
  }

  keyup(event: Keystroke) {
    if (!this.keydowns[event.name()]) {
      // Already processed.
      return false;
    }
    delete this.keydowns[event.name()];

    return true;
  }

  camera() {
    return this._camera;
  }

  tick(t: number) {
    const cam = this.camera();
    const xSpeed = 1000 / cam.scale();
    const ySpeed = 1000 / cam.scale();
    const scaleSpeed = 20;

    let needsUpdate = false;

    if (this.getKey(RESET_CAMERA_KEY)) {
      this.resetCamera(false);
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

