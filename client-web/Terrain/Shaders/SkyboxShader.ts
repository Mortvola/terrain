import Shader from "./Shader";
import skyboxVert from './Skybox.vert';
import skyboxFrag from './Skybox.frag';
import { mat4 } from "gl-matrix";

class SkyboxShader extends Shader {
  attribLocations: {
    position: number,
  };

  constructor(gl: WebGL2RenderingContext) {
    super(gl, skyboxVert, skyboxFrag);

    this.bindMatricesUniformLocation();

    this.attribLocations = {
      position: this.attributeLocation('aPos'),
    }
  }
}

export default SkyboxShader;
