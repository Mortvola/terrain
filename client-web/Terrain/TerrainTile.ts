import { mat4 } from 'gl-matrix';
import Http from '@mortvola/http';
import {
  bilinearInterpolation, terrainTileToLatLng,
} from '../utilities';
import { TerrainTileProps } from '../../common/ResponseTypes';
import TerrainShader from './Shaders/TerrainShader';
import LatLng from '../LatLng';
import TriangleMesh from './RenderElements/TriangleMesh';
import RenderObjectInterface from './RenderElements/RenderObject';
import Line from './RenderElements/Line';
import LineShader from './Shaders/LineShader';

type TerrainData = {
  xDimension: number,
  yDimension: number,
  elevation: number[][],
  objects: {
    type: 'triangles' | 'line',
    points: number[],
    indices: number[],
    normals: number[],  
  }[],
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

  // vao: WebGLVertexArrayObject | null;

  gl: WebGL2RenderingContext;

  // texture: WebGLTexture | null = null;

  // numIndices = 0;

  elevation: number[][] = [];

  sw: LatLng;

  ne: LatLng;

  latLngCenter: LatLng;

  objects: RenderObjectInterface[] = [];

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

    // The tile also contains the points from the neighboring north and east tiles (thus the + 1)
    const halfDimension = ((this.location.dimension + 1) / 3600) / 2;

    this.sw = new LatLng(
      this.latLngCenter.lat - halfDimension,
      this.latLngCenter.lng - halfDimension,
    );

    this.ne = new LatLng(
      this.latLngCenter.lat + halfDimension,
      this.latLngCenter.lng + halfDimension,
    );

    // this.vao = this.gl.createVertexArray();
  }

  async load(shader: TerrainShader, lineShader: LineShader): Promise<void | void[]> {
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
            objects: body.objects,
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
      // this.initBuffers(data, shader);
      this.objects = data.objects.map((object) => {
        switch (object.type) {
          case 'triangles':
            return new TriangleMesh(
              this.gl,
              object.points,
              object.normals,
              object.indices,
              shader,
            );
          
          case 'line':
            return new Line(this.gl, object.points, lineShader);

          default:
            throw new Error(`Unkonwn render type: ${object.type}`);
        }
      });
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

  draw(modelMatrix: mat4): void {
    this.objects.forEach((object) => object.draw(modelMatrix));
  }

  drawMesh(): void {
    this.objects.forEach((object) => object.drawMesh());
  }

  // eslint-disable-next-line class-methods-use-this
  drawTransparent(
    modelMatrix: mat4,
    shader: TerrainShader,
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
