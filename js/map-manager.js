let regionsLayer;

function getColorByStatus(status) {
  if (status === "NO_POWER") return "#dc2626";   // 🔴
  if (status === "SCHEDULE") return "#facc15";  // 🟡
  if (status === "POWER_ON") return "#16a34a";  // 🟢
  return "#999999";
}

async function loadRegions() {
  const outageData = await loadOutageData();

  // Дані по твоїй адресі з YASNO
  const userResp = await fetch("https://svitlo-ye-api.granit-ai-store.workers.dev/?city=baranivka&street=petliury&house=25");
  const user = await userResp.json();

  const res = await fetch("data/ukraine-regions.json");
  const geo = await res.json();

  if (regionsLayer) map.removeLayer(regionsLayer);

  regionsLayer = L.geoJSON(geo, {
    style: feature => {
      const iso = feature.properties.shapeISO;
      const info = outageData[iso];

      return {
        color: "#000",
        weight: 1,
        fillColor: info ? getColorByStatus(info.status) : "#999",
        fillOpacity: 0.75
      };
    },
    onEachFeature: (feature, layer) => {
      const iso = feature.properties.shapeISO;
      const info = outageData[iso];

      if (iso === "UA-18") {
        layer.bindPopup(`
          <b>Житомирська область</b><br>
          📍 Твоя адреса: Баранівка, Симона Петлюри 25<br>
          🔢 Черга: ${user.queue}<br>
          ⚡ Статус: ${user.currentStatus === "NO_POWER" ? "🔴 Немає світла" : "🟢 Світло є"}<br>
          ⏱ Зараз: ${user.nowInterval || "—"}<br>
          ➡ Далі: ${user.nextInterval}
        `);
      } else if (info) {
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
  })
    if (iso === "UA-32") {
  fetch("https://svitlo-ye-api.granit-ai-store.workers.dev/?region=UA-32&city=brovary&street=kyivska&house=10")
    .then(r => r.json())
    .then(user => {
      layer.bindPopup(`
        <b>Київська область</b><br>
        📍 Адреса: Бровари, вул. Київська 10<br>
        🔢 Черга: ${user.queue}<br>
        ⚡ Статус: ${user.currentStatus === "NO_POWER" ? "🔴 Немає світла" : "🟢 Світло є"}<br>
        ⏱ Зараз: ${user.nowInterval || "—"}<br>
        ➡ Далі: ${user.nextInterval}
      `);
    });
}

}
