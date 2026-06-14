/**
 * Geocodes a UK postcode prefix using api.postcodes.io (free, no API key).
 * Returns [latitude, longitude] or null if not found.
 */
export async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  const cleaned = postcode.trim().replace(/\s+/g, '').toUpperCase();
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}/autocomplete`);
    if (!res.ok) return null;
    const json = (await res.json()) as { status: number; result: string[] | null };
    const candidates = json.result;
    if (!candidates?.length) return null;

    // Use the first full postcode result to get a centroid
    const lookup = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(candidates[0])}`);
    if (!lookup.ok) return null;
    const detail = (await lookup.json()) as { status: number; result: { latitude: number; longitude: number } | null };
    if (!detail.result) return null;
    return { lat: detail.result.latitude, lng: detail.result.longitude };
  } catch {
    return null;
  }
}
