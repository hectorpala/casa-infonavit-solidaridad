/**
 * COMPARACIÓN: Scraper HOY vs Excel AYER (primeras 60 propiedades)
 *
 * Compara el resultado del scraper de hoy con las primeras 60 propiedades
 * del archivo Excel propiedades-completo-2025-10-13.xlsx
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// =============== CONFIGURACIÓN ===============
const EXCEL_FILE = 'scraper-por-dia-excel/propiedades-completo-2025-10-13.xlsx';
const JSON_SCRAPER_HOY = 'inmuebles24-culiacan-historico.json';
const NUM_PROPIEDADES_COMPARAR = 60;

// =============== FUNCIONES AUXILIARES ===============

/**
 * Extrae ID de URL de Inmuebles24
 */
function extractPropertyId(url) {
    const match = url.match(/propiedades\/.*-(\d+)\.html/);
    return match ? match[1] : url;
}

/**
 * Lee propiedades del Excel (primeras 60)
 */
function loadExcelProperties() {
    console.log(`📂 Leyendo Excel: ${EXCEL_FILE}...`);

    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log(`   Total propiedades en Excel: ${data.length}`);

    // Tomar solo las primeras 60
    const primeras60 = data.slice(0, NUM_PROPIEDADES_COMPARAR);

    // Convertir a formato compatible
    const properties = primeras60.map(row => ({
        url: row.URL || row.url || '',
        title: (row.Título || row.titulo || row.Title || '').substring(0, 150),
        price: row.Precio || row.precio || row.Price || 'Consultar',
        source: 'Excel (ayer)'
    }));

    console.log(`   ✅ Primeras ${properties.length} propiedades extraídas del Excel`);
    return properties;
}

/**
 * Lee propiedades del JSON scrapeadas HOY
 */
function loadScraperProperties() {
    console.log(`📂 Leyendo scraper de HOY: ${JSON_SCRAPER_HOY}...`);

    if (!fs.existsSync(JSON_SCRAPER_HOY)) {
        console.error(`❌ Archivo no encontrado: ${JSON_SCRAPER_HOY}`);
        return [];
    }

    const data = JSON.parse(fs.readFileSync(JSON_SCRAPER_HOY, 'utf-8'));
    const properties = data.properties || [];

    console.log(`   ✅ ${properties.length} propiedades del scraper de HOY`);
    return properties.map(p => ({
        ...p,
        source: 'Scraper (hoy)'
    }));
}

/**
 * Compara dos conjuntos de propiedades
 */
function compareProperties(excelProps, scraperProps) {
    const excelIds = new Set(excelProps.map(p => extractPropertyId(p.url)));
    const scraperIds = new Set(scraperProps.map(p => extractPropertyId(p.url)));

    // Propiedades NUEVAS (están en scraper HOY pero NO en Excel AYER)
    const nuevas = scraperProps.filter(p => !excelIds.has(extractPropertyId(p.url)));

    // Propiedades ELIMINADAS (están en Excel AYER pero NO en scraper HOY)
    const eliminadas = excelProps.filter(p => !scraperIds.has(extractPropertyId(p.url)));

    // Propiedades COMUNES (están en ambos)
    const comunes = scraperProps.filter(p => excelIds.has(extractPropertyId(p.url)));

    return { nuevas, eliminadas, comunes };
}

/**
 * Genera reporte detallado
 */
function generateReport(excelProps, scraperProps, comparison) {
    const { nuevas, eliminadas, comunes } = comparison;

    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORTE COMPARATIVO: SCRAPER HOY vs EXCEL AYER (primeras 60)');
    console.log('='.repeat(80));

    console.log(`\n📅 EXCEL AYER (primeras 60): ${excelProps.length} propiedades`);
    console.log(`📅 SCRAPER HOY: ${scraperProps.length} propiedades`);
    console.log(`📊 Diferencia: ${scraperProps.length - excelProps.length > 0 ? '+' : ''}${scraperProps.length - excelProps.length}`);

    console.log(`\n✅ PROPIEDADES COMUNES (en ambos): ${comunes.length}`);
    console.log(`✨ PROPIEDADES NUEVAS (solo en scraper HOY): ${nuevas.length}`);
    console.log(`❌ PROPIEDADES ELIMINADAS (solo en Excel AYER): ${eliminadas.length}`);

    if (nuevas.length > 0) {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`✨ PROPIEDADES NUEVAS (${nuevas.length}):`);
        console.log('─'.repeat(80));
        nuevas.forEach((prop, i) => {
            console.log(`\n${i + 1}. ${prop.title}`);
            console.log(`   💰 ${prop.price}`);
            console.log(`   🔗 ${prop.url}`);
            console.log(`   📅 Scrapeada: ${new Date(prop.scrapedAt).toLocaleString('es-MX')}`);
        });
    }

    if (eliminadas.length > 0) {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`❌ PROPIEDADES ELIMINADAS (${eliminadas.length}):`);
        console.log('─'.repeat(80));
        eliminadas.forEach((prop, i) => {
            console.log(`\n${i + 1}. ${prop.title}`);
            console.log(`   💰 ${prop.price}`);
            console.log(`   🔗 ${prop.url}`);
        });
    }

    console.log('\n' + '='.repeat(80));
    console.log('📈 RESUMEN:');
    console.log('='.repeat(80));
    console.log(`Excel AYER (primeras 60): ${excelProps.length}`);
    console.log(`Scraper HOY: ${scraperProps.length}`);
    console.log(`Comunes: ${comunes.length}`);
    console.log(`Nuevas HOY: ${nuevas.length}`);
    console.log(`Eliminadas desde AYER: ${eliminadas.length}`);
    console.log('='.repeat(80) + '\n');
}

// =============== EJECUCIÓN PRINCIPAL ===============

async function main() {
    try {
        console.log('🚀 Iniciando comparación Excel AYER vs Scraper HOY...\n');

        // 1. Cargar datos del Excel (primeras 60 de ayer)
        const excelProps = loadExcelProperties();

        // 2. Cargar datos del scraper (hoy)
        const scraperProps = loadScraperProperties();

        if (excelProps.length === 0 || scraperProps.length === 0) {
            console.error('❌ No hay datos suficientes para comparar');
            process.exit(1);
        }

        // 3. Comparar
        const comparison = compareProperties(excelProps, scraperProps);

        // 4. Generar reporte
        generateReport(excelProps, scraperProps, comparison);

        console.log('✅ Comparación completada exitosamente\n');

    } catch (error) {
        console.error('❌ Error en la comparación:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
