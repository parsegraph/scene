import Method from "parsegraph-method";

export default abstract class AbstractSceneList<T> {
  _items: T[];
  _update: Method;

  constructor() {
    this._items = [];
    this._update = new Method();
  }

  protected items() {
    return this._items;
  }

  length() {
    return this._items.length;
  }

  scheduleUpdate() {
    this._update.call();
  }

  setOnScheduleUpdate(func: Function, obj?: object) {
    this._update.set(func, obj);
  }

  protected onItemAdded(_item: T): void {}

  protected onItemRemoved(_item: T): void {}

  addToFront(item: T) {
    this._items.push(item);
    this.onItemAdded(item);
    this.scheduleUpdate();
  }

  addToBack(item: T) {
    this._items.unshift(item);
    this.onItemAdded(item);
    this.scheduleUpdate();
  }

  remove(itemToRemove: T) {
    if (!itemToRemove) {
      return;
    }
    const oldLen = this._items.length;
    this._items = this._items.filter((item) => item !== itemToRemove);
    if (this._items.length < oldLen) {
      this.onItemRemoved(itemToRemove);
    }
    this.scheduleUpdate();
  }

  replace(orig: T, item: T) {
    if (orig === item) {
      return;
    }
    if (!item) {
      this.remove(orig);
      return;
    }
    const idx = this._items.indexOf(orig);
    if (idx < 0) {
      return;
    }
    this.onItemRemoved(orig);
    this._items[idx] = item;
    this.onItemAdded(item);
    this.scheduleUpdate();
  }
}
