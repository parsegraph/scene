import Camera from "parsegraph-camera";
import { Projector, BasicProjector } from "parsegraph-projector";
import TimingBelt from "parsegraph-timingbelt";
import AbstractScene from "./AbstractScene";
import { WorldLabels } from "./WorldLabel";
import WorldTransform from "./WorldTransform";
import Color from 'parsegraph-color';

const font = "96px sans-serif";

class Scene extends AbstractScene {
  _dom: HTMLElement;

  _cam: Camera;
  _labels: WorldLabels;

  constructor(projector: Projector, cam: Camera) {
    super(projector);
    this._cam = cam;
  }

  private createDom() {
    this._dom = document.createElement("div");
    this._dom.style.font = font;
    this._dom.innerText = "No timey";
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
    for(let i = 0; i < proj.width(); ++i) {
      if (i % 10 === 0) {
        this._labels.draw("Hello", i, i, 24, 1);
      } else {
        this._labels.draw("Hello", i, i, 12, 1);
      }
    }
    for(let i = 0; i < 50; ++i) {
      const x = Math.random() * proj.width();
      const y = Math.random() * proj.height();
      const size = 12 + 36 * Math.random()
      this._labels.draw("Hello", x, y, size, Math.random() * 10, new Color(0, 0, 0, 1), new Color(Math.random(), Math.random(), Math.random()));
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
  const cam = new Camera();
  const scene = new Scene(proj, cam);
  proj.container().tabIndex = 0;

  setTimeout(() => {
    scene.paint();
    redraw();
  }, 0);

  const redraw = ()=>{
    proj.glProvider().canvas();
    proj.overlay();
    proj.render();
    proj.glProvider().gl().viewport(0, 0, proj.width(), proj.height());
    console.log("REDRAW")
    cam.setSize(proj.width(), proj.height());
    proj.overlay().resetTransform();
    proj.overlay().clearRect(0, 0, proj.width(), proj.height());
    WorldTransform.fromCamera(null, cam).applyTransform(proj, null, cam.scale());
    scene.render();
  }
  let clicked = false;
  root.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
      clicked = true;
    }
  });
  root.addEventListener("mousemove", (e) => {
    if (!clicked) {
      return;
    }
    console.log(e.movementX);
    cam.adjustOrigin(e.movementX / cam.scale(), e.movementY / cam.scale());
    redraw();
  });
  root.addEventListener("mouseup", (e) => {
    if (e.button === 0) {
      clicked = false;
    }
  });
  proj.container().addEventListener("wheel", (e)=>{
    cam.zoomToPoint((e as WheelEvent).deltaY < 0 ? 1.1 : 0.9, e.clientX*cam.scale(), e.clientY*cam.scale());
    redraw();
  })
  proj.container().addEventListener("keydown", (e)=>{
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
