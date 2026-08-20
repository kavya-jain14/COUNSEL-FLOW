export interface Coords {
  lat: number
  lon: number
}

export const CITY_COORDS: Record<string, Coords> = {
  Agra: { lat: 27.1767, lon: 78.0081 },
  Aligarh: { lat: 27.8974, lon: 78.088 },
  Banda: { lat: 25.4759, lon: 80.335 },
  Bareilly: { lat: 28.367, lon: 79.4304 },
  Ghaziabad: { lat: 28.6692, lon: 77.4538 },
  Gorakhpur: { lat: 26.7606, lon: 83.3732 },
  Jhansi: { lat: 25.4484, lon: 78.5685 },
  Kanpur: { lat: 26.4499, lon: 80.3319 },
  Lucknow: { lat: 26.8467, lon: 80.9462 },
  Meerut: { lat: 28.9845, lon: 77.7064 },
  Moradabad: { lat: 28.8386, lon: 78.7733 },
  Noida: { lat: 28.5355, lon: 77.391 },
  Prayagraj: { lat: 25.4358, lon: 81.8463 },
  Varanasi: { lat: 25.3176, lon: 82.9739 },
}

export const HOME_CITIES = Object.keys(CITY_COORDS).sort()

export const DISTANCE_METHOD = 'straight-line distance between city centres'

export const DISTANCE_METHOD_NOTE =
  'Straight-line distance between city centres. Road travel is typically 20-30% longer.'

const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function haversineKm(from: Coords, to: Coords): number {
  const dLat = toRadians(to.lat - from.lat)
  const dLon = toRadians(to.lon - from.lon)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

export function distanceBetweenCities(
  homeCity: string | null,
  collegeCity: string,
): number | null {
  if (!homeCity) return null
  const from = CITY_COORDS[homeCity]
  const to = CITY_COORDS[collegeCity]
  if (!from || !to) return null
  return Math.round(haversineKm(from, to))
}
