async function loadBaranivkaBuildings() {
  const query = `
    [out:json][timeout:25];
    area["name"="Баранівка"]["boundary"="administrative"]->.searchArea;
    (
      way["building"](area.searchArea);
      relation["building"](area.searchArea);
    );
    out geom;
  `;

  const url = "https://overpass-api.de/api/interpreter";
  const res = await fetch(url, {
    method: "POST",
    body: query,
    headers: { "Content-Type": "text/plain" }
  });

  const data = await res.json();
  return osmtogeojson(data);
}
