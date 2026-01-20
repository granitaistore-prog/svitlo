if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

document.addEventListener("DOMContentLoaded", () => {
  window.map = L.map("map").setView([48.3794, 31.1656], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
  }).addTo(map);

  loadRegions();

  // автооновлення кожні 2 хв
  setInterval(() => {
    if (window.regionsLayer) map.removeLayer(regionsLayer);
    loadRegions();
  }, 120000);
});
