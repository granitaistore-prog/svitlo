let regionsLayer;

function getColor(status) {
  if (status === "red") return "#dc2626";
  if (status === "yellow") return "#facc15";
  if (status === "green") return "#16a34a";
  return "#475569";
}

function normalizeRegionName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace("oblast", "")
    .replace("область", "")
    .trim();
}

async function loadRegions() {
  const outageData = await loadOutageData();
  const res = await fetch("data/ukraine-regions.json");
  const geo = await res.json();

  if (regionsLayer) map.removeLayer(regionsLayer);

  regionsLayer = L.geoJSON(geo, {
    style: feature => {
      const rawName = feature.properties.shapeName;
      const regionKey = normalizeRegionName(rawName);

      let statusColor = "#475569";

      if (outageData) {
        for (const key in outageData) {
          if (regionKey.includes(normalizeRegionName(key))) {
            statusColor = getColor(outageData[key].color);
          }
        }
      }

      return {
        color: "#1f2933",
        weight: 1,
        fillColor: statusColor,
        fillOpacity: 0.7
      };
    },
    onEachFeature: (feature, layer) => {
      const rawName = feature.properties.shapeName;
      const regionKey = normalizeRegionName(rawName);

      let popup = `<b>${rawName}</b><br>`;

      if (outageData) {
        for (const key in outageData) {
          if (regionKey.includes(normalizeRegionName(key))) {
            const info = outageData[key];
            popup += `Черга: ${info.queue}<br>`;
            popup += `Статус: ${info.currentStatus === "NO_POWER" ? "🔴 Немає світла" : "🟢 Світло є"}<br>`;
            popup += `Графік: ${info.schedule}`;
          }
        }
      }

      layer.bindPopup(popup);
    }
  }).addTo(map);
}
