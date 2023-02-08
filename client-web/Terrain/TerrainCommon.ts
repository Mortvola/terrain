import { latDistance, lngDistance } from '../utilities';
import LatLng from '../LatLng'

// eslint-disable-next-line import/prefer-default-export
export const getStartOffset = (latLng: LatLng): {
  startLatOffset: number,
  startLngOffset: number,
} => {
  const center = { lat: 40, lng: -105 };
  let startLatOffset = latDistance(latLng.lat, center.lat);

  if (latLng.lat < center.lat) {
    startLatOffset = -startLatOffset;
  }

  let startLngOffset = lngDistance(latLng.lng, center.lng);

  if (latLng.lng < center.lng) {
    startLngOffset = -startLngOffset;
  }

  return {
    startLatOffset,
    startLngOffset,
  };
};
