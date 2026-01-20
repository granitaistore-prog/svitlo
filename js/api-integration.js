async function loadOutageData() {
  const r = await fetch("https://svitlo-ye-api.granit-ai-store.workers.dev/?region=zhytomyr&city=Баранівка&street=Симона%20Петлюри&house=25");
  const d = await r.json();

  return {
    "Zhytomyr": {
      color: d.currentStatus === "NO_POWER" ? "red" : "green",
      queue: d.queue,
      schedule: d.schedule,
      currentStatus: d.currentStatus
    }
  };
}
