import Rectangle2D from "./Rectangle2D";

// type Node = {
//   extents: Rectangle2D

//   nodes: Node[]
// }

export type Point2D = [number, number];

class Polyline2D {
  points: Point2D[] = [];

  extents: Rectangle2D | null = null;

  // nodes: Node[];

  constructor(points: Point2D[] = []) {
    this.points = points;    
  }

  computeExtents() {
    this.extents = this.points.reduce((prev, curr) => {
      return new Rectangle2D(
        [
          curr[0] < prev.min[0] ? curr[0] : prev.min[0],
          curr[1] < prev.min[1] ? curr[1] : prev.min[1],
        ],
        [
          curr[0] > prev.max[0] ? curr[0] : prev.max[0],
          curr[1] > prev.max[1] ? curr[1] : prev.max[1],
        ]
      )
    }, new Rectangle2D(
      [this.points[0][0], this.points[0][1]],
      [this.points[0][0], this.points[0][1]],
    ))
  }

  // createTree() {
  //   // Divide current extent in two
  //   const newY = (this.extents.max[1] - this.extents.min[1]) / 2 + this.extents.min[1];

  //   const extent1 = new Rectangle2D(
  //     [this.extents.min[0], this.extents.min[1]],
  //     [this.extents.max[0], newY],
  //   )

  //   const extent2 = new Rectangle2D(
  //     [this.extents.min[0], newY],
  //     [this.extents.max[0], this.extents.max[1]],
  //   )

  //   const points1: Point2D[] = [];
  //   const points2: Point2D[] = [];

  //   if (this.points[0][1] < newY) {
  //     points1.push(this.points[0]);
  //   }
  //   else {
  //     points2.push(this.points[0]);
  //   }  

  //   for (let i = 1; i < this.points.length; i += 1) {
  //     if (this.points[i][1] < newY) {
  //       if (this.points[i - 1][1] >= newY) {

  //       }
  //       points1.push(this.points[i]);
  //     }
  //     else {
  //       if (this.points[i - 1][1] < newY) {
          
  //       }
  //       points2.push(this.points[i]);
  //     }  
  //   }
  // }
}

export default Polyline2D;
