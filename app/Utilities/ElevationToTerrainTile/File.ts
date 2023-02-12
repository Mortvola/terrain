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
  }

  data(x: number, y: number): number {
    const rowBytes = (TILE_FILE_DIMENSION + 1) * 2;

    return this.buffer.getInt16((TILE_FILE_DIMENSION - y) * rowBytes + x, false);
  }
}

export default File;
