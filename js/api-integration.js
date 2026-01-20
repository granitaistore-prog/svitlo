const API = {
  ukrenergo: "https://power-api.ukrenergo.ua/v1/regions" // проксі пізніше винесемо на сервер
};

async function loadOutageData() {
  try {
    const response = await fetch(API.ukrenergo);
    const data = await response.json();

    /*
      Формат нормалізуємо до:
      {
        "Київська": "green",
        "Львівська": "yellow",
        "Донецька": "red"
      }
    */

    const normalized = {};

    data.forEach(region => {
      if (region.status === "NO_POWER") normalized[region.name] = "red";
      else if (region.status === "SCHEDULE") normalized[region.name] = "yellow";
      else normalized[region.name] = "green";
    });

    return normalized;
  } catch (e) {
    console.error("Помилка отримання даних:", e);
    return null;
  }
}
