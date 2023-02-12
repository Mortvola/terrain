import LatLng from '../../../client-web/LatLng';
import File, { TILE_FILE_DIMENSION } from "./File";
import Point from './Point';
import Triangle from './Triangle';
import { Output, TerrainOutput } from './Types';

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

    const terrain = this.getElevationTile(westEdge, eastEdge, southEdge, northEdge, southLat, westLng, northLat, eastLng);
  
    if (terrain === undefined) {
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

    const triangles = this.createTerrainTriangles(terrain, xDimension, yDimension);

    // addRoutes(southLat, westLng, northLat, eastLng);

    return this.formatOutput(terrain, triangles);
  }

  formatOutput(
    ele: Elevations,
    triangles: Triangle[],
  ): Output {
    const points: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];

    let pointIndex = 0;
    for (let triangle of triangles) {
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

    for (let y = 1; y < ele.points.length - 1; y += 1) {
      outputEle.push([]);
    
      for (let x = 1; x < ele.points[y].length - 1; x += 1) {
        outputEle[y - 1].push(ele.points[y][x].z);
      }
    }
  
    const terrain: TerrainOutput = {
      type: 'triangles',
      points,
      normals,
      indices,
    }

    const nwPoint = ele.points[1][1];
    const nePoint = ele.points[1][ele.points[1].length - 2];
    const swPoint = ele.points[ele.points.length - 2][1];
  
    const data: Output = {
      ele: outputEle,
      xDimension: nePoint.x - nwPoint.x,
      yDimension: swPoint.y - nwPoint.y,
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
  
          let fileStartX = 0;
  
          if (lng == lngMin) {
            fileStartX = westEdge % TILE_FILE_DIMENSION;
          }
  
          let fileEndX = TILE_FILE_DIMENSION;
  
          if (lng == lngMax - 1) {
            fileEndX = eastEdge % TILE_FILE_DIMENSION;
            if (fileEndX == 0) {
              fileEndX = TILE_FILE_DIMENSION;
            }
          }
  
          let fileStartY = southEdge % TILE_FILE_DIMENSION;
          let yy = 0;
  
          if (lat != latMin) {
            yy = TILE_FILE_DIMENSION - fileStartY;
            fileStartY = 0;
          }
  
          let fileEndY = TILE_FILE_DIMENSION;
  
          if (lat == latMax - 1) {
            fileEndY = northEdge % TILE_FILE_DIMENSION;
            if (fileEndY == 0) {
              fileEndY = TILE_FILE_DIMENSION;
            }
          }
  
          for (let j = fileStartY; j < fileEndY; j++) {
            if (yy >= points.length) {
              points.push([]);
            }
            
            // Increment by two because the data is read as bytes in pairs to get 16 bit values.
            for (let i = fileStartX * 2; i < fileEndX * 2; i += 2) {
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

  createTerrainTriangles(
    terrain: Elevations,
    xDimension: number,
    yDimension: number
  ): Triangle[] {
    const triangles: Triangle[] = [];

    const numPointsX = terrain.points[0].length;
    const numPointsY = terrain.points.length;
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
      let point = terrain.points[0][i];
      point.x = startXOffset + i * xStep;
      point.y = startYOffset;
      point.s = terrain.textureSW.s + i * sStep;
      point.t = terrain.textureSW.t;
    }
  
    for (let j = 1; j < numPointsY; j += 1) {
      let upperLeft = terrain.points[j - 1][0];
      let lowerLeft = terrain.points[j][0];

      lowerLeft.x = startXOffset;
      lowerLeft.y = startYOffset + j * yStep;
      lowerLeft.s = terrain.textureSW.s;
      lowerLeft.t = terrain.textureSW.t + j * tStep;
  
      for (let i = 1; i < numPointsX; i += 1) {  
        let upperRight = terrain.points[j - 1][i];
        let lowerRight = terrain.points[j][i];
        let center = terrain.centers[j - 1][i - 1];

        center.x = startXOffset + (i - 0.5) * xStep;
        center.y = startYOffset + (j - 0.5) * yStep;
        center.s = terrain.textureSW.s + (i - 0.5) * sStep;
        center.t = terrain.textureSW.t + (j - 0.5) * tStep;

        lowerRight.x = startXOffset + i * xStep;
        lowerRight.y = startYOffset + j * yStep;
        lowerRight.s = terrain.textureSW.s + i * sStep;
        lowerRight.t = terrain.textureSW.t + j * tStep;

        // Triangles marked as padding will not be output.
        // First and last of each row of quads and the last row of quads
        const padding = this.padding !== 0 && (i === 0 || i === numPointsX - 2 || j === 0 || j === numPointsY - 2);
      
        triangles.push(new Triangle(upperLeft, upperRight, center, padding));
        triangles.push(new Triangle(upperRight, lowerRight, center, padding));
        triangles.push(new Triangle(lowerRight, lowerLeft, center, padding));
        triangles.push(new Triangle(lowerLeft, upperLeft, center, padding));

        upperLeft = upperRight;
        lowerLeft = lowerRight;
      }
    }

    // Now that all of the triangles have been added compute the normals for each point.
    for (let y = 0; y < terrain.points.length; y += 1) {
      for (let x = 0; x < terrain.points[y].length; x += 1) {
        terrain.points[y][x].computeNormal();
      }
    }

    for (let y = 0; y < terrain.centers.length; y += 1) {
      for (let x = 0; x < terrain.centers[y].length; x += 1) {
        terrain.centers[y][x].computeNormal();
      }
    }

    return triangles;
  }
}

export default ElevationsToTerrainTile;
