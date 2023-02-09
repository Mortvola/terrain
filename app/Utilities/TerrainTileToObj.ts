import fs from 'fs';

type Tile = {
  type: string,
  points: number[],
  normals: number[],
  indices: number[],
}

const saveToObj = (tile: Tile): void => {
  let data = '# vertices\n';
  for (let i = 0; i < tile.points.length; i += 5) {
    data += `v ${tile.points[i + 0]} ${tile.points[i + 1]} ${tile.points[i + 2]}\n`;
  }

  data += '# texture\n';
  for (let i = 0; i < tile.points.length; i += 5) {
    data += `vt ${tile.points[i + 3]} ${tile.points[i + 4]}\n`;
  }

  data += '# normals\n';
  for (let i = 0; i < tile.normals.length; i += 3) {
    data += `vn ${tile.normals[i + 0]} ${tile.normals[i + 1]} ${tile.normals[i + 2]}\n`;
  }

  data += '# faces\n';
  for (let i = 0; i < tile.indices.length; i += 3) {
    data += `f ${tile.indices[i + 0] + 1}/${tile.indices[i + 0] + 1}/${tile.indices[i + 0] + 1} `
      + `${tile.indices[i + 1] + 1}/${tile.indices[i + 1] + 1}/${tile.indices[i + 1] + 1} `
      + `${tile.indices[i + 2] + 1}/${tile.indices[i + 2] + 1}/${tile.indices[i + 2] + 1}\n`;
  }

  fs.writeFileSync('tile.obj', data);
}

if (process.argv.length < 3) {
  console.log(`usage: ts-node TerrainTileToObj.ts <filename>`)
}
else {
  const filename = process.argv[2];

  const json = fs.readFileSync(filename, { encoding: 'utf8' });
  
  const terrain = JSON.parse(json.toString());
  
  saveToObj(terrain);  
}
