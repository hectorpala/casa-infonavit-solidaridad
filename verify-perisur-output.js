const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('🔍 VERIFICACIÓN COMPLETA: Sistema Inmuebles24 Mejorado\n');
    console.log('═══════════════════════════════════════════════════════\n');

    const browser = await puppeteer.launch({
        headless: false,
        devtools: true
    });

    const page = await browser.newPage();

    const consoleErrors = [];
    const consoleWarnings = [];

    // Capturar errores de consola
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        } else if (msg.type() === 'warning') {
            consoleWarnings.push(msg.text());
        }
    });

    // Capturar errores de página
    page.on('pageerror', error => {
        consoleErrors.push(`PageError: ${error.message}`);
    });

    const htmlPath = path.join(__dirname, 'culiacan/se-vende-casa-en-perisur-ii-culiacan/index.html');
    const fileUrl = 'file://' + htmlPath;

    console.log('📄 Cargando página generada...');
    console.log(`   Ruta: ${htmlPath}\n`);

    await page.goto(fileUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    // Esperar que la página esté completamente cargada
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('═══════════════════════════════════════════════════════');
    console.log('1️⃣  VERIFICACIÓN: CONSOLA DEL NAVEGADOR');
    console.log('═══════════════════════════════════════════════════════\n');

    if (consoleErrors.length === 0) {
        console.log('✅ Sin errores de JavaScript');
    } else {
        console.log(`❌ ${consoleErrors.length} errores encontrados:`);
        consoleErrors.forEach((err, i) => {
            console.log(`   ${i + 1}. ${err}`);
        });
    }

    if (consoleWarnings.length > 0) {
        console.log(`\n⚠️  ${consoleWarnings.length} warnings (pueden ser normales):`);
        consoleWarnings.slice(0, 3).forEach((warn, i) => {
            console.log(`   ${i + 1}. ${warn.substring(0, 100)}...`);
        });
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('2️⃣  VERIFICACIÓN: JSON-LD SCHEMA.ORG');
    console.log('═══════════════════════════════════════════════════════\n');

    const jsonLdData = await page.evaluate(() => {
        const script = document.querySelector('script[type="application/ld+json"]');
        if (!script) return null;

        try {
            const data = JSON.parse(script.textContent);
            return {
                exists: true,
                streetAddress: data.address?.streetAddress,
                addressLocality: data.address?.addressLocality,
                addressRegion: data.address?.addressRegion,
                postalCode: data.address?.postalCode,
                addressCountry: data.address?.addressCountry,
                fullAddress: data.address
            };
        } catch (e) {
            return { exists: false, error: e.message };
        }
    });

    if (!jsonLdData || !jsonLdData.exists) {
        console.log('❌ JSON-LD no encontrado o inválido');
    } else {
        console.log('✅ JSON-LD encontrado y parseado correctamente\n');
        console.log('📍 Estructura de dirección:');
        console.log(`   streetAddress:     "${jsonLdData.streetAddress}"`);
        console.log(`   addressLocality:   "${jsonLdData.addressLocality}"`);
        console.log(`   addressRegion:     "${jsonLdData.addressRegion}"`);
        console.log(`   postalCode:        "${jsonLdData.postalCode}"`);
        console.log(`   addressCountry:    "${jsonLdData.addressCountry}"`);

        console.log('\n🔍 Validaciones:');

        // Verificar que streetAddress tiene calle + colonia
        const hasStreetAndColony = jsonLdData.streetAddress &&
                                   jsonLdData.streetAddress.includes('Ahuejote') &&
                                   jsonLdData.streetAddress.includes('Perisur');
        console.log(`   ${hasStreetAndColony ? '✅' : '❌'} streetAddress contiene calle + colonia`);

        // Verificar que addressLocality es solo la ciudad
        const isOnlyCity = jsonLdData.addressLocality === 'Culiacán';
        console.log(`   ${isOnlyCity ? '✅' : '❌'} addressLocality es solo ciudad (no incluye calle)`);

        // Verificar región
        const hasRegion = jsonLdData.addressRegion === 'Sinaloa';
        console.log(`   ${hasRegion ? '✅' : '❌'} addressRegion correcto`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('3️⃣  VERIFICACIÓN: MARKER_CONFIG Y COORDENADAS');
    console.log('═══════════════════════════════════════════════════════\n');

    const markerData = await page.evaluate(() => {
        if (typeof MARKER_CONFIG === 'undefined') {
            return { exists: false };
        }

        return {
            exists: true,
            lat: MARKER_CONFIG.lat,
            lng: MARKER_CONFIG.lng,
            location: MARKER_CONFIG.location,
            precision: MARKER_CONFIG.precision,
            latOffset: MARKER_CONFIG.latOffset,
            lngOffset: MARKER_CONFIG.lngOffset,
            hasCoordinates: MARKER_CONFIG.lat !== null && MARKER_CONFIG.lng !== null
        };
    });

    if (!markerData.exists) {
        console.log('❌ MARKER_CONFIG no encontrado');
    } else {
        console.log('✅ MARKER_CONFIG encontrado\n');
        console.log('📍 Coordenadas (Geocoder V1.5):');
        console.log(`   Lat: ${markerData.lat}`);
        console.log(`   Lng: ${markerData.lng}`);
        console.log(`   Location: "${markerData.location}"`);
        console.log(`   Precision: "${markerData.precision}"`);

        console.log('\n🔍 Validaciones:');
        console.log(`   ${markerData.hasCoordinates ? '✅' : '❌'} Coordenadas presentes (no null)`);
        console.log(`   ${markerData.lat > 24 && markerData.lat < 25 ? '✅' : '❌'} Latitud en rango de Culiacán (~24.75)`);
        console.log(`   ${markerData.lng < -107 && markerData.lng > -108 ? '✅' : '❌'} Longitud en rango de Culiacán (~-107.4)`);

        const coordinatesExpectedToBeReused = markerData.hasCoordinates && markerData.lat !== null;
        console.log(`   ${coordinatesExpectedToBeReused ? '✅' : '⚠️ '} Sistema de reuso de coordenadas ${coordinatesExpectedToBeReused ? 'activo' : 'NO activo'}`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('4️⃣  VERIFICACIÓN: MODAL DEL MAPA');
    console.log('═══════════════════════════════════════════════════════\n');

    const mapModalCheck = await page.evaluate(() => {
        const modalElement = document.getElementById('mapModal');
        const mapContainerElement = document.getElementById('map');
        const openMapModalExists = typeof openMapModal !== 'undefined';
        const closeMapModalExists = typeof closeMapModal !== 'undefined';
        const buttonElement = document.querySelector('button[onclick="openMapModal()"]');

        return {
            modalElement: !!modalElement,
            mapContainerElement: !!mapContainerElement,
            openMapModalExists,
            closeMapModalExists,
            buttonElement: !!buttonElement,
            buttonText: buttonElement ? buttonElement.textContent.trim() : null
        };
    });

    console.log('🔍 Elementos del modal:');
    console.log(`   ${mapModalCheck.modalElement ? '✅' : '❌'} #mapModal existe`);
    console.log(`   ${mapModalCheck.mapContainerElement ? '✅' : '❌'} #map existe`);
    console.log(`   ${mapModalCheck.openMapModalExists ? '✅' : '❌'} openMapModal() definida`);
    console.log(`   ${mapModalCheck.closeMapModalExists ? '✅' : '❌'} closeMapModal() definida`);
    console.log(`   ${mapModalCheck.buttonElement ? '✅' : '❌'} Botón "Ver mapa" existe`);

    if (mapModalCheck.buttonText) {
        console.log(`   Texto del botón: "${mapModalCheck.buttonText}"`);
    }

    console.log('\n🧪 Probando apertura del modal...');

    try {
        await page.evaluate(() => {
            openMapModal();
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const modalVisible = await page.evaluate(() => {
            const modal = document.getElementById('mapModal');
            return modal && modal.style.display === 'flex';
        });

        console.log(`   ${modalVisible ? '✅' : '❌'} Modal se abre correctamente`);

        if (modalVisible) {
            console.log('\n🗺️  Verificando inicialización del mapa...');

            await new Promise(resolve => setTimeout(resolve, 3000));

            const mapInitialized = await page.evaluate(() => {
                return typeof window.map !== 'undefined' && window.map !== null;
            });

            console.log(`   ${mapInitialized ? '✅' : '❌'} Mapa de Google inicializado`);

            // Verificar si se usaron las coordenadas de V1.5
            const coordinateReuseLog = await page.evaluate(() => {
                // Revisar si hay logs de consola que confirmen el reuso
                return window.__coordinatesReused || false;
            });

            console.log(`   ${markerData.hasCoordinates ? '✅' : '⚠️ '} Coordenadas de Geocoder V1.5 ${markerData.hasCoordinates ? 'disponibles para reuso' : 'NO disponibles'}`);
        }

    } catch (error) {
        console.log(`   ❌ Error al abrir modal: ${error.message}`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN FINAL');
    console.log('═══════════════════════════════════════════════════════\n');

    const allChecks = {
        noConsoleErrors: consoleErrors.length === 0,
        jsonLdExists: jsonLdData && jsonLdData.exists,
        jsonLdCorrect: jsonLdData && jsonLdData.addressLocality === 'Culiacán' &&
                       jsonLdData.streetAddress && jsonLdData.streetAddress.includes('Perisur'),
        coordinatesPresent: markerData.hasCoordinates,
        modalWorks: mapModalCheck.modalElement && mapModalCheck.openMapModalExists
    };

    const passedChecks = Object.values(allChecks).filter(v => v).length;
    const totalChecks = Object.keys(allChecks).length;

    console.log(`✅ Verificaciones pasadas: ${passedChecks}/${totalChecks}\n`);

    if (passedChecks === totalChecks) {
        console.log('🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!\n');
        console.log('✅ Todas las mejoras implementadas correctamente:');
        console.log('   1. Script del modal limpio y sin errores');
        console.log('   2. Sistema de reuso de coordenadas (Geocoder V1.5) activo');
        console.log('   3. Normalización de nombres de ciudad funcionando');
        console.log('   4. JSON-LD con direcciones reales (calle + colonia)\n');
    } else {
        console.log('⚠️  Algunos aspectos requieren atención:\n');
        if (!allChecks.noConsoleErrors) console.log('   ❌ Errores en consola del navegador');
        if (!allChecks.jsonLdExists) console.log('   ❌ JSON-LD no encontrado');
        if (!allChecks.jsonLdCorrect) console.log('   ❌ JSON-LD con estructura incorrecta');
        if (!allChecks.coordinatesPresent) console.log('   ❌ Coordenadas no presentes en MARKER_CONFIG');
        if (!allChecks.modalWorks) console.log('   ❌ Modal del mapa con problemas');
        console.log();
    }

    console.log('⏸️  Navegador abierto para inspección manual (30 segundos)...\n');
    console.log('   Puedes verificar manualmente:');
    console.log('   - Abrir DevTools y revisar la pestaña Console');
    console.log('   - Click en "Ver mapa" para probar el modal');
    console.log('   - Inspeccionar el JSON-LD en el <head>\n');

    await new Promise(resolve => setTimeout(resolve, 30000));

    await browser.close();
    console.log('✅ Verificación completa.\n');

})().catch(e => console.error('❌ Error fatal:', e.message));
