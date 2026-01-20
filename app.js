// Головний файл JavaScript для додатку "Світло Є"

// Конфігурація
const CONFIG = {
    UPDATE_INTERVAL: 2 * 60 * 1000, // 2 хвилини
    API_ENDPOINTS: {
        UKRENERGO: 'https://ua.energy/api/outages/',
        OBLENERGO: 'https://api.oblenergo.com.ua/outages'
    },
    FALLBACK_DATA: 'data/outages-data.json'
};

// Глобальні змінні
let map;
let regionsLayer;
let userLocation = null;
let outagesData = {};
let updateTimer;
let isOnline = navigator.onLine;

// Ініціалізація карти Leaflet
function initMap() {
    // Центрування на Україні
    const ukraineCenter = [48.3794, 31.1656];
    
    // Створення карти
    map = L.map('map', {
        center: ukraineCenter,
        zoom: 6,
        zoomControl: false,
        attributionControl: false
    });

    // Додавання плиток карти (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Додавання контролів масштабу
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Ініціалізація шару регіонів
    regionsLayer = L.layerGroup().addTo(map);
    
    // Завантаження геоданих України
    loadUkraineRegions();
    
    // Завантаження даних про відключення
    loadOutagesData();
}

// Завантаження геоданих регіонів України
async function loadUkraineRegions() {
    try {
        const response = await fetch('data/ukraine-regions.json');
        const regions = await response.json();
        renderRegionsOnMap(regions);
    } catch (error) {
        console.error('Помилка завантаження геоданих:', error);
        // Використання фолбек-даних
        const fallbackRegions = await fetchFallbackRegions();
        renderRegionsOnMap(fallbackRegions);
    }
}

// Завантаження даних про відключення
async function loadOutagesData(forceUpdate = false) {
    const statusIndicator = document.getElementById('globalStatus');
    const statusText = statusIndicator.querySelector('.status-text');
    
    try {
        statusText.textContent = 'Оновлення даних...';
        
        // Спробувати отримати актуальні дані з API
        if (isOnline && !forceUpdate) {
            // Тут буде реальний запит до API Укренерго/Обленерго
            // Тимчасово використовуємо мок-дані
            outagesData = await fetchMockData();
        } else {
            // Використання кешованих або фолбек-даних
            outagesData = await loadCachedData();
        }
        
        // Оновлення інтерфейсу
        updateMapWithOutages();
        updateStatistics();
        updateStatusIndicator('success', 'Дані оновлено');
        
        // Оновлення часу останнього оновлення
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('Помилка завантаження даних:', error);
        updateStatusIndicator('error', 'Помилка оновлення даних');
    }
}

// Відображення регіонів на карті
function renderRegionsOnMap(regions) {
    regionsLayer.clearLayers();
    
    regions.forEach(region => {
        // Визначення кольору залежно від статусу
        const status = outagesData[region.id]?.status || 'unknown';
        const fillColor = getStatusColor(status);
        
        // Створення полігону регіону
        const polygon = L.geoJSON(region.geometry, {
            style: {
                fillColor: fillColor,
                weight: 2,
                opacity: 0.8,
                color: 'white',
                fillOpacity: 0.6
            },
            onEachFeature: (feature, layer) => {
                // Додавання інформації при кліку
                layer.on('click', () => showRegionDetails(region.id));
                
                // Додавання тултіпу
                layer.bindTooltip(region.name, {
                    permanent: false,
                    direction: 'auto',
                    className: 'region-tooltip'
                });
            }
        });
        
        polygon.addTo(regionsLayer);
    });
}

// Оновлення карти з даними про відключення
function updateMapWithOutages() {
    regionsLayer.eachLayer(layer => {
        const regionId = layer.feature?.properties?.id;
        if (regionId && outagesData[regionId]) {
            const status = outagesData[regionId].status;
            layer.setStyle({
                fillColor: getStatusColor(status)
            });
        }
    });
}

// Отримання кольору за статусом
function getStatusColor(status) {
    switch(status) {
        case 'no_power':
            return '#ef4444'; // Червоний
        case 'possible':
            return '#f59e0b'; // Жовтий
        case 'has_power':
            return '#10b981'; // Зелений
        case 'scheduled':
            return '#3b82f6'; // Синій
        default:
            return '#94a3b8'; // Сірий
    }
}

// Оновлення статистики
function updateStatistics() {
    const regions = Object.values(outagesData);
    
    const noPowerCount = regions.filter(r => r.status === 'no_power').length;
    const scheduledCount = regions.filter(r => r.status === 'scheduled').length;
    const hasPowerCount = regions.filter(r => r.status === 'has_power').length;
    const totalCount = regions.length;
    
    document.getElementById('statNoPower').textContent = noPowerCount;
    document.getElementById('statScheduled').textContent = scheduledCount;
    document.getElementById('statHasPower').textContent = hasPowerCount;
    document.getElementById('statTotal').textContent = totalCount;
}

// Показ деталей регіону
function showRegionDetails(regionId) {
    const regionData = outagesData[regionId];
    const detailsContainer = document.getElementById('regionDetails');
    
    if (!regionData) {
        detailsContainer.innerHTML = '<p class="empty-details">Інформація про цей регіон недоступна</p>';
        return;
    }
    
    const statusText = getStatusText(regionData.status);
    const statusClass = getStatusClass(regionData.status);
    
    detailsContainer.innerHTML = `
        <div class="region-details">
            <h3>${regionData.name}</h3>
            <div class="status ${statusClass}">${statusText}</div>
            <div class="detail-item">
                <span class="detail-label">Черга відключень:</span>
                <span class="detail-value">${regionData.schedule || 'Не визначено'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Останнє оновлення:</span>
                <span class="detail-value">${formatTime(regionData.lastUpdate)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Населені пункти:</span>
                <span class="detail-value">${regionData.cities?.join(', ') || 'Немає інформації'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Коментар:</span>
                <span class="detail-value">${regionData.comment || 'Немає коментаря'}</span>
            </div>
        </div>
    `;
}

// Отримання тексту статусу
function getStatusText(status) {
    switch(status) {
        case 'no_power': return 'Немає світла 🔴';
        case 'possible': return 'Можливі відключення 🟡';
        case 'has_power': return 'Є світло 🟢';
        case 'scheduled': return 'За графіком 📅';
        default: return 'Невідомий статус';
    }
}

// Отримання CSS класу статусу
function getStatusClass(status) {
    switch(status) {
        case 'no_power': return 'status-red';
        case 'possible': return 'status-yellow';
        case 'has_power': return 'status-green';
        case 'scheduled': return 'status-blue';
        default: return '';
    }
}

// Форматування часу
function formatTime(timestamp) {
    if (!timestamp) return 'Невідомо';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('uk-UA');
}

// Оновлення індикатора статусу
function updateStatusIndicator(type, message) {
    const statusIndicator = document.getElementById('globalStatus');
    const statusDot = statusIndicator.querySelector('.status-dot');
    const statusText = statusIndicator.querySelector('.status-text');
    
    statusText.textContent = message;
    
    switch(type) {
        case 'success':
            statusDot.style.backgroundColor = '#10b981';
            statusDot.style.animation = 'none';
            break;
        case 'error':
            statusDot.style.backgroundColor = '#ef4444';
            statusDot.style.animation = 'pulse 1s infinite';
            break;
        case 'loading':
            statusDot.style.backgroundColor = '#3b82f6';
            statusDot.style.animation = 'pulse 2s infinite';
            break;
    }
}

// Оновлення часу останнього оновлення
function updateLastUpdateTime() {
    const lastUpdateElement = document.getElementById('lastUpdate');
    const now = new Date();
    const timeString = now.toLocaleTimeString('uk-UA');
    lastUpdateElement.textContent = `Оновлено: ${timeString}`;
    
    // Оновлення таймера наступного оновлення
    updateNextUpdateTimer();
}

// Оновлення таймера наступного оновлення
function updateNextUpdateTimer() {
    const nextUpdateElement = document.getElementById('nextUpdate');
    const now = new Date();
    const nextUpdate = new Date(now.getTime() + CONFIG.UPDATE_INTERVAL);
    const timeString = nextUpdate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    nextUpdateElement.textContent = timeString;
}

// Визначення геолокації користувача
function getUserLocation() {
    if (!navigator.geolocation) {
        updateUserLocationStatus(false, 'Геолокація не підтримується вашим браузером');
        return;
    }
    
    updateStatusIndicator('loading', 'Визначення вашого місцезнаходження...');
    
    navigator.geolocation.getCurrentPosition(
        position => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Центрування карти на користувача
            map.setView([userLocation.lat, userLocation.lng], 10);
            
            // Визначення регіону за координатами
            determineUserRegion();
        },
        error => {
            console.error('Помилка геолокації:', error);
            updateUserLocationStatus(false, 'Не вдалося визначити ваше місцезнаходження');
        }
    );
}

// Визначення регіону користувача за координатами
async function determineUserRegion() {
    // Тут буде реалізована логіка визначення регіону за координатами
    // Тимчасово використовуємо фіктивні дані
    
    const mockRegion = {
        name: 'Київ',
        status: 'has_power',
        schedule: '1 черга'
    };
    
    updateUserLocationStatus(true, mockRegion);
}

// Оновлення статусу локації користувача
function updateUserLocationStatus(success, data) {
    const statusBadge = document.getElementById('userRegionStatus');
    const locationInfo = document.getElementById('userLocationInfo');
    
    if (success) {
        const statusClass = getStatusClass(data.status);
        const statusText = getStatusText(data.status);
        
        statusBadge.textContent = statusText;
        statusBadge.className = `status-badge ${statusClass}`;
        
        locationInfo.innerHTML = `
            <strong>${data.name}</strong><br>
            Черга відключень: ${data.schedule}<br>
            Статус: ${statusText}
        `;
    } else {
        statusBadge.textContent = 'Невідомо';
        statusBadge.className = 'status-badge';
        locationInfo.textContent = data;
    }
}

// Пошук населеного пункту
function searchLocation(query) {
    if (!query.trim()) return;
    
    // Тут буде реалізована логіка пошуку
    // Тимчасово використовуємо фіктивні дані
    
    const mockResult = {
        name: query,
        coordinates: [50.4501, 30.5234], // Координати Києва
        region: 'Київ'
    };
    
    map.setView(mockResult.coordinates, 12);
    
    L.popup()
        .setLatLng(mockResult.coordinates)
        .setContent(`<b>${mockResult.name}</b><br>Регіон: ${mockResult.region}`)
        .openOn(map);
}

// Завантаження мок-даних (тимчасово)
async function fetchMockData() {
    // Тут будуть реальні дані з API
    // Тимчасово використовуємо мок-дані
    
    return {
        'kyiv': {
            id: 'kyiv',
            name: 'Київ та область',
            status: 'has_power',
            schedule: '1 черга',
            lastUpdate: new Date().toISOString(),
            cities: ['Київ', 'Бровари', 'Ірпінь', 'Буча'],
            comment: 'Стабільне електропостачання'
        },
        'lviv': {
            id: 'lviv',
            name: 'Львівська область',
            status: 'scheduled',
            schedule: '2 черга',
            lastUpdate: new Date().toISOString(),
            cities: ['Львів', 'Дрогобич', 'Червоноград'],
            comment: 'Відключення за графіком з 10:00 до 14:00'
        },
        'kharkiv': {
            id: 'kharkiv',
            name: 'Харківська область',
            status: 'no_power',
            schedule: '3 черга',
            lastUpdate: new Date().toISOString(),
            cities: ['Харків', 'Ізюм', 'Чугуїв'],
            comment: 'Аварійні відключення через бойові дії'
        },
        // Додайте інші області...
    };
}

async function fetchFallbackRegions() {
    // Базові геодані для України (спрощені)
    return [
        {
            id: 'kyiv',
            name: 'Київ та область',
            geometry: {
                type: 'Polygon',
                coordinates: [[...]] // Координати регіону
            }
        }
        // ... інші регіони
    ];
}

async function loadCachedData() {
    // Спроба завантажити дані з локального сховища
    const cachedData = localStorage.getItem('outagesData');
    if (cachedData) {
        return JSON.parse(cachedData);
    }
    
    // Завантаження фолбек-даних
    const response = await fetch(CONFIG.FALLBACK_DATA);
    return await response.json();
}

// Ініціалізація додатку
document.addEventListener('DOMContentLoaded', () => {
    // Ініціалізація карти
    initMap();
    
    // Встановлення обробників подій
    setupEventListeners();
    
    // Запуск автооновлення
    startAutoUpdate();
    
    // Спробувати визначити місцезнаходження користувача
    setTimeout(() => getUserLocation(), 1000);
});

// Налаштування обробників подій
function setupEventListeners() {
    // Кнопка геолокації
    document.getElementById('locationBtn').addEventListener('click', getUserLocation);
    
    // Кнопка оновлення
    document.getElementById('refreshBtn').addEventListener('click', () => loadOutagesData(true));
    
    // Кнопка примусового оновлення
    document.getElementById('forceUpdate').addEventListener('click', () => loadOutagesData(true));
    
    // Пошук
    document.getElementById('searchBtn').addEventListener('click', () => {
        const query = document.getElementById('searchInput').value;
        searchLocation(query);
    });
    
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = document.getElementById('searchInput').value;
            searchLocation(query);
        }
    });
    
    // Фільтри
    document.getElementById('regionFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    
    // Перемикач теми
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Контроли масштабу
    document.getElementById('zoomIn').addEventListener('click', () => map.zoomIn());
    document.getElementById('zoomOut').addEventListener('click', () => map.zoomOut());
    
    // Відстеження онлайн/офлайн статусу
    window.addEventListener('online', () => {
        isOnline = true;
        updateStatusIndicator('success', 'Онлайн. Дані оновлюються');
        loadOutagesData();
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        updateStatusIndicator('warning', 'Офлайн. Використовуються кешовані дані');
    });
}

// Застосування фільтрів
function applyFilters() {
    const regionFilter = document.getElementById('regionFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    // Тут буде реалізована логіка фільтрації
    // Поки що просто оновлюємо карту
    updateMapWithOutages();
}

// Перемикання теми
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    }
}

// Запуск автооновлення
function startAutoUpdate() {
    // Очистити попередній таймер, якщо він існує
    if (updateTimer) clearInterval(updateTimer);
    
    // Запустити новий таймер
    updateTimer = setInterval(() => {
        loadOutagesData();
    }, CONFIG.UPDATE_INTERVAL);
}

// Завантаження збереженої теми
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (savedTheme === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        themeToggle.textContent = '☀️';
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        themeToggle.textContent = '🌙';
    }
}

// Виклик завантаження теми при завантаженні сторінки
loadSavedTheme();
// Додамо до існуючого app.js

// Імпортуємо API модуль (якщо використовуємо модулі)
// import { OutageAPI } from './api-integration.js';

// Або створюємо екземпляр глобально
let outageAPI;

// Оновлюємо функцію loadOutagesData
async function loadOutagesData(forceUpdate = false) {
    const statusIndicator = document.getElementById('globalStatus');
    const statusText = statusIndicator.querySelector('.status-text');
    
    try {
        statusText.textContent = 'Оновлення даних...';
        
        // Ініціалізація API
        if (!outageAPI) {
            outageAPI = new OutageAPI();
        }
        
        // Отримання даних
        if (isOnline || forceUpdate) {
            // Отримання реальних даних
            outagesData = await outageAPI.fetchAllOutages();
            
            // Перевірка здоров'я API
            const apiHealth = await outageAPI.checkAPIHealth();
            const availableAPIs = apiHealth.filter(api => api.available).length;
            
            updateStatusIndicator('success', 
                `Дані оновлено (${availableAPIs}/${apiHealth.length} API доступні)`);
        } else {
            // Офлайн режим
            outagesData = outageAPI.getCachedData() || outageAPI.getFallbackData();
            updateStatusIndicator('warning', 'Офлайн. Використовуються кешовані дані');
        }
        
        // Оновлення інтерфейсу
        updateMapWithOutages();
        updateStatistics();
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('Помилка завантаження даних:', error);
        
        // Спробувати отримати кешовані дані
        if (outageAPI) {
            outagesData = outageAPI.getCachedData() || outageAPI.getFallbackData();
            updateMapWithOutages();
            updateStatistics();
        }
        
        updateStatusIndicator('error', 'Помилка оновлення. Використовуються останні доступні дані');
    }
}

// Додаємо нову функцію для показу інформації про API
function showAPIHealthInfo() {
    if (!outageAPI) return;
    
    outageAPI.checkAPIHealth().then(healthInfo => {
        const available = healthInfo.filter(h => h.available).length;
        const total = healthInfo.length;
        
        // Можна показати спливаюче повідомлення або оновити статус
        if (available === 0) {
            console.warn('Жодне API не доступне. Використовуються кешовані дані.');
        }
    });
}

// Оновлюємо ініціалізацію
document.addEventListener('DOMContentLoaded', () => {
    // ... існуючий код ...
    
    // Ініціалізація API
    outageAPI = new OutageAPI();
    
    // Перевірка здоров'я API при запуску
    setTimeout(showAPIHealthInfo, 3000);
});
// Файл: proxy-server.js (для Node.js)
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json());

// Проксі для Укренерго
app.get('/api/ukrenergo', async (req, res) => {
    try {
        const response = await fetch('https://ua.energy/диспетчерська-інформація/');
        const html = await response.text();
        
        // Обробка HTML та повернення JSON
        const data = parseUkrenergoHTML(html);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Проксі для ДТЕК
app.get('/api/dtek', async (req, res) => {
    try {
        const response = await fetch('https://www.dtek.com.ua/api/outages');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Об'єднані дані
app.get('/api/all-outages', async (req, res) => {
    try {
        const [ukrenergo, dtek, yasno] = await Promise.all([
            fetch('https://ua.energy/диспетчерська-інформація/').then(r => r.text()),
            fetch('https://www.dtek.com.ua/api/outages').then(r => r.json()),
            fetch('https://yasno.com.ua/api/outage-info', {
                method: 'POST',
                body: JSON.stringify({ action: 'get_outages' })
            }).then(r => r.json())
        ]);
        
        const processed = processAllData(ukrenergo, dtek, yasno);
        res.json(processed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Проксі-сервер запущено на порті ${PORT}`);
});
// Використання публічних API сервісів для даних про відключення

class PublicOutageAPI {
    constructor() {
        this.endpoints = {
            // Український сервіс моніторингу енергосистеми
            energyMap: 'https://api.energymap.com.ua/v1/outages',
            
            // Crowdsourced дані
            powerOutageUA: 'https://poweroutage.com.ua/api/current',
            
            // Міжнародний сервіс (має дані по Україні)
            electricityMap: 'https://api.electricitymap.org/v3/power-breakdown/latest',
            
            // Власний сервер (якщо налаштували)
            customServer: 'https://ваш-сервер.com/api/outages'
        };
    }
    
    async fetchFromMultipleSources() {
        const sources = [
            this.fetchEnergyMap.bind(this),
            this.fetchPowerOutageUA.bind(this),
            this.fetchElectricityMap.bind(this)
        ];
        
        const results = await Promise.allSettled(
            sources.map(source => source())
        );
        
        return this.mergeSources(results);
    }
    
    async fetchEnergyMap() {
        try {
            const response = await fetch(this.endpoints.energyMap);
            if (!response.ok) throw new Error('EnergyMap недоступний');
            
            const data = await response.json();
            return this.formatEnergyMapData(data);
        } catch (error) {
            console.error('EnergyMap помилка:', error);
            return [];
        }
    }
    
    async fetchPowerOutageUA() {
        try {
            const response = await fetch(this.endpoints.powerOutageUA, {
                headers: {
                    'X-API-Key': 'ваш-ключ-якщо-потрібно'
                }
            });
            
            const data = await response.json();
            return this.formatPowerOutageData(data);
        } catch (error) {
            console.error('PowerOutageUA помилка:', error);
            return [];
        }
    }
    
    formatEnergyMapData(data) {
        // Форматування даних під нашу структуру
        return data.regions.map(region => ({
            region: region.name,
            status: this.mapStatus(region.status),
            powerDeficit: region.deficit_mw,
            lastUpdate: region.updated_at,
            source: 'EnergyMap'
        }));
    }
    
    mapStatus(statusCode) {
        const statusMap = {
            'red': 'no_power',
            'orange': 'possible',
            'yellow': 'scheduled',
            'green': 'has_power'
        };
        return statusMap[statusCode] || 'unknown';
    }
}
// Real-time updates через WebSocket
class OutageWebSocket {
    constructor() {
        this.socket = null;
        this.reconnectInterval = 5000;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
        this.listeners = new Set();
    }
    
    connect() {
        const wsUrl = 'wss://ваш-сервер.com/ws/outages';
        // Або використовуйте публічний WebSocket сервіс
        // const wsUrl = 'wss://stream.energymap.com.ua/outages';
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.notifyListeners('connected', null);
        };
        
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.notifyListeners('update', data);
            } catch (error) {
                console.error('Помилка парсингу WebSocket повідомлення:', error);
            }
        };
        
        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.notifyListeners('disconnected', null);
            this.reconnect();
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket помилка:', error);
        };
    }
    
    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Досягнуто максимальну кількість спроб перепідключення');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`Спроба перепідключення ${this.reconnectAttempts}`);
        
        setTimeout(() => this.connect(), this.reconnectInterval);
    }
    
    addListener(callback) {
        this.listeners.add(callback);
    }
    
    removeListener(callback) {
        this.listeners.delete(callback);
    }
    
    notifyListeners(event, data) {
        this.listeners.forEach(callback => callback(event, data));
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

// Використання WebSocket в додатку
const outageWS = new OutageWebSocket();

// Додаємо в app.js
outageWS.addListener((event, data) => {
    switch (event) {
        case 'update':
            // Оновлення даних в реальному часі
            processRealTimeUpdate(data);
            break;
        case 'connected':
            updateStatusIndicator('success', 'Підключено до реальних оновлень');
            break;
        case 'disconnected':
            updateStatusIndicator('warning', 'Втрачено зв\'язок з сервером');
            break;
    }
});

function processRealTimeUpdate(data) {
    // Оновлення конкретного регіону
    if (data.region && data.status) {
        if (outagesData[data.region]) {
            outagesData[data.region].status = data.status;
            outagesData[data.region].lastUpdate = new Date().toISOString();
            
            // Оновлення карти
            updateMapWithOutages();
            
            // Сповіщення користувача
            if (data.region === userRegion) {
                showNotification(`Статус оновлено: ${getStatusText(data.status)}`);
            }
        }
    }
}
// server.js - Повноцінний сервер агрегації даних
const express = require('express');
const cron = require('node-cron');
const axios = require('axios');
const app = express();

// База даних для зберігання (проста in-memory)
let outagesCache = {};
let lastUpdated = null;

// Завдання по розкладу: оновлення кожні 2 хвилини
cron.schedule('*/2 * * * *', async () => {
    console.log('Запуск оновлення даних...');
    await updateAllOutages();
});

// Функція оновлення всіх даних
async function updateAllOutages() {
    try {
        const sources = [
            scrapeUkrenergo(),
            fetchDtekAPI(),
            fetchYasnoAPI(),
            fetchRegionalData()
        ];
        
        const results = await Promise.allSettled(sources);
        
        const allData = processResults(results);
        outagesCache = allData;
        lastUpdated = new Date();
        
        console.log('Дані оновлено успішно');
        
    } catch (error) {
        console.error('Помилка оновлення даних:', error);
    }
}

// API endpoint для клієнта
app.get('/api/outages', (req, res) => {
    res.json({
        success: true,
        data: outagesCache,
        lastUpdated: lastUpdated,
        timestamp: new Date().toISOString()
    });
});

// WebSocket endpoint
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Нове WebSocket з\'єднання');
    
    // Відправка поточних даних
    ws.send(JSON.stringify({
        type: 'init',
        data: outagesCache
    }));
    
    // Оновлення при зміні даних
    const interval = setInterval(() => {
        ws.send(JSON.stringify({
            type: 'ping',
            time: new Date().toISOString()
        }));
    }, 30000);
    
    ws.on('close', () => {
        clearInterval(interval);
        console.log('WebSocket з\'єднання закрито');
    });
});

app.listen(3000, () => {
    console.log('Сервер запущено на порті 3000');
    // Первинне завантаження даних
    updateAllOutages();
});
