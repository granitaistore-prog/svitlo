async function loadOutageData() {
  const r = await fetch("https://svitlo-ye-api.granit-ai-store.workers.dev/");
  const data = await r.json();
  return data; // { "UA-18": {status, region}, ... }
}
