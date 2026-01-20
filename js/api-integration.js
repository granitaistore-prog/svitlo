async function loadOutageData() {
  const r = await fetch("https://svitlo-ye-api.granit-ai-store.workers.dev/");
  return await r.json(); // { "UA-01": {...}, "UA-02": {...} }
}
