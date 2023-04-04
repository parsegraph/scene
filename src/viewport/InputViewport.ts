import Camera from "parsegraph-camera";

export const MIN_CAMERA_SCALE = 1 / 800;

export default interface InputViewport {
  lastMouseX(): number;
  lastMouseY(): number;
  camera(): Camera;
  resetCamera(complete?: boolean): void;
  scheduleRepaint(): void;
  mouseVersion(): number;
}
