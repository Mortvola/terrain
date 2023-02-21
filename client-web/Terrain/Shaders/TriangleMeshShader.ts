import Shader from "./Shader";

class TriangleMeshShader extends Shader {
  attribLocations: {
    texCoord: number,
    vertexNormal: number,
    tangent: number,
  }

  constructor (gl: WebGL2RenderingContext, vertexShdaderCode: string, fragmentShaderCode: string) {
    super(gl, vertexShdaderCode, fragmentShaderCode);

    this.attribLocations = {
      texCoord: this.attributeLocation('aTexCoord'),
      vertexNormal: this.attributeLocation('aVertexNormal'),
      tangent: this.attributeLocation('aTangent'),
    }
  }
}

export default TriangleMeshShader;
