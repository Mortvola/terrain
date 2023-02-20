import Shader from './Shader';
import lineVert from './Line.vert';
import lineFrag from './Line.frag';
import { mat4 } from 'gl-matrix';

class LineShader extends Shader {
  uniformLocations: {
    modelMatrix: WebGLUniformLocation,
  }

  constructor(gl: WebGL2RenderingContext) {
    super(gl, lineVert, lineFrag);

    this.bindMatricesUniformLocation();

    this.uniformLocations = {
      modelMatrix: this.uniformLocation('uModelMatrix'),
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

export default LineShader;
