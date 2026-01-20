let regionsLayer;

function loadRegions() {
  fetch("data/ukraine-regions.json")
    .then(res => res.json())
    .then(data => {
      regionsLayer = L.geoJSON(data, {
        style: {
          color: "#3b82f6",
          weight: 1,
          fillOpacity: 0.15
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup("Область: " + feature.properties.name);
        }
      }).addTo(map);
    });
}
