/**
 * Utility functions for Nominatim search & distance calculations.
 */

// User-Agent identifier per Nominatim usage policy
export const NOMINATIM_USER_AGENT = 'LocalConnect-PBL-Demo/1.0 (mohalla-connect-student-project)';

/**
 * Searches locations using Nominatim OpenStreetMap API scoped to India.
 * @param {string} query 
 * @returns {Promise<Array>}
 */
export async function searchNominatim(query) {
  if (!query || query.trim().length < 3) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&format=json&countrycodes=in&limit=5&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': NOMINATIM_USER_AGENT,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Calculates distance in kilometers between two lat/lng coordinates
 * using the Haversine formula.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10; // Round to 1 decimal place (e.g. 2.3)
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}
