import { vec3 } from "gl-matrix";

export interface TriangleInterface {
  normal: vec3
}

export interface PointInterface {
  
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
