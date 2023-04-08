import { Renderable } from "parsegraph-timingbelt";
import { Projector } from "parsegraph-projector";
import Method from "parsegraph-method";

export default abstract class AbstractScene implements Renderable {
  private _projector: Projector;
  private _onUpdate: Method;

  constructor(projector: Projector) {
    this._projector = projector;
    this._onUpdate = new Method();
  }

  projector() {
    return this._projector;
  }

  markDirty() {
    this.scheduleUpdate();
  }

  protected scheduleUpdate() {
    this._onUpdate.call();
  }

  setOnScheduleUpdate(listener: () => void, listenerObj?: object): void {
    this._onUpdate.set(listener, listenerObj);
  }

  tick() {
    return false;
  }

  paint() {
    return false;
  }

  render() {
    return this.projector().render();
  }

  unmount() {}
}
