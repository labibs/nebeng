export const parseLocation = (location) => {
  if (!location) return null;

  const [lat, lng, ...rest] = location.split(",");
  return {
    lat: Number(lat),
    lng: Number(lng),
    address: rest.join(",").trim(),
  };
};
