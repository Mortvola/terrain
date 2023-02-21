import fs from 'fs';
import { quat, vec3 } from 'gl-matrix';
import { PNG } from 'pngjs';

const buffer = new Uint8Array(1024 * 1024 * 4);

const MAX_ANGLE = 24.5;

for (let i = 0; i < 1024 * 1024 * 4; i += 4) {
  const q = quat.create();
  quat.fromEuler(
    q,
    Math.random() * MAX_ANGLE * 2 - MAX_ANGLE,
    Math.random() * MAX_ANGLE * 2 - MAX_ANGLE,
    0,
  );

  const normal = vec3.fromValues(0, 0, 1);
  vec3.transformQuat(normal, normal, q);

  // let r = normal[0] + 245;
  // let g = normal[1] * 10 + 245;
  // let b = normal[2] * 10 + 245;
  
  // let n = vec3.fromValues(r, g, b);
  // vec3.normalize(n, n);

  buffer[i + 0] = Math.round((normal[0] * 0.5 + 0.5) * 255);
  buffer[i + 1] = Math.round((normal[1] * 0.5 + 0.5) * 255);
  buffer[i + 2] = Math.round((normal[2] * 0.5 + 0.5) * 255);
  buffer[i + 3] = 255;
}

const png = new PNG();

png.width = 1024;
png.height = 1024;
png.data = Buffer.from(buffer);

fs.writeFileSync(
  'test.png',
  PNG.sync.write(png, { colorType: 2 }),
)
