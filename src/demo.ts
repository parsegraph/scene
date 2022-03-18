import { BasicProjector } from "parsegraph-projector";
import TimingBelt from "parsegraph-timingbelt";
import AbstractScene from "./AbstractScene";

const font = "96px sans"

class Scene extends AbstractScene {
  _dom:HTMLElement;

  private createDom() {
    this._dom = document.createElement("div");
    this._dom.style.font = font;
    this._dom.innerText = "No timey";
  }

  paint() {
    const needsUpdate = super.paint();
    this.projector().overlay();
    if (!this._dom) {
      this.createDom();
    }
    this.projector().getDOMContainer().appendChild(this._dom);
    this._dom.style.position = "absolute";
    this._dom.style.left = "0px";
    this._dom.style.top = "70px";
    return needsUpdate;
  }

  render() {
    const needsUpdate = super.render();
    const proj = this.projector();
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
    for(let x = 0; x < w; x += step) {
      for(let y = 0; y < h; y += step) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    return needsUpdate;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("demo");
  const belt = new TimingBelt();
  const proj = new BasicProjector();
  const scene = new Scene(proj);
  root.appendChild(proj.container());
  belt.addRenderable(scene);
});
