import { KeyController } from "parsegraph-input";
import { Keystroke } from "parsegraph-input";

export default class KeyTimer implements KeyController {
  _keydowns: { [id: string]: number };

  constructor() {
    // A map of keyName's to a true value.
    this._keydowns = {};
  }

  getKey(key: string) {
    return this._keydowns[key] ? 1 : 0;
  }

  keyElapsed(key: string, cycleStart: number) {
    const v = this._keydowns[key];
    if (!v) {
      return 0;
    }
    const elapsed = (cycleStart - v) / 1000;
    this._keydowns[key] = cycleStart;
    return elapsed;
  }

  keydown(event: Keystroke) {
    if (!event.name().length) {
      return false;
    }

    if (this._keydowns[event.name()]) {
      // Already processed.
      return false;
    }
    this._keydowns[event.name()] = Date.now();

    return false;
  }

  keyup(event: Keystroke) {
    if (!this._keydowns[event.name()]) {
      // Already processed.
      return false;
    }
    delete this._keydowns[event.name()];

    return false;
  }

  tick() {
    return false;
  }
}
