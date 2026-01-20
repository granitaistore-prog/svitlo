let regionsLayer;

function getColorByStatus(status) {
  if (status === "NO_POWER") return "#dc2626";   // 🔴
  if (status === "SCHEDULE") return "#facc15";  // 🟡
  if (status === "POWER_ON") return "#16a34a";  // 🟢
  return "#999999";
}

function loadRegions() {
  loadOutageData().then(outageData => {
    fetch("data/ukraine-regions.json")
      .then(r => r.json())
      .then(geo => {
        if (regionsLayer) map.removeLayer(regionsLayer);

        regionsLayer = L.geoJSON(geo, {
          style: feature => {
            const iso = feature.properties.shapeISO;
            const info = outageData[iso];

            return {
              color: "#000",
              weight: 1,
              fillColor: info ? getColorByStatus(info.status) : "#999999",
              fillOpacity: 0.7
            };
          },
          onEachFeature: (feature, layer) => {
            const iso = feature.properties.shapeISO;
            const info = outageData[iso];
            if (info) {
              layer.bindPopup(`
                <b>${info.region}</b><br>
                Статус: ${
                  info.status === "NO_POWER" ? "🔴 Немає світла" :
                  info.status === "SCHEDULE" ? "🟡 За графіком" :
                  "🟢 Світло є"
                }
              `);
            }
          }
        }).addTo(map);
      });
  });
}
