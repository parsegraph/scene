import Method from "parsegraph-method";
import log, { logc } from "parsegraph-log";
import { Renderable } from "parsegraph-timingbelt";

import SceneList from "../SceneList";
import KeyControllers from "../input/KeyControllers";
import MouseControllers from "../input/MouseControllers";
import AllInputs from "../input/AllInputs";

export default class Viewport implements Renderable {
  _renderedMouse: number;
  _needsRender: boolean;
  _needsRepaint: boolean;
  _update: Method;
  _unmount: () => void;
  _scenes: SceneList;
  _inputs: AllInputs;
  _key: KeyControllers;
  _mouse: MouseControllers;

  constructor(inputs: AllInputs) {
    this._update = new Method();

    this._scenes = new SceneList();
    this._scenes.setOnScheduleUpdate(() => this.scheduleRepaint());

    this._inputs = inputs;
    this._key = new KeyControllers();
    this._key.setOnScheduleUpdate(() => {
      this.keyChanged();
    });
    inputs.key().setControl(this._key);

    this._mouse = new MouseControllers();
    this._mouse.setOnScheduleUpdate(() => {
      this.mouseChanged();
    });
    inputs.mouse().setControl(this._mouse);
    inputs.focus().setControl(this._mouse);
    inputs.touch().setControl(this._mouse);

    this._renderedMouse = 1;
    this._needsRender = true;

    this._unmount = null;
    this._needsRepaint = true;
  }

  keyChanged() {
    this.scheduleUpdate();
  }

  mouseChanged() {
    this._renderedMouse++;
    this.scheduleUpdate();
  }

  scene() {
    return this._scenes;
  }

  mouse() {
    return this._mouse;
  }

  key() {
    return this._key;
  }

  scheduleUpdate() {
    this._update.call();
  }

  setOnScheduleUpdate(func: Function, obj?: object) {
    this._update.set(func, obj);
  }

  renderedMouse() {
    return this._renderedMouse;
  }

  scheduleRepaint() {
    // console.log("Viewport is scheduling repaint");
    this.scheduleUpdate();
    this._needsRepaint = true;
    this._needsRender = true;
  }

  scheduleRender() {
    // console.log("Viewport is scheduling render");
    this.scheduleUpdate();
    this._needsRender = true;
  }

  needsRepaint() {
    return this._needsRepaint;
  }

  needsRender() {
    return this.needsRepaint() || this._needsRender || this._renderedMouse > 0;
  }

  tick(cycleStart: number): boolean {
    let needsUpdate = false;
    if (this._mouse.tick(cycleStart)) {
      log("Input tick needs update from mouse");
      needsUpdate = true;
    }
    if (this._key.tick(cycleStart)) {
      log("Input tick needs update from key");
      needsUpdate = true;
    }
    return this._scenes.tick(cycleStart) || needsUpdate;
  }

  /*
   * Paints the graph up to the given time, in milliseconds.
   *
   * Returns true if the graph completed painting.
   */
  paint(timeout?: number) {
    let needsUpdate = false;
    if (this.needsRepaint()) {
      if (this.scene()?.paint(timeout)) {
        needsUpdate = true;
      }
    }

    this._needsRender = this._needsRender || this._needsRepaint;
    if (needsUpdate) {
      this.scheduleUpdate();
      this._needsRepaint = true;
    } else {
      this._needsRepaint = false;
    }
    log("Needs a render", this._needsRender, needsUpdate);
    return needsUpdate;
  }

  render(): boolean {
    let needsUpdate = this.scene()?.render();

    if (!needsUpdate) {
      this._needsRender = this._needsRepaint;
    }

    if (!this._needsRender) {
      this._renderedMouse = 0;
    }

    needsUpdate = Boolean(needsUpdate);
    logc(
      "Viewport renders",
      needsUpdate ? "Render needs more time" : "Render complete"
    );
    return needsUpdate;
  }

  unmount() {
    const inputs = this._inputs;
    inputs.key().setControl(null);
    inputs.mouse().setControl(null);
    inputs.focus().setControl(null);
    inputs.touch().setControl(null);
  }
}
