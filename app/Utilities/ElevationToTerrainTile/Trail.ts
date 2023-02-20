import fs from 'fs';
import * as geo from 'geometric';
import { latLngToMercator, latLngToTerrainTile } from '../../../client-web/utilities';
import Line2D from './Line2D';
import MultiPolyline2D from './MultiPolyline2D';
import Plane from './Plane';
import Polyline2D from './Polyline2D';
import { MercatorValues, TriangleInterface } from './Types';

type TrailMap = Map<number, Map<number, MultiPolyline2D>>;

export const partitionTrail = (segments: MultiPolyline2D, dimension: number): TrailMap => {
  const map: TrailMap = new Map();

  segments.segments.forEach((line) => {
    let polyline = new Polyline2D();

    let [currentTileX, currentTileY] = latLngToTerrainTile(line.points[0][1], line.points[0][0], dimension)
    polyline.points.push(line.points[0]);

    for (let i = 1; i < line.points.length; i += 1) {
      const [tileX, tileY] = latLngToTerrainTile(line.points[i][1], line.points[i][0], dimension)
  
      if (tileX !== currentTileX || tileY !== currentTileY) {
        let xMap = map.get(currentTileY);
        let multiPolyline: MultiPolyline2D | undefined;
    
        if (!xMap) {
          xMap = new Map();
          map.set(currentTileY, xMap);
        }
        else {
          multiPolyline = xMap.get(currentTileX);
        }
  
        if (!multiPolyline) {
          multiPolyline = new MultiPolyline2D();
          xMap.set(currentTileX, multiPolyline);
        }
  
        multiPolyline.segments.push(polyline);
  
        polyline = new Polyline2D();

        currentTileX = tileX;
        currentTileY = tileY;
      }
  
      polyline.points.push(line.points[i]);
    }  
  })

  return map;
}

export const readPCT = (): MultiPolyline2D => {
  const buffer = fs.readFileSync('../../../data/PCT.json');

  const trail = new MultiPolyline2D(JSON.parse(buffer.toString()));

  return trail;
}

const projectPointOnPlane = (triangle: TriangleInterface, point: [number, number]) => {
  const plane = new Plane(triangle.normal, [triangle.points[1].x, triangle.points[1].y, triangle.points[1].z]);

  const projectedPoint = plane.lineIntersection([point[0], point[1], 0], [0, 0, 1])

  if (!projectedPoint) {
    throw new Error('projectedPoint is null');
  }

  return projectedPoint;
}

export const applyTrail = (
  trailMap: TrailMap,
  triangles: TriangleInterface[],
  tileX: number,
  tileY: number,
  mercatorValues: MercatorValues,
): [number, number, number][][] => {
  const lines: [number, number, number][][] = [];

  const xMap = trailMap.get(tileY);

  if (xMap) {
    const multiPolyline = xMap.get(tileX);

    if (multiPolyline) {
      const xDimension = mercatorValues.eastMercator - mercatorValues.westMercator;
      const yDimension = mercatorValues.northMercator - mercatorValues.southMercator;

      multiPolyline.segments.forEach((polyline) => {
        const points: [number, number, number][] = [];

        let [triangle, point, pointIndex] = findFirstTriangle(polyline, triangles, mercatorValues, xDimension, yDimension);

        if (triangle && point && pointIndex !== undefined) {
          const plane = new Plane(triangle.normal, [triangle.points[1].x, triangle.points[1].y, triangle.points[1].z]);

          const prevPoint = plane.lineIntersection([point[0], point[1], 0], [0, 0, 1])

          if (!prevPoint) {
            throw new Error('prevPoint is null');
          }

          points.push(prevPoint);

          for (let i = pointIndex + 1; i < polyline.points.length - 1; i += 1) {
            const [x1, y1] = latLngToMercator(polyline.points[i][1], polyline.points[i][0]);
      
            let point: geo.Point = [
              x1 - mercatorValues.westMercator - xDimension / 2,
              y1 - mercatorValues.southMercator - yDimension / 2,
            ];
      
            let prevEdge: Line2D | null = null;

            for (;;) {
              const polygon: geo.Polygon = [
                [triangle.points[0].x, triangle.points[0].y],
                [triangle.points[1].x, triangle.points[1].y],
                [triangle.points[2].x, triangle.points[2].y],
              ];
      
              const intersection = geo.pointInPolygon(point, polygon);

              if (intersection) {
                prevEdge = null;
                // const plane = new Plane(triangle.normal, [triangle.points[1].x, triangle.points[1].y, triangle.points[1].z]);

                // const prevPoint = plane.lineIntersection([point[0], point[1], 0], [0, 0, 1])
      
                // if (!prevPoint) {
                //   throw new Error('prevPoint is null');
                // }

                const projectedPoint = projectPointOnPlane(triangle, point);
                points.push(projectedPoint);
                console.log(`number of points: ${points.length}, i = ${i}`);

                break;
              }

              // Traverse along the current line segment, finding the 
              // where it intersects with the current neighboring triangels until
              // we reach the end of the segment.
              const l1 = new Line2D(
                [points[points.length - 1][0], points[points.length - 1][1]],
                point,
              );

              triangle.points.forEach((p) => {
                console.log(`(${p.x}, ${p.y})`)
              })

              console.log('--------')
              console.log(`(${points[points.length - 1][0]}, ${points[points.length - 1][1]})`)
              console.log(`(${point[0]}, ${point[1]})`)

              for (let j = 0; j < 3; j += 1) {
                const edge = new Line2D(
                  [triangle.points[j].x, triangle.points[j].y],
                  [triangle.points[(j + 1) % 3].x, triangle.points[(j + 1) % 3].y],
                )

                if (
                  prevEdge &&
                  (
                    (
                      edge.point1[0] === prevEdge.point1[0] &&
                      edge.point1[1] === prevEdge.point1[1] &&
                      edge.point2[0] === prevEdge.point2[0] &&
                      edge.point2[1] === prevEdge.point2[1]
                    ) || (
                      edge.point1[0] === prevEdge.point2[0] &&
                      edge.point1[1] === prevEdge.point2[1] &&
                      edge.point2[0] === prevEdge.point1[0] &&
                      edge.point2[1] === prevEdge.point1[1]
                    )
                  )
                ) {
                  continue;
                }
                
                // console.log(l1);
                // console.log(edge);

                const intersection = l1.intersectionLine2D(edge);

                // Don't consider the edge where the segment entered the triangle (t === 0)
                if (
                  intersection  // && 
                  // intersection.t >= 0.00001
                  // intersection.point[0] !== points[points.length - 1][0] &&
                  // intersection.point[1] !== points[points.length - 1][1]
                ) {
                  prevEdge = edge;

                  // Push point found on edge of triangle onto the list of points.
                  const projectedPoint = projectPointOnPlane(triangle, intersection.point);
                  points.push(projectedPoint);
                  console.log(`number of points: ${points.length}, i = ${i}`);

                  // find the neighboring triangle that shares the edge.
                  const common = triangle.points[j].triangles.filter((t1) => (
                    triangle!.points[(j + 1) % 3].triangles.includes(t1)
                  ))
                    .filter((t) => t !== triangle);

                  if (common.length === 0) {
                    throw new Error('triangle is null');
                  }

                  triangle = common[0];

                  if (!triangle) {
                    throw new Error('triangle is null');
                  }

                  // point = projectedPoint;
                  // console.log(common)

                  break;
                }
              }
            }
          }                  
        }

        lines.push(points);
      })
    }
  }

  return lines;
}

const findFirstTriangle = (
  polyline: Polyline2D,
  triangles: TriangleInterface[],
  mercatorValues: MercatorValues,
  xDimension: number,
  yDimension: number,
): [TriangleInterface | undefined, geo.Point | undefined, number | undefined] => {
  let t: TriangleInterface | undefined;
  let p: geo.Point | undefined;

  const index = polyline.points.findIndex((pt) => {
    const [x1, y1] = latLngToMercator(pt[1], pt[0]);

    const point: geo.Point = [
      x1 - mercatorValues.westMercator - xDimension / 2,
      y1 - mercatorValues.southMercator - yDimension / 2,
    ];

    t = triangles.find((triangle) => {
      const polygon: geo.Polygon = [
        [triangle.points[0].x, triangle.points[0].y],
        [triangle.points[1].x, triangle.points[1].y],
        [triangle.points[2].x, triangle.points[2].y],
      ];

      return geo.pointInPolygon(point, polygon);
    })

    if (t) {
      p = point;

      return true;
    }

    return false;
  })

  return [t, p, index];
}