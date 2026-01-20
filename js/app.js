if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

document.getElementById("status").innerText = "Карта України завантажується...";

const map = L.map("map").setView([48.3794, 31.1656], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "© OpenStreetMap"
}).addTo(map);

document.getElementById("status").innerText = "Початкові дані: карта готова";
