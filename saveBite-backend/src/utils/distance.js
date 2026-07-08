const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => degrees * (Math.PI / 180);

export const getDistanceKm = (pointA, pointB) => {
  const latDistance = toRadians(pointB.latitude - pointA.latitude);
  const lonDistance = toRadians(pointB.longitude - pointA.longitude);
  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);

  const a =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDistance / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
