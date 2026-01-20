function loadRegions() {
  const testGeoJSON = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": { "name": "TEST" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[30,50],[32,50],[32,49],[30,49],[30,50]]]
        }
      }
    ]
  };

  if (window.testLayer) {
    map.removeLayer(window.testLayer);
  }

  window.testLayer = L.geoJSON(testGeoJSON, {
    style: {
      color: "#000",
      fillColor: "#dc2626",
      fillOpacity: 0.7
    }
  }).addTo(map);
}
