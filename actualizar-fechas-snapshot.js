#!/usr/bin/env node

/**
 * ACTUALIZAR FECHAS EN SNAPSHOT
 *
 * Este script toma el snapshot existente y extrae las fechas de publicación
 * de cada propiedad visitando cada URL individualmente.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SNAPSHOTS_DIR = '.snapshots-propiedades';

async function extraerFechaPropiedad(browser, url, index, total) {
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

        console.log(`   [${index}/${total}] Extrayendo fecha de: ${url.substring(45, 100)}...`);

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        const fecha = await page.evaluate(() => {
            // 1. Buscar en JSON-LD
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (const script of scripts) {
                try {
                    const data = JSON.parse(script.textContent);
                    if (data.datePosted && data.datePosted !== '') {
                        return data.datePosted;
                    }
                    if (data.datePublished && data.datePublished !== '') {
                        return data.datePublished;
                    }
                } catch (e) {}
            }

            // 2. Buscar fechas en formato YYYY-MM-DD
            const bodyText = document.body.textContent;
            const matches = bodyText.match(/(\d{4}-\d{2}-\d{2})/g);
            if (matches && matches.length > 0) {
                const validDates = matches.filter(date => {
                    const [y, m, d] = date.split('-');
                    const year = parseInt(y);
                    const month = parseInt(m);
                    const day = parseInt(d);
                    return year >= 2024 && year <= 2026 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
                });
                if (validDates.length > 0) {
                    // Retornar la más reciente
                    return validDates.sort().reverse()[0];
                }
            }

            return null;
        });

        await page.close();

        if (fecha) {
            console.log(`      ✅ Fecha encontrada: ${fecha}`);
        } else {
            console.log(`      ⚠️  No se encontró fecha`);
        }

        return fecha;
    } catch (error) {
        console.error(`      ❌ Error: ${error.message}`);
        return null;
    }
}

async function actualizarFechas(snapshotFile) {
    console.log('\n📅 ACTUALIZAR FECHAS EN SNAPSHOT\n');
    console.log(`📂 Archivo: ${snapshotFile}\n`);

    if (!fs.existsSync(snapshotFile)) {
        console.error('❌ El archivo de snapshot no existe');
        process.exit(1);
    }

    // Leer snapshot actual
    const snapshot = JSON.parse(fs.readFileSync(snapshotFile, 'utf-8'));
    const propiedades = snapshot.propiedades || [];

    console.log(`📊 Total propiedades: ${propiedades.length}\n`);

    const browser = await puppeteer.launch({
        headless: false, // Cambiar a true para más velocidad
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('🔄 Extrayendo fechas de cada propiedad...\n');

    let actualizadas = 0;
    let sinFecha = 0;

    for (let i = 0; i < propiedades.length; i++) {
        const propiedad = propiedades[i];

        // Limpiar URL (quitar hash params)
        const urlLimpia = propiedad.url.split('#')[0];

        const fecha = await extraerFechaPropiedad(browser, urlLimpia, i + 1, propiedades.length);

        if (fecha) {
            propiedad.date = fecha;
            actualizadas++;
        } else {
            propiedad.date = 'N/A';
            sinFecha++;
        }

        // Pausa entre requests para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await browser.close();

    // Guardar snapshot actualizado
    snapshot.fechaActualizacion = new Date().toISOString();
    fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('✅ ACTUALIZACIÓN COMPLETADA\n');
    console.log(`📊 Propiedades con fecha: ${actualizadas}/${propiedades.length}`);
    console.log(`⚠️  Sin fecha: ${sinFecha}/${propiedades.length}`);
    console.log(`💾 Snapshot actualizado: ${snapshotFile}\n`);
    console.log('='.repeat(80) + '\n');

    // Mostrar propiedades ordenadas por fecha (más recientes primero)
    const conFecha = propiedades
        .filter(p => p.date && p.date !== 'N/A')
        .sort((a, b) => b.date.localeCompare(a.date));

    if (conFecha.length > 0) {
        console.log('📅 PROPIEDADES MÁS RECIENTES (Top 10):\n');
        conFecha.slice(0, 10).forEach((prop, i) => {
            console.log(`${i + 1}. ${prop.date} - ${prop.title.substring(0, 60)}...`);
            console.log(`   📍 ${prop.location}`);
            console.log(`   🔗 ${prop.url.substring(0, 80)}...\n`);
        });
    }
}

// Main
const snapshotFile = process.argv[2] || path.join(SNAPSHOTS_DIR, 'snapshot-https---propiedades-com-culiacan-residencial-venta.json');

actualizarFechas(snapshotFile)
    .then(() => {
        console.log('🎯 Siguiente paso: Commit y push para actualizar el dashboard');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
