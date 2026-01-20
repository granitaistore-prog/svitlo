async function loadOutageData() {
  const r = await fetch("https://svitlo-ye-api.granit-ai-store.workers.dev/?city=Баранівка&street=Симона%20Петлюри&house=25");
  const d = await r.json();

  return d; // ключ = ISO області, значення = статус
}
