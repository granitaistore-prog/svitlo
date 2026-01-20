function loadRegions() {
  fetch("data/ukraine-regions.json")
    .then(res => res.json())
    .then(data => {
      L.geoJSON(data, {
        style: {
          color: "#2563eb",
          weight: 1,
          fillOpacity: 0.25
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(feature.properties.name);
        }
      }).addTo(map);
    });
}
