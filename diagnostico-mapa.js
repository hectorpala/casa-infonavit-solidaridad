const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 DIAGNÓSTICO COMPLETO DEL MAPA MODAL\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        devtools: true
    });

    const page = await browser.newPage();

    // Escuchar TODOS los mensajes de consola
    page.on('console', msg => {
        console.log('📋 Console:', msg.text());
    });

    // Escuchar errores
    page.on('pageerror', error => {
        console.error('❌ Page Error:', error.message);
    });

    // Escuchar errores de recursos
    page.on('requestfailed', request => {
        console.error('❌ Request Failed:', request.url());
    });

    console.log('📄 Cargando culiacan/index.html...');
    await page.goto('file:///Users/hectorpc/Documents/Hector%20Palazuelos/Google%20My%20Business/landing%20casa%20solidaridad/culiacan/index.html', {
        waitUntil: 'networkidle0',
        timeout: 60000
    });

    await new Promise(r => setTimeout(r, 3000));

    console.log('\n🔍 VERIFICANDO CÓDIGO JAVASCRIPT...\n');

    // Verificar que guadalupeV15Property existe
    const propExists = await page.evaluate(() => {
        return typeof guadalupeV15Property !== 'undefined';
    });

    console.log(`   guadalupeV15Property definida: ${propExists ? '✅' : '❌'}`);

    // Buscar el botón del mapa
    console.log('\n🔍 BUSCANDO BOTÓN DEL MAPA...\n');
    const btnInfo = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const mapButtons = buttons.filter(b =>
            b.textContent.toLowerCase().includes('mapa') ||
            b.onclick?.toString().includes('showMapModal')
        );

        return mapButtons.map(b => ({
            text: b.textContent.trim().substring(0, 50),
            onclick: b.onclick ? b.onclick.toString().substring(0, 100) : null,
            id: b.id,
            className: b.className
        }));
    });

    console.log('   Botones de mapa encontrados:', btnInfo.length);
    btnInfo.forEach((b, i) => {
        console.log(`   ${i + 1}. "${b.text}"`);
        console.log(`      onclick: ${b.onclick || 'N/A'}`);
    });

    if (btnInfo.length === 0) {
        console.log('\n❌ NO SE ENCONTRÓ BOTÓN DEL MAPA');
        console.log('   Verifica que existe el botón "Ver mapa de propiedades"\n');
        await new Promise(() => {});
        return;
    }

    console.log('\n🗺️  ABRIENDO MAPA MODAL...\n');

    // Hacer clic en el primer botón del mapa
    const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const mapBtn = buttons.find(b =>
            b.textContent.toLowerCase().includes('mapa') ||
            (b.onclick && b.onclick.toString().includes('showMapModal'))
        );

        if (mapBtn) {
            mapBtn.click();
            return true;
        }
        return false;
    });

    if (!clicked) {
        console.log('❌ No se pudo hacer clic en el botón');
        await new Promise(() => {});
        return;
    }

    console.log('✅ Clic ejecutado en botón del mapa');

    // Esperar 5 segundos para que se inicialice
    await new Promise(r => setTimeout(r, 5000));

    console.log('\n📊 VERIFICANDO MARCADORES...\n');

    const markerInfo = await page.evaluate(() => {
        const info = {
            mapInitialized: typeof window.mapCuliacan !== 'undefined',
            markersArray: typeof window.allCuliacanMarkers !== 'undefined',
            totalMarkers: window.allCuliacanMarkers ? window.allCuliacanMarkers.length : 0,
            markers: []
        };

        if (window.allCuliacanMarkers && window.allCuliacanMarkers.length > 0) {
            info.markers = window.allCuliacanMarkers.map((m, i) => {
                const pos = m.position;
                const lat = pos && pos.lat ? pos.lat() : null;
                const lng = pos && pos.lng ? pos.lng() : null;

                return {
                    index: i,
                    lat: lat ? lat.toFixed(4) : 'N/A',
                    lng: lng ? lng.toFixed(4) : 'N/A',
                    isV15: lat && lng && Math.abs(lat - 24.824) < 0.001 && Math.abs(lng - (-107.399)) < 0.001
                };
            });
        }

        return info;
    });

    console.log(`   Mapa inicializado: ${markerInfo.mapInitialized ? '✅' : '❌'}`);
    console.log(`   Array de marcadores: ${markerInfo.markersArray ? '✅' : '❌'}`);
    console.log(`   Total marcadores: ${markerInfo.totalMarkers}`);

    if (markerInfo.totalMarkers > 0) {
        console.log('\n   MARCADORES DETECTADOS:\n');
        markerInfo.markers.forEach(m => {
            const icon = m.isV15 ? '🌍 V1.5 GEOCODER' : '📍';
            console.log(`   ${icon} #${m.index + 1}: ${m.lat}, ${m.lng}`);
        });

        const v15Found = markerInfo.markers.some(m => m.isV15);
        console.log(`\n   ${v15Found ? '✅ MARCADOR V1.5 ENCONTRADO' : '❌ MARCADOR V1.5 NO ENCONTRADO'}`);
    } else {
        console.log('\n   ❌ NO HAY MARCADORES EN EL MAPA');
        console.log('      El mapa modal no se inicializó correctamente');
    }

    console.log('\n✅ Diagnóstico completado. Revisar navegador abierto.');
    console.log('   Presiona Ctrl+C cuando termines.\n');

    await new Promise(() => {});

})().catch(e => {
    console.error('\n❌ Error fatal:', e.message);
    console.error(e.stack);
    process.exit(1);
});
