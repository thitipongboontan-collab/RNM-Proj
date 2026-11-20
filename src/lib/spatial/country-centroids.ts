export type CountryCentroid = {
  latitude: number;
  longitude: number;
};

/** Visual geographic centres used when country clusters are shown on the network map. */
const COUNTRY_CENTROIDS: Record<string, CountryCentroid> = {
  Australia: { latitude: -25.2744, longitude: 133.7751 },
  Austria: { latitude: 47.5162, longitude: 14.5501 },
  Bangladesh: { latitude: 23.685, longitude: 90.3563 },
  Belgium: { latitude: 50.5039, longitude: 4.4699 },
  Bolivia: { latitude: -16.2902, longitude: -63.5887 },
  Brazil: { latitude: -14.235, longitude: -51.9253 },
  Cambodia: { latitude: 12.5657, longitude: 104.991 },
  Canada: { latitude: 56.1304, longitude: -106.3468 },
  China: { latitude: 35.8617, longitude: 104.1954 },
  Colombia: { latitude: 4.5709, longitude: -74.2973 },
  "Costa Rica": { latitude: 9.7489, longitude: -83.7534 },
  Estonia: { latitude: 58.5953, longitude: 25.0136 },
  France: { latitude: 46.2276, longitude: 2.2137 },
  Germany: { latitude: 51.1657, longitude: 10.4515 },
  Greece: { latitude: 39.0742, longitude: 21.8243 },
  "Hong Kong": { latitude: 22.3193, longitude: 114.1694 },
  India: { latitude: 21.1466, longitude: 79.0888 },
  Indonesia: { latitude: -2.5489, longitude: 118.0149 },
  Iran: { latitude: 32.4279, longitude: 53.688 },
  Ireland: { latitude: 53.1424, longitude: -7.6921 },
  Israel: { latitude: 31.0461, longitude: 34.8516 },
  Italy: { latitude: 41.8719, longitude: 12.5674 },
  Jamaica: { latitude: 18.1096, longitude: -77.2975 },
  Japan: { latitude: 36.2048, longitude: 138.2529 },
  Kenya: { latitude: -0.0236, longitude: 37.9062 },
  Laos: { latitude: 19.8563, longitude: 102.4955 },
  Malaysia: { latitude: 4.2105, longitude: 101.9758 },
  Monaco: { latitude: 43.7384, longitude: 7.4246 },
  Nepal: { latitude: 28.3949, longitude: 84.124 },
  Netherlands: { latitude: 52.1326, longitude: 5.2913 },
  "New Zealand": { latitude: -40.9006, longitude: 174.886 },
  Norway: { latitude: 60.472, longitude: 8.4689 },
  Pakistan: { latitude: 30.3753, longitude: 69.3451 },
  Philippines: { latitude: 12.8797, longitude: 121.774 },
  Poland: { latitude: 51.9194, longitude: 19.1451 },
  Portugal: { latitude: 39.3999, longitude: -8.2245 },
  "Puerto Rico": { latitude: 18.2208, longitude: -66.5901 },
  Qatar: { latitude: 25.3548, longitude: 51.1839 },
  Russia: { latitude: 61.524, longitude: 105.3188 },
  "Saudi Arabia": { latitude: 23.8859, longitude: 45.0792 },
  Singapore: { latitude: 1.3521, longitude: 103.8198 },
  "South Africa": { latitude: -30.5595, longitude: 22.9375 },
  "South Korea": { latitude: 35.9078, longitude: 127.7669 },
  Spain: { latitude: 40.4637, longitude: -3.7492 },
  "Sri Lanka": { latitude: 7.8731, longitude: 80.7718 },
  Sudan: { latitude: 12.8628, longitude: 30.2176 },
  Sweden: { latitude: 60.1282, longitude: 18.6435 },
  Switzerland: { latitude: 46.8182, longitude: 8.2275 },
  Taiwan: { latitude: 23.6978, longitude: 120.9605 },
  Thailand: { latitude: 15.87, longitude: 100.9925 },
  Turkey: { latitude: 38.9637, longitude: 35.2433 },
  "United Kingdom": { latitude: 54.7024, longitude: -3.2766 },
  "United States": { latitude: 39.8283, longitude: -98.5795 },
  Vietnam: { latitude: 16.1667, longitude: 107.8333 },
};

export function getCountryCentroid(country: string): CountryCentroid | null {
  const key = country.trim();
  return COUNTRY_CENTROIDS[key] ?? null;
}

export function resolveClusterPosition(
  keyPrefix: "province" | "region" | "country",
  label: string,
  organizations: Array<{
    country: string;
    latitude: number;
    longitude: number;
    collaborationCount: number;
  }>,
): CountryCentroid {
  const weighted = weightedCentroid(organizations);
  const useCountryCenter =
    keyPrefix === "country" ||
    (keyPrefix === "province" &&
      organizations.length > 0 &&
      organizations.every((item) => item.country === label && item.country !== "Thailand"));

  if (!useCountryCenter) return weighted;
  return getCountryCentroid(label) ?? weighted;
}

function weightedCentroid(
  organizations: Array<{
    latitude: number;
    longitude: number;
    collaborationCount: number;
  }>,
): CountryCentroid {
  const totalCollaborations = organizations.reduce(
    (sum, item) => sum + item.collaborationCount,
    0,
  );
  const totalWeight = Math.max(totalCollaborations, organizations.length, 1);
  return {
    latitude:
      organizations.reduce(
        (sum, item) => sum + item.latitude * Math.max(item.collaborationCount, 1),
        0,
      ) / totalWeight,
    longitude:
      organizations.reduce(
        (sum, item) => sum + item.longitude * Math.max(item.collaborationCount, 1),
        0,
      ) / totalWeight,
  };
}
