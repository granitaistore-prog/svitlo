// Модуль для інтеграції з реальними API
class OutageAPI {
    constructor() {
        this.cacheDuration = 2 * 60 * 1000; // 2 хвилини
        this.cacheKey = 'outages_api_cache';
        this.lastUpdateKey = 'outages_last_update';
    }

    // Головний метод для отримання даних
    async fetchAllOutages() {
        try {
            // Перевірка кешу
            const cachedData = this.getCachedData();
            if (cachedData && !this.shouldRefreshCache()) {
                console.log('Використовуються кешовані дані');
                return cachedData;
            }

            console.log('Оновлення даних з API...');
            
            // Паралельне отримання даних з усіх джерел
            const [ukrenergoData, dtekData, yasnoData, regionalData] = await Promise.allSettled([
                this.fetchUkrenergoData(),
                this.fetchDtekData(),
                this.fetchYasnoData(),
                this.fetchRegionalData()
            ]);

            // Обробка результатів
            const allData = this.processAPIResults({
                ukrenergo: ukrenergoData,
                dtek: dtekData,
                yasno: yasnoData,
                regional: regionalData
            });

            // Об'єднання та нормалізація даних
            const normalizedData = this.normalizeOutageData(allData);
            
            // Збереження в кеш
            this.cacheData(normalizedData);
            
            return normalizedData;
            
        } catch (error) {
            console.error('Помилка отримання даних:', error);
            return this.getCachedData() || this.getFallbackData();
        }
    }

    // Отримання даних з Укренерго (офіційний сайт)
    async fetchUkrenergoData() {
        try {
            // Використовуємо CORS проксі для обходу обмежень
            const proxyUrl = 'https://corsproxy.io/?';
            const targetUrl = 'https://ua.energy/диспетчерська-інформація/';
            
            const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`Укренерго: ${response.status}`);
            }

            const html = await response.text();
            return this.parseUkrenergoHTML(html);
            
        } catch (error) {
            console.error('Помилка Укренерго:', error);
            throw error;
        }
    }

    // Парсинг HTML Укренерго
    parseUkrenergoHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const outages = [];
        const regions = doc.querySelectorAll('.region-outage, .outage-item');
        
        regions.forEach(region => {
            const regionName = region.querySelector('.region-name')?.textContent?.trim();
            const statusText = region.querySelector('.status')?.textContent?.trim();
            const schedule = region.querySelector('.schedule')?.textContent?.trim();
            const affectedAreas = region.querySelector('.affected-areas')?.textContent?.trim();
            
            if (regionName) {
                outages.push({
                    source: 'Укренерго',
                    region: this.normalizeRegionName(regionName),
                    status: this.parseStatus(statusText),
                    schedule: schedule || 'Не вказано',
                    affectedAreas: affectedAreas ? affectedAreas.split(',').map(a => a.trim()) : [],
                    timestamp: new Date().toISOString()
                });
            }
        });

        return outages;
    }

    // Отримання даних з ДТЕК (якщо доступне API)
    async fetchDtekData() {
        try {
            // ДТЕК має API для відключень
            const response = await fetch('https://www.dtek.com.ua/api/outages', {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                // Спробуємо альтернативний метод
                return this.fetchDtekAlternative();
            }

            const data = await response.json();
            return this.processDtekData(data);
            
        } catch (error) {
            console.error('Помилка ДТЕК:', error);
            throw error;
        }
    }

    // Альтернативний метод для ДТЕК
    async fetchDtekAlternative() {
        try {
            const response = await fetch('https://www.dtek.com.ua/ru/interactive_map');
            const html = await response.text();
            
            // Пошук JSON даних у скриптах сторінки
            const scriptRegex = /var\s+outageData\s*=\s*({.*?});/s;
            const match = html.match(scriptRegex);
            
            if (match && match[1]) {
                return JSON.parse(match[1]);
            }
            
            throw new Error('Не вдалося знайти дані ДТЕК');
            
        } catch (error) {
            console.error('Помилка альтернативного методу ДТЕК:', error);
            return [];
        }
    }

    // Обробка даних ДТЕК
    processDtekData(data) {
        const outages = [];
        
        if (data && data.regions) {
            Object.entries(data.regions).forEach(([regionId, regionData]) => {
                outages.push({
                    source: 'ДТЕК',
                    region: this.normalizeRegionName(regionData.name),
                    status: regionData.has_outage ? 'no_power' : 'has_power',
                    schedule: regionData.schedule || '',
                    affectedAreas: regionData.cities || [],
                    estimatedRestoration: regionData.restoration_time,
                    timestamp: regionData.last_updated || new Date().toISOString()
                });
            });
        }
        
        return outages;
    }

    // Отримання даних з Yasno
    async fetchYasnoData() {
        try {
            // Yasno має власне API для статусів
            const response = await fetch('https://yasno.com.ua/api/outage-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'get_outages',
                    region: 'all'
                })
            });

            if (!response.ok) {
                return this.fetchYasnoScrape();
            }

            const data = await response.json();
            return this.processYasnoData(data);
            
        } catch (error) {
            console.error('Помилка Yasno:', error);
            return [];
        }
    }

    // Скрейпінг даних Yasno
    async fetchYasnoScrape() {
        try {
            const response = await fetch('https://corsproxy.io/?https://yasno.com.ua/schedule-outages');
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const outages = [];
            const outageElements = doc.querySelectorAll('.outage-table tr');
            
            outageElements.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    outages.push({
                        source: 'Yasno',
                        region: cells[0].textContent.trim(),
                        status: this.parseYasnoStatus(cells[1].textContent),
                        schedule: cells[2].textContent.trim(),
                        timestamp: new Date().toISOString()
                    });
                }
            });
            
            return outages;
            
        } catch (error) {
            console.error('Помилка скрейпінгу Yasno:', error);
            return [];
        }
    }

    // Отримання регіональних даних
    async fetchRegionalData() {
        const regionalAPIs = [
            {
                name: 'Київобленерго',
                url: 'https://kyivoblenergo.com.ua/api/v1/outages',
                processor: this.processKyivoblenergoData.bind(this)
            },
            {
                name: 'Харківобленерго',
                url: 'https://www.kharkiv-oblenergo.com.ua/outages.json',
                processor: this.processKharkivData.bind(this)
            },
            {
                name: 'Львівобленерго',
                url: 'https://www.leos.com.ua/api/power-status',
                processor: this.processLvivData.bind(this)
            }
        ];

        const promises = regionalAPIs.map(async (api) => {
            try {
                const response = await fetch(api.url, { timeout: 5000 });
                if (response.ok) {
                    const data = await response.json();
                    return api.processor(data, api.name);
                }
                return [];
            } catch (error) {
                console.error(`Помилка ${api.name}:`, error);
                return [];
            }
        });

        const results = await Promise.allSettled(promises);
        return results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value)
            .flat();
    }

    // Обробка результатів всіх API
    processAPIResults(results) {
        const allOutages = [];
        
        Object.entries(results).forEach(([source, result]) => {
            if (result.status === 'fulfilled' && result.value) {
                allOutages.push(...result.value);
            }
        });
        
        return allOutages;
    }

    // Нормалізація даних відключень
    normalizeOutageData(rawOutages) {
        const normalized = {};
        
        // Групування по регіонах
        rawOutages.forEach(outage => {
            const regionKey = this.getRegionKey(outage.region);
            
            if (!normalized[regionKey]) {
                normalized[regionKey] = {
                    id: regionKey,
                    name: outage.region,
                    sources: [],
                    status: 'unknown',
                    schedules: [],
                    cities: [],
                    lastUpdate: outage.timestamp,
                    comments: []
                };
            }
            
            // Додавання джерела
            normalized[regionKey].sources.push(outage.source);
            
            // Визначення найгіршого статусу
            const statusPriority = {
                'no_power': 4,
                'scheduled': 3,
                'possible': 2,
                'has_power': 1,
                'unknown': 0
            };
            
            const currentPriority = statusPriority[normalized[regionKey].status] || 0;
            const newPriority = statusPriority[outage.status] || 0;
            
            if (newPriority > currentPriority) {
                normalized[regionKey].status = outage.status;
            }
            
            // Додавання розкладу
            if (outage.schedule && !normalized[regionKey].schedules.includes(outage.schedule)) {
                normalized[regionKey].schedules.push(outage.schedule);
            }
            
            // Додавання міст
            if (outage.affectedAreas) {
                outage.affectedAreas.forEach(city => {
                    if (!normalized[regionKey].cities.includes(city)) {
                        normalized[regionKey].cities.push(city);
                    }
                });
            }
            
            // Оновлення часу останнього оновлення
            if (new Date(outage.timestamp) > new Date(normalized[regionKey].lastUpdate)) {
                normalized[regionKey].lastUpdate = outage.timestamp;
            }
            
            // Додавання коментаря
            if (outage.estimatedRestoration) {
                normalized[regionKey].comments.push(`Відновлення: ${outage.estimatedRestoration}`);
            }
        });
        
        // Остаточне форматування
        Object.keys(normalized).forEach(regionKey => {
            const region = normalized[regionKey];
            
            // Створення унікального розкладу
            region.schedule = region.schedules.length > 0 
                ? region.schedules.join('; ')
                : 'Немає інформації';
                
            // Об'єднання коментарів
            region.comment = region.comments.length > 0
                ? region.comments.join('. ')
                : 'Дані оновлено';
                
            // Видалення тимчасових полів
            delete region.schedules;
            delete region.comments;
        });
        
        return normalized;
    }

    // Допоміжні методи
    normalizeRegionName(regionName) {
        const regionMap = {
            'київ': 'Київ та область',
            'киев': 'Київ та область',
            'kyiv': 'Київ та область',
            'львів': 'Львівська область',
            'львов': 'Львівська область',
            'lviv': 'Львівська область',
            'харків': 'Харківська область',
            'харьков': 'Харківська область',
            'kharkiv': 'Харківська область',
            'одеса': 'Одеська область',
            'одесса': 'Одеська область',
            'odesa': 'Одеська область',
            // ... інші регіони
        };
        
        const lowerName = regionName.toLowerCase();
        return regionMap[lowerName] || regionName;
    }

    parseStatus(statusText) {
        if (!statusText) return 'unknown';
        
        const text = statusText.toLowerCase();
        
        if (text.includes('немає світла') || text.includes('відключення') || text.includes('аварія')) {
            return 'no_power';
        }
        
        if (text.includes('за графіком') || text.includes('стабілізаційні')) {
            return 'scheduled';
        }
        
        if (text.includes('можливі') || text.includes('часткові')) {
            return 'possible';
        }
        
        if (text.includes('є світло') || text.includes('без відключень')) {
            return 'has_power';
        }
        
        return 'unknown';
    }

    parseYasnoStatus(statusText) {
        const text = statusText.toLowerCase();
        
        if (text.includes('червона') || text.includes('red')) {
            return 'no_power';
        }
        
        if (text.includes('жовта') || text.includes('yellow')) {
            return 'possible';
        }
        
        if (text.includes('зелена') || text.includes('green')) {
            return 'has_power';
        }
        
        return 'unknown';
    }

    getRegionKey(regionName) {
        const keyMap = {
            'Київ та область': 'kyiv',
            'Львівська область': 'lviv',
            'Харківська область': 'kharkiv',
            'Одеська область': 'odesa',
            'Дніпропетровська область': 'dnipro',
            'Донецька область': 'donetsk',
            'Запорізька область': 'zaporizhzhia',
            'Вінницька область': 'vinnytsia',
            'Житомирська область': 'zhytomyr',
            'Полтавська область': 'poltava',
            'Черкаська область': 'cherkasy',
            'Чернігівська область': 'chernihiv',
            'Сумська область': 'sumy',
            'Рівненська область': 'rivne',
            'Хмельницька область': 'khmelnytskyi',
            'Тернопільська область': 'ternopil',
            'Івано-Франківська область': 'ivano-frankivsk',
            'Херсонська область': 'kherson',
            'Миколаївська область': 'mykolaiv',
            'Чернівецька область': 'chernivtsi',
            'Закарпатська область': 'zakarpattia',
            'Волинська область': 'volyn',
            'Луганська область': 'luhansk'
        };
        
        return keyMap[regionName] || regionName.toLowerCase().replace(/\s+/g, '_');
    }

    // Кешування даних
    cacheData(data) {
        try {
            const cacheData = {
                data: data,
                timestamp: new Date().getTime()
            };
            
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
            localStorage.setItem(this.lastUpdateKey, new Date().toISOString());
            
            // Також зберігаємо в Service Worker кеш
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'UPDATE_CACHE',
                    data: cacheData
                });
            }
            
        } catch (error) {
            console.error('Помилка кешування:', error);
        }
    }

    getCachedData() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;
            
            const parsed = JSON.parse(cached);
            return parsed.data;
            
        } catch (error) {
            console.error('Помилка читання кешу:', error);
            return null;
        }
    }

    shouldRefreshCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return true;
            
            const parsed = JSON.parse(cached);
            const cacheAge = new Date().getTime() - parsed.timestamp;
            
            return cacheAge > this.cacheDuration;
            
        } catch (error) {
            return true;
        }
    }

    getFallbackData() {
        // Повертаємо базові дані, якщо API не доступні
        return {
            kyiv: {
                id: 'kyiv',
                name: 'Київ та область',
                status: 'has_power',
                schedule: 'Немає відключень',
                lastUpdate: new Date().toISOString(),
                cities: ['Київ', 'Бровари', 'Ірпінь'],
                comment: 'Дані тимчасово недоступні. Останнє оновлення: ' + new Date().toLocaleTimeString()
            }
        };
    }

    // Метод для перевірки доступності API
    async checkAPIHealth() {
        const endpoints = [
            { name: 'Укренерго', test: this.testUkrenergo.bind(this) },
            { name: 'ДТЕК', test: this.testDtek.bind(this) },
            { name: 'Yasno', test: this.testYasno.bind(this) }
        ];

        const results = await Promise.allSettled(
            endpoints.map(async (endpoint) => {
                try {
                    const isAvailable = await endpoint.test();
                    return { name: endpoint.name, available: isAvailable };
                } catch {
                    return { name: endpoint.name, available: false };
                }
            })
        );

        return results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
    }

    async testUkrenergo() {
        try {
            const response = await fetch('https://ua.energy/', { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    async testDtek() {
        try {
            const response = await fetch('https://www.dtek.com.ua/', { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    async testYasno() {
        try {
            const response = await fetch('https://yasno.com.ua/', { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Експорт класу
window.OutageAPI = OutageAPI;
