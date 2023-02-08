export type ObjectProps = {
  type: string,
  points: number[],
  normals: number[],
  indices: number[],
};

export type TerrainTileProps = {
  xDimension: number,
  yDimension: number,
  ele: number[][],
  objects: ObjectProps[],
};
