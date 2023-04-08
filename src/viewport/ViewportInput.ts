import { FocusInput, TouchInput, MouseInput, KeyInput } from "parsegraph-input";

export const TOUCH_SENSITIVITY = 1;
export const MOUSE_SENSITIVITY = 1;

export default class ViewportInput {
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
