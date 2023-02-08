import LatLng from '../../../client-web/LatLng';
import fs from 'fs';

export const TILE_FILE_DIMENSION = 3600;

class File {
  filename: string;

  buffer: DataView

  latLng: LatLng;

  constructor(filename: string, latLng: LatLng) {
    this.filename = filename;
    this.latLng = latLng;
  }

  read() {
    const buffer = fs.readFileSync(this.filename);

    this.buffer = new DataView(buffer.buffer)
    // console.log(`${buffer[0]}, ${buffer[1]}, ${buffer[2]}, ${buffer[3]}`)

    // for(let i = 0; i < 100; i += 2) {
    //   console.log(`${this.buffer.getUint16(i, false)}`)
    // }

    // console.log('end')
  }

  data(x: number, y: number): number {
    const rowBytes = (TILE_FILE_DIMENSION + 1) * 2;

    return this.buffer.getInt16((TILE_FILE_DIMENSION - y) * rowBytes + x, false);
  }
}

export default File;
