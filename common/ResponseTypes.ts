export type ObjectProps = {
  type: 'triangles' | 'line',
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
