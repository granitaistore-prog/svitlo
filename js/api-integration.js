async function loadOutageData() {
  const r = await fetch("https://svitlo-ye-api.granit-ai-store.workers.dev/?city=Баранівка&street=Симона%20Петлюри&house=25");
  const d = await r.json();

  return {
    "UA-18": {
      color: d.currentStatus === "NO_POWER" ? "red" : "green",
      queue: d.queue,
      schedule: d.schedule,
      currentStatus: d.currentStatus
    }
  };
}
