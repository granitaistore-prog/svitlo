// Дані по всій Україні (поки з локального JSON)
async function loadOutageData() {
  const r = await fetch("data/status.json");
  return await r.json();
}

// Дані по твоїй адресі (YASNO)
async function loadUserQueue() {
  const r = await fetch("https://svitlo-ye-api.granit-ai-store.workers.dev/?city=baranivka&street=petliury&house=25");
  return await r.json();
}
