import Camera from "parsegraph-camera";
import { BasicProjector, Projector } from "parsegraph-projector";
import Method from "parsegraph-method";
import Color from "parsegraph-color";
import log, { logc } from "parsegraph-log";
import WorldRenderable from "../WorldRenderable";
import { Renderable } from "parsegraph-timingbelt";

import InputViewport from "./InputViewport";
import ViewportInputController from "./input";
import WorldTransform from "../WorldTransform";

export default class Viewport implements Renderable, InputViewport {
  _camera: Camera;
  _input: ViewportInputController;
  _renderedMouse: number;
  _needsRender: boolean;
  _backgroundColor: Color;
  _needsRepaint: boolean;
  _update: Method;
  _cursor: string;
  _inputLayer: Projector;
  _scene: WorldRenderable;
  _unmount: () => void;

  constructor(
    backgroundColor: Color = new Color(149 / 255, 149 / 255, 149 / 255, 1)
  ) {
    this._scene = null;
    // Construct the graph.
    this._update = new Method();
    this._backgroundColor = backgroundColor;
    this._camera = new Camera();
    this._input = new ViewportInputController(this);

    this._inputLayer = null;

    this._renderedMouse = -1;
    this._needsRender = true;

    this._unmount = null;
    this._needsRepaint = true;
  }

  mouse() {
    return this._input.mouse();
  }

  key() {
    return this._input.key();
  }

  lastMouseX() {
    return this.mouse().lastMouseX();
  }

  lastMouseY() {
    return this.mouse().lastMouseY();
  }

  setCursor(cur: string): void {
    this._cursor = cur;
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

  tick(startDate: number): boolean {
    return this._input.update(new Date(startDate));
  }

  unmount() {
    this._inputLayer.glProvider().container().remove();
  }

  camera() {
    return this._camera;
  }

  resetCamera(complete?: boolean) {
    const defaultScale = 0.25;
    const cam = this.camera();
    let x = this.width() / 2;
    let y = this.height() / 2;
    if (!complete && cam.x() === x && cam.y() === y) {
      cam.setScale(defaultScale);
    } else {
      if (complete) {
        cam.setScale(defaultScale);
      }
      x = this.width() / (2 * defaultScale);
      y = this.height() / (2 * defaultScale);
      cam.setOrigin(x, y);
    }
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
      this._renderedMouse !== this.mouse().mouseVersion()
    );
  }

  projector() {
    return this.scene()?.projector();
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

      if (this._input.paint(this._inputLayer)) {
        needsUpdate = true;
      }

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

  mouseVersion() {
    return this._renderedMouse;
  }

  backgroundColor(): Color {
    return this._backgroundColor;
  }

  setBackgroundColor(color: Color) {
    this._backgroundColor = color;
    this.scheduleRender();
  }

  private renderBackground(projector: Projector) {
    const hasGL = projector.glProvider()?.hasGL();
    const container = projector.glProvider().container();
    if (container.style.backgroundColor != this.backgroundColor().asRGBA()) {
      container.style.backgroundColor = this.backgroundColor().asRGBA();
    }
    if (hasGL) {
      // console.log("Rendering GL background");
      const gl = projector.glProvider().gl();
      const bg = this.backgroundColor();
      gl.viewport(0, 0, projector.width(), projector.height());
      gl.clearColor(bg.r(), bg.g(), bg.b(), bg.a());
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    if (projector.hasOverlay()) {
      // console.log("Rendering canvas background");
      const overlay = projector.overlay();
      overlay.textBaseline = "top";
      overlay.fillStyle = this.backgroundColor().asRGBA();
      overlay.clearRect(0, 0, projector.width(), projector.height());
    }
  }

  scene(): WorldRenderable {
    return this._scene;
  }

  setScene(scene: WorldRenderable) {
    if (this._scene === scene) {
      return;
    }
    this.unmount();
    this._scene = scene;
    this.scheduleRepaint();
  }

  render(): boolean {
    const projector = this.projector();

    // Set camera size
    this.camera().setSize(projector.width(), projector.height());

    // Render background
    const overlay = projector.overlay();
    overlay.resetTransform();
    overlay.clearRect(0, 0, projector.width(), projector.height());
    this.renderBackground(projector);

    overlay.textBaseline = "top";
    let needsUpdate = false;

    // Render scene
    this.scene()?.setWorldTransform(WorldTransform.fromCamera(this.camera()));
    if (this.scene()?.render()) {
      needsUpdate = true;
    }

    const inputProj = this._inputLayer;
    if (inputProj) {
      const gl = inputProj.glProvider().gl();
      if (!gl.isContextLost()) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(0, 0, projector.width(), projector.height());
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      inputProj
        .overlay()
        .clearRect(0, 0, projector.width(), projector.height());
      inputProj?.render();
      if (this._input.render(inputProj)) {
        this.scheduleRender();
      }
    }

    this._renderedMouse = this.mouse().mouseVersion();
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
