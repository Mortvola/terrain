import { mat4, vec3 } from "gl-matrix";
import LineShader from "../Shaders/LineShader";
import Shader from "../Shaders/Shader";
import RenderObjectInterface from "./RenderObject";

const vertexStride = 3;
const floatSize = 4;

class Normals implements RenderObjectInterface {
  gl: WebGL2RenderingContext;

  vao: WebGLVertexArrayObject | null;

  numNormals = 0;

  shader: LineShader;
  
  constructor(
    gl: WebGL2RenderingContext,
    points: number[],
    normals: number[],
    indices: number[],
    shader: LineShader,
  ) {
    this.gl = gl;
    this.shader = shader;

    this.vao = this.gl.createVertexArray();

    this.gl.bindVertexArray(this.vao);
    this.createNormals(normals, points, indices, shader);
    this.gl.bindVertexArray(null);
  }

  formatData(
    normals: number[],
    points: number[],
    indices: number[],
  ): number[] {
    // Buffer for the vertex data (position, texture, normal, tangent)
    const data: number[] = [];

    for (let i = 0; i < indices.length; i += 1) {
      const point1 = vec3.fromValues(
        points[i * 5 + 0],
        points[i * 5 + 1],
        points[i * 5 + 2],
      );
  
      const normal = vec3.fromValues(
        normals[i * 3 + 0],
        normals[i * 3 + 1],
        normals[i * 3 + 2],
      );

      const point2 = vec3.create();

      vec3.scaleAndAdd(point2, point1, normal, 3);

      data.push(point1[0]);
      data.push(point1[1]);
      data.push(point1[2]);

      data.push(point2[0]);
      data.push(point2[1]);
      data.push(point2[2]);

      this.numNormals += 1;
    }

    return data;
  }

  createNormals (
    normals: number[],
    points: number[],
    indices: number[],
    shader: Shader,
  ) {
    const data = this.formatData(normals, points, indices);

    const buf = this.gl.createBuffer();

    if (buf === null) {
      throw new Error('buf is null');
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(shader.vertexPosition);
    this.gl.vertexAttribPointer(
      shader.vertexPosition,
      3, // Number of components
      this.gl.FLOAT,
      false, // normalize
      vertexStride * floatSize, // stride
      0, // offset
    );
  }

  draw(modelMatrix: mat4) : void {
    if (this.numNormals !== 0) {
      this.shader.use();

      this.shader.setModelMatrix(modelMatrix);

      this.gl.bindVertexArray(this.vao);

      this.gl.drawArrays(
        this.gl.LINES,
        0,
        this.numNormals,
      );

      this.gl.bindVertexArray(null);
    }
  }

  drawMesh() : void {
  }
}

export default Normals;
