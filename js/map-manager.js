let regionsLayer;

function getColor(status) {
  if (status === "red") return "#dc2626";
  if (status === "yellow") return "#facc15";
  if (status === "green") return "#16a34a";
  return "#475569";
}

async function loadRegions() {
  const outageStatus = await loadOutageData();

  fetch("data/ukraine-regions.json")
    .then(res => res.json())
    .then(data => {
      regionsLayer = L.geoJSON(data, {
        style: feature => {
          const name = feature.properties.name;
          const status = outageStatus ? outageStatus[name] : null;
          return {
            color: "#1f2933",
            weight: 1,
            fillColor: getColor(status),
            fillOpacity: 0.7
          };
        },
        onEachFeature: (feature, layer) => {
          const name = feature.properties.name;
          const status = outageStatus ? outageStatus[name] : "невідомо";

          let text = "Статус: ";
          if (status === "red") text += "🔴 Немає світла";
          else if (status === "yellow") text += "🟡 За графіком";
          else if (status === "green") text += "🟢 Світло є";
          else text += "Дані відсутні";

          layer.bindPopup(`<b>${name}</b><br>${text}`);
        }
      }).addTo(map);
    });
}
