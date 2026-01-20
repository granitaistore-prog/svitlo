let regionsLayer;

function getColor(status) {
  if (status === "red") return "#dc2626";
  if (status === "green") return "#16a34a";
  if (status === "yellow") return "#facc15";
  return "#475569";
}

async function loadRegions() {
  const outageData = await loadOutageData();
  const res = await fetch("data/ukraine-regions.json");
  const geo = await res.json();

  if (regionsLayer) map.removeLayer(regionsLayer);

  regionsLayer = L.geoJSON(geo, {
    style: feature => {
      const iso = feature.properties.shapeISO;
      let fill = "#475569";

      if (outageData && outageData[iso]) {
        fill = getColor(outageData[iso].color);
      }

      return {
        color: "#000",
        weight: 1,
        fillColor: fill,
        fillOpacity: 0.75
      };
    },
    onEachFeature: (feature, layer) => {
      const iso = feature.properties.shapeISO;

      if (outageData && outageData[iso]) {
        const info = outageData[iso];
        layer.bindPopup(`
          <b>Житомирська область</b><br>
          Черга: ${info.queue}<br>
          Статус: ${info.currentStatus === "NO_POWER" ? "🔴 Немає світла" : "🟢 Світло є"}<br>
          Графік: ${info.schedule}
        `);
      }
    }
  }).addTo(map);
}
