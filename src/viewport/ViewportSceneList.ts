import WorldRenderable from "../WorldRenderable";
import WorldTransform from "../WorldTransform";
import AbstractViewportList from './AbstractViewportList';

export default class ViewportSceneList extends AbstractViewportList<WorldRenderable> implements WorldRenderable {
  protected onItemAdded(scene: WorldRenderable) {
    scene.setOnScheduleUpdate(()=>this.scheduleUpdate());
  }

  protected onItemRemoved(scene: WorldRenderable) {
    scene.setOnScheduleUpdate(null);
  }

  tick(startDate: number): boolean {
    return this.items().reduce((needsUpdate, scene)=>scene.tick(startDate) || needsUpdate, false);
  }

  paint(timeout?: number): boolean {
    return this.items().reduce((needsUpdate, scene)=>scene.paint(timeout / this.length()) || needsUpdate, false);
  }

  render(): boolean {
    return this.items().reduce((needsUpdate, scene)=>scene.render() || needsUpdate, false);
  }

  setWorldTransform(wt: WorldTransform) {
    this.items().forEach(scene=>scene.setWorldTransform(wt));
  }

  unmount(): void {
    this.items().forEach(scene=>scene.unmount());
  }
}
