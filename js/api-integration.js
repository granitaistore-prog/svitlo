async function loadUserQueue() {
  const r = await fetch("https://svitlo-ye-api.granit-ai-store.workers.dev/?city=baranivka&street=petliury&house=25");
  return await r.json();
}
