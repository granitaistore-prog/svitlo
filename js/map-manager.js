function loadRegions() {
  fetch("data/ukraine-regions.json")
    .then(r => r.json())
    .then(geo => {
      if (window.regionsLayer) {
        map.removeLayer(window.regionsLayer);
      }

      window.regionsLayer = L.geoJSON(geo, {
        style: feature => {
          // Жорстко: тільки по ISO коду
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
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties.shapeISO === "UA-18") {
            layer.bindPopup("Житомирська область (тест фарбування по ISO)");
          }
        }
      }).addTo(map);
    })
    .catch(err => {
      console.error("GEOJSON LOAD ERROR:", err);
    });
}
