import { Projector } from "parsegraph-projector";
import { Renderable } from "parsegraph-timingbelt";
import Color from "parsegraph-color";
import Method from "parsegraph-method";

export default class Cleared implements Renderable {
  _proj: Projector;
  _update: Method;

  constructor(proj: Projector) {
    this._proj = proj;
    this._update = new Method();
  }

  tick() {
    return false;
  }

  paint() {
    return false;
  }

  scheduleUpdate() {
    this._update.call();
  }

  setOnScheduleUpdate(update: () => void) {
    this._update.set(update);
  }

  render() {
    const projector = this._proj;
    if (projector.glProvider()?.hasGL()) {
      const gl = projector.glProvider().gl();
      if (!gl.isContextLost()) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(0, 0, projector.width(), projector.height());
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    }
    if (projector.hasOverlay()) {
      projector
        .overlay()
        .clearRect(0, 0, projector.width(), projector.height());
    }
    return false;
  }

  unmount() {
    return false;
  }
}
