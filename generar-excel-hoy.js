/**
 * GENERAR EXCEL - Propiedades scrapeadas HOY
 *
 * Convierte el JSON del scraper de hoy a formato Excel
 */

const XLSX = require('xlsx');
const fs = require('fs');

// =============== CONFIGURACIÓN ===============
const JSON_FILE = 'inmuebles24-culiacan-historico.json';
const OUTPUT_EXCEL = 'scraper-por-dia-excel/propiedades-hoy-2025-10-14.xlsx';

// =============== FUNCIÓN PRINCIPAL ===============

function generarExcel() {
    console.log('🚀 Generando Excel de propiedades scrapeadas HOY...\n');

    // 1. Leer JSON del scraper
    console.log(`📂 Leyendo: ${JSON_FILE}`);
    const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
    const properties = data.properties || [];

    console.log(`   ✅ ${properties.length} propiedades encontradas`);
    console.log(`   📅 Última actualización: ${new Date(data.lastCheck).toLocaleString('es-MX')}\n`);

    // 2. Convertir a formato Excel
    const excelData = properties.map((prop, index) => ({
        '#': index + 1,
        'Título': prop.title || '',
        'Precio': prop.price || 'Consultar',
        'URL': prop.url || '',
        'Fecha Scraping': new Date(prop.scrapedAt).toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }));

    // 3. Crear workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 4. Ajustar anchos de columna
    worksheet['!cols'] = [
        { wch: 5 },   // #
        { wch: 100 }, // Título
        { wch: 20 },  // Precio
        { wch: 120 }, // URL
        { wch: 20 }   // Fecha
    ];

    // 5. Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Propiedades HOY');

    // 6. Escribir archivo Excel
    XLSX.writeFile(workbook, OUTPUT_EXCEL);

    console.log('✅ Excel generado exitosamente!\n');
    console.log('📁 Archivo:', OUTPUT_EXCEL);
    console.log('📊 Propiedades:', properties.length);
    console.log('📅 Fecha:', new Date().toLocaleDateString('es-MX'));
    console.log('\n💡 Puedes abrir el archivo con:');
    console.log(`   open "${OUTPUT_EXCEL}"\n`);
}

// =============== EJECUCIÓN ===============

try {
    generarExcel();
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
