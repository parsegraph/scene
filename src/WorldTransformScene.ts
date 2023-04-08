import WorldTransform from "./WorldTransform";
import { Projector } from "parsegraph-projector";
import AbstractScene from './AbstractScene';

export default abstract class WorldTransformScene extends AbstractScene {
  private _world: WorldTransform;

  constructor(projector: Projector) {
    super(projector);
    this._world = null;
  }

  setWorldTransform(world: WorldTransform) {
    this._world = world;
  }

  worldTransform() {
    return this._world;
  }

  render() {
    const needsUpdate = super.render();
    this.worldTransform()?.applyTransform(this.projector());
    return needsUpdate;
  }
}
