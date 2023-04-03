import TimingBelt from "parsegraph-timingbelt";
import {
  Projector,
  BasicProjector,
  Projected,
  Projection,
} from "parsegraph-projector";

export default function render(
  container: Element,
  projected: Projected,
  projector: Projector = new BasicProjector(),
  belt: TimingBelt = new TimingBelt()
): () => void {
  container.appendChild(projector.container());
  new ResizeObserver(() => {
    belt.scheduleUpdate();
  }).observe(projector.container());

  const projection = new Projection(projector, projected);
  belt.addRenderable(projection);

  return () => {
    projection.unmount();
    belt.removeRenderable(projection);
    projector.container().remove();
  };
}
