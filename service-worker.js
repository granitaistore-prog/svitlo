// Service Worker для PWA додатку "Світло Є"

const CACHE_NAME = 'svitlo-ye-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/data/ukraine-regions.json',
    '/data/outages-data.json'
];

// Встановлення Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кешування ресурсів...');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Активація Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Видалення старого кешу:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Обробка запитів
self.addEventListener('fetch', event => {
    // Пропускаємо запити до API
    if (event.request.url.includes('/api/')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Повертаємо кешовану версію, якщо вона є
                if (response) {
                    return response;
                }
                
                // Інакше робимо запит до мережі
                return fetch(event.request)
                    .then(response => {
                        // Перевірка, чи отримали ми дійсну відповідь
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Клонуємо відповідь
                        const responseToCache = response.clone();
                        
                        // Кешуємо новий ресурс
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Фолбек для сторінок
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Оновлення даних у фоновому режимі
self.addEventListener('sync', event => {
    if (event.tag === 'update-outages') {
        event.waitUntil(updateOutagesData());
    }
});

// Фонова синхронізація даних
async function updateOutagesData() {
    try {
        const response = await fetch('https://api.svitlo-ye.com/outages');
        const data = await response.json();
        
        // Зберігаємо дані в кеш
        const cache = await caches.open(CACHE_NAME);
        await cache.put(
            new Request('/data/outages-data.json'),
            new Response(JSON.stringify(data))
        );
        
        // Повідомляємо клієнтам про оновлення
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'DATA_UPDATED',
                    data: data
                });
            });
        });
    } catch (error) {
        console.error('Помилка фонового оновлення:', error);
    }
}
