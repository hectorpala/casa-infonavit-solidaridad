/**
 * GENERADOR DE EXCEL - PROPIEDADES INMUEBLES24
 * Convierte el JSON de propiedades a formato Excel
 */

const fs = require('fs');
const XLSX = require('xlsx');

// Leer el archivo JSON
const historico = JSON.parse(fs.readFileSync('inmuebles24-culiacan-historico.json', 'utf8'));

// Preparar datos para Excel
const excelData = historico.properties.map((prop, index) => {
    // Extraer precio numérico
    const priceMatch = prop.price.match(/[\d,]+/);
    const priceNumeric = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;

    // Extraer ID de la URL (7+ dígitos)
    const idMatch = prop.url.match(/-(\d{7,})-/) || prop.url.match(/(\d{7,})\.html/);
    const propertyId = idMatch ? idMatch[1] : 'N/A';

    return {
        '#': index + 1,
        'ID Propiedad': propertyId,
        'Ubicación': prop.location || 'Sin ubicación',
        'Precio': prop.price,
        'Precio (Numérico)': priceNumeric,
        'Título': prop.title,
        'URL': prop.url,
        'Fecha Scrape': new Date(prop.scrapedAt).toLocaleString('es-MX')
    };
});

// Crear workbook
const wb = XLSX.utils.book_new();

// Crear hoja de propiedades
const ws = XLSX.utils.json_to_sheet(excelData);

// Ajustar anchos de columnas
ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 12 },  // ID Propiedad
    { wch: 35 },  // Ubicación
    { wch: 15 },  // Precio
    { wch: 15 },  // Precio Numérico
    { wch: 80 },  // Título
    { wch: 100 }, // URL
    { wch: 20 }   // Fecha
];

// Agregar la hoja al workbook
XLSX.utils.book_append_sheet(wb, ws, 'Propiedades');

// Crear hoja de resumen
const resumenData = [
    { 'Métrica': 'Total Propiedades', 'Valor': historico.properties.length },
    { 'Métrica': 'Última Verificación', 'Valor': new Date(historico.lastCheck).toLocaleString('es-MX') },
    { 'Métrica': 'Precio Mínimo', 'Valor': `$${Math.min(...excelData.map(p => p['Precio (Numérico)'])).toLocaleString()}` },
    { 'Métrica': 'Precio Máximo', 'Valor': `$${Math.max(...excelData.map(p => p['Precio (Numérico)'])).toLocaleString()}` },
    { 'Métrica': 'Precio Promedio', 'Valor': `$${Math.round(excelData.reduce((sum, p) => sum + p['Precio (Numérico)'], 0) / excelData.length).toLocaleString()}` },
    { 'Métrica': 'Nuevas Detectadas (último)', 'Valor': historico.stats.nuevasDetectadas },
    { 'Métrica': 'Eliminadas Detectadas (último)', 'Valor': historico.stats.eliminadasDetectadas }
];

const wsResumen = XLSX.utils.json_to_sheet(resumenData);
wsResumen['!cols'] = [{ wch: 30 }, { wch: 30 }];
XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

// Crear hoja de historial de cambios
const changeLogData = historico.stats.changeLog.map((log, index) => ({
    '#': index + 1,
    'Fecha': new Date(log.date).toLocaleString('es-MX'),
    'Nuevas': log.nuevas,
    'Eliminadas': log.eliminadas,
    'Total': log.total
}));

const wsChangeLog = XLSX.utils.json_to_sheet(changeLogData);
wsChangeLog['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 10 }];
XLSX.utils.book_append_sheet(wb, wsChangeLog, 'Historial Cambios');

// Guardar archivo
const filename = `propiedades-culiacan-${new Date().toISOString().split('T')[0]}.xlsx`;
XLSX.writeFile(wb, filename);

console.log(`✅ Archivo Excel generado: ${filename}`);
console.log(`📊 Total propiedades: ${historico.properties.length}`);
console.log(`📄 Hojas creadas: Propiedades, Resumen, Historial Cambios`);
