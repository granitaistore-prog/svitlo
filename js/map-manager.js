let regionsLayer;

function getColor(status) {
  if (status === "red") return "#dc2626";
  if (status === "yellow") return "#facc15";
  if (status === "green") return "#16a34a";
  return "#475569";
}

async function loadRegions() {
  const outageData = await loadOutageData();

  const res = await fetch("data/ukraine-regions.json");
  const geo = await res.json();

  if (regionsLayer) map.removeLayer(regionsLayer);

  regionsLayer = L.geoJSON(geo, {
    style: feature => {
      const name = feature.properties.name;
      const info = outageData && outageData[name];
      const color = info ? getColor(info.color) : "#475569";

      return {
        color: "#1f2933",
        weight: 1,
        fillColor: color,
        fillOpacity: 0.7
      };
    },
    onEachFeature: (feature, layer) => {
      const name = feature.properties.name;
      const info = outageData && outageData[name];

      let popup = `<b>${name}</b><br>`;
      if (info) {
        popup += `Черга: ${info.queue}<br>`;
        popup += `Статус: ${info.currentStatus === "NO_POWER" ? "🔴 Немає світла" : "🟢 Світло є"}<br>`;
        popup += `Графік: ${info.schedule}`;
      } else {
        popup += "Дані відсутні";
      }

      layer.bindPopup(popup);
    }
  }).addTo(map);
}
