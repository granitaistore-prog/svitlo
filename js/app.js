if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

document.addEventListener("DOMContentLoaded", () => {
  window.map = L.map("map").setView([48.3794, 31.1656], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
  }).addTo(window.map);

  // Тепер карта точно існує
  loadRegions();

  setInterval(loadRegions, 120000);
});
