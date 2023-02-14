import { mat4 } from 'gl-matrix';
import Http from '@mortvola/http';
import {
  bilinearInterpolation, terrainTileToLatLng,
} from '../utilities';
import { TerrainTileProps } from '../../common/ResponseTypes';
import Shader from './Shaders/TerrainShader';
import LatLng from '../LatLng';

type TerrainData = {
  xDimension: number,
  yDimension: number,
  elevation: number[][],
  points: number[],
  indices: number[],
  normals: number[],
}

export type Location = { x: number, y: number, dimension: number };

const locationKey = (location: Location): string => (
  `${location.dimension}-${location.x}-${location.y}`
);

const terrainDataMap: Map<string, TerrainData> = new Map();

const terrainVertexStride = 5;

export const tileDimension = 128;

export interface TerrainRendererInterface {
  gl: WebGL2RenderingContext;

  tileServerUrl: string;
}

class TerrainTile {
  location: Location;

  xDimension = 0;

  yDimension = 0;

  renderer: TerrainRendererInterface;

  vao: WebGLVertexArrayObject | null;

  gl: WebGL2RenderingContext;

  texture: WebGLTexture | null = null;

  numIndices = 0;

  elevation: number[][] = [];

  sw: LatLng;

  ne: LatLng;

  latLngCenter: LatLng;

  constructor(
    renderer: TerrainRendererInterface,
    location: Location,
  ) {
    this.location = location;
    this.renderer = renderer;
    this.gl = renderer.gl;

    this.latLngCenter = terrainTileToLatLng(
      this.location.x, this.location.y, this.location.dimension,
    );

    const halfDimension = (this.location.dimension / 3600) / 2;

    this.sw = new LatLng(
      this.latLngCenter.lat - halfDimension,
      this.latLngCenter.lng - halfDimension,
    );

    this.ne = new LatLng(
      this.latLngCenter.lat + halfDimension,
      this.latLngCenter.lng + halfDimension,
    );

    this.vao = this.gl.createVertexArray();
  }

  async load(shader: Shader): Promise<void | void[]> {
    let data = terrainDataMap.get(locationKey(this.location));

    if (!data) {
      const url = `${this.renderer.tileServerUrl}/tile/terrain3d/${this.location.dimension}/${this.location.x}/${this.location.y}`;
      const response = await Http.get<TerrainTileProps>(url);

      if (response.ok) {
        try {
          const body = await response.body();

          data = {
            xDimension: body.xDimension,
            yDimension: body.yDimension,
            elevation: body.ele,
            points: body.objects[0].points,
            indices: body.objects[0].indices,
            normals: body.objects[0].normals,
          };

          terrainDataMap.set(locationKey(this.location), data);
        }
        catch (error) {
          console.log(`error in content: ${url}`);
        }
      }
      else {
        throw new Error('invalid response');
      }
    }

    if (data) {
      this.xDimension = data.xDimension;
      this.yDimension = data.yDimension;
      this.elevation = data.elevation;
      this.initBuffers(data, shader);
    }
  }

  getElevation(x: number, y: number): number {
    const pointX = (x / this.xDimension + 0.5) * (this.elevation[0].length - 1);
    const pointY = (y / this.yDimension + 0.5) * (this.elevation.length - 1);

    const x1 = Math.floor(pointX);
    const y1 = Math.floor(pointY);

    const x2 = pointX - x1;
    const y2 = pointY - y1;

    return bilinearInterpolation(
      this.elevation[y1][x1],
      this.elevation[y1][x1 + 1],
      this.elevation[y1 + 1][x1],
      this.elevation[y1 + 1][x1 + 1],
      x2,
      y2,
    );
  }

  // async loadPhotos(onPhotosLoaded: () => void): Promise<void | void[]> {
  // eslint-disable-next-line max-len
  //   const response = await Http.get<PhotoProps[]>(`/api/poi/photos?n=${this.ne.lat}&s=${this.sw.lat}&e=${this.ne.lng}&w=${this.sw.lng}`);

  //   if (response.ok) {
  //     const body = await response.body();
  //     if (body.length === 0) {
  //       onPhotosLoaded();

  //       return Promise.resolve();
  //     }

  //     let photosLoaded = 0;

  //     const handlePhotoLoaded = (photo: Photo) => {
  //       this.onPhotoLoaded(photo);

  //       photosLoaded += 1;
  //       // if (photosLoaded >= body.length) {
  //       onPhotosLoaded();
  //       // }
  //     };

  //     return Promise.all(body.map(async (p) => {
  //       const xOffset = -latOffset(p.location[0], this.latLngCenter.lng);
  //       const yOffset = -latOffset(p.location[1], this.latLngCenter.lat);
  //       const zOffset = this.getElevation(xOffset, yOffset) + 2;
  //       const frame = new Photo(
  //         p.id,
  //         this.gl,
  //         this.photoShader,
  //         xOffset,
  //         yOffset,
  //         zOffset,
  //         p.transforms,
  //         handlePhotoLoaded,
  //       );

  //       this.frames.push(frame);
  //       handlePhotoLoaded(frame);
  //       // return frame.loadPhoto(`${this.photoUrl}/${p.id}`);
  //     }));
  //   }

  //   return Promise.resolve();
  // }

  initBuffers(
    data: TerrainData,
    shader: Shader,
  ): void {
    this.gl.bindVertexArray(this.vao);
    this.createVertexBuffer(data.points, shader);
    this.createNormalBuffer(data.normals, shader);
    this.createIndexBuffer(data.indices);
    this.gl.bindVertexArray(null);

    this.numIndices = data.indices.length;
  }

  createVertexBuffer(
    positions: number[],
    shader: Shader,
  ): void {
    const vertexBuffer = this.gl.createBuffer();

    if (vertexBuffer === null) {
      throw new Error('vertexBuffer is null');
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(shader.attribLocations.vertexPosition);
    this.gl.vertexAttribPointer(
      shader.attribLocations.vertexPosition,
      3, // Number of components
      this.gl.FLOAT,
      false, // normalize
      terrainVertexStride * 4, // stride
      0, // offset
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

  createNormalBuffer(
    vertexNormals: number[],
    shader: Shader,
  ): void {
    const normalBuffer = this.gl.createBuffer();

    if (normalBuffer === null) {
      throw new Error('normalBuffer is null');
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormals), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(shader.attribLocations.vertexNormal);
    this.gl.vertexAttribPointer(
      shader.attribLocations.vertexNormal,
      3, // Number of components
      this.gl.FLOAT, // type
      false, // normalize
      0, // stride
      0, // offset
    );
  }

  draw(
    modelMatrix: mat4,
    shader: Shader,
  ): void {
    if (this.numIndices !== 0) {
      this.gl.uniformMatrix4fv(
        shader.uniformLocations.modelMatrix,
        false,
        modelMatrix,
      );

      this.gl.bindVertexArray(this.vao);

      this.gl.drawElements(
        this.gl.TRIANGLES,
        this.numIndices, // vertex count
        this.gl.UNSIGNED_INT, // unsigned int
        0, // offset
      );

      this.gl.bindVertexArray(null);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  drawTransparent(
    modelMatrix: mat4,
    shader: Shader,
  ): void {
    // if (this.numIndices !== 0) {
    //   if (this.frames.length > 0) {
    //     this.photoShader.use();

    //     this.gl.uniformMatrix4fv(
    //       this.photoShader.uniformLocations.projectionMatrix,
    //       false,
    //       projectionMatrix,
    //     );

    //     this.gl.uniformMatrix4fv(
    //       this.photoShader.uniformLocations.viewMatrix,
    //       false,
    //       viewMatrix,
    //     );

    //     this.gl.blendColor(1, 1, 1, 0.5);
    //     this.gl.blendFunc(this.gl.CONSTANT_ALPHA, this.gl.ONE_MINUS_CONSTANT_ALPHA);
    //     this.gl.enable(this.gl.BLEND);

    //     this.frames.forEach((f) => {
    //       this.gl.uniformMatrix4fv(
    //         this.photoShader.uniformLocations.modelMatrix,
    //         false,
    //         f.transform,
    //       );

    //       f.draw();
    //     });

    //     this.gl.disable(this.gl.BLEND);
    //   }
    // }
  }
}

export default TerrainTile;
