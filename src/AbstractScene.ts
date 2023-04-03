import WorldTransform from "./WorldTransform";
import WorldRenderable from "./WorldRenderable";
import { Projector } from "parsegraph-projector";
import Method from "parsegraph-method";

export default abstract class AbstractScene implements WorldRenderable {
  private _projector: Projector;
  private _world: WorldTransform;
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

  setWorldTransform(world: WorldTransform) {
    this._world = world;
  }

  worldTransform() {
    return this._world;
  }

  tick() {
    return false;
  }

  paint() {
    return false;
  }

  render() {
    const needsUpdate = this.projector().render();
    this.worldTransform().applyTransform(this.projector());
    return needsUpdate;
  }

  unmount() {}
}
