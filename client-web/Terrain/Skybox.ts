import { mat3, mat4, quat } from "gl-matrix";
import SkyboxShader from "./Shaders/SkyboxShader";

class Skybox {
  gl: WebGL2RenderingContext

  texture: WebGLTexture | null = null;

  skyboxShader: SkyboxShader;

  skyboxVAO: WebGLVertexArrayObject | null;

  skyboxVBO: WebGLBuffer | null;

  loaded = false;

  constructor(gl: WebGL2RenderingContext, skyboxShader: SkyboxShader) {
    this.gl = gl

    this.skyboxShader = skyboxShader;

    this.skyboxVAO = this.gl.createVertexArray();
    this.skyboxVBO = this.gl.createBuffer();

    const floatSize = 4;

    this.gl.bindVertexArray(this.skyboxVAO);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skyboxVBO);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(skyboxVertices), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(this.skyboxShader.attribLocations.position);
    this.gl.vertexAttribPointer(
      this.skyboxShader.attribLocations.position,
      3, this.gl.FLOAT, false, 3 * floatSize, 0);
    this.gl.bindVertexArray(null);
  }

  async load() {
    const faces: { file: string, face: GLenum }[] = [
      { file: "skybox-east.png", face: this.gl.TEXTURE_CUBE_MAP_POSITIVE_X },
      { file: "skybox-north.png", face: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y },
      { file: "skybox-up.png", face: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z },
      { file: "skybox-west.png", face: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X },
      { file: "skybox-south.png", face: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y },
      { file: "skybox-down.png", face: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z },
    ];

    await this.loadCubemap(faces);

    this.loaded = true;
    console.log('ready')
  }

  draw () {
    if (this.loaded) {
      this.skyboxShader.use();

      this.gl.depthFunc(this.gl.LEQUAL)
      this.gl.bindVertexArray(this.skyboxVAO);
      this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 36);
      this.gl.bindVertexArray(null);
      this.gl.depthFunc(this.gl.LESS)  
    }
  }

  async loadCubemap(faces: { file: string, face: GLenum }[]) {
    this.texture = this.gl.createTexture();
    if (this.texture === null) {
      throw new Error('this.texture is null');
    }

    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);

    await Promise.all(faces.map((face) => this.loadImage(face.file, face.face)));

    this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);  
    this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
  }

  loadImage(file: string, face: GLenum): Promise<void> {
    return new Promise((resolve) => {
      const image = new Image();

      image.onload = () => {
        if (this === null || this.gl === null) {
          throw new Error('this or this.gl is null');
        }

        // this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);

        const level = 0;
        const internalFormat = this.gl.RGB;
        const srcFormat = this.gl.RGB;
        const srcType = this.gl.UNSIGNED_BYTE;
    
        this.gl.texImage2D(
          face,
          level,
          internalFormat,
          image.width,
          image.height,
          0,
          srcFormat,
          srcType,
          image,
        );

        console.log('image loaded')
        // this.gl.generateMipmap(this.gl.TEXTURE_2D);
    
        // this.gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, 
        //   0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data
        // );
    
        resolve();
      };

      image.src = `/${file}`;
    });
  }
}

const skyboxVertices: number[] = [
  // positions          
  -1.0,  1.0, -1.0,
  -1.0, -1.0, -1.0,
   1.0, -1.0, -1.0,
   1.0, -1.0, -1.0,
   1.0,  1.0, -1.0,
  -1.0,  1.0, -1.0,

  -1.0, -1.0,  1.0,
  -1.0, -1.0, -1.0,
  -1.0,  1.0, -1.0,
  -1.0,  1.0, -1.0,
  -1.0,  1.0,  1.0,
  -1.0, -1.0,  1.0,

   1.0, -1.0, -1.0,
   1.0, -1.0,  1.0,
   1.0,  1.0,  1.0,
   1.0,  1.0,  1.0,
   1.0,  1.0, -1.0,
   1.0, -1.0, -1.0,

  -1.0, -1.0,  1.0,
  -1.0,  1.0,  1.0,
   1.0,  1.0,  1.0,
   1.0,  1.0,  1.0,
   1.0, -1.0,  1.0,
  -1.0, -1.0,  1.0,

  -1.0,  1.0, -1.0,
   1.0,  1.0, -1.0,
   1.0,  1.0,  1.0,
   1.0,  1.0,  1.0,
  -1.0,  1.0,  1.0,
  -1.0,  1.0, -1.0,

  -1.0, -1.0, -1.0,
  -1.0, -1.0,  1.0,
   1.0, -1.0, -1.0,
   1.0, -1.0, -1.0,
  -1.0, -1.0,  1.0,
   1.0, -1.0,  1.0
];

export default Skybox;