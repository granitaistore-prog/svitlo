const API_URL = "https://svitlo-ye-api.yourname.workers.dev";

async function loadOutageData() {
  try {
    const response = await fetch(
      `${API_URL}?region=zhytomyr&city=baranivka&street=petliury&house=25`
    );
    const data = await response.json();

    return {
      "Житомирська": data.currentStatus === "NO_POWER" ? "red" :
                     data.currentStatus === "SCHEDULE" ? "yellow" : "green"
    };
  } catch (e) {
    console.error("Помилка API:", e);
    return null;
  }
}
