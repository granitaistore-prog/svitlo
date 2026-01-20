function searchCity(name) {
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${name}, Ukraine`)
    .then(r => r.json())
    .then(data => {
      if (data.length > 0) {
        const lat = data[0].lat;
        const lon = data[0].lon;
        map.setView([lat, lon], 11);
      }
    });
}
