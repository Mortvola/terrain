class Rectangle2D {
  min: [number, number];

  max: [number, number];

  constructor(p1: [number, number], p2: [number, number]) {
    const mins: number[] = [];
    const maxs: number[] = [];

    for (let i = 0; i < 2; i += 1) {
      if (p1[i] < p2[i]) {
        mins.push(p1[i]);
        maxs.push(p2[i]);  
      }
      else {
        mins.push(p2[i]);
        maxs.push(p1[i]);
      }  
    }

    this.min = [mins[0], mins[1]];
    this.max = [maxs[0], maxs[1]];
  }

  intersectsRectangle2D(other: Rectangle2D): boolean {
    return other.min[0] <= this.max[0] && other.min[1] <= this.max[1] &&
    other.max[0] >= this.min[0] && other.max[1] >= this.min[1]
  }

  intersectsLine2D(point1: [number, number], point2: [number, number]): boolean {
    const d: number[] = [0, 0];
    const q1: number[] = [0, 0]
    const q2: number[] = [0, 0];
  
    for (let i = 0; i < 2; i += 1) {
      d[i] = -(point2[i] - point1[i]);
  
      q1[i] = point1[i] - this.min[i];
      q2[i] = this.max[i] - point1[i];
    }

    if (
      (d[0] === 0 && (q1[0] < 0 || q2[0] < 0)) || // line is vertical and left or right of the rectangle
      (d[1] === 0 && (q1[1] < 0 || q2[1] < 0)) // line is horizontal and below or above the rectangle
    ) {
      return false;
    }

    const negarr: number[] = [];
    const posarr: number[] = [];

    for (let i = 0; i < 2; i += 1) {
      if (d[i] !== 0) {
        const r1 = q1[i] / d[i];
        const r2 = q2[i] / -d[i];
  
        if (d[i] < 0) {
          negarr.push(r1);
          posarr.push(r2);
        }
        else {
          negarr.push(r2);
          posarr.push(r1);
        }
      }  
    }

    // get minimum value
    const minimum = posarr.reduce((prev, curr) => {
      if (curr < prev) {
        return curr;
      }

      return prev;
    }, 1);

    // get maximum value
    const maximum = negarr.reduce((prev, curr) => {
      if (curr > prev) {
        return curr;
      }

      return prev;
    }, 0);

    if (maximum > minimum) {
      return false;
    }

    return true;
  }
}

export default Rectangle2D;

// const r1 = new Rectangle2D([-1, -1], [1, 1]);

// const lines: [number, number][][] = [
//   [[-1.5, -1.5], [0.5, 0.5]],
//   [[-1.5, 0.5], [0.5, 0.5]],
//   [[-1.5, 1.5], [0.5, 0.5]],

//   [[0.5, -1.5], [0.5, 0.5]],
//   [[-0.5, -0.5], [0.5, 0.5]],
//   [[0.5, 1.5], [0.5, 0.5]],

//   [[1.5, -1.5], [0.5, 0.5]],
//   [[1.5, 0.5], [0.5, 0.5]],
//   [[1.5, 1.5], [0.5, 0.5]],

//   [[-1.5, -1.5], [1.5, -1.5]],
//   [[-1.5, 1.5], [1.5, 1.5]],
//   [[-1.5, -1.5], [0.5, -1.5]],
//   [[-1.5, 1.5], [0.5, 1.5]],

//   [[0.5, 1.5], [1.5, 0.5]],
//   [[0.5, 2.5], [2.5, 0.5]],
//   [[0.5, 1.5], [1.5, 0.6]],
//   [[-0.5, 1.5], [-1.5, 0.5]],
//   [[-0.5, 1.5], [-1.5, 0.6]],

//   [[1.5, 1.5], [1.5, -1.5]],
//   [[0, 1.5], [0, -1.5]],
//   [[-1.5, 1.5], [-1.5, -1.5]],
// ];

// lines.forEach((line) => {
//   const result = r1.intersectsLine2D(line[0], line[1]);

//   console.log(result);  
// })

