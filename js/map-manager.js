function loadRegions() {
  fetch("data/ukraine-regions.json")
    .then(r => r.json())
    .then(geo => {
      if (window.regionsLayer) map.removeLayer(window.regionsLayer);

      window.regionsLayer = L.geoJSON(geo, {
        style: feature => {
          return {
            color: "#000",
            weight: 1,
            fillColor: "#facc15", // жовтий
            fillOpacity: 0.7
          };
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(feature.properties.shapeName + " (" + feature.properties.shapeISO + ")");
        }
      }).addTo(map);
    });
}
