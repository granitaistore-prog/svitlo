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
      const iso = feature.properties.shapeISO; // UA-18 = Житомирська
      let color = "#475569";

      if (iso === "UA-18" && outageData && outageData.Zhytomyr) {
        color = getColor(outageData.Zhytomyr.color);
      }

      return {
        color: "#000",
        weight: 1,
        fillColor: color,
        fillOpacity: 0.7
      };
    },
    onEachFeature: (feature, layer) => {
      const iso = feature.properties.shapeISO;
      if (iso === "UA-18" && outageData && outageData.Zhytomyr) {
        const info = outageData.Zhytomyr;
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
