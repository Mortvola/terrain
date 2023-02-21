import { mat4, vec3 } from 'gl-matrix';
import { degToRad } from '../utilities';
import { PhotoInterface } from '../PhotoInterface';
import PhotoShader from './Shaders/PhotoShader';
import { loaddImage } from './Texture';

type Data = {
  points: number[],
  indices: number[],
}

class Photo {
  photoData: PhotoInterface;

  gl: WebGL2RenderingContext;

  image = new Image();

  vao: WebGLVertexArrayObject | null = null;

  shader: PhotoShader;

  data: Data | null = null;

  texture: WebGLTexture | null = null;

  xOffset: number;

  yOffset: number;

  zOffset: number;

  transform: mat4 = mat4.create();

  scale: number;

  center: vec3 = vec3.fromValues(0, 0, 0);

  onPhotoLoaded: () => void;

  constructor(
    photoData: PhotoInterface,
    photoUrl: string,
    gl: WebGL2RenderingContext,
    shader: PhotoShader,
    xOffset: number,
    yOffset: number,
    zOffset: number,
    scale: number,
    onPhotoLoaded: () => void,
  ) {
    this.photoData = photoData;
    this.photoData.onChange = this.makeTransform.bind(this);
    this.gl = gl;
    this.shader = shader;
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    this.zOffset = zOffset;
    this.scale = scale;
    this.onPhotoLoaded = onPhotoLoaded;

    this.makeTransform();

    this.loadPhoto(`${photoUrl}/${this.photoData.id}`);
  }

  async loadPhoto(photoUrl: string): Promise<void> {
    if (this.texture === null) {
      const image = await loaddImage(photoUrl);

      this.data = this.initData(image.width, image.height);

      this.vao = this.gl.createVertexArray();

      this.gl.bindVertexArray(this.vao);
      this.initBuffers();
      this.initTexture(image);
      this.gl.bindVertexArray(null);

      this.onPhotoLoaded();

    }

    return Promise.resolve();
  }

  // eslint-disable-next-line class-methods-use-this
  initData(width: number, height: number): Data {
    const w = 15.75;
    const h = (w / width) * height;
    console.log(h);
    console.log(this.scale);
    const points = [
      0, w, h, 0, 0,
      0, w, -h, 0, 1,
      0, -w, -h, 1, 1,
      0, -w, h, 1, 0,
    ];

    const indices = [
      0, 1, 2,
      2, 3, 0,
    ];

    return { points, indices };
  }

  makeTransform(): void {
    const transform = mat4.create();

    mat4.translate(transform, transform, [
      (this.xOffset + this.photoData.translation[0]) * this.scale,
      (this.yOffset + this.photoData.translation[1]) * this.scale,
      this.zOffset + 0, // this.photoData.translation[2],
    ]);

    const offset = vec3.multiply(
      vec3.create(),
      this.photoData.offset,
      vec3.fromValues(this.scale, this.scale, 1),
    );

    mat4.rotateZ(transform, transform, degToRad(this.photoData.zRotation));
    mat4.rotateY(transform, transform, degToRad(this.photoData.yRotation));
    mat4.translate(transform, transform, offset);
    mat4.rotateX(transform, transform, degToRad(this.photoData.xRotation));

    this.transform = transform;

    vec3.transformMat4(this.center, vec3.create(), this.transform);
  }

  setTranslation(x: number | null, y: number | null, z: number | null): void {
    this.photoData.setTranslation(x, y, z);
  }

  setOffset(x: number | null, y: number | null, z: number | null): void {
    this.photoData.setOffset(x, y, z);
  }

  setRotation(x: number | null, y: number | null, z: number | null): void {
    this.photoData.setRotation(x, y, z);
  }

  setScale(scale: number): void {
    this.scale = scale;
    this.makeTransform();
  }

  initBuffers(): void {
    if (this.data === null) {
      throw new Error('data is null');
    }

    this.createVertexBuffer(this.data.points);
    this.createIndexBuffer(this.data.indices);
  }

  createVertexBuffer(
    positions: number[],
  ): void {
    const positionBuffer = this.gl.createBuffer();

    if (positionBuffer === null) {
      throw new Error('positionBuffer is null');
    }

    const floatSize = 4;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

    this.gl.enableVertexAttribArray(this.shader.vertexPosition);
    this.gl.vertexAttribPointer(
      this.shader.vertexPosition,
      3, // Number of components
      this.gl.FLOAT,
      false, // normalize
      5 * floatSize, // stride
      0, // offset
    );

    this.gl.enableVertexAttribArray(this.shader.attribLocations.texCoord);
    this.gl.vertexAttribPointer(
      this.shader.attribLocations.texCoord,
      2, // Number of components
      this.gl.FLOAT,
      false, // normalize
      5 * floatSize, // stride
      3 * floatSize, // offset
    );
  }

  createIndexBuffer(
    indices: number[],
  ): void {
    const indexBuffer = this.gl.createBuffer();

    if (indexBuffer === null) {
      throw new Error('indexBuffer is null');
    }

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), this.gl.STATIC_DRAW);
  }

  initTexture(image: HTMLImageElement):void {
    this.texture = this.gl.createTexture();
    if (this.texture === null) {
      throw new Error('this.texture is null');
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    const level = 0;
    const internalFormat = this.gl.RGBA;
    const srcFormat = this.gl.RGBA;
    const srcType = this.gl.UNSIGNED_BYTE;

    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      level,
      internalFormat,
      image.width,
      image.height,
      0,
      srcFormat,
      srcType,
      image,
    );
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
  }

  draw(): void {
    if (this.data && this.data.indices.length !== 0) {
      this.gl.bindVertexArray(this.vao);

      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

      this.gl.drawElements(
        this.gl.TRIANGLES,
        this.data.indices.length, // vertex count
        this.gl.UNSIGNED_INT, // unsigned int
        0, // offset
      );

      this.gl.bindVertexArray(null);
    }
  }
}

export default Photo;
