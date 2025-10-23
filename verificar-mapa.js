const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Verificando mapa modal de Culiacán...\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        devtools: true  // Abrir DevTools automáticamente
    });

    const page = await browser.newPage();

    // Escuchar mensajes de consola
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Marcador') || text.includes('guadalupe') || text.includes('Guadalupe') || text.includes('V1.5')) {
            console.log('📋 Console:', text);
        }
    });

    // Escuchar errores
    page.on('pageerror', error => {
        console.error('❌ Error en página:', error.message);
    });

    console.log('📄 Abriendo culiacan/index.html...');
    await page.goto('file:///Users/hectorpc/Documents/Hector%20Palazuelos/Google%20My%20Business/landing%20casa%20solidaridad/culiacan/index.html', {
        waitUntil: 'networkidle0',
        timeout: 60000
    });

    // Esperar 3 segundos
    await new Promise(r => setTimeout(r, 3000));

    console.log('\n🗺️  Haciendo clic en botón "Ver mapa de propiedades"...');

    // Click en el botón del mapa
    try {
        await page.evaluate(() => {
            const btn = document.querySelector('button[onclick*="showMapModal"]') ||
                        document.querySelector('button:has-text("Ver mapa")') ||
                        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('mapa'));
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        });

        console.log('✅ Clic en botón ejecutado');
    } catch (e) {
        console.error('❌ Error al hacer clic:', e.message);
    }

    // Esperar 5 segundos para que cargue el mapa
    await new Promise(r => setTimeout(r, 5000));

    // Verificar marcadores
    const markers = await page.evaluate(() => {
        if (window.allCuliacanMarkers) {
            return {
                total: window.allCuliacanMarkers.length,
                markers: window.allCuliacanMarkers.map((m, i) => {
                    const pos = m.position || {};
                    return {
                        index: i,
                        lat: pos.lat ? pos.lat() : null,
                        lng: pos.lng ? pos.lng() : null
                    };
                })
            };
        }
        return null;
    });

    if (markers) {
        console.log(`\n📊 MARCADORES EN MAPA: ${markers.total} total\n`);
        markers.markers.forEach(m => {
            if (m.lat && m.lng) {
                const isV15 = (Math.abs(m.lat - 24.824) < 0.001 && Math.abs(m.lng - (-107.399)) < 0.001);
                const marker = isV15 ? '🌍 V1.5' : '📍';
                console.log(`   ${marker} #${m.index + 1}: ${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}`);
            }
        });
    } else {
        console.log('\n❌ No se encontraron marcadores en window.allCuliacanMarkers');
    }

    console.log('\n✅ Mantener navegador abierto para inspección manual...');
    console.log('   Presiona Ctrl+C cuando termines de verificar.\n');

    // Mantener abierto indefinidamente
    await new Promise(() => {});

})().catch(e => {
    console.error('❌ Error fatal:', e.message);
    process.exit(1);
});
