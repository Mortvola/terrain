import Shader from './Shader';
import terrainVertex from './Terrain.vert';
import terrainFragment from './Terrain.frag';
import { mat4, vec3, vec4 } from 'gl-matrix';

class TerrainShader extends Shader {
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation,
    viewMatrix: WebGLUniformLocation,
    modelMatrix: WebGLUniformLocation,
    fogColor: WebGLUniformLocation,
    fogNormalizationFactor: WebGLUniformLocation,
    lightVector: WebGLUniformLocation,
  }

  attribLocations: {
    vertexPosition: number,
    texCoord: number,
    vertexNormal: number,
  }

  constructor(gl:WebGL2RenderingContext) {
    super(gl, terrainVertex, terrainFragment);

    this.uniformLocations = {
      projectionMatrix: this.uniformLocation('uProjectionMatrix'),
      viewMatrix: this.uniformLocation('uViewMatrix'),
      modelMatrix: this.uniformLocation('uModelMatrix'),
      fogColor: this.uniformLocation('uFogColor'),
      fogNormalizationFactor: this.uniformLocation('uFogNormalizationFactor'),
      lightVector: this.uniformLocation('uLightVector'),
    }

    this.attribLocations = {
      vertexPosition: this.attributeLocation('aVertexPosition'),
      texCoord: this.attributeLocation('aTexCoord'),
      vertexNormal: this.attributeLocation('aVertexNormal'),
    }
  }

  setView(view: mat4) {
    this.gl.uniformMatrix4fv(
      this.uniformLocations.viewMatrix,
      false,
      view,
    );
  }

  setProjection(projection: mat4) {
    this.gl.uniformMatrix4fv(
      this.uniformLocations.projectionMatrix,
      false,
      projection,
    );
  }

  setLightVector (lightVector: vec3) {
    this.gl.uniform3fv(this.uniformLocations.lightVector, lightVector);
  }

  setFog(color: vec4, normalizationFactor: number) {
    this.gl.uniform4fv(this.uniformLocations.fogColor, [1.0, 1.0, 1.0, 1.0]);
    this.gl.uniform1f(
      this.uniformLocations.fogNormalizationFactor, normalizationFactor,
    );
  }
}

export default TerrainShader;
