class Shader {
  gl: WebGL2RenderingContext;

  shaderProgram: WebGLProgram;

  constructor(gl: WebGL2RenderingContext, vertexShdaderCode: string, fragmentShaderCode: string) {
    this.gl = gl;

    const vertexShader = this.loadShader(this.gl, this.gl.VERTEX_SHADER, vertexShdaderCode);

    if (vertexShader === null) {
      throw new Error('vertexShader is null');
    }

    const fragmentShader = this.loadShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderCode);

    if (fragmentShader === null) {
      throw new Error('fragmentShader is null');
    }

    this.shaderProgram = this.compileProgram(this.gl, vertexShader, fragmentShader);

    if (this.shaderProgram === null) {
      throw new Error('shaderProgram is null');
    }
  }

  compileProgram(
    gl: WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
  ): WebGLProgram {
    const shaderProgram = gl.createProgram();

    if (shaderProgram === null) {
      throw new Error('shaderProgram is null');
    }

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw new Error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
    }

    return shaderProgram;
  };

  loadShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string,
  ): WebGLShader {
    if (gl === null) {
      throw new Error('gl is null');
    }

    const shader = gl.createShader(type);

    if (shader === null) {
      throw new Error('shader is null');
    }

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);

      throw new Error(`An error occurred compiling the shaders: ${log}`);
    }

    return shader;
  };

  uniformLocation(name: string) {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);

    if (location === null) {
      throw new Error(`location ${name} is null`);
    }

    return location;
  }

  attributeLocation(name: string) {
    return this.gl.getAttribLocation(this.shaderProgram, name);
  }

  bindMatricesUniformLocation() {
    const bindingPoint = 0;
    const uniformBlockIndex = this.gl.getUniformBlockIndex(this.shaderProgram, 'Matrices');
    this.gl.uniformBlockBinding(this.shaderProgram, uniformBlockIndex, bindingPoint);
  }

  use() {
    this.gl.useProgram(this.shaderProgram);
  }
}

export default Shader;

