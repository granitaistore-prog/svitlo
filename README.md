svitlo-ye/
│
├── index.html                    # Головна сторінка додатку
├── manifest.json                 # Конфігурація PWA
├── service-worker.js             # Service Worker для офлайн роботи
├── robots.txt                    # Для пошукових систем
├── README.md                     # Документація проєкту
│
├── css/
│   ├── style.css                 # Основні стилі
│   ├── dark-theme.css            # Темна тема
│   └── light-theme.css           # Світла тема
│
├── js/
│   ├── app.js                    # Основний файл логіки
│   ├── api-integration.js        # Інтеграція з API
│   ├── map-manager.js            # Управління картою
│   ├── offline-manager.js        # Офлайн функціонал
│   ├── pwa-install.js            # PWA встановлення
│   ├── geolocation.js            # Геолокація
│   ├── search.js                 # Пошук населених пунктів
│   └── notifications.js          # Сповіщення
│
├── data/
│   ├── ukraine-regions.json      # Геодані регіонів України
│   ├── cities-coordinates.json   # Координати міст
│   ├── outages-data.json         # Тимчасові дані про відключення
│   └── schedule-templates.json   # Шаблони графіків відключень
│
├── icons/                        # Іконки для PWA
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   ├── maskable-icon.png
│   └── favicon.ico
│
├── images/                       # Зображення
│   ├── logo.svg                  # Логотип
│   ├── screenshot-desktop.png    # Скріншот для PWA
│   ├── screenshot-mobile.png
│   └── markers/                  # Маркери для карти
│       ├── red-marker.png
│       ├── yellow-marker.png
│       ├── green-marker.png
│       └── blue-marker.png
│
├── api/                          # Серверна частина (якщо потрібно)
│   ├── server.js                 # Node.js сервер
│   ├── package.json
│   ├── routes/
│   │   ├── outages.js            # Маршрути для даних
│   │   ├── regions.js            # Геодані регіонів
│   │   └── statistics.js         # Статистика
│   ├── controllers/
│   │   ├── ukrenergo.js          # Парсинг Укренерго
│   │   ├── dtek.js               # Парсинг ДТЕК
│   │   └── yasno.js              # Парсинг Yasno
│   └── database/
│       ├── models/
│       │   ├── Outage.js         # Модель даних
│       │   └── Region.js         # Модель регіону
│       └── migrations/           # Міграції БД
│
└── docs/                         # Документація
    ├── api-documentation.md      # Документація API
    ├── deployment-guide.md       # Інструкція розгортання
    └── user-manual.md            # Користувацька інструкція



# 💡 Світло Є

PWA-додаток для перегляду відключень електроенергії по Україні в реальному часі.

## Можливості
- Інтерактивна карта України (Leaflet)
- Працює офлайн
- Встановлюється як додаток на Android
- Темна тема
- Автооновлення кожні 2 хв (буде додано)

## Запуск
Відкрити:  
https://granitaistore-prog.github.io/svitlo/

## Статус
Етап 1: Базова карта + PWA готові.
