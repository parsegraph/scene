import { Projector } from 'parsegraph-projector';
import { Renderable } from 'parsegraph-timingbelt';
import Color from 'parsegraph-color';
import Method from 'parsegraph-method';

export default class Background implements Renderable {
  _proj: Projector;
  _backgroundColor: Color;
  _update: Method;

  constructor(proj: Projector, backgroundColor: Color = new Color(149 / 255, 149 / 255, 149 / 255, 1)) {
    this._proj = proj;
    this._backgroundColor = backgroundColor;
    this._update = new Method();
  }

  tick() {
    return false;
  }

  paint() {
    return false;
  }

  backgroundColor() {
    return this._backgroundColor;
  }

  setBackgroundColor(color: Color) {
    this._backgroundColor = color;
    this.scheduleUpdate();
  }

  scheduleUpdate() {
    this._update.call();
  }

  setOnScheduleUpdate(update: ()=>void) {
    this._update.set(update);
  }

  render() {
    const projector = this._proj;
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
      overlay.resetTransform();
      overlay.textBaseline = "top";
      overlay.fillStyle = this.backgroundColor().asRGBA();
      overlay.clearRect(0, 0, projector.width(), projector.height());
    }
    return false;
  }

  unmount() {
    return false;
  }
}
