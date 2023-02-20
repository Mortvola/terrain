import { mat4 } from "gl-matrix";
import Shader from "../Shaders/Shader";
import RenderObjectInterface from "./RenderObject";

const vertexStride = 3;

class Line implements RenderObjectInterface {
  gl: WebGL2RenderingContext;

  vao: WebGLVertexArrayObject | null;

  numVertices: number;

  shader: Shader;

  constructor(gl: WebGL2RenderingContext, points: number[], shader: Shader) {
    this.gl = gl;
    this.shader = shader;

    this.vao = this.gl.createVertexArray();

    this.gl.bindVertexArray(this.vao);
    this.createVertexBuffer(points, shader);
    // this.createIndexBuffer(indices);
    this.gl.bindVertexArray(null);

    this.numVertices = points.length / 3;
  }

  createVertexBuffer(
    positions: number[],
    shader: Shader,
  ): void {
    const vertexBuffer = this.gl.createBuffer();

    if (vertexBuffer === null) {
      throw new Error('vertexBuffer is null');
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(shader.vertexPosition);
    this.gl.vertexAttribPointer(
      shader.vertexPosition,
      3, // Number of components
      this.gl.FLOAT,
      false, // normalize
      vertexStride * 4, // stride
      0, // offset
    );
  }

  draw(modelMatrix: mat4) : void {
    if (this.numVertices !== 0) {
      this.shader.use();

      this.shader.setModelMatrix(modelMatrix);

      this.gl.bindVertexArray(this.vao);

      this.gl.drawArrays(
        this.gl.LINE_STRIP,
        0,
        this.numVertices, // vertex count
      );

      this.gl.bindVertexArray(null);
    }
  }

  drawMesh(): void {

  }
}

export default Line;
