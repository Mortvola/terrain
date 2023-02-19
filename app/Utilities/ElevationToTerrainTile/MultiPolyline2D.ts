import Polyline2D, { Point2D } from './Polyline2D';

class MultiPolyline2D {
  segments: Polyline2D[] = [];

  constructor(segments: Point2D[][] = []) {
    for (let segment of segments) {
      this.segments.push(new Polyline2D(segment));
    }
  }
}

export default MultiPolyline2D;
