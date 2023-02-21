import { vec3, vec4 } from 'gl-matrix';
import terrainVertex from './Terrain.vert';
import terrainFragment from './Terrain.frag';
import TriangleMeshShader from './TriangleMeshShader';

class TerrainShader extends TriangleMeshShader {
  uniformLocations: {
    lightVector: WebGLUniformLocation,
    normalMap: WebGLUniformLocation,
  }

  constructor(gl:WebGL2RenderingContext) {
    super(gl, terrainVertex, terrainFragment);

    this.bindMatricesUniformLocation();

    this.uniformLocations = {
      lightVector: this.uniformLocation('uLightVector'),
      normalMap: this.uniformLocation('normalMap'),
    }
  }

  setLightVector(lightVector: vec3) {
    this.gl.uniform3fv(this.uniformLocations.lightVector, lightVector);
  }

  setNormalMap(id: number) {
    this.gl.uniform1i(this.uniformLocations.normalMap, id);
  }
}

export default TerrainShader;
