async function loadRegions() {
  console.log("LOAD REGIONS");

  const outageData = await loadOutageData();
  console.log("OUTAGE DATA:", outageData);

  const res = await fetch("data/ukraine-regions.json");
  const geo = await res.json();

  if (window.regionsLayer) {
    map.removeLayer(window.regionsLayer);
  }

  window.regionsLayer = L.geoJSON(geo, {
    style: feature => {
      if (feature.properties.shapeISO === "UA-18") {
        return {
          color: "#000",
          weight: 2,
          fillColor: "#ff0000",
          fillOpacity: 0.8
        };
      }

      return {
        color: "#000",
        weight: 1,
        fillColor: "#cccccc",
        fillOpacity: 0.2
      };
    }
  }).addTo(map);
}
