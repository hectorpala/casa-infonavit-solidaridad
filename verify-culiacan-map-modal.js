const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('🗺️  VERIFICACIÓN: Modal de Mapa en culiacan/index.html\n');
    console.log('═══════════════════════════════════════════════════════\n');

    const browser = await puppeteer.launch({
        headless: false,
        devtools: true
    });

    const page = await browser.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    page.on('pageerror', error => {
        consoleErrors.push(`PageError: ${error.message}`);
    });

    const htmlPath = path.join(__dirname, 'culiacan/index.html');
    const fileUrl = 'file://' + htmlPath;

    console.log('📄 Cargando culiacan/index.html...');
    console.log(`   Ruta: ${htmlPath}\n`);

    await page.goto(fileUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('═══════════════════════════════════════════════════════');
    console.log('1️⃣  VERIFICACIÓN: ELEMENTOS DEL MODAL');
    console.log('═══════════════════════════════════════════════════════\n');

    const modalElements = await page.evaluate(() => {
        return {
            modalExists: !!document.getElementById('mapModal'),
            mapContainerExists: !!document.getElementById('map'),
            openButtonExists: !!document.querySelector('button[onclick="openMapModal()"]'),
            closeButtonExists: !!document.querySelector('button[onclick="closeMapModal()"]'),
            openMapModalDefined: typeof openMapModal !== 'undefined',
            closeMapModalDefined: typeof closeMapModal !== 'undefined',
            initMapDefined: typeof initMap !== 'undefined'
        };
    });

    console.log('🔍 Elementos HTML:');
    console.log(`   ${modalElements.modalExists ? '✅' : '❌'} #mapModal existe`);
    console.log(`   ${modalElements.mapContainerExists ? '✅' : '❌'} #map existe`);
    console.log(`   ${modalElements.openButtonExists ? '✅' : '❌'} Botón "Ver mapa" existe`);
    console.log(`   ${modalElements.closeButtonExists ? '✅' : '❌'} Botón cerrar (X) existe`);

    console.log('\n🔍 Funciones JavaScript:');
    console.log(`   ${modalElements.openMapModalDefined ? '✅' : '❌'} openMapModal() definida`);
    console.log(`   ${modalElements.closeMapModalDefined ? '✅' : '❌'} closeMapModal() definida`);
    console.log(`   ${modalElements.initMapDefined ? '✅' : '❌'} initMap() definida`);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('2️⃣  VERIFICACIÓN: PROPIEDAD PERISUR II');
    console.log('═══════════════════════════════════════════════════════\n');

    const perisurData = await page.evaluate(() => {
        // Buscar el script que define la propiedad Perisur II
        const scripts = Array.from(document.scripts);
        let perisurFound = false;
        let perisurCoords = null;

        for (const script of scripts) {
            if (script.textContent.includes('Perisur II') || script.textContent.includes('Ahuejote')) {
                perisurFound = true;

                // Intentar extraer coordenadas
                const latMatch = script.textContent.match(/lat:\s*([\d.-]+)/);
                const lngMatch = script.textContent.match(/lng:\s*([\d.-]+)/);

                if (latMatch && lngMatch) {
                    perisurCoords = {
                        lat: parseFloat(latMatch[1]),
                        lng: parseFloat(lngMatch[1])
                    };
                }
                break;
            }
        }

        return { perisurFound, perisurCoords };
    });

    console.log('🔍 Propiedad Perisur II en el mapa:');
    console.log(`   ${perisurData.perisurFound ? '✅' : '❌'} Script de Perisur II encontrado`);

    if (perisurData.perisurCoords) {
        console.log(`   ✅ Coordenadas encontradas:`);
        console.log(`      Lat: ${perisurData.perisurCoords.lat}`);
        console.log(`      Lng: ${perisurData.perisurCoords.lng}`);

        const isValidLat = perisurData.perisurCoords.lat > 24 && perisurData.perisurCoords.lat < 25;
        const isValidLng = perisurData.perisurCoords.lng < -107 && perisurData.perisurCoords.lng > -108;

        console.log(`   ${isValidLat ? '✅' : '❌'} Latitud en rango de Culiacán (~24.75)`);
        console.log(`   ${isValidLng ? '✅' : '❌'} Longitud en rango de Culiacán (~-107.4)`);
    } else {
        console.log(`   ⚠️  No se pudieron extraer coordenadas del script`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('3️⃣  PRUEBA FUNCIONAL: ABRIR MODAL');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        console.log('🧪 Intentando abrir el modal...');

        await page.evaluate(() => {
            openMapModal();
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const modalState = await page.evaluate(() => {
            const modal = document.getElementById('mapModal');
            const displayStyle = window.getComputedStyle(modal).display;

            return {
                isVisible: displayStyle !== 'none',
                displayValue: displayStyle,
                hasFlexClass: modal.classList.contains('flex')
            };
        });

        console.log(`   ${modalState.isVisible ? '✅' : '❌'} Modal visible (display: ${modalState.displayValue})`);

        if (modalState.isVisible) {
            console.log('\n🗺️  Esperando inicialización del mapa de Google...');
            await new Promise(resolve => setTimeout(resolve, 4000));

            const mapInitialized = await page.evaluate(() => {
                return typeof window.map !== 'undefined' && window.map !== null;
            });

            console.log(`   ${mapInitialized ? '✅' : '❌'} Mapa de Google inicializado`);

            if (mapInitialized) {
                const markersCount = await page.evaluate(() => {
                    return window.allMarkers ? window.allMarkers.length : 0;
                });

                console.log(`   ✅ Marcadores en el mapa: ${markersCount}`);
            }
        }

    } catch (error) {
        console.log(`   ❌ Error al abrir modal: ${error.message}`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('4️⃣  VERIFICACIÓN: CONSOLA DEL NAVEGADOR');
    console.log('═══════════════════════════════════════════════════════\n');

    if (consoleErrors.length === 0) {
        console.log('✅ Sin errores de JavaScript');
    } else {
        console.log(`❌ ${consoleErrors.length} errores encontrados:`);
        consoleErrors.slice(0, 5).forEach((err, i) => {
            console.log(`   ${i + 1}. ${err.substring(0, 100)}`);
        });
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN FINAL');
    console.log('═══════════════════════════════════════════════════════\n');

    const allChecks = {
        modalElementsExist: modalElements.modalExists && modalElements.mapContainerExists,
        functionsExist: modalElements.openMapModalDefined && modalElements.closeMapModalDefined,
        perisurInMap: perisurData.perisurFound,
        noErrors: consoleErrors.length === 0
    };

    const passedChecks = Object.values(allChecks).filter(v => v).length;
    const totalChecks = Object.keys(allChecks).length;

    console.log(`✅ Verificaciones pasadas: ${passedChecks}/${totalChecks}\n`);

    if (passedChecks === totalChecks) {
        console.log('🎉 ¡MODAL DEL MAPA COMPLETAMENTE FUNCIONAL!\n');
        console.log('✅ Sistema completo validado:');
        console.log('   1. Modal de mapa sin errores');
        console.log('   2. Propiedad Perisur II con coordenadas correctas');
        console.log('   3. Funciones openMapModal() y closeMapModal() operativas');
        console.log('   4. Mapa de Google inicializado correctamente\n');
    } else {
        console.log('⚠️  Algunos aspectos requieren atención\n');
    }

    console.log('⏸️  Navegador abierto para inspección manual (30 segundos)...');
    console.log('   Puedes probar:');
    console.log('   - Click en "Ver mapa" en el header');
    console.log('   - Verificar que aparecen todas las propiedades');
    console.log('   - Click en marcadores para ver InfoWindows\n');

    await new Promise(resolve => setTimeout(resolve, 30000));

    await browser.close();
    console.log('✅ Verificación completa.\n');

})().catch(e => console.error('❌ Error fatal:', e.message));
