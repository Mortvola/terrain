import Shader from "./Shader";
import skyboxVert from './Skybox.vert';
import skyboxFrag from './Skybox.frag';

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
