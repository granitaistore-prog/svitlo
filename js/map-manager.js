let regionsLayer;

function loadRegions() {
  const testGeoJSON = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": { "name": "Test" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[30,50],[32,50],[32,49],[30,49],[30,50]]]
        }
      }
    ]
  };

  regionsLayer = L.geoJSON(testGeoJSON, {
    style: {
      color: "#000",
      fillColor: "#dc2626",
      fillOpacity: 0.7
    }
  }).addTo(map);
}
