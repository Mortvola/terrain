import { vec3 } from "gl-matrix";

export interface TriangleInterface {
  points: [PointInterface, PointInterface, PointInterface];

  normal: vec3
}

export interface PointInterface {
  x: number;

  y: number;

  z: number;

  s: number;

  t: number;

  triangles: TriangleInterface[];
}

export type TerrainOutput = {
  type: string,
  points: number[],
  normals: number[],
  indices: number[],
}

export type Output = {
  ele: number[][],
  xDimension: number,
  yDimension: number,
  objects: TerrainOutput[],
}

export type MercatorValues = {
  westMercator: number,
  southMercator: number,
  eastMercator: number,
  northMercator: number,
  southLat: number,
  westLng: number,
  northLat: number,
  eastLng: number,
}
