import { Projector } from "parsegraph-projector";

import { FocusInput, TouchInput, MouseInput, KeyInput } from "parsegraph-input";
import ViewportKeyController from "./key";
import ViewportMouseController from "./mouse";
import log from "parsegraph-log";
import InputViewport from "./InputViewport";

export const TOUCH_SENSITIVITY = 1;
export const MOUSE_SENSITIVITY = 1;

class Input {
  _mainContainer: HTMLElement;
  _domContainer: HTMLElement;

  _focus: FocusInput;
  _touch: TouchInput;
  _mouse: MouseInput;
  _key: KeyInput;

  constructor(mainContainer: HTMLElement, domContainer: HTMLElement) {
    if (!mainContainer) {
      throw new Error("container must be provided");
    }
    if (!domContainer) {
      throw new Error("domContainer must be provided");
    }
    this._mainContainer = mainContainer;
    this._domContainer = domContainer;

    this._focus = new FocusInput();
    this._focus.mount(this.mainContainer());

    this._key = new KeyInput();
    this._key.mount(this.mainContainer());

    this._mouse = new MouseInput();
    this._mouse.mount(this.domContainer());

    this._touch = new TouchInput();
    this._touch.mount(this.domContainer());
  }

  unmount() {
    this._touch.unmount();
    this._mouse.unmount();
    this._key.unmount();
    this._focus.unmount();
  }

  mouse() {
    return this._mouse;
  }

  touch() {
    return this._touch;
  }

  key() {
    return this._key;
  }

  focus() {
    return this._focus;
  }

  mainContainer() {
    return this._mainContainer;
  }

  domContainer() {
    return this._domContainer;
  }
}

export default class ViewportInputController {
  _viewport: InputViewport;
  _key: ViewportKeyController;
  _mouse: ViewportMouseController;
  _showCursor: boolean;

  _inputs: Map<Projector, Input>;

  constructor(viewport: InputViewport) {
    this._viewport = viewport;
    this._inputs = new Map();

    this._showCursor = true;

    this._key = new ViewportKeyController(viewport);
    this._mouse = new ViewportMouseController(viewport);
  }

  mouse() {
    return this._mouse;
  }

  key() {
    return this._key;
  }

  scheduleRepaint() {
    this.viewport().scheduleRepaint();
  }

  camera() {
    return this.viewport().camera();
  }

  width() {
    return this.camera().width();
  }

  height() {
    return this.camera().height();
  }

  viewport() {
    return this._viewport;
  }

  handleEvent(eventType: string, eventData: any, proj: Projector): boolean {
    // console.log(eventType, eventData);
    console.log("Unhandled event type: " + eventType, eventData, proj);
    return false;
  }

  update(t: Date) {
    let needsUpdate = false;
    if (this._mouse.update(t)) {
      log("Input tick needs update from mouse");
      needsUpdate = true;
    }
    if (this._key.update(t)) {
      log("Input tick needs update from key");
      needsUpdate = true;
    }
    return needsUpdate;
  }

  unmount(projector: Projector) {
    if (!this._inputs.has(projector)) {
      return;
    }
    const input = this._inputs.get(projector);
    input.unmount();
    this._inputs.delete(projector);
  }

  paint(projector: Projector): boolean {
    if (!this._inputs.has(projector)) {
      const input = new Input(
        projector.glProvider().container(),
        projector.glProvider().container()
      );
      input.mouse().setControl(this._mouse);
      input.focus().setControl(this._mouse);
      input.touch().setControl(this._mouse);
      console.log("Painting input");
      input.key().setControl(this._key);
      this._inputs.set(projector, input);
    }
    return false;
  }

  render(_: Projector) {
    return false;
  }
}
