/**
 * GENERADOR DE REPORTE DETALLADO
 * Compara histórico anterior con scraping actual
 */

const fs = require('fs');

// Cargar histórico actual
const historico = JSON.parse(fs.readFileSync('inmuebles24-culiacan-historico.json', 'utf-8'));

// Función para extraer ID único de URL
function extractPropertyId(url) {
    const match = url.match(/propiedades\/.*-(\d+)\.html/);
    return match ? match[1] : url;
}

// Función para determinar de qué página viene una propiedad (aproximado)
function getPageNumber(index) {
    return Math.floor(index / 30) + 1;
}

// Obtener propiedades actuales
const currentProperties = historico.properties;

// Obtener cambios del último changelog
const lastChange = historico.stats?.changeLog?.[historico.stats.changeLog.length - 1] || {};

// Crear sets de IDs
const currentIds = new Set(currentProperties.map(p => extractPropertyId(p.url)));

// Reconstruir histórico anterior simulado (restando las nuevas y sumando las eliminadas)
// NOTA: No tenemos el histórico anterior guardado, pero podemos inferir del changelog

console.log('🏠 REPORTE DETALLADO - INMUEBLES24 CULIACÁN');
console.log('='.repeat(80));
console.log(`\n📅 Fecha del último scraping: ${new Date(historico.lastCheck).toLocaleString('es-MX')}`);
console.log(`📊 Total propiedades actuales: ${currentProperties.length}`);

if (lastChange.nuevas || lastChange.eliminadas) {
    console.log(`\n🔄 Cambios detectados en última ejecución:`);
    console.log(`   ✨ Nuevas: ${lastChange.nuevas || 0}`);
    console.log(`   ❌ Eliminadas: ${lastChange.eliminadas || 0}`);
}

// Generar reporte en Markdown
let markdown = `# 📊 REPORTE DETALLADO - INMUEBLES24 CULIACÁN

**Fecha:** ${new Date(historico.lastCheck).toLocaleString('es-MX')}
**Total propiedades:** ${currentProperties.length}

---

## 📋 LISTA COMPLETA DE PROPIEDADES ACTUALES

`;

// Agrupar por páginas
const propertiesByPage = {};

currentProperties.forEach((property, index) => {
    const page = getPageNumber(index);
    if (!propertiesByPage[page]) {
        propertiesByPage[page] = [];
    }
    propertiesByPage[page].push({
        ...property,
        indexGlobal: index + 1,
        id: extractPropertyId(property.url)
    });
});

// Generar reporte por páginas
Object.keys(propertiesByPage).sort((a, b) => parseInt(a) - parseInt(b)).forEach(page => {
    const props = propertiesByPage[page];

    markdown += `\n### 📄 PÁGINA ${page} (${props.length} propiedades)\n\n`;

    props.forEach((prop, idx) => {
        markdown += `${idx + 1}. **ID:** ${prop.id}  \n`;
        markdown += `   **Título:** ${prop.title.substring(0, 100)}${prop.title.length > 100 ? '...' : ''}  \n`;
        markdown += `   **Precio:** ${prop.price}  \n`;
        markdown += `   **URL:** ${prop.url}  \n`;
        markdown += `   **Posición global:** #${prop.indexGlobal}  \n\n`;
    });
});

// Agregar estadísticas del changelog
if (historico.stats?.changeLog) {
    markdown += `\n---\n\n## 📈 HISTORIAL DE CAMBIOS\n\n`;
    markdown += `| Fecha | Nuevas | Eliminadas | Total |\n`;
    markdown += `|-------|--------|------------|-------|\n`;

    historico.stats.changeLog.slice(-10).forEach(log => {
        const fecha = new Date(log.date).toLocaleString('es-MX');
        markdown += `| ${fecha} | ${log.nuevas} | ${log.eliminadas} | ${log.total} |\n`;
    });
}

// Agregar resumen de IDs únicos
markdown += `\n---\n\n## 🔑 LISTADO DE IDs ÚNICOS\n\n`;
markdown += `Total de IDs únicos: ${currentIds.size}\n\n`;
markdown += '```\n';
Array.from(currentIds).sort().forEach((id, idx) => {
    if (idx > 0 && idx % 10 === 0) markdown += '\n';
    markdown += id + (idx < currentIds.size - 1 ? ', ' : '');
});
markdown += '\n```\n';

// Guardar reporte
const filename = `REPORTE-INMUEBLES24-${new Date().toISOString().split('T')[0]}.md`;
fs.writeFileSync(filename, markdown, 'utf-8');

console.log(`\n✅ Reporte generado: ${filename}`);
console.log(`📄 Total de líneas: ${markdown.split('\n').length}`);
console.log(`📏 Tamaño: ${Math.round(markdown.length / 1024)} KB`);

// También generar CSV simple
let csv = 'ID,Título,Precio,URL,Página,Posición\n';
currentProperties.forEach((prop, index) => {
    const id = extractPropertyId(prop.url);
    const page = getPageNumber(index);
    const title = prop.title.replace(/"/g, '""').substring(0, 150);
    csv += `"${id}","${title}","${prop.price}","${prop.url}","${page}","${index + 1}"\n`;
});

const csvFilename = `REPORTE-INMUEBLES24-${new Date().toISOString().split('T')[0]}.csv`;
fs.writeFileSync(csvFilename, csv, 'utf-8');

console.log(`✅ CSV generado: ${csvFilename}`);
console.log(`\n🎯 Los reportes contienen TODAS las ${currentProperties.length} propiedades actuales`);
console.log(`   organizadas por páginas (30 propiedades por página aprox.)\n`);
