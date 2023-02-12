import LatLng from '../../../client-web/LatLng';
import File, { TILE_FILE_DIMENSION } from "./File";
import Point from './Point';
import Triangle from './Triangle';
import { Output, TerrainOutput } from './Types';

// const terrainVertexStride = 5; // 3 values for the vertex coordinates, 2 for the texutre coordinates
// const normalStride = 3

const files: Map<string, File> = new Map();

type TextureCoord = {
  s: number,
  t: number,
}

type Elevations = {
  points: Point[][],
  centers: Point[][],
  textureSW: TextureCoord,
  textureNE: TextureCoord
}

const bilinearInterpolation = (
  q11: number,
  q12: number,
  q21: number,
  q22: number,
  x: number,
  y: number,
) => {
  const x2x = 1 - x;
  const y2y = 1 - y;

  return (q11 * x2x * y2y + q12 * x * y2y + q21 * x2x * y + q22 * x * y);
}

const elevationPathGet = () => {
  return '../../../data/elevations'
}

class ElevationsToTerrainTile {
  x: number

  y: number

  dimension: number;

  padding = 1; // the amount of padding on each side of a tile for computing edge normals.

  points: Point[] = [];

  triangles: Triangle[] = [];

  // normals: number[] = [];

  constructor(x: number, y: number, dimension: number) {
    this.x = x;
    this.y = y;
    this.dimension = dimension;
  }

  render() {
    const latLngPerPoint = 1 / TILE_FILE_DIMENSION;

    let westEdge = this.x * (this.dimension - 1);
    let eastEdge = westEdge + this.dimension;
    westEdge -= this.padding;
    eastEdge += this.padding;

    const westLng = westEdge * latLngPerPoint - 180;
    const eastLng = eastEdge * latLngPerPoint - 180;
  
    let southEdge = this.y * (this.dimension - 1);
    let northEdge = southEdge + this.dimension;
    southEdge -= this.padding;
    northEdge += this.padding;
  
    const southLat = southEdge * latLngPerPoint - 180;
    const northLat = northEdge * latLngPerPoint - 180;

    // const sw = terrainTileToLatLng(this.x, this.y, this.dimension);
    // const westLng = sw.lng - latLngPerPoint;
    // const southLat = sw.lat - latLngPerPoint;
    // console.log(`${sw.lat}, ${sw.lng}`);

    // const ne = terrainTileToLatLng(this.x + 1, this.y + 1, this.dimension);
    // const eastLng = ne.lng + latLngPerPoint;
    // const northLat = ne.lat + latLngPerPoint;
    // console.log(`${ne.lat}, ${ne.lng}`);

    const ele = this.getElevationTile(westEdge, eastEdge, southEdge, northEdge, southLat, westLng, northLat, eastLng);
  
    if (ele === undefined) {
      throw new Error('elevations not loaded');
    }
  
    let westMercator: number;
    let southMercator: number;
    let eastMercator: number;
    let northMercator: number;
  
    [westMercator, southMercator] = ElevationsToTerrainTile.latLngToMercator(
      southLat,
      westLng,
    );
    [eastMercator, northMercator] = ElevationsToTerrainTile.latLngToMercator(
      northLat,
      eastLng,
    );
  
    const xDimension = eastMercator - westMercator;
    const yDimension = northMercator - southMercator;

    console.log(`xDimension: ${xDimension}, yDimension: ${yDimension}`)

    this.create(ele, xDimension, yDimension);
  
    // addRoutes(southLat, westLng, northLat, eastLng);
  
    const points: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];

    let pointIndex = 0;
    for (let triangle of this.triangles) {
      if (!triangle.padding) {
        // output points that have not been output
        for (let point of triangle.points) {
          if (point.index === null) {
            point.index = pointIndex;
            pointIndex += 1;

            points.push(point.x);
            points.push(point.y);
            points.push(point.z);
            points.push(point.s);
            points.push(point.t);

            normals.push(point.normal[0]);
            normals.push(point.normal[1]);
            normals.push(point.normal[2]);
          }

          indices.push(point.index)
        }
      }
    }

    const outputEle: number[][] = [];

    for (let y = 0; y < ele.points.length; y += 1) {
      outputEle.push([]);
    
      for (let x = 0; x < ele.points[y].length; x += 1) {
        outputEle[y].push(ele.points[y][x].z);
      }
    }
  
    const terrain: TerrainOutput = {
      type: 'triangles',
      points,
      normals,
      indices,
    }

    const firstRowLastValue = (this.dimension - 1);
    const lastRowFirstValue = ((this.dimension - 2) * (this.dimension * 2 - 1) + this.dimension);
  
    const data: Output = {
      ele: outputEle,
      xDimension: this.points[firstRowLastValue].x - this.points[0].x,
      yDimension: this.points[lastRowFirstValue].y - this.points[0].y,
      objects: [terrain]
    }
  
    return data;
  }

  static latLngToMercator(lat: number, lng: number): number[] {
    const degToRad = (d: number) => (
      (d / 180.0) * Math.PI
    );
  
    const latRad = degToRad(lat);
    const lngRad = degToRad(lng);
  
    let equatorialRadius = 6378137.0;
    let a = equatorialRadius;
    let f = 1 / 298.257223563;
    let b = a * (1 - f);
    let e = Math.sqrt(1 - (b * b) / (a * a)); // ellipsoid eccentricity
  
    const sinLatRad = Math.sin(latRad);
  
    const c = ((1 - e * sinLatRad) / (1 + e * sinLatRad));
  
    const x = lngRad * a;
    const y = Math.log(((1 + sinLatRad) / (1 - sinLatRad)) * Math.pow(c, e)) * (a / 2);
  
    console.log(`latLngToMercator: ${lat}, ${lng} => ${x}, ${y}`);
    return [x, y];
  }

  getElevationTile(
    westEdge: number,
    eastEdge: number,
    southEdge: number,
    northEdge: number,
    southLat: number,
    westLng: number,
    northLat: number,
    eastLng: number
  ): Elevations | undefined {
    try {
      // const westEdge = this.x * (this.dimension - 1 + this.padding);
      // const eastEdge = westEdge + (this.dimension - 1 + this.padding);
  
      // const southEdge = this.y * (this.dimension - 1 + this.padding);
      // const northEdge = southEdge + (this.dimension - 1 + this.padding);
  
      const latMin = Math.floor(southLat);
      const latMax = Math.ceil(northLat);
  
      const lngMin = Math.floor(westLng);
      const lngMax = Math.ceil(eastLng);
  
      console.log(`(${southLat}, ${westLng}) - (${northLat}, ${eastLng})`);
  
      const points: Point[][] = [];

      for (let lat = latMin; lat < latMax; lat += 1) {
        for (let lng = lngMin; lng < lngMax; lng += 1) {
  
          const nw = new LatLng(lat, lng);
          const file = this.loadFile(nw);
  
          let startX = 0;
  
          if (lng == lngMin) {
            startX = westEdge % TILE_FILE_DIMENSION;
          }
  
          let endX = TILE_FILE_DIMENSION;
  
          if (lng == lngMax - 1) {
            endX = eastEdge % TILE_FILE_DIMENSION;
            if (endX == 0) {
              endX = TILE_FILE_DIMENSION;
            }
          }
  
          let startY = southEdge % TILE_FILE_DIMENSION;
          let yy = 0;
  
          if (lat != latMin) {
            yy = TILE_FILE_DIMENSION - startY;
            startY = 0;
          }
  
          let endY = TILE_FILE_DIMENSION;
  
          if (lat == latMax - 1) {
            endY = northEdge % TILE_FILE_DIMENSION;
            if (endY == 0) {
              endY = TILE_FILE_DIMENSION;
            }
          }
  
          for (let j = startY; j < endY; j++) {
            if (yy >= points.length) {
              points.push([]);
            }
            
            // Increment by two because the data is read as bytes in pairs to get 16 bit values.
            for (let i = startX * 2; i < endX * 2; i += 2) {
              points[yy].push(new Point(0, 0, file.data(i, j)));
            }
  
            ++yy;
          }
        }
      }
  
      const centersDimension = points[0].length - 1;
      const centers: Point[][] = Array<Array<Point>>().fill([], 0, centersDimension);
  
      for (let j = 0; j < centersDimension; j++) {
        if (j >= centers.length) {
          centers.push([]);
        }

        for (let i = 0; i < centersDimension; i++) {
          centers[j].push(new Point(0, 0, bilinearInterpolation(
            points[j][i].z,
            points[j + 1][i].z,
            points[j][i + 1].z,
            points[j + 1][i + 1].z,
            0.5,
            0.5,
          )));
        }
      }
  
      return {
        points,
        centers,
        textureNE: { s: 0, t: 0},
        textureSW: { s: 1, t: 1}
      };
    }
    catch (error) {
      console.log(error);
    }
  
    return undefined;
  }

  loadFile(point: LatLng): File {
    const { filename, latLng } = this.getBaseFileName(point);
  
    const fullFileName = `${elevationPathGet()}/${filename}.hgt`;
  
    // std::unique_lock<std::mutex> lock(m_fileLoadMutex);
  
    // See if the file has already been loaded.
    let file = files.get(fullFileName);
  
    if (!file) {
      // No, it hasn't been loaded. Load it now.
      // const file = std::ifstream(fullFileName, std::ios_base::binary);
  
      console.log(`loading elevation file ${fullFileName}`);

      file = new File(fullFileName, latLng);

      // elevationFile.latLng = latLng;
      // elevationFile.m_buffer.resize(size / sizeof(int16_t));
      file.read();

      files.set(fullFileName, file);
    }
  
    // accessCounter++;
    // iter->second->m_accessCounter = accessCounter;
  
    // if (files.size() > 100) {
    //   const oldestAccess = accessCounter;
    //   const oldestEntry = files.end();
  
    //   for (const iter = files.begin(); iter != files.end(); ++iter) {
    //     if (iter->second->m_accessCounter < oldestAccess) {
    //       oldestEntry = iter;
    //       oldestAccess = iter->second->m_accessCounter;
    //     }
    //   }
  
    //   if (oldestEntry != files.end()) {
    //     files.erase(oldestEntry);
    //   }
    // }
  
    return file;
  }

  getBaseFileName(point: LatLng): { filename: string, latLng: LatLng } {
    // Determine file name
    const latInt = Math.floor(point.lat);
    const lngInt = Math.floor(point.lng);
  
    let filename = '';
  
    if (point.lat >= 0) {
      filename = `N${String(latInt).padStart(2, '0')}`;
    } else {
      filename = `S${String(-latInt).padStart(2, '0')}`;
    }
  
    if (point.lng >= 0) {
      filename += `E${String(lngInt).padStart(2, '0')}`;
    } else {
      filename += `W${String(-lngInt).padStart(2, '0')}`;
    }
  
    return {
      filename,
      latLng: new LatLng(latInt, lngInt),
    }
  }

  create(ele: Elevations, xDimension: number, yDimension: number) {
    const numPointsX = ele.points[0].length;
    const numPointsY = ele.points.length;
  
    this.createTerrainPoints(ele, numPointsX, numPointsY, xDimension, yDimension);
    this.createTerrainFaces(numPointsX, numPointsY);
    // this.createTerrainNormals(numPointsX, numPointsY);

    // if (this.padding) {
    //   this.depad(ele);
    // }
  }

  // depad(ele: Elevations) {
  //   // depad points and normals
  //   const newPoints: Point[] = [];
  //   const newNormals: number[] = [];

  //   // Padding on top row is one on each side of the row
  //   // Padding on subsequent rows is two on each side of the row.
  //   // So, for this first row it padding * 2 (for top row) + padding * 2 (for the left side of the next row) 
  //   let offset = this.dimension + this.padding * 4;

  //   // Increment by 2 to skip the center vertices
  //   for (let x = 0; x < this.dimension * 2 - 1; x += 2) {
  //     // face coordinates
  //     newPoints.push(this.points[(offset + x) * terrainVertexStride + 0]);
  //     newPoints.push(this.points[(offset + x) * terrainVertexStride + 1]);
  //     newPoints.push(this.points[(offset + x) * terrainVertexStride + 2]);

  //     // texture coordinates
  //     newPoints.push(this.points[(offset + x) * terrainVertexStride + 3]);
  //     newPoints.push(this.points[(offset + x) * terrainVertexStride + 4]);

  //     // noramls
  //     newNormals.push(this.normals[(offset + x) * normalStride + 0]);
  //     newNormals.push(this.normals[(offset + x) * normalStride + 1]);
  //     newNormals.push(this.normals[(offset + x) * normalStride + 2]);
  //   }

  //   const stride = this.dimension * 2 - 1 + this.padding * 4;
  //   offset += stride;

  //   for (let y = 0; y < this.dimension - 1; y += 1) {
  //     for (let x = 0; x < this.dimension * 2 - 1; x += 1) {
  //       // face coordinates
  //       newPoints.push(this.points[(offset + x) * terrainVertexStride + 0]);
  //       newPoints.push(this.points[(offset + x) * terrainVertexStride + 1]);
  //       newPoints.push(this.points[(offset + x) * terrainVertexStride + 2]);
  
  //       // texture coordinates
  //       newPoints.push(this.points[(offset + x) * terrainVertexStride + 3]);
  //       newPoints.push(this.points[(offset + x) * terrainVertexStride + 4]);

  //       // noramls
  //       newNormals.push(this.normals[(offset + x) * normalStride + 0]);
  //       newNormals.push(this.normals[(offset + x) * normalStride + 1]);
  //       newNormals.push(this.normals[(offset + x) * normalStride + 2]);
  //     }   
      
  //     offset += stride;
  //   }

  //   console.log(newPoints.length);
  //   this.points = newPoints;
  //   this.normals = newNormals;
    
  //   this.triangles = [];
  //   this.createTerrainFaces(this.dimension, this.dimension);

  //   // depad the elevation points.
  //   const newElePoints: Point[][] = [
  //     ...ele.points.slice(1, ele.points.length - 1)
  //   ];

  //   for (let y = 0; y < this.dimension; y += 1) {
  //     newElePoints[y] = [
  //       ...newElePoints[y].slice(1, newElePoints[y].length - 1)
  //     ]
  //   }

  //   ele.points = newElePoints;

  //   // Depad faces
  //   // const newIndices: number[] = [];

  //   // offset = (this.dimension + 2) * 4;
  //   // let pointOffset = this.dimension + this.padding + 2;
  //   // const faceStride = 3;

  //   // for (let x = 0; x < this.dimension - 1; x += 1) {
  //   //   const point1 = this.indices[(offset + 0) * faceStride] - (pointOffset + 1 * x) * terrainVertexStride;
  //   //   const point2 = this.indices[(offset + 1) * faceStride] - (pointOffset + 1 * (x + 1)) * terrainVertexStride;
  //   //   const point3 = this.indices[offset + this.dimension * 2 + 5] - (pointOffset + this.dimension + 1) * terrainVertexStride;
  //   //   const point4 = this.indices[offset + this.dimension * 2 + 3] - (pointOffset + this.dimension + 1) * terrainVertexStride;
  //   //   const center = this.indices[offset + this.dimension * 2 + 4] - (pointOffset + this.dimension + 1) * terrainVertexStride;

  //   //   // face 0
  //   //   newIndices.push(point1);
  //   //   newIndices.push(point2);
  //   //   newIndices.push(center);

  //   //   // face 1
  //   //   newIndices.push(point2);
  //   //   newIndices.push(point3);
  //   //   newIndices.push(center);

  //   //   // face 2
  //   //   newIndices.push(point3);
  //   //   newIndices.push(point4);
  //   //   newIndices.push(center);

  //   //   // face 3
  //   //   newIndices.push(point4);
  //   //   newIndices.push(point1);
  //   //   newIndices.push(center);
  //   // }
  // }

  createTerrainPoints(
    terrain: Elevations,
    numPointsX: number,
    numPointsY: number,
    xDimension: number,
    yDimension: number
  ) {
    // const { startLatOffset, startLngOffset } = getStartOffset(terrain.sw);
  
    // Center the tile around the origin.
    // const startLatOffset = -(terrain.ne.lat - terrain.sw.lat) / 2;
    // const startLngOffset = -(terrain.ne.lng - terrain.sw.lng) / 2;
  
    const sStep = (terrain.textureNE.s - terrain.textureSW.s) / (numPointsX - 1);
    const tStep = (terrain.textureNE.t - terrain.textureSW.t) / (numPointsY - 1);
  
    // const double xDimension = ((m_dimension - 1) * Terrain3dRequest::metersPerPoint);
    // const double yDimension = ((m_dimension - 1) * Terrain3dRequest::metersPerPoint);
  
    // std::cout << "dimension2: " << xDimension << ", " << yDimension << std::endl;
  
    // we are purposefully using latDistance for both dimensions
    // here to create a square tile (at least for now).
    const yStep = yDimension / (numPointsY - 1); // Terrain3dRequest::metersPerPoint;
    const startYOffset = -yDimension / 2;
  
    const xStep = xDimension / (numPointsX - 1); // Terrain3dRequest::metersPerPoint;
    const startXOffset = -xDimension / 2;
  
    for (let i = 0; i < numPointsX; i += 1) {
      terrain.points[0][i].x = startXOffset + i * xStep;
      terrain.points[0][i].y = startYOffset;
      terrain.points[0][i].s = terrain.textureSW.s + i * sStep;
      terrain.points[0][i].t = terrain.textureSW.t;

      this.points.push(terrain.points[0][i]);
    }
  
    for (let j = 1; j < numPointsY; j += 1) {
      let point = terrain.points[j][0];
      point.x = startXOffset;
      point.y = startYOffset + j * yStep;
      point.s = terrain.textureSW.s;
      point.t = terrain.textureSW.t + j * tStep;

      this.points.push(point);
  
      for (let i = 1; i < numPointsX; i += 1) {
        point = terrain.centers[j - 1][i - 1];
        point.x = startXOffset + (i - 0.5) * xStep;
        point.y = startYOffset + (j - 0.5) * yStep;
        point.s = terrain.textureSW.s + (i - 0.5) * sStep;
        point.t = terrain.textureSW.t + (j - 0.5) * tStep;

        this.points.push(point);
  
        point = terrain.points[j][i];
        point.x = startXOffset + i * xStep;
        point.y = startYOffset + j * yStep;
        point.s = terrain.textureSW.s + i * sStep;
        point.t = terrain.textureSW.t + j * tStep;

        this.points.push(point);
      }
    }
  }

  createTerrainFaces(
    numPointsX: number,
    numPointsY: number,
  ) {
    // First row of quads
    for (let i = 0; i < numPointsX - 1; i += 1) {
      const point1 = this.points[i];
      const point2 = this.points[i + 1];
      const point3 = this.points[numPointsX + i * 2 + 2];
      const point4 = this.points[numPointsX + i * 2 + 0];
      const center = this.points[numPointsX + i * 2 + 1];

      // Triangles in first of quads are considered padding and will not be output.
      this.triangles.push(new Triangle(point1, point2, center, this.padding !== 0));
      this.triangles.push(new Triangle(point2, point3, center, this.padding !== 0));
      this.triangles.push(new Triangle(point3, point4, center, this.padding !== 0));
      this.triangles.push(new Triangle(point4, point1, center, this.padding !== 0));
    }
  
    const firstRowOffset = numPointsX;
    const numRowPoints = numPointsX * 2 - 1;
  
    for (let j = 1; j < numPointsY - 1; j += 1) {
      for (let i = 0; i < numPointsX - 1; i += 1) {
        const point1 = this.points[firstRowOffset + numRowPoints * (j - 1) + i * 2 + 0];
        const point2 = this.points[firstRowOffset + numRowPoints * (j - 1) + i * 2 + 2];
        const point3 = this.points[firstRowOffset + numRowPoints * (j + 0) + i * 2 + 2];
        const point4 = this.points[firstRowOffset + numRowPoints * (j + 0) + i * 2 + 0];
        const center = this.points[firstRowOffset + numRowPoints * (j + 0) + i * 2 + 1];

        // Triangles marked as pdding will not be output.
        // First and last of each row of quads and the last row of quads
        const padding = this.padding !== 0 && (i === 0 || i === numPointsX - 2 || j === numPointsY - 2);
      
        this.triangles.push(new Triangle(point1, point2, center, padding));
        this.triangles.push(new Triangle(point2, point3, center, padding));
        this.triangles.push(new Triangle(point3, point4, center, padding));
        this.triangles.push(new Triangle(point4, point1, center, padding));
      }
    }

    // Now that all of the triangles have been added compute the normals for each point.
    for (let point of this.points) {
      point.computeNormal();
    }
  }
  
  // createTerrainNormals() {
  //   // Create a normal for each face
  //   const faceNormals: vec3[] = [];
  //   for (let i = 0; i < this.triangles.length; i += 1) {
  //     this.triangles[i].computeNormal();
  //     faceNormals.push(this.triangles[i].normal);
  //   }
  
  //   const sumNormals = (indexes: number[]): vec3 => {
  //     const vec = [0, 0, 0];
  
  //     for (let i = 0; i < indexes.length; i += 1) {
  //       vec[0] += faceNormals[indexes[i]][0];
  //       vec[1] += faceNormals[indexes[i]][1];
  //       vec[2] += faceNormals[indexes[i]][2];
  //     }
  
  //     const normal = vec3.fromValues(vec[0], vec[1], vec[2]);
  
  //     return vec3.normalize(normal, normal);
  //   };
  
  //   const concatNormal = (n: vec3) => {
  //     this.normals.push(n[0]);
  //     this.normals.push(n[1]);
  //     this.normals.push(n[2]);
  //   };
  
  //   // Sum the face normals that share a vertex
  
  //   let lastRow = numPointsY - 2;
  //   let lastCell = (numPointsX - 2) * 4;

  //   // first row
  
  //   concatNormal(sumNormals([0, 3]));
  
  //   for (let i = 0; i < lastCell; i += 4) {
  //     concatNormal(sumNormals([i, i + 1, i + 7, i + 4]));
  //   }
  
  //   concatNormal(sumNormals([lastCell, lastCell + 1]));
  
  //   // interior
  
  //   for (let j = 0; j < lastRow; j += 1) {
  //     const row0Index = j * (numPointsX - 1) * 4;
  //     const row1Index = (j + 1) * (numPointsX - 1) * 4;

  //     const faceNormalIndexA = row0Index + 3;
  //     const faceNormalIndexB = row0Index + 2;
  //     const faceNormalIndexC = row1Index + 0;
  //     const faceNormalIndexD = row1Index + 3;

  //     concatNormal(sumNormals([
  //       faceNormalIndexA,
  //       faceNormalIndexB,
  //       faceNormalIndexC,
  //       faceNormalIndexD
  //     ]));
  
  //     for (let i = 0; i < lastCell; i += 4) {
  //       const row0Index2 = row0Index + i;
  //       const row1Index2 = row1Index + i;

  //       const faceNormalIndex0 = row0Index2 + 0;
  //       const faceNormalIndex1 = row0Index2 + 1;
  //       const faceNormalIndex2 = row0Index2 + 2;
  //       const faceNormalIndex3 = row0Index2 + 3;
  //       const faceNormalIndex6 = row0Index2 + 6;
  //       const faceNormalIndex7 = row0Index2 + 7;

  //       const faceNormalIndex12 = row1Index2 + 0;
  //       const faceNormalIndex13 = row1Index2 + 1;
  //       const faceNormalIndex16 = row1Index2 + 4;
  //       const faceNormalIndex19 = row1Index2 + 7;

  //       concatNormal(sumNormals([
  //         faceNormalIndex0,
  //         faceNormalIndex1,
  //         faceNormalIndex2,
  //         faceNormalIndex3
  //       ]));
  
  //       concatNormal(sumNormals([
  //         faceNormalIndex1,
  //         faceNormalIndex2,
  //         faceNormalIndex7,
  //         faceNormalIndex6,
  //         faceNormalIndex16,
  //         faceNormalIndex19,
  //         faceNormalIndex13,
  //         faceNormalIndex12
  //       ]));
  //     }
  
  //     const row0Index3 = row0Index + lastCell;
  //     const row1Index3 = row1Index + lastCell;

  //     concatNormal(sumNormals([
  //       row0Index3 + 0,
  //       row0Index3 + 1,
  //       row0Index3 + 2,
  //       row0Index3 + 3
  //     ]));
  
  //     concatNormal(sumNormals([
  //       row0Index3 + 1,
  //       row0Index3 + 2,
  //       row1Index3 + 0,
  //       row1Index3 + 1
  //     ]));
  //   }
  
  //   const lastRowIndex = lastRow * (numPointsX - 1) * 4;

  //   // last row
  //   concatNormal(sumNormals([
  //     lastRowIndex + 2,
  //     lastRowIndex + 3
  //   ]));
  
  //   for (let i = 0; i < lastCell; i += 4) {
  //     concatNormal(sumNormals([
  //       lastRowIndex + i + 0,
  //       lastRowIndex + i + 1,
  //       lastRowIndex + i + 2,
  //       lastRowIndex + i + 3
  //     ]));
  
  //     concatNormal(sumNormals([
  //       lastRowIndex + i + 2,
  //       lastRowIndex + i + 1,
  //       lastRowIndex + i + 7,
  //       lastRowIndex + i + 6
  //     ]));
  //   }
  
  //   concatNormal(sumNormals([
  //     lastRowIndex + lastCell + 0,
  //     lastRowIndex + lastCell + 1,
  //     lastRowIndex + lastCell + 2,
  //     lastRowIndex + lastCell + 3
  //   ]));
  
  //   concatNormal(sumNormals([
  //     lastRowIndex + lastCell + 1,
  //     lastRowIndex + lastCell + 2
  //   ]));
  // }
}

export default ElevationsToTerrainTile;
