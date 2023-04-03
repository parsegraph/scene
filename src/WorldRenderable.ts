import { Renderable } from "parsegraph-timingbelt";
import Transformed from "./Transformed";
import {Projector} from 'parsegraph-projector';

interface ProjectedScene {
  projector(): Projector;
}

type WorldRenderable = Renderable & Transformed & ProjectedScene;

export default WorldRenderable;
