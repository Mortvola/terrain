import { vec3, vec4 } from 'gl-matrix';
import terrainVertex from './Terrain.vert';
import terrainFragment from './Terrain.frag';
import TriangleMeshShader from './TriangleMeshShader';

class TerrainShader extends TriangleMeshShader {
  uniformLocations: {
    fogColor: WebGLUniformLocation,
    fogNormalizationFactor: WebGLUniformLocation,
    lightVector: WebGLUniformLocation,
  }

  constructor(gl:WebGL2RenderingContext) {
    super(gl, terrainVertex, terrainFragment);

    this.bindMatricesUniformLocation();

    this.uniformLocations = {
      fogColor: this.uniformLocation('uFogColor'),
      fogNormalizationFactor: this.uniformLocation('uFogNormalizationFactor'),
      lightVector: this.uniformLocation('uLightVector'),
    }
  }

  setLightVector(lightVector: vec3) {
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
