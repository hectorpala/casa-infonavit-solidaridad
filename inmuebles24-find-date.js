const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const url = 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-venta-de-casa-por-calle-mariano-escobedo-centro-de-la-143508352.html';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    const result = await page.evaluate(() => {
        const data = {};

        // Buscar fecha en TODO el HTML
        const html = document.documentElement.innerHTML;
        const bodyText = document.body.innerText;

        // Patrones de fecha
        const patterns = [
            /publicad[oa]\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
            /fecha\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
            /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/gi,
            /"date":\s*"([^"]+)"/gi,
            /"publishedTime":\s*"([^"]+)"/gi,
            /"datePosted":\s*"([^"]+)"/gi,
            /hace\s+(\d+)\s+(día|días|semana|semanas|mes|meses)/gi
        ];

        data.allMatches = [];
        patterns.forEach((pattern, i) => {
            const matches = [...html.matchAll(pattern)];
            if (matches.length > 0) {
                data.allMatches.push({
                    pattern: i + 1,
                    matches: matches.slice(0, 5).map(m => m[0])
                });
            }
        });

        // Buscar elementos con texto de fecha
        const elements = Array.from(document.querySelectorAll('span, div, p, time'));
        data.dateElements = [];
        elements.forEach(el => {
            const text = el.textContent.trim();
            if (text.match(/publicad|fecha|hace.*día|hace.*mes|hace.*semana/i) && text.length < 100) {
                data.dateElements.push({
                    tag: el.tagName,
                    class: el.className,
                    text: text
                });
            }
        });

        // Buscar atributo "time"
        const timeElements = document.querySelectorAll('time[datetime]');
        data.timeElements = Array.from(timeElements).map(el => ({
            datetime: el.getAttribute('datetime'),
            text: el.textContent.trim()
        }));

        return data;
    });

    console.log('🔍 BÚSQUEDA DE FECHA DE PUBLICACIÓN\n');

    console.log('📅 Matches de patrones de fecha:');
    if (result.allMatches.length > 0) {
        result.allMatches.forEach(m => {
            console.log(`\nPatrón ${m.pattern}:`);
            m.matches.forEach(match => console.log(`  - ${match}`));
        });
    } else {
        console.log('  ❌ No se encontraron fechas con patrones regex\n');
    }

    console.log('\n📅 Elementos con texto de fecha:');
    if (result.dateElements.length > 0) {
        result.dateElements.forEach(el => {
            console.log(`  <${el.tag}${el.class ? ' class="' + el.class + '"' : ''}>: ${el.text}`);
        });
    } else {
        console.log('  ❌ No se encontraron elementos con texto de fecha\n');
    }

    console.log('\n📅 Elementos <time> con datetime:');
    if (result.timeElements.length > 0) {
        result.timeElements.forEach(el => {
            console.log(`  datetime="${el.datetime}": ${el.text}`);
        });
    } else {
        console.log('  ❌ No se encontraron elementos <time>\n');
    }

    await browser.close();
})();
