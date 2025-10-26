const axios = require('axios');

/**
 * Sistema de Pool de Proxies con Rotación Automática
 * Soporta proxies residenciales y datacenter
 */

class ProxyPool {
    constructor(config = {}) {
        this.proxies = config.proxies || [];
        this.currentIndex = 0;
        this.failedProxies = new Set();
        this.retryAfter = new Map(); // proxy -> timestamp

        // Configuración de servicios de proxies pagados
        this.services = {
            // Zyte (antes Crawlera) - $25/GB
            zyte: {
                enabled: false,
                apiKey: process.env.ZYTE_API_KEY || '',
                endpoint: 'http://proxy.zyte.com:8011'
            },
            // Oxylabs - Residential $8/GB
            oxylabs: {
                enabled: false,
                username: process.env.OXYLABS_USER || '',
                password: process.env.OXYLABS_PASS || '',
                endpoint: 'pr.oxylabs.io:7777'
            },
            // BrightData (Luminati) - $8.4/GB
            brightdata: {
                enabled: false,
                username: process.env.BRIGHTDATA_USER || '',
                password: process.env.BRIGHTDATA_PASS || '',
                endpoint: 'brd.superproxy.io:22225'
            },
            // ScraperAPI - $49/mes (1000 requests)
            scraperapi: {
                enabled: false,
                apiKey: process.env.SCRAPERAPI_KEY || ''
            }
        };

        // Pool de proxies gratuitos/propios
        if (config.useOwnProxies) {
            this.loadProxiesFromFile(config.proxyFile || 'proxies.txt');
        }
    }

    // Cargar proxies desde archivo
    loadProxiesFromFile(filename) {
        try {
            const fs = require('fs');
            if (fs.existsSync(filename)) {
                const content = fs.readFileSync(filename, 'utf8');
                const proxies = content.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#'));

                this.proxies = proxies.map(proxy => ({
                    url: proxy,
                    failures: 0,
                    lastUsed: 0
                }));

                console.log(`📋 Cargados ${this.proxies.length} proxies desde ${filename}`);
            }
        } catch (error) {
            console.error('Error cargando proxies:', error.message);
        }
    }

    // Obtener siguiente proxy (rotación)
    getNext() {
        if (this.proxies.length === 0) {
            return null;
        }

        // Buscar un proxy disponible
        let attempts = 0;
        while (attempts < this.proxies.length) {
            const proxy = this.proxies[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

            // Verificar si el proxy está en cooldown
            if (this.retryAfter.has(proxy.url)) {
                const cooldownUntil = this.retryAfter.get(proxy.url);
                if (Date.now() < cooldownUntil) {
                    attempts++;
                    continue;
                }
                this.retryAfter.delete(proxy.url);
            }

            // Verificar si no ha fallado demasiado
            if (proxy.failures < 3) {
                proxy.lastUsed = Date.now();
                return proxy;
            }

            attempts++;
        }

        // Si todos están fallidos, resetear
        console.log('⚠️  Todos los proxies han fallado, reseteando...');
        this.proxies.forEach(p => p.failures = 0);
        this.failedProxies.clear();
        return this.proxies[0];
    }

    // Marcar proxy como fallido
    markFailed(proxyUrl, cooldownSeconds = 300) {
        const proxy = this.proxies.find(p => p.url === proxyUrl);
        if (proxy) {
            proxy.failures++;
            this.failedProxies.add(proxyUrl);

            // Cooldown de 5 minutos por defecto
            this.retryAfter.set(proxyUrl, Date.now() + (cooldownSeconds * 1000));

            console.log(`❌ Proxy fallido (${proxy.failures}/3): ${proxyUrl}`);
        }
    }

    // Marcar proxy como exitoso
    markSuccess(proxyUrl) {
        const proxy = this.proxies.find(p => p.url === proxyUrl);
        if (proxy) {
            proxy.failures = Math.max(0, proxy.failures - 1);
            this.failedProxies.delete(proxyUrl);
        }
    }

    // Obtener configuración para Puppeteer
    getPuppeteerConfig(proxy) {
        if (!proxy) return {};

        return {
            args: [
                `--proxy-server=${proxy.url}`,
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        };
    }

    // Obtener configuración para Axios
    getAxiosConfig(proxy) {
        if (!proxy) return {};

        const [host, port] = proxy.url.replace('http://', '').split(':');

        return {
            proxy: {
                host: host,
                port: parseInt(port)
            }
        };
    }

    // Usar ScraperAPI (alternativa sin proxies propios)
    async fetchWithScraperAPI(url, options = {}) {
        if (!this.services.scraperapi.enabled || !this.services.scraperapi.apiKey) {
            throw new Error('ScraperAPI no configurado');
        }

        const apiUrl = `http://api.scraperapi.com?api_key=${this.services.scraperapi.apiKey}&url=${encodeURIComponent(url)}&render=true`;

        try {
            const response = await axios.get(apiUrl, {
                timeout: options.timeout || 60000
            });
            return response.data;
        } catch (error) {
            console.error('ScraperAPI error:', error.message);
            throw error;
        }
    }

    // Estadísticas
    getStats() {
        const total = this.proxies.length;
        const failed = this.failedProxies.size;
        const active = total - failed;

        return {
            total,
            active,
            failed,
            failureRate: total > 0 ? ((failed / total) * 100).toFixed(1) + '%' : '0%'
        };
    }

    // Generar archivo de ejemplo de proxies
    static generateExampleFile() {
        const fs = require('fs');
        const example = `# Archivo de proxies - Un proxy por línea
# Formato: http://host:port o http://user:pass@host:port

# Proxies HTTP
http://proxy1.example.com:8080
http://proxy2.example.com:3128

# Proxies con autenticación
http://user:pass@proxy3.example.com:8080

# Proxies SOCKS5
socks5://proxy4.example.com:1080
`;

        fs.writeFileSync('proxies.txt.example', example, 'utf8');
        console.log('📄 Archivo de ejemplo creado: proxies.txt.example');
    }
}

// User Agents Pool
class UserAgentPool {
    constructor() {
        this.userAgents = [
            // Chrome on macOS
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',

            // Chrome on Windows
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',

            // Firefox on macOS
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',

            // Firefox on Windows
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',

            // Safari on macOS
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',

            // Edge on Windows
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
        ];
    }

    getRandom() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    getAll() {
        return [...this.userAgents];
    }
}

module.exports = { ProxyPool, UserAgentPool };
