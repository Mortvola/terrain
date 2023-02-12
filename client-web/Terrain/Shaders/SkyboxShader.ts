import Shader from "./Shader";
import skyboxVert from './Skybox.vert';
import skyboxFrag from './Skybox.frag';
import { mat4 } from "gl-matrix";

class SkyboxShader extends Shader {
  uniformLocations: {
    projection: WebGLUniformLocation,
    view: WebGLUniformLocation,
  };

  attribLocations: {
    position: number,
  };

  constructor(gl: WebGL2RenderingContext) {
    super(gl, skyboxVert, skyboxFrag);

    this.uniformLocations = {
      projection: this.uniformLocation('uProjectionMatrix'),
      view: this.uniformLocation('uViewMatrix'),
    }

    this.attribLocations = {
      position: this.attributeLocation('aPos'),
    }
  }

  setView(view: mat4) {
    this.gl.uniformMatrix4fv(
      this.uniformLocations.view,
      false,
      view,
    );
  }

  setProjection(projection: mat4) {
    this.gl.uniformMatrix4fv(
      this.uniformLocations.projection,
      false,
      projection,
    );
  }
}

export default SkyboxShader;
