import LatLng from './LatLng';

function nvl<T1, T2>(value: T1, replacement: T2): T1 | T2 {
  if (value === null) {
    return replacement;
  }

  return value;
}

function objectifyForm(formArray: Record<string, {name: string, value: string}>): unknown {
  const returnObject: Record<string, string> = {};

  Object.keys(formArray).forEach((i) => {
    returnObject[formArray[i].name] = formArray[i].value;
  });

  return returnObject;
}

function metersToMilesRounded(meters: number | string | null): number {
  if (meters !== null) {
    if (typeof meters === 'string') {
      return Math.round((parseFloat(meters) / 1609.34) * 10) / 10;
    }

    return Math.round((meters / 1609.34) * 10) / 10;
  }

  return 0;
}

function metersToMiles(meters: number | string): number {
  if (typeof meters === 'string') {
    return parseFloat(meters) / 1609.34;
  }

  return meters / 1609.34;
}

export const milesToMeters = (miles: number | string): number => {
  if (typeof miles === 'string') {
    return parseFloat(miles) * 1609.34;
  }

  return miles * 1609.34;
};

function metersToFeet(meters: number | string): number {
  if (typeof meters === 'string') {
    return Math.round(parseFloat(meters) * 3.281);
  }

  return Math.round(meters * 3.281);
}

export const metersToLocal = (m: number): string => (
  `${metersToFeet(m).toFixed(1)} ft`
);

function gramsToOunces(grams: number): number {
  return grams * 0.035274;
}

function gramsToPoundsAndOunces(grams: number): string {
  let ounces = gramsToOunces(grams);
  const pounds = Math.floor(ounces / 16.0);
  ounces = Math.round((ounces % 16.0) * 10) / 10.0;

  return `${pounds.toString()} lb ${ounces.toFixed(1)} oz`;
}

// Format time
// Parameter t is in minutes from midnight
function formatTime(t: number): string {
  const h = Math.floor(t / 60.0);
  const m = Math.floor((t % 60));

  let formattedTime = '';

  if (h < 10) {
    formattedTime = `0${h}`;
  }
  else {
    formattedTime = h.toString();
  }

  if (m < 10) {
    formattedTime += `:0${m}`;
  }
  else {
    formattedTime += `:${m}`;
  }

  return formattedTime;
}

// Parameter t is a string in the form of HH:MM.
export function unformatTime(t: string): number {
  const time = t.split(':');

  return parseInt(time[0], 10) * 60 + parseInt(time[1], 10);
}

export function toTimeString(time: number | undefined | null): string | null {
  if (time !== undefined && time !== null) {
    let hour = Math.floor(time).toString();
    if (time < 10) {
      hour = `0${hour}`;
    }

    const minutes = Math.floor((time - Math.floor(time)) * 60);
    if (minutes < 10) {
      return `${hour}:0${minutes}`;
    }

    return `${hour}:${minutes}`;
  }

  return null;
}

function toTimeFloat(time: string): number {
  return parseInt(time.substring(0, 2), 10) + parseInt(time.substring(3), 10) / 60.0;
}

export const degToRad = (degrees: number): number => (
  degrees * (Math.PI / 180)
);

export const radToDeg = (radians: number): number => (
  (radians / Math.PI) * 180
);

function haversineGreatCircleDistance(
  latitudeFrom: number,
  longitudeFrom: number,
  latitudeTo: number,
  longitudeTo: number,
  earthRadius = 6378137,
): number {
  // convert from degrees to radians
  const latFrom = degToRad(latitudeFrom);
  const lonFrom = degToRad(longitudeFrom);
  const latTo = degToRad(latitudeTo);
  const lonTo = degToRad(longitudeTo);

  const latDelta = latTo - latFrom;
  const lonDelta = lonTo - lonFrom;

  const a = (Math.sin(latDelta / 2) ** 2)
    + Math.cos(latFrom) * Math.cos(latTo) * (Math.sin(lonDelta / 2) ** 2);

  const angle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return angle * earthRadius;
}

export const lngDistance = (fromLng: number, toLng: number): number => (
  haversineGreatCircleDistance(
    0, fromLng, 0, toLng,
  )
);

export const latDistance = (fromLat: number, toLat: number): number => (
  haversineGreatCircleDistance(
    fromLat, 0, toLat, 0,
  )
);

export const latOffset = (fromLat: number, toLat: number): number => (
  latDistance(fromLat, toLat) * (fromLat < toLat ? 1 : -1)
);

export const lngOffset = (fromLng: number, toLng: number): number => (
  lngDistance(fromLng, toLng) * (fromLng < toLng ? 1 : -1)
);

// function sleep(ms: number): Promise<number> {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

export const tile2lng = (x: number, z: number): number => (
  (x / (2 ** z)) * 360 - 180
);

export const tile2lat = (y: number, z: number): number => {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return ((180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
};

export const lng2tile = (lon:number, zoom: number): number => (
  Math.floor(((lon + 180) / 360) * 2 ** zoom)
);

export const lat2tile = (lat: number, zoom: number): number => (
  Math.floor(
    ((1 - Math.log(Math.tan(lat * (Math.PI / 180)) + 1 / Math.cos(lat * (Math.PI / 180))) / Math.PI)
      / 2) * 2 ** zoom,
  )
);

export const latLngToTerrainTile = (
  lat: number, lng:number, dimension: number,
): [number, number] => {
  // Add 180 to convert coordinates to positive values for convenience.
  const x = Math.floor(((lng + 180) * 3600) / (dimension - 1));
  const y = Math.floor(((lat + 180) * 3600) / (dimension - 1));

  return [x, y];
};

export const terrainTileToLatLng = (x: number, y: number, dimension: number): LatLng => {
  const numTiles = (360 * 3600) / (dimension - 1);

  let lng = ((x / numTiles) * 360 - 180);
  let lat = ((y / numTiles) * 360 - 180);

  lng += ((dimension - 1) / 3600) / 2;
  lat += ((dimension - 1) / 3600) / 2;

  return new LatLng(lat, lng);
};

export const latLngToMercator = (lat: number, lng: number): [number, number] => {
  const latRad = degToRad(lat);
  const lngRad = degToRad(lng);

  const equatorialRadius = 6378137.0;
  const a = equatorialRadius;
  const f = 1 / 298.257223563;
  const b = a * (1 - f); // WGS84 semi-minor axis
  const e = Math.sqrt(1 - (b ** 2) / (a ** 2)); // ellipsoid eccentricity

  const sinLatRad = Math.sin(latRad);

  const c = ((1 - e * sinLatRad) / (1 + e * sinLatRad));

  const x = lngRad * a;
  const y = Math.log(((1 + sinLatRad) / (1 - sinLatRad)) * (c ** e)) * (a / 2);

  return [x, y];
};

export const bilinearInterpolation = (
  f00: number, f10: number, f01: number, f11: number, x: number, y: number,
): number => {
  const oneMinusX = 1 - x;
  const oneMinusY = 1 - y;
  return (f00 * oneMinusX * oneMinusY + f10 * x * oneMinusY + f01 * oneMinusX * y + f11 * x * y);
};

export {
  objectifyForm,
  metersToMilesRounded,
  toTimeFloat,
  metersToFeet,
  metersToMiles,
  gramsToPoundsAndOunces,
  formatTime,
  nvl,
  haversineGreatCircleDistance,
  // sleep,
};
