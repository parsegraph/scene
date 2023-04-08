import Camera from "parsegraph-camera";
import { Keystroke, MouseController } from "parsegraph-input";
import { KeyController } from "parsegraph-input";
import {
  MIN_CAMERA_SCALE,
  RESET_CAMERA_KEY,
  MOVE_BACKWARD_KEY,
  MOVE_FORWARD_KEY,
  MOVE_UPWARD_KEY,
  MOVE_DOWNWARD_KEY,
  ZOOM_IN_KEY,
  ZOOM_OUT_KEY,
} from "./constants";
import Method from "parsegraph-method";
import KeyTimer from "./KeyTimer";

export default class CameraKeyController implements KeyController {
  _camera: Camera;
  _mouse: MouseController;
  _update: Method;
  _keys: KeyTimer;

  constructor(camera: Camera, mouse?: MouseController) {
    this._camera = camera;
    this._mouse = mouse;
    this._update = new Method();
    this._keys = new KeyTimer();
  }

  lastMouseX() {
    return this._mouse?.lastMouseX();
  }

  lastMouseY() {
    return this._mouse?.lastMouseY();
  }

  scheduleUpdate() {
    this._update.call();
  }

  setOnScheduleUpdate(update: () => void) {
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

  keys() {
    return this._keys;
  }

  keydown(event: Keystroke) {
    return this.keys().keydown(event);
  }

  keyup(event: Keystroke) {
    return this.keys().keyup(event);
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

    const keys = this.keys();
    if (keys.getKey(RESET_CAMERA_KEY)) {
      this.resetCamera(false);
      needsUpdate = true;
    }

    if (
      keys.getKey(MOVE_BACKWARD_KEY) ||
      keys.getKey(MOVE_FORWARD_KEY) ||
      keys.getKey(MOVE_UPWARD_KEY) ||
      keys.getKey(MOVE_DOWNWARD_KEY)
    ) {
      // console.log("Moving");
      const x =
        cam.x() +
        (keys.keyElapsed(MOVE_BACKWARD_KEY, t) * xSpeed +
          keys.keyElapsed(MOVE_FORWARD_KEY, t) * -xSpeed);
      const y =
        cam.y() +
        (keys.keyElapsed(MOVE_UPWARD_KEY, t) * ySpeed +
          keys.keyElapsed(MOVE_DOWNWARD_KEY, t) * -ySpeed);
      cam.setOrigin(x, y);
      needsUpdate = true;
    }

    if (keys.getKey(ZOOM_OUT_KEY)) {
      // console.log("Continuing to zoom out");
      needsUpdate = true;
      cam.zoomToPoint(
        Math.pow(1.1, scaleSpeed * keys.keyElapsed(ZOOM_OUT_KEY, t)),
        cam.width() / 2,
        cam.height() / 2
      );
    }
    if (keys.getKey(ZOOM_IN_KEY)) {
      // console.log("Continuing to zoom in");
      needsUpdate = true;
      if (cam.scale() >= MIN_CAMERA_SCALE) {
        cam.zoomToPoint(
          Math.pow(1.1, -scaleSpeed * keys.keyElapsed(ZOOM_IN_KEY, t)),
          cam.width() / 2,
          cam.height() / 2
        );
      }
    }

    return needsUpdate;
  }
}
