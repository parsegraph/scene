import { KeyController, Keystroke } from "parsegraph-input";
import AbstractViewportList from "./AbstractViewportList";

export default class ViewportKeyControllers extends AbstractViewportList<KeyController>
implements KeyController {

  protected forEach(iter: (controller: KeyController)=>boolean) {
    for(let i = 0; i < this.items().length; ++i) {
      const controller = this.items()[this.items().length - 1 - i];
      if (iter(controller)) {
        this.scheduleUpdate();
        return true;
      }
    }
    return false;
  }

  keydown(event: Keystroke) {
    return this.forEach(controller=>controller.keydown(event));
  }

  keyup(event: Keystroke) {
    return this.forEach(controller=>controller.keyup(event));
  }

  tick(cycleStart: number) {
    return this.items().reduce((needsUpdate, controller)=>controller.tick(cycleStart) || needsUpdate, false);
  }
}
