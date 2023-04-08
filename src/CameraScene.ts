import Camera from "parsegraph-camera";
import { Projector } from "parsegraph-projector";
import WorldTransformScene from "./WorldTransformScene";
import WorldTransform from "./WorldTransform";

export default class CameraScene extends WorldTransformScene {
  _camera: Camera;

  constructor(projector: Projector, camera: Camera) {
    super(projector);
    this._camera = camera;
  }

  camera() {
    return this._camera;
  }

  width() {
    return this.camera().width();
  }

  height() {
    return this.camera().height();
  }

  render(): boolean {
    // Set camera size
    const projector = this.projector();
    this.camera().setSize(projector.width(), projector.height());

    const wt = WorldTransform.fromCamera(this.camera());
    this.setWorldTransform(wt);

    return super.render();
  }
}
