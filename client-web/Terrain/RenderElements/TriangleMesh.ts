import RenderObjectInterface from "./RenderObject";
import TriangleMeshShader from "../Shaders/TriangleMeshShader";
import { mat4 } from "gl-matrix";
import Shader from "../Shaders/Shader";

const vertexStride = 5;

class TriangleMesh implements RenderObjectInterface {
  gl: WebGL2RenderingContext;

  vao: WebGLVertexArrayObject | null;

  numIndices: number;

  shader: Shader;

  constructor(
    gl: WebGL2RenderingContext,
    points: number[],
    normals: number[],
    indices: number[],
    shader: TriangleMeshShader,
  ) {
    this.gl = gl;
    this.shader = shader;

    this.vao = this.gl.createVertexArray();

    this.gl.bindVertexArray(this.vao);
    this.createVertexBuffer(points, shader);
    this.createNormalBuffer(normals, shader);
    this.createIndexBuffer(indices);
    this.gl.bindVertexArray(null);

    this.numIndices = indices.length;
  }

  createVertexBuffer(
    positions: number[],
    shader: TriangleMeshShader,
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

  createNormalBuffer(
    vertexNormals: number[],
    shader: TriangleMeshShader,
  ): void {
    const normalBuffer = this.gl.createBuffer();

    if (normalBuffer === null) {
      throw new Error('normalBuffer is null');
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormals), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(shader.attribLocations.vertexNormal);
    this.gl.vertexAttribPointer(
      shader.attribLocations.vertexNormal,
      3, // Number of components
      this.gl.FLOAT, // type
      false, // normalize
      0, // stride
      0, // offset
    );
  }

  createIndexBuffer(
    indices: number[],
  ): void {
    const indexBuffer = this.gl.createBuffer();

    if (indexBuffer === null) {
      throw new Error('indexBuffer is null');
    }

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), this.gl.STATIC_DRAW);
  }

  draw(modelMatrix: mat4): void {
    if (this.numIndices !== 0) {
      this.shader.setModelMatrix(modelMatrix);

      this.gl.bindVertexArray(this.vao);

      this.gl.drawElements(
        this.gl.TRIANGLES,
        this.numIndices, // vertex count
        this.gl.UNSIGNED_INT, // unsigned int
        0, // offset
      );

      this.gl.bindVertexArray(null);
    }
  }

  drawMesh(): void {
    if (this.numIndices !== 0) {
      this.gl.bindVertexArray(this.vao);

      this.gl.drawElements(
        this.gl.LINES,
        this.numIndices, // vertex count
        this.gl.UNSIGNED_INT, // unsigned int
        0, // offset
      );

      this.gl.bindVertexArray(null);
    }
  }
}

export default TriangleMesh;
