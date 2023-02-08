import { vec3 } from 'gl-matrix';
import LatLng from '../../../client-web/LatLng';
import File, { TILE_FILE_DIMENSION } from "./File";

const terrainVertexStride = 5;

const files: Map<string, File> = new Map();

type TextureCoord = {
  s: number,
  t: number,
}

type Elevations = {
  points: number[][],
  centers: number[][],
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

  points: number[] = [];

  indices: number[] = [];

  normals: number[] = [];

  constructor(x: number, y: number, dimension: number) {
    this.x = x;
    this.y = y;
    this.dimension = dimension;
  }

  render() {
    const latLngPerPoint = 1 / TILE_FILE_DIMENSION;

    const westEdge = this.x * (this.dimension - 1);
    const eastEdge = westEdge + (this.dimension - 1);
    const westLng = westEdge * latLngPerPoint - 180;
    const eastLng = eastEdge * latLngPerPoint - 180;
  
    const southEdge = this.y * (this.dimension - 1);
    const northEdge = southEdge + (this.dimension - 1);
    const southLat = southEdge * latLngPerPoint - 180;
    const northLat = northEdge * latLngPerPoint - 180;
  
    let westMercator: number;
    let southMercator: number;
    let eastMercator: number;
    let northMercator: number;
  
    [westMercator, southMercator] = ElevationsToTerrainTile.latLngToMercator(southLat, westLng);
    [eastMercator, northMercator] = ElevationsToTerrainTile.latLngToMercator(northLat, eastLng);
  
    const xDimension = eastMercator - westMercator;
    const yDimension = northMercator - southMercator;

    console.log(`xDimension: ${xDimension}, yDimension: ${yDimension}`)

    const ele = this.getElevationTile(southLat, westLng, northLat, eastLng);
  
    if (ele === undefined) {
      throw new Error('elevations not loaded');
    }
  
    console.log(ele.centers?.length)
    this.create(ele, xDimension, yDimension);
  
    // addRoutes(southLat, westLng, northLat, eastLng);
  
    // Json::Value terrain = Json::objectValue;
    // terrain["type"] = "triangles";
    // terrain["points"] = vectorToJson(this.points);
    // terrain["normals"] = vectorToJson(m_normals);
    // terrain["indices"] = vectorToJson(this.indices);
  
    const terrain = {
      type: 'triangles',
      points: this.points,
      normals: this.normals,
      indices: this.indices,
    }

    // Json::Value objectArray = Json::arrayValue;
    // objectArray.append(terrain);
  
    // Json::Value data = Json::objectValue;
    // data["ele"] = vector2dToJson(ele.points);
    // data["xDimension"] = xDimension;
    // data["yDimension"] = yDimension;
    // data["objects"] = objectArray;
    const data = {
      ele: ele.points,
      xDimension,
      yDimension,
      objects: [terrain]
    }
  
    // Json::FastWriter fastWriter;
    // std::string output = fastWriter.write(data);
  
    // result.push(m_layer->saveTile(m_x, m_y, m_dimension, output));
  
    return data;
  }

  static latLngToMercator(lat: number, lng: number): number[]
  {
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
    southLat: number,
    westLng: number,
    northLat: number,
    eastLng: number
  ): Elevations | undefined {
    try {
      const westEdge = this.x * (this.dimension - 1);
      const eastEdge = westEdge + (this.dimension - 1);
  
      const southEdge = this.y * (this.dimension - 1);
      const northEdge = southEdge + (this.dimension - 1);
  
      const latMin = Math.floor(southLat);
      const latMax = Math.ceil(northLat);
  
      const lngMin = Math.floor(westLng);
      const lngMax = Math.ceil(eastLng);
  
      console.log(`(${southLat}, ${westLng}) - (${northLat}, ${eastLng})`);
  
      const points: number[][] = [];

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
  
          for (let j = startY; j <= endY; j++) {
            if (yy >= points.length) {
              points.push([]);
            }
            
            for (let i = startX * 2; i <= endX * 2; i += 2) {
              points[yy].push(file.data(i, j));
            }
  
            ++yy;
          }
        }
      }
  
      const centersDimension = this.dimension - 1;
      const centers: number[][] = Array<Array<number>>().fill([], 0, centersDimension);
  
      for (let j = 0; j < centersDimension; j++) {
        if (j >= centers.length) {
          centers.push([]);
        }

        for (let i = 0; i < centersDimension; i++) {
          centers[j].push(bilinearInterpolation(
            points[j][i],
            points[j + 1][i],
            points[j][i + 1],
            points[j + 1][i + 1],
            0.5,
            0.5)
          );
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
    this.createTerrainIndices(numPointsX, numPointsY);
    this.createTerrainNormals(numPointsX, numPointsY);
  }

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
      this.points.push(startXOffset + i * xStep);
      this.points.push(startYOffset);
      this.points.push(terrain.points[0][i]);
  
      // texture coordinates
      this.points.push(terrain.textureSW.s + i * sStep);
      this.points.push(terrain.textureSW.t);
    }
  
    for (let j = 1; j < numPointsY; j += 1) {
      this.points.push(startXOffset);
      this.points.push(startYOffset + j * yStep);
      this.points.push(terrain.points[j][0]);
  
      // texture coordinates
      this.points.push(terrain.textureSW.s);
      this.points.push(terrain.textureSW.t + j * tStep);
  
      for (let i = 1; i < numPointsX; i += 1) {
        this.points.push(startXOffset + (i - 0.5) * xStep);
        this.points.push(startYOffset + (j - 0.5) * yStep);
        this.points.push(terrain.centers[j - 1][i - 1]);
  
        // texture coordinates
        this.points.push(terrain.textureSW.s + (i - 0.5) * sStep);
        this.points.push(terrain.textureSW.t + (j - 0.5) * tStep);
  
        this.points.push(startXOffset + i * xStep);
        this.points.push(startYOffset + j * yStep);
        this.points.push(terrain.points[j][i]);
  
        // texture coordinates
        this.points.push(terrain.textureSW.s + i * sStep);
        this.points.push(terrain.textureSW.t + j * tStep);
      }
    }
  }

  createTerrainIndices(
    numPointsX: number,
    numPointsY: number,
  ) {
    for (let i = 0; i < numPointsX - 1; i += 1) {
      this.indices.push(i);
      this.indices.push(i + 1);
      this.indices.push(numPointsX + i * 2 + 1); // center
  
      this.indices.push(i + 1);
      this.indices.push(numPointsX + i * 2 + 2);
      this.indices.push(numPointsX + i * 2 + 1); // center
  
      this.indices.push(numPointsX + i * 2 + 2);
      this.indices.push(numPointsX + i * 2 + 0);
      this.indices.push(numPointsX + i * 2 + 1); // center
  
      this.indices.push(numPointsX + i * 2 + 0);
      this.indices.push(i);
      this.indices.push(numPointsX + i * 2 + 1); // center
    }
  
    const firstRowOffset = numPointsX;
    const numRowPoints = numPointsX * 2 - 1;
  
    for (let j = 1; j < numPointsY - 1; j += 1) {
      for (let i = 0; i < numPointsX - 1; i += 1) {
        this.indices.push(firstRowOffset + numRowPoints * (j - 1) + i * 2 + 0);
        this.indices.push(firstRowOffset + numRowPoints * (j - 1) + i * 2 + 2);
        this.indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 1);
  
        this.indices.push(firstRowOffset + numRowPoints * (j - 1) + i * 2 + 2);
        this.indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 2);
        this.indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 1);
  
        this.indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 2);
        this.indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 0);
        this.indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 1);
  
        this.indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 0);
        this.indices.push(firstRowOffset + numRowPoints * (j - 1) + i * 2 + 0);
        this.indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 1);
      }
    }
  }

  computeNormal(
    positions: number[],
    indices: number[],
    index: number
  ): vec3 {
    const v1 = vec3.fromValues(
      positions[indices[index + 2] * terrainVertexStride + 0]
        - positions[indices[index + 1] * terrainVertexStride + 0],
      positions[indices[index + 2] * terrainVertexStride + 1]
        - positions[indices[index + 1] * terrainVertexStride + 1],
      positions[indices[index + 2] * terrainVertexStride + 2]
      - positions[indices[index + 1] * terrainVertexStride + 2]
    );
  
    const v2 = vec3.fromValues(
      positions[indices[index] * terrainVertexStride + 0]
        - positions[indices[index + 1] * terrainVertexStride + 0],
      positions[indices[index] * terrainVertexStride + 1]
        - positions[indices[index + 1] * terrainVertexStride + 1],
      positions[indices[index] * terrainVertexStride + 2]
        - positions[indices[index + 1] * terrainVertexStride + 2]
    );
  
    let normal = vec3.fromValues(0, 0, 0);
    normal = vec3.cross(normal, v1, v2);
    normal = vec3.normalize(normal, normal);
  
    return normal;
  }
  
  createTerrainNormals(
    numPointsX: number,
    numPointsY: number,
  ) {
    // Create a normal for each face
    
    const faceNormals: vec3[] = [];
  
    const sumNormals = (indexes: number[]): vec3 => {
      const vec = [0, 0, 0];
  
      for (let i = 0; i < indexes.length; i += 1) {
        vec[0] += faceNormals[indexes[i]][0];
        vec[1] += faceNormals[indexes[i]][1];
        vec[2] += faceNormals[indexes[i]][2];
      }
  
      let normal = vec3.fromValues(vec[0], vec[1], vec[2]);
      normal = vec3.normalize(normal, normal);
  
      return normal; // vec3.fromValues(normal[0], normal[1], normal[2]);
    };
  
    const concatNormal = (n: vec3) => {
      this.normals.push(n[0]);
      this.normals.push(n[1]);
      this.normals.push(n[2]);
    };
  
    for (let i = 0; i < this.indices.length; i += 3) {
      faceNormals.push(this.computeNormal(this.points, this.indices, i));
    }
  
    // Sum the face normals that share a vertex
  
    // first row
  
    concatNormal(sumNormals([0, 3]));
  
    for (let i = 4; i < (numPointsX - 1) * 4; i += 4) {
      concatNormal(sumNormals([i - 1, i + 3, i + 6, i]));
    }
  
    concatNormal(sumNormals([(numPointsX - 1) * 4, (numPointsX - 1) * 4 + 1]));
  
    // interior
  
    for (let j = 1; j < numPointsY - 1; j += 1) {
      concatNormal(sumNormals([
        (j - 1) * (numPointsX - 1) * 4 + 3,
        (j - 1) * (numPointsX - 1) * 4 + 2,
        (j + 0) * (numPointsX - 1) * 4 + 0,
        (j + 0) * (numPointsX - 1) * 4 + 3
      ]));
  
      for (let i = 1; i < numPointsX - 1; i += 1) {
        concatNormal(sumNormals([
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 1,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 2,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 3,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 4
        ]));
  
        concatNormal(sumNormals([
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 2,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 3,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 + 3,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 + 2,
          (j + 0) * (numPointsX - 1) * 4 + i * 4 - 4,
          (j + 0) * (numPointsX - 1) * 4 + i * 4 - 3,
          (j + 0) * (numPointsX - 1) * 4 + i * 4 + 0,
          (j + 0) * (numPointsX - 1) * 4 + i * 4 + 3
        ]));
      }
  
      concatNormal(sumNormals([
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 1,
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 2,
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 4
      ]));
  
      concatNormal(sumNormals([
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 2,
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
        (j + 0) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 4,
        (j + 0) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3
      ]));
    }
  
    // last row
    concatNormal(sumNormals([
      (numPointsY - 2) * (numPointsX - 1) * 4 + 2,
      (numPointsY - 2) * (numPointsX - 1) * 4 + 3
    ]));
  
    for (let i = 1; i < numPointsX - 1; i += 1) {
      concatNormal(sumNormals([
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 1,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 2,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 3,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 4
      ]));
  
      concatNormal(sumNormals([
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 2,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 3,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 + 3,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 + 2
      ]));
    }
  
    concatNormal(sumNormals([
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 1,
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 2,
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 4
    ]));
  
    concatNormal(sumNormals([
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 2,
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3
    ]));
  }
}

export default ElevationsToTerrainTile;
