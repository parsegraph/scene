import { MouseController } from "parsegraph-input";

import AbstractSceneList from "../AbstractSceneList";

export default class MouseControllers
  extends AbstractSceneList<MouseController>
  implements MouseController
{
  _focused: boolean;
  _lastMouse: MouseController;

  constructor() {
    super();
    this._focused = false;
    this._lastMouse = null;
  }

  lastMouseX() {
    return this._lastMouse?.lastMouseX();
  }

  lastMouseY() {
    return this._lastMouse?.lastMouseY();
  }

  protected onItemRemoved(itemToRemove: MouseController) {
    if (this._lastMouse === itemToRemove) {
      this._lastMouse = null;
    }
  }

  protected forEach(iter: (controller: MouseController) => boolean) {
    for (let i = 0; i < this.items().length; ++i) {
      const controller = this.items()[this.items().length - 1 - i];
      if (iter(controller)) {
        this._lastMouse = controller;
        this.scheduleUpdate();
        return true;
      }
    }
    return false;
  }

  tick(cycleStart: number) {
    return this.items().reduce(
      (needsUpdate, controller) => controller.tick(cycleStart) || needsUpdate,
      false
    );
  }

  blur() {
    this._focused = false;
    this.items().forEach((controller) => controller.blur());
  }

  focus() {
    this._focused = true;
    this.items().forEach((controller) => controller.focus());
  }

  focused() {
    return this._focused;
  }

  mousedown(button: any, downTime: number, x: number, y: number): boolean {
    return this.forEach((controller) =>
      controller.mousedown(button, downTime, x, y)
    );
  }

  mousemove(x: number, y: number): boolean {
    return this.forEach((controller) => controller.mousemove(x, y));
  }

  mouseup(button: any, downTime: number, x: number, y: number) {
    return this.forEach((controller) =>
      controller.mouseup(button, downTime, x, y)
    );
  }

  wheel(mag: number, x: number, y: number): boolean {
    return this.forEach((controller) => controller.wheel(mag, x, y));
  }
}
