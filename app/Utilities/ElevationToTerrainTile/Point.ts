import { vec3 } from "gl-matrix";
import { PointInterface, TriangleInterface } from "./Types";

class Point implements PointInterface {
  x: number;

  y: number;

  z: number;

  s: number;

  t: number;

  normal = vec3.create();

  index: number | null = null;

  triangles: TriangleInterface[] = [];

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;

    this.s = 0;
    this.t = 0;
  }

  computeNormal() {
    const sum = vec3.create();

    for (let i = 0; i < this.triangles.length; i += 1) {
      sum[0] += this.triangles[i].normal[0];
      sum[1] += this.triangles[i].normal[1];
      sum[2] += this.triangles[i].normal[2];
    }

    vec3.normalize(this.normal, sum);
  };
}

export default Point;
