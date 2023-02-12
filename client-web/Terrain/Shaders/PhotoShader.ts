import Shader from './Shader';
import photoVertex from './Photo.vert';
import photoFragment from './Photo.frag';

class PhotoShader extends Shader {
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation,
    viewMatrix: WebGLUniformLocation,
    modelMatrix: WebGLUniformLocation,
  }

  attribLocations: {
    vertexPosition: number,
    texCoord: number,
  }

  constructor(gl:WebGL2RenderingContext) {
    super(gl, photoVertex, photoFragment)

    this.uniformLocations = {
      projectionMatrix: this.uniformLocation('uProjectionMatrix'),
      viewMatrix: this.uniformLocation('uViewMatrix'),
      modelMatrix: this.uniformLocation('uModelMatrix'),
    }

    this.attribLocations = {
      vertexPosition: this.attributeLocation('aVertexPosition'),
      texCoord: this.attributeLocation('aTexCoord'),
    }
  }
}

export default PhotoShader;
