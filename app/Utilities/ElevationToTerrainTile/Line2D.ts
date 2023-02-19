import { vec2 } from "gl-matrix";

class Line2D {
  point1: vec2;

  point2: vec2;

  constructor(p1: [number, number], p2: [number, number]) {
    this.point1 = vec2.fromValues(p1[0], p1[1]);
    this.point2 = vec2.fromValues(p2[0], p2[1]);
  }

  intersectionLine2D(q: Line2D): { point: [number, number], t: number } | null {
    const cross2D = (v1: vec2, v2: vec2) => (
      v1[0] * v2[1] - v1[1] * v2[0]
    );

    const r = vec2.fromValues(
      this.point2[0] - this.point1[0],
      this.point2[1] - this.point1[1],
    );

    const s = vec2.fromValues(
      q.point2[0] - q.point1[0],
      q.point2[1] - q.point1[1],
    );

    const qp = vec2.fromValues(
      q.point1[0] - this.point1[0],
      q.point1[1] - this.point1[1],
    )

    const denominator = cross2D(r, s);
    const numerator = cross2D(qp, s);

    if (denominator === 0) {
      // if (numerator ==0) {
      //   console.log('lines are colinear');
      //   return null;
      // }

      // console.log('lines are parallel');
      return null;
    }

    const t = numerator / denominator

    if (t < 0 || t > 1) {
      return null;
    }

    const u = cross2D(qp, r) / denominator;

    if (u < 0 || u > 1) {
      return null;
    }

    return {
      point: [
        this.point1[0] + t * r[0],
        this.point1[1] + t * r[1],
      ],
      t,
    }

    // console.log(intersection);
    // const pq = vec2.fromValues(
    //   this.point1[0] - q.point1[0],
    //   this.point1[1] - q.point1[1],
    // )

    // const u = cross2D(qp, r) / denominator
    
    // console.log(t, u);
  }
}

export default Line2D;

const lines: [number, number][][] = [
//   [[1, 1], [-1, -1]],
//   [[-1, 1], [1, -1]],
//   [[0, 0], [1, -1]],
//   [[-1, 1], [0, 0]],
//   [[0, 0], [-1, -1]],
//   [[1, 1], [0, 0]],
//   [[1, 1], [0.5, 0.5]],
//   [[0, -1], [2, 1]],
//   [[3, -1], [2, 1]],
  [[287.0279226405546, 2158.9202506993897], [290.50411931145936, 2187.87728042854]],
  [[289.2403869628906, 2182.71630859375], [304.46356201171875, 2204.763916015625]],
  [[287.0279226405546, 2158.9202506993897], [290.02014261843306, 2183.845622716674]],
]

const l1 = new Line2D(lines[0][0], lines[0][1]);
const l2 = new Line2D(lines[1][0], lines[1][1]);
const l3 = new Line2D(lines[2][0], lines[2][1]);
// const l3 = new Line2D(lines[2][0], lines[2][1]);
// const l4 = new Line2D(lines[3][0], lines[3][1]);
// const l5 = new Line2D(lines[4][0], lines[4][1]);
// const l6 = new Line2D(lines[5][0], lines[5][1]);
// const l7 = new Line2D(lines[6][0], lines[6][1]);
// const l8 = new Line2D(lines[7][0], lines[7][1]);
// const l9 = new Line2D(lines[8][0], lines[8][1]);

console.log(l1.intersectionLine2D(l2));
// console.log(l1.intersectionLine2D(l2));
console.log(l3.intersectionLine2D(l2));

// l3.intersectionLine2D(l1);
// l4.intersectionLine2D(l1);
// l4.intersectionLine2D(l5);
// l4.intersectionLine2D(l6);
// l4.intersectionLine2D(l7);
// l4.intersectionLine2D(l4);
// l8.intersectionLine2D(l1);
// l8.intersectionLine2D(l9);

