const API_URL = "https://svitlo-ye-api.granit-ai-store.workers.dev/";

async function loadOutageData() {
  try {
    const r = await fetch(`${API_URL}?region=zhytomyr&city=Баранівка&street=Симона%20Петлюри&house=25`);
    const d = await r.json();

    const status =
      d.currentStatus === "NO_POWER" ? "red" :
      d.currentStatus === "POWER_ON" ? "green" : "yellow";

    return {
      "Житомирська": {
        color: status,
        queue: d.queue,
        schedule: d.schedule,
        currentStatus: d.currentStatus
      }
    };
  } catch (e) {
    console.error("API error", e);
    return null;
  }
}
