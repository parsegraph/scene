import Camera from "parsegraph-camera";
import { BasicProjector, Projector } from "parsegraph-projector";
import Method from "parsegraph-method";
import Color from "parsegraph-color";
import log, { logc } from "parsegraph-log";
import WorldRenderable from "../WorldRenderable";
import { Renderable } from "parsegraph-timingbelt";

import WorldTransform from "../WorldTransform";
import ViewportSceneList from "./scenes";
import ViewportKeyControllers from "./ViewportKeyControllers";
import ViewportMouseControllers from "./ViewportMouseControllers";
import ViewportInput from './input';

export default class Viewport implements Renderable {
  _camera: Camera;
  _renderedMouse: number;
  _needsRender: boolean;
  _needsRepaint: boolean;
  _update: Method;
  _inputLayer: Projector;
  _unmount: () => void;
  _scenes: ViewportSceneList;
  _proj: Projector;
  _input: ViewportInput;
  _key: ViewportKeyControllers;
  _mouse: ViewportMouseControllers;

  constructor(proj: Projector) {
    this._proj = proj;
    this._input = null;

    this._scenes = new ViewportSceneList();
    this._scenes.setOnScheduleUpdate(()=>this.scheduleRepaint());
    // Construct the graph.
    this._update = new Method();
    this._camera = new Camera();

    this._key = new ViewportKeyControllers();
    this._key.setOnScheduleUpdate(()=>{
      this.keyChanged();
    });
    this._mouse = new ViewportMouseControllers();
    this._mouse.setOnScheduleUpdate(()=>{
      this.mouseChanged();
    });

    this._inputLayer = null;

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

  projector() {
    return this._proj;
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

  lastMouseX() {
    return this.mouse().lastMouseX();
  }

  lastMouseY() {
    return this.mouse().lastMouseY();
  }

  scheduleUpdate() {
    this._update.call();
  }

  setOnScheduleUpdate(func: Function, obj?: object) {
    this._update.set(func, obj);
  }

  width() {
    return this.camera().width();
  }

  height() {
    return this.camera().height();
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

  unmount() {
    this._input?.unmount();
    this._input = null;
    this._inputLayer?.glProvider().container().remove();
  }

  camera() {
    return this._camera;
  }

  dispose() {
    if (this._unmount !== null) {
      this._unmount();
      this._unmount = null;
    }
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
    return (
      this.needsRepaint() ||
      this._needsRender ||
      this._renderedMouse > 0
    );
  }

  /*
   * Paints the graph up to the given time, in milliseconds.
   *
   * Returns true if the graph completed painting.
   */
  paint(timeout?: number) {
    const gl = this.projector().glProvider().gl();
    if (gl.isContextLost()) {
      return false;
    }
    let needsUpdate = false;
    if (!this._input) {
      const projector = this.projector();
      const input = new ViewportInput(
        projector.glProvider().container(),
        projector.glProvider().container()
      );
      projector.container().tabIndex = 0;
      input.mouse().setControl(this._mouse);
      input.focus().setControl(this._mouse);
      input.touch().setControl(this._mouse);
      input.key().setControl(this._key);
      this._input = input;
    }
    if (this.needsRepaint()) {
      if (!this._inputLayer) {
        const inputProj = new BasicProjector();
        const container = inputProj.glProvider().container();
        this.projector().glProvider().container().appendChild(container);
        container.style.zIndex = "0";
        container.style.left = "0px";
        container.style.top = "0px";
        container.style.right = "0px";
        container.style.bottom = "0px";
        inputProj.glProvider().gl();
        inputProj.overlay();
        this._inputLayer = inputProj;
      }

      this._inputLayer.glProvider().container().style.position = "absolute";

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

  renderedMouse() {
    return this._renderedMouse;
  }

  render(): boolean {
    const projector = this.projector();

    // Set camera size
    this.camera().setSize(projector.width(), projector.height());

    let needsUpdate = false;

    // Render scene
    this.scene()?.setWorldTransform(WorldTransform.fromCamera(this.camera()));
    if (this.scene()?.render()) {
      needsUpdate = true;
    }

    this._renderedMouse = 0;
    if (!needsUpdate) {
      this._needsRender = this._needsRepaint;
    }

    needsUpdate = Boolean(needsUpdate);
    logc(
      "Viewport renders",
      needsUpdate ? "Render needs more time" : "Render complete"
    );
    return needsUpdate;
  }
}
