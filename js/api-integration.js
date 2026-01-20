async function loadOutageData() {
  const r = await fetch("data/status.json");
  return await r.json();
}
