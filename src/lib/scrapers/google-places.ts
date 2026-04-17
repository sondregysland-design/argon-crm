export interface PlaceDetails {
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
}

/** Returns true if the Google Places result name is a plausible match for the company name. */
function isNameMatch(searchedName: string, resultName: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/\b(as|asa|ans|da|ba|sa|norge|norway|norsk)\b/g, "")
      .replace(/[^a-zæøå0-9]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const a = normalize(searchedName);
  const b = normalize(resultName);

  if (!a || !b) return false;

  // Accept if either normalized name contains the other
  if (a.includes(b) || b.includes(a)) return true;

  // Accept if they share at least one significant word (3+ chars)
  const wordsA = new Set(a.split(" ").filter((w) => w.length >= 3));
  const wordsB = b.split(" ").filter((w) => w.length >= 3);
  return wordsB.some((w) => wordsA.has(w));
}

export async function searchPlace(name: string, city: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const query = `${name} ${city} Norge`;
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "no");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Text Search error: ${res.status}`);

  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;

  const topResult = data.results[0];
  if (!isNameMatch(name, topResult.name ?? "")) return null;

  return topResult.place_id ?? null;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "rating,user_ratings_total,formatted_phone_number,website");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "no");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Place Details error: ${res.status}`);

  const data = await res.json();
  if (data.status !== "OK" || !data.result) return null;

  return {
    rating: data.result.rating ?? null,
    reviewCount: data.result.user_ratings_total ?? null,
    phone: data.result.formatted_phone_number ?? null,
    website: data.result.website ?? null,
  };
}
