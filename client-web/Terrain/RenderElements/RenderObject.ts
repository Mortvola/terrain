import { mat4 } from "gl-matrix";

interface RenderObjectInterface {
  draw(modelMatrix: mat4): void;

  drawMesh(): void
}

export default RenderObjectInterface;
