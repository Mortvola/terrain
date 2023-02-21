import RenderObjectInterface from "./RenderObject";
import TriangleMeshShader from "../Shaders/TriangleMeshShader";
import { mat4, vec2, vec3 } from "gl-matrix";
import Shader from "../Shaders/Shader";

const vertexStride = 11;
const floatSize = 4;

class TriangleMesh implements RenderObjectInterface {
  gl: WebGL2RenderingContext;

  vao: WebGLVertexArrayObject | null;

  numVertices = 0;

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
    this.createBuffer(normals, points, indices, shader);
    this.gl.bindVertexArray(null);
  }

  // createVertexBuffer(
  //   positions: number[],
  //   shader: TriangleMeshShader,
  // ): void {
  //   const vertexBuffer = this.gl.createBuffer();

  //   if (vertexBuffer === null) {
  //     throw new Error('vertexBuffer is null');
  //   }

  //   this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
  //   this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
  //   this.gl.enableVertexAttribArray(shader.vertexPosition);
  //   this.gl.vertexAttribPointer(
  //     shader.vertexPosition,
  //     3, // Number of components
  //     this.gl.FLOAT,
  //     false, // normalize
  //     vertexStride * floatSize, // stride
  //     0, // offset
  //   );

  //   this.gl.enableVertexAttribArray(shader.attribLocations.texCoord);
  //   this.gl.vertexAttribPointer(
  //     shader.attribLocations.texCoord,
  //     2, // Number of components
  //     this.gl.FLOAT,
  //     false, // normalize
  //     vertexStride * floatSize, // stride
  //     3 * floatSize, // offset
  //   );
  // }

  createBuffer(
    normals: number[],
    points: number[],
    indices: number[],
    shader: TriangleMeshShader,
  ): void {
    const normalBuffer = this.gl.createBuffer();

    if (normalBuffer === null) {
      throw new Error('normalBuffer is null');
    }

    // Buffer for the vertex data (position, texture, normal, tangent)
    const buffer: number[] = [];

    const edge1 = vec3.create();      
    const edge2 = vec3.create();
    const deltaUV1 = vec2.create();
    const deltaUV2 = vec2.create();

    for (let i = 0; i < indices.length; i += 3) {
      const pointCoords: vec3[] = [];
      const textureCoords: vec2[] = [];
      const vertexNormals: vec3[] = [];

      for (let j = 0; j < 3; j += 1) {
        const index = indices[i + j];

        pointCoords.push(vec3.fromValues(
          points[index * 5 + 0],
          points[index * 5 + 1],
          points[index * 5 + 2],
        ))
  
        textureCoords.push(vec2.fromValues(
          points[index * 5 + 3],
          points[index * 5 + 4],
        ));
  
        vertexNormals.push(vec3.fromValues(
          normals[index * 3 + 0],
          normals[index * 3 + 1],
          normals[index * 3 + 2],
        ));
      }

      for (let j = 0; j < 3; j += 1) {
        vec3.subtract(edge1, pointCoords[j + 0], pointCoords[(j + 1) % 3]);
        vec3.subtract(edge2, pointCoords[j + 0], pointCoords[(j + 2) % 3]);
        vec2.subtract(deltaUV1, textureCoords[j + 0], textureCoords[(j + 1) % 3]);
        vec2.subtract(deltaUV2, textureCoords[j + 0], textureCoords[(j + 2) % 3]);

        // inverse of the matrix determinant
        const f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

        const tangent = vec3.fromValues(
          f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]),
          f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]),
          f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]),
        )

        // const bitangent = vec3.fromValues(
        //   f * (deltaUV1[0] * edge2[0] - deltaUV2[0] * edge1[0]),
        //   f * (deltaUV1[0] * edge2[1] - deltaUV2[0] * edge1[1]),
        //   f * (deltaUV1[0] * edge2[2] - deltaUV2[0] * edge1[2]),
        // )

        buffer.push(pointCoords[j][0]);
        buffer.push(pointCoords[j][1]);
        buffer.push(pointCoords[j][2]);

        buffer.push(textureCoords[j][0]);
        buffer.push(textureCoords[j][1]);

        buffer.push(vertexNormals[j][0]);
        buffer.push(vertexNormals[j][1]);
        buffer.push(vertexNormals[j][2]);

        buffer.push(tangent[0]);
        buffer.push(tangent[1]);
        buffer.push(tangent[2]);

        // buffer.push(bitangent[0]);
        // buffer.push(bitangent[1]);
        // buffer.push(bitangent[2]);

        this.numVertices += 1;
      }
    }

    const buf = this.gl.createBuffer();

    if (buf === null) {
      throw new Error('buf is null');
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(buffer), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(shader.vertexPosition);
    this.gl.vertexAttribPointer(
      shader.vertexPosition,
      3, // Number of components
      this.gl.FLOAT,
      false, // normalize
      vertexStride * floatSize, // stride
      0, // offset
    );

    this.gl.enableVertexAttribArray(shader.attribLocations.texCoord);
    this.gl.vertexAttribPointer(
      shader.attribLocations.texCoord,
      2, // Number of components
      this.gl.FLOAT,
      false, // normalize
      vertexStride * floatSize, // stride
      3 * floatSize, // offset
    );

    this.gl.enableVertexAttribArray(shader.attribLocations.vertexNormal);
    this.gl.vertexAttribPointer(
      shader.attribLocations.vertexNormal,
      3, // Number of components
      this.gl.FLOAT,
      false, // normalize
      vertexStride * floatSize, // stride
      5 * floatSize, // offset
    );

    this.gl.enableVertexAttribArray(shader.attribLocations.tangent);
    this.gl.vertexAttribPointer(
      shader.attribLocations.tangent,
      3, // Number of components
      this.gl.FLOAT,
      false, // normalize
      vertexStride * floatSize, // stride
      8 * floatSize, // offset
    );
  }

  // createIndexBuffer(
  //   indices: number[],
  // ): void {
  //   const indexBuffer = this.gl.createBuffer();

  //   if (indexBuffer === null) {
  //     throw new Error('indexBuffer is null');
  //   }

  //   this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  //   this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), this.gl.STATIC_DRAW);
  // }

  draw(modelMatrix: mat4): void {
    if (this.numVertices !== 0) {
      this.shader.setModelMatrix(modelMatrix);

      this.gl.bindVertexArray(this.vao);

      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.numVertices)

      this.gl.bindVertexArray(null);
    }
  }

  drawMesh(): void {
    if (this.numVertices !== 0) {
      this.gl.bindVertexArray(this.vao);

      this.gl.drawArrays(this.gl.LINES, 0, this.numVertices)

      this.gl.bindVertexArray(null);
    }
  }
}

export default TriangleMesh;
