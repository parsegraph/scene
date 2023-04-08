import WorldRenderable from "./WorldRenderable";
import { Renderable } from "parsegraph-timingbelt";
import AbstractSceneList from "./AbstractSceneList";

export default class SceneList
  extends AbstractSceneList<Renderable>
  implements Renderable
{
  constructor() {
    super();
  }

  protected onItemAdded(scene: WorldRenderable) {
    scene.setOnScheduleUpdate(() => this.scheduleUpdate());
  }

  protected onItemRemoved(scene: WorldRenderable) {
    scene.setOnScheduleUpdate(null);
  }

  tick(startDate: number): boolean {
    return this.items().reduce(
      (needsUpdate, scene) => scene.tick(startDate) || needsUpdate,
      false
    );
  }

  paint(timeout?: number): boolean {
    return this.items().reduce(
      (needsUpdate, scene) =>
        scene.paint(timeout / this.length()) || needsUpdate,
      false
    );
  }

  render(): boolean {
    return this.items().reduce(
      (needsUpdate, scene) => scene.render() || needsUpdate,
      false
    );
  }

  unmount(): void {
    this.items().forEach((scene) => scene.unmount());
  }
}
