import { vec3 } from "gl-matrix";

type Point3 = [number, number, number];

class Plane {
  normal: vec3;

  point: Point3;

  constructor(normal: vec3, point: Point3) {
    this.normal = normal;
    this.point = point;
  }

  lineIntersection(point: Point3, vector: vec3): [number, number, number] | null {
    const v1 = vec3.fromValues(
      this.point[0] - point[0],
      this.point[1] - point[1],
      this.point[2] - point[2],
    );

    const denominator = vec3.dot(vector, this.normal);

    if (denominator !== 0) {
      const d = vec3.dot(v1, this.normal) / denominator;

      return [
        point[0] + vector[0] * d,
        point[1] + vector[1] * d,
        point[2] + vector[2] * d,
      ]
    }

    return null;
  }
}

export default Plane;
