import Camera from "parsegraph-camera";
import { BasicProjector } from "parsegraph-projector";
import TimingBelt from "parsegraph-timingbelt";
import AbstractScene from "./AbstractScene";
import { WorldLabels } from "./WorldLabel";
import WorldTransform from "./WorldTransform";

const font = "96px sans";

class Scene extends AbstractScene {
  _dom: HTMLElement;

  _cam: Camera;
  _labels: WorldLabels;

  private createDom() {
    this._dom = document.createElement("div");
    this._dom.style.font = font;
    this._dom.innerText = "No timey";

    this._cam = new Camera();
    this._labels = new WorldLabels();
  }

  paint() {
    const needsUpdate = super.paint();
    const proj = this.projector();
    proj.overlay();
    if (!this._dom) {
      this.createDom();
    }
    this._cam.setSize(proj.width(), proj.height());
    proj.getDOMContainer().appendChild(this._dom);
    this._dom.style.position = "absolute";
    this._dom.style.left = "0px";
    this._dom.style.top = "70px";

    this._labels.clear();
    for(let i = 0; i < 100; ++i) {
      if (i % 10 === 0) {
        this._labels.draw("Hello", i, i, 24, 1);
      } else {
        this._labels.draw("Hello", i, i, 12, 1);
      }
    }
    this._labels.draw("Hello", 50, 0, 25, 2);
    return needsUpdate;
  }

  render() {
    const needsUpdate = super.render();
    const proj = this.projector();
    const wt = WorldTransform.fromCamera(null, this._cam);
    wt.applyTransform(proj, null, this._cam.scale());

    const ctx = proj.overlay();
    ctx.font = font;
    ctx.fillStyle = "orange";
    ctx.fillRect(0, 0, proj.width(), proj.height());
    ctx.textBaseline = "top";
    ctx.fillStyle = "black";
    ctx.fillText("No timey", 0, 0);

    const w = proj.width();
    const h = proj.height();
    ctx.fillStyle = "blue";
    const step = 10;
    for (let x = 0; x < w; x += step) {
      for (let y = 0; y < h; y += step) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    this._labels.render(proj, this._cam.scale());

    return needsUpdate;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("demo");
  const belt = new TimingBelt();
  const proj = new BasicProjector();
  const scene = new Scene(proj);
  proj.container().tabIndex = 0;
  proj.container().addEventListener("wheel", (e)=>{
    const cam = scene._cam;
    cam.setScale(cam.scale() * ((e as WheelEvent).deltaY > 0 ? 1.1 : 0.9));
    belt.scheduleUpdate()
  })
  proj.container().addEventListener("keydown", (e)=>{
    const cam = scene._cam;
    if (e.key === '+' || e.key === '=') {
      cam.setScale(cam.scale() * 1.1);
    }
    if (e.key === '-' || e.key === '_') {
      cam.setScale(cam.scale() * 0.9)
    }
    belt.scheduleUpdate()
  })
  proj.container().focus();
  root.appendChild(proj.container());
  belt.addRenderable(scene);
});
