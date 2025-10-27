#!/usr/bin/env node

const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log('🌐 Navegando a Los Pinos...\n');
    await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-los-pinos-142636213.html', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const addressInfo = await page.evaluate(() => {
        const targetAddress = "Col Los Pinos, Río del Carmen, Los Pinos, Culiacán";
        const results = [];

        // Buscar la dirección exacta
        const allElements = Array.from(document.querySelectorAll('*'));

        allElements.forEach(el => {
            const text = el.textContent;
            if (text && text.includes('Col Los Pinos') && text.includes('Río del Carmen')) {
                const directText = Array.from(el.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent.trim())
                    .filter(Boolean)
                    .join(' ');

                results.push({
                    tag: el.tagName.toLowerCase(),
                    text: el.textContent.trim().substring(0, 200),
                    directText: directText.substring(0, 150),
                    className: el.className || '',
                    id: el.id || '',
                    parentTag: el.parentElement ? el.parentElement.tagName.toLowerCase() : 'none'
                });
            }
        });

        // También buscar divs/sections con "map" en clase o id
        const mapContainers = Array.from(document.querySelectorAll('[id*="map"], [class*="map"], [id*="mapa"], [class*="mapa"]'));

        return {
            addressMatches: results.slice(0, 10),
            mapContainers: mapContainers.slice(0, 5).map(el => ({
                tag: el.tagName.toLowerCase(),
                id: el.id || '',
                className: el.className || '',
                hasChildren: el.children.length > 0,
                childrenCount: el.children.length
            }))
        };
    });

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📍 BÚSQUEDA DE DIRECCIÓN EN HTML\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`🎯 Buscando: "Col Los Pinos, Río del Carmen, Los Pinos, Culiacán"\n`);
    console.log(`✅ ${addressInfo.addressMatches.length} coincidencias encontradas\n`);

    if (addressInfo.addressMatches.length > 0) {
        addressInfo.addressMatches.forEach((match, idx) => {
            console.log(`${idx + 1}. [${match.tag}] (parent: ${match.parentTag})`);
            console.log(`   id: "${match.id}"`);
            console.log(`   class: "${match.className}"`);
            console.log(`   text: "${match.text}"`);
            console.log('');
        });
    }

    console.log('─────────────────────────────────────────────────────────\n');
    console.log(`🗺️  CONTENEDORES DE MAPA (${addressInfo.mapContainers.length} encontrados)\n`);

    if (addressInfo.mapContainers.length > 0) {
        addressInfo.mapContainers.forEach((container, idx) => {
            console.log(`${idx + 1}. [${container.tag}]`);
            console.log(`   id: "${container.id}"`);
            console.log(`   class: "${container.className}"`);
            console.log(`   children: ${container.childrenCount}`);
            console.log('');
        });
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('💡 Presiona Ctrl+C para cerrar\n');

    await new Promise(() => {});
})();
