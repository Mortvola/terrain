import { vec3 } from "gl-matrix";
import Point from "./Point";
import { TriangleInterface } from "./Types";

class Triangle implements TriangleInterface {
  points: [Point, Point, Point];

  normal: vec3;

  padding = false;

  constructor(p1: Point, p2: Point, p3: Point, padding = false) {
    this.points = [p1, p2, p3];
    this.padding = padding;

    p1.triangles.push(this);
    p2.triangles.push(this);
    p3.triangles.push(this);

    this.computeNormal();
  }

  computeNormal() {
    const v1 = vec3.fromValues(
      this.points[2].x - this.points[1].x,
      this.points[2].y - this.points[1].y,
      this.points[2].z - this.points[1].z
    );
  
    const v2 = vec3.fromValues(
      this.points[0].x - this.points[1].x,
      this.points[0].y - this.points[1].y,
      this.points[0].z - this.points[1].z
    );
  
    this.normal = vec3.fromValues(0, 0, 0);
    this.normal = vec3.cross(this.normal, v1, v2);
    this.normal = vec3.normalize(this.normal, this.normal);
  }
}

export default Triangle;
