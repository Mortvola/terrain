import { compileProgram, loadShader } from './Common';
import photoVertex from './Photo.vert';
import photoFragment from './Photo.frag';

class PhotoShader {
  gl: WebGL2RenderingContext;

  shaderProgram: WebGLProgram | null = null;

  uniformLocations: {
    projectionMatrix: WebGLUniformLocation | null,
    viewMatrix: WebGLUniformLocation | null,
    modelMatrix: WebGLUniformLocation | null,
  } = {
      projectionMatrix: null,
      viewMatrix: null,
      modelMatrix: null,
    };

  attribLocations: {
    vertexPosition: number | null,
    texCoord: number | null,
  } = { vertexPosition: null, texCoord: null };

  constructor(gl:WebGL2RenderingContext) {
    this.gl = gl;

    const vertexShader = loadShader(this.gl, this.gl.VERTEX_SHADER, photoVertex);

    if (vertexShader === null) {
      throw new Error('vertexShader is null');
    }

    const fragmentShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, photoFragment);

    if (fragmentShader === null) {
      throw new Error('fragmentShader is null');
    }

    this.shaderProgram = compileProgram(this.gl, vertexShader, fragmentShader);

    if (this.shaderProgram === null) {
      throw new Error('shaderProgram is null');
    }

    this.uniformLocations.projectionMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix');

    if (this.uniformLocations.projectionMatrix === null) {
      throw new Error('projectionMatrix is null');
    }

    this.uniformLocations.viewMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uViewMatrix');

    if (this.uniformLocations.viewMatrix === null) {
      throw new Error('viewMatrix is null');
    }

    this.uniformLocations.modelMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uModelMatrix');

    if (this.uniformLocations.modelMatrix === null) {
      throw new Error('modelMatrix is null');
    }

    this.attribLocations.vertexPosition = this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
    this.attribLocations.texCoord = this.gl.getAttribLocation(this.shaderProgram, 'aTexCoord');
  }
}

export default PhotoShader;
