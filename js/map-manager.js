let regionsLayer;

async function loadRegions() {
  const res = await fetch("data/ukraine-regions.json");
  const geo = await res.json();

  if (regionsLayer) map.removeLayer(regionsLayer);

  regionsLayer = L.geoJSON(geo, {
    style: feature => {
      if (feature.properties.shapeISO === "UA-18") {
        return {
          color: "#000",
          weight: 1,
          fillColor: "#dc2626",
          fillOpacity: 0.8
        };
      }

      return {
        color: "#000",
        weight: 1,
        fillColor: "#444",
        fillOpacity: 0.3
      };
    },
    onEachFeature: (feature, layer) => {
      if (feature.properties.shapeISO === "UA-18") {
        layer.bindPopup("Житомирська область (тест фарбування)");
      }
    }
  }).addTo(map);
}
