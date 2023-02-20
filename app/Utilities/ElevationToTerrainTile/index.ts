import fs from 'fs';
import { latLngToTerrainTile } from '../../../client-web/utilities';
import ElevationsToTerrainTile from './ElevationsToTerrainTile';
import { applyTrail, partitionTrail, readPCT } from './Trail';
import { Output, TerrainOutput } from './Types';

const saveFile = (x: number, y: number, dimension: number, result: Output) => {
  const folderX = Math.floor(x / 10);
  const folderY = Math.floor(y / 10);
  const filename = `${x}-${y}-${dimension}.dat`;

  const path = `../../../data/terrain/${folderX}/${folderY}`;
  fs.mkdirSync(path, { recursive: true });
  
  console.log(`Saving data to ${path}`)
  fs.writeFileSync(`${path}/${filename}`, JSON.stringify(result))
}

if (process.argv.length < 3) {
  throw new Error('not enough arguments.')
}

if (process.argv[2] === 'range') {
  if (process.argv.length < 8) {
    throw new Error('not enough arguments.')
  }

  const startLat = parseFloat(process.argv[4]);
  const startLng = parseFloat(process.argv[3]);

  const endLat = parseFloat(process.argv[6]);
  const endLng = parseFloat(process.argv[5]);

  const dimension = parseInt(process.argv[7], 10);

  let [startX, startY] = latLngToTerrainTile(startLat, startLng, dimension);
  startX += 2;
  startY += 2;

  let [endX, endY] = latLngToTerrainTile(endLat, endLng, dimension);
  endX -= 1;
  endY -= 1;

  const trail = readPCT();
  const trailMap = partitionTrail(trail, dimension);

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const converter = new ElevationsToTerrainTile(x, y, dimension);
  
      const [elevations, triangles, mercatorValues] = converter.render();
    
      const trails = applyTrail(trailMap, triangles, x, y, mercatorValues);

      const result = converter.formatOutput(elevations, triangles);

      trails?.forEach((trail) => {
        const t: TerrainOutput = {
          type: 'line',
          points: trail.flatMap((p) => p),
          normals: [] as number[],
          indices: [] as number[],
        };
      
        result.objects.push(t)  
      });

      saveFile(x, y, dimension, result);
    }
  }
}
else {
  if (process.argv.length < 5) {
    throw new Error('not enough arguments.')
  }
  
  // const [x1, y1] = latLngToTerrainTile(46.514279, -121.456191, 128);
  // console.log(x1, y1);

  const x = parseFloat(process.argv[2]);
  const y = parseFloat(process.argv[3]);
  const dimension = parseFloat(process.argv[4])

  const trail = readPCT();
  const trailMap = partitionTrail(trail, dimension);

  const converter = new ElevationsToTerrainTile(x, y, dimension);
  
  const [elevations, triangles, mercatorValues] = converter.render();

  const trails = applyTrail(trailMap, triangles, x, y, mercatorValues);

  const result = converter.formatOutput(elevations, triangles);

  trails?.forEach((trail) => {
    const t: TerrainOutput = {
      type: 'line',
      points: trail.flatMap((p) => p),
      normals: [] as number[],
      indices: [] as number[],
    };
  
    result.objects.push(t)  
  })

  saveFile(x, y, dimension, result);
}
