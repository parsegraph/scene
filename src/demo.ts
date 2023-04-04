import { Projector, BasicProjector } from "parsegraph-projector";
import TimingBelt from "parsegraph-timingbelt";
import AbstractScene from "./AbstractScene";
import { WorldLabels } from "./WorldLabel";
import Color from "parsegraph-color";
import { Viewport } from "./viewport";

const font = "96px sans-serif";

class Scene extends AbstractScene {
  _dom: HTMLElement;

  _labels: WorldLabels;

  _needsRepaint: boolean;
  _viewport: Viewport;

  constructor(projector: Projector) {
    super(projector);
    this._needsRepaint = true;
  }

  private createDom() {
    this._dom = document.createElement("div");
    this._dom.style.font = font;
    this._dom.innerText = "No timey";
    this._labels = new WorldLabels();
    this._labels.setScaleMultiplier(2);
  }

  paint() {
    const needsUpdate = super.paint();
    if (!needsUpdate && !this._needsRepaint) {
      return false;
    }
    this._needsRepaint = false;
    const proj = this.projector();
    proj.overlay();
    if (!this._dom) {
      this.createDom();
    }
    proj.getDOMContainer().appendChild(this._dom);
    this._dom.style.position = "absolute";
    this._dom.style.left = "0px";
    this._dom.style.top = "70px";

    this._labels.clear();
    for (let i = 0; i < Math.min(proj.height(), proj.width()); ++i) {
      if (i % 10 === 0) {
        this._labels.draw("Hello", i, i, 24, 1);
      } else {
        this._labels.draw("Hello", i, i, 12, 1);
      }
    }
    for (let i = 0; i < 50; ++i) {
      const x = Math.random() * proj.width();
      const y = Math.random() * proj.height();
      const size = 12 + 36 * Math.random();
      this._labels.draw(
        "DOWNWARD",
        x,
        y,
        size,
        1,
        new Color(0, 0, 0, 1),
        new Color(Math.random(), Math.random(), Math.random())
      );
    }
    this._labels.draw("Hello", 50, 0, 16, 2);
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
    for (let x = 0; x < w; x += step) {
      for (let y = 0; y < h; y += step) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    this._labels?.render(proj, this.worldTransform());

    ctx.resetTransform();
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.font = "18px mono";
    ctx.fillText("scale=" + this.worldTransform().scale(), 0, 0);
    if (this._viewport) {
      const mouse = this._viewport.mouse();

      const [tx, ty] = this._viewport
        .camera()
        .transform(mouse.lastMouseX(), mouse.lastMouseY());
      ctx.fillText(`mouse=(${tx}, ${ty})`, 0, 16);
    }

    return needsUpdate;
  }

  setViewport(viewport: Viewport) {
    this._viewport = viewport;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("demo");

  const belt = new TimingBelt();
  const proj = new BasicProjector();
  proj.container().tabIndex = 0;
  const scene = new Scene(proj);

  const viewport = new Viewport(new Color(0.2, 0.2, 0.2, 1));
  viewport.setScene(scene);
  scene.setViewport(viewport);

  belt.addRenderable(viewport);
  root.appendChild(proj.container());
});
