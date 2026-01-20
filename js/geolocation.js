navigator.geolocation.getCurrentPosition(pos => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  const marker = L.marker([lat, lon]).addTo(map)
    .bindPopup("Ти тут")
    .openPopup();

  map.setView([lat, lon], 10);
});
