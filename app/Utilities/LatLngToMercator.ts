const lat = 39.745277777777773;
const lng = -105.95194444444445;

const degToRad = (d: number) => (
  (d / 180) * Math.PI
);

const latRad = degToRad(lat);
const lngRad = degToRad(lng);

console.log(`latRad = ${latRad}`);
console.log(`lngRad = ${lngRad}`);

const equatorialRadius = 6378137.0;
const a = equatorialRadius;
const f = 1 / 298.257223563;
const b = a * (1 - f) // WGS84 semi-minor axis
const e = Math.sqrt(1 - (b ** 2) / (a ** 2)) // ellipsoid eccentricity

const sinLatRad = Math.sin(latRad);

const c = ((1 - e * sinLatRad) / (1 + e * sinLatRad));

console.log(`c = ${c}`);

const x = lngRad * a;
const y = Math.log(((1 + sinLatRad) / (1 - sinLatRad)) * (c ** e)) * (a / 2);

console.log(`(x, y) = (${x}, ${y})`);
