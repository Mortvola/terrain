import Shader from './Shader';
import meshVert from './Mesh.vert';
import meshFrag from './Mesh.frag';
import { mat4 } from 'gl-matrix';

class MeshShader extends Shader {
  uniformLocations: {
    modelMatrix: WebGLUniformLocation,
  }

  attribLocations: {
    position: number,
  };

  constructor(gl: WebGL2RenderingContext) {
    super(gl, meshVert, meshFrag);

    this.bindMatricesUniformLocation();

    this.uniformLocations = {
      modelMatrix: this.uniformLocation('uModelMatrix'),
    }

    this.attribLocations = {
      position: this.attributeLocation('aVertexPosition'),
    }
  }

  setModelMatrix(modelMatrix: mat4) {
    this.gl.uniformMatrix4fv(
      this.uniformLocations.modelMatrix,
      false,
      modelMatrix,
    );
  }
}

export default MeshShader;
