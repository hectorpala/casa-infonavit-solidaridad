/**
 * Script de validación para datasets de García, Nuevo León
 * Genera reporte de discrepancias y tabla de validación
 */

const fs = require('fs');

console.log('🔍 VALIDACIÓN DE DATASETS - GARCÍA, NUEVO LEÓN\n');
console.log('═'.repeat(80));

// Cargar datos fusionados
const coloniasData = JSON.parse(fs.readFileSync('colonias-garcia.json', 'utf8'));
const callesData = JSON.parse(fs.readFileSync('calles-garcia.json', 'utf8'));

const colonias = coloniasData.colonias || [];
const calles = callesData.calles || [];

// ============================================================================
// VALIDACIÓN COLONIAS
// ============================================================================

console.log('\n📍 VALIDANDO COLONIAS...\n');

// 1. Colonias sin código postal
const coloniasSinCP = colonias.filter(c => !c.codigoPostal || c.codigoPostal === '');
console.log(`⚠️  Colonias sin código postal: ${coloniasSinCP.length}`);

// 2. Nombres inconsistentes (caracteres especiales extraños)
const coloniasSospechosas = colonias.filter(c => {
    const nombre = c.nombre;
    // Detectar números solos, caracteres raros, etc.
    return /[^a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s\d\-\.,()]/.test(nombre) || /^\d+$/.test(nombre);
});
console.log(`⚠️  Colonias con nombres sospechosos: ${coloniasSospechosas.length}`);

// 3. Distribución por fuente
const coloniasPorFuente = colonias.reduce((acc, c) => {
    acc[c.fuente] = (acc[c.fuente] || 0) + 1;
    return acc;
}, {});

// 4. Distribución por tipo
const coloniasPorTipo = colonias.reduce((acc, c) => {
    acc[c.tipo] = (acc[c.tipo] || 0) + 1;
    return acc;
}, {});

// ============================================================================
// VALIDACIÓN CALLES
// ============================================================================

console.log('\n🛣️  VALIDANDO CALLES...\n');

// 1. Calles sin tipo específico
const callesSinTipo = calles.filter(c => {
    const cUpper = c.toUpperCase();
    return !cUpper.includes('CALLE') &&
           !cUpper.includes('AVENIDA') &&
           !cUpper.includes('AV.') &&
           !cUpper.includes('BOULEVARD') &&
           !cUpper.includes('BLVD') &&
           !cUpper.includes('PRIVADA') &&
           !cUpper.includes('CIRCUITO') &&
           !cUpper.includes('RETORNO') &&
           !cUpper.includes('ANDADOR') &&
           !cUpper.includes('CALLEJÓN') &&
           !cUpper.includes('CERRADA') &&
           !cUpper.includes('PASEO') &&
           !cUpper.includes('CALZADA');
});
console.log(`⚠️  Calles sin tipo específico: ${callesSinTipo.length}`);

// 2. Nombres inconsistentes
const callesSospechosas = calles.filter(c => {
    // Detectar nombres muy cortos (posibles errores)
    return c.trim().length < 5 || /^\d+$/.test(c);
});
console.log(`⚠️  Calles con nombres sospechosos: ${callesSospechosas.length}`);

// ============================================================================
// TABLA DE DISCREPANCIAS
// ============================================================================

const discrepancias = [];

// Agregar colonias sin CP a discrepancias
if (coloniasSinCP.length > 0) {
    discrepancias.push({
        tipo: 'Colonias sin CP',
        cantidad: coloniasSinCP.length,
        ejemplos: coloniasSinCP.slice(0, 5).map(c => c.nombre),
        severidad: 'Media',
        recomendacion: 'Validar con SEPOMEX o fuentes locales'
    });
}

// Agregar colonias con nombres sospechosos
if (coloniasSospechosas.length > 0) {
    discrepancias.push({
        tipo: 'Colonias nombres sospechosos',
        cantidad: coloniasSospechosas.length,
        ejemplos: coloniasSospechosas.slice(0, 5).map(c => c.nombre),
        severidad: 'Baja',
        recomendacion: 'Revisar manualmente y normalizar nombres'
    });
}

// Agregar calles sin tipo
if (callesSinTipo.length > 0) {
    discrepancias.push({
        tipo: 'Calles sin tipo específico',
        cantidad: callesSinTipo.length,
        ejemplos: callesSinTipo.slice(0, 10),
        severidad: 'Baja',
        recomendacion: 'Agregar prefijo "Calle" si corresponde'
    });
}

// Agregar calles con nombres sospechosos
if (callesSospechosas.length > 0) {
    discrepancias.push({
        tipo: 'Calles nombres sospechosos',
        cantidad: callesSospechosas.length,
        ejemplos: callesSospechosas.slice(0, 10),
        severidad: 'Media',
        recomendacion: 'Revisar y validar con fuentes oficiales'
    });
}

// ============================================================================
// GENERAR REPORTE
// ============================================================================

const reporte = {
    metadata: {
        municipio: 'García',
        estado: 'Nuevo León',
        claveGeoestadistica: '19/018',
        fechaValidacion: new Date().toISOString().split('T')[0],
        version: '1.0'
    },
    resumen: {
        colonias: {
            total: colonias.length,
            conCP: colonias.length - coloniasSinCP.length,
            sinCP: coloniasSinCP.length,
            porcentajeConCP: ((colonias.length - coloniasSinCP.length) / colonias.length * 100).toFixed(1)
        },
        calles: {
            total: calles.length,
            conTipo: calles.length - callesSinTipo.length,
            sinTipo: callesSinTipo.length,
            porcentajeConTipo: ((calles.length - callesSinTipo.length) / calles.length * 100).toFixed(1)
        }
    },
    fuentes: {
        colonias: coloniasPorFuente,
        calles: callesData.metadata.fuentes
    },
    distribuciones: {
        coloniasPorTipo: coloniasPorTipo,
        callesPorTipo: callesData.metadata.tipos
    },
    discrepancias: discrepancias,
    recomendacionesMantenimiento: {
        frecuenciaActualizacion: {
            INEGI: 'Anual (actualización del Marco Geoestadístico)',
            SEPOMEX: 'Trimestral (nuevos fraccionamientos)',
            OSM: 'Mensual (datos de comunidad)'
        },
        pasosActualizacion: [
            '1. Re-ejecutar scripts de extracción (INEGI primero)',
            '2. Ejecutar scripts de fusión (INEGI + complementos)',
            '3. Validar con este script (validate-garcia.js)',
            '4. Revisar discrepancias manualmente',
            '5. Actualizar archivos finales en producción',
            '6. Actualizar cache busting y publicar'
        ]
    }
};

// Guardar reporte
const reportePath = 'validation-report-garcia.json';
fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2), 'utf8');

// ============================================================================
// DISPLAY RESULTADOS
// ============================================================================

console.log('\n' + '═'.repeat(80));
console.log('\n📊 RESUMEN DE VALIDACIÓN\n');

console.log('📍 COLONIAS:');
console.log(`   Total:              ${colonias.length}`);
console.log(`   Con código postal:  ${colonias.length - coloniasSinCP.length} (${reporte.resumen.colonias.porcentajeConCP}%)`);
console.log(`   Sin código postal:  ${coloniasSinCP.length}`);

console.log('\n📈 Por fuente:');
Object.entries(coloniasPorFuente)
    .sort((a, b) => b[1] - a[1])
    .forEach(([fuente, count]) => {
        console.log(`   - ${fuente}: ${count}`);
    });

console.log('\n📊 Por tipo (top 5):');
Object.entries(coloniasPorTipo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([tipo, count]) => {
        console.log(`   - ${tipo}: ${count}`);
    });

console.log('\n🛣️  CALLES:');
console.log(`   Total:              ${calles.length}`);
console.log(`   Con tipo definido:  ${calles.length - callesSinTipo.length} (${reporte.resumen.calles.porcentajeConTipo}%)`);
console.log(`   Sin tipo:           ${callesSinTipo.length}`);

console.log('\n📈 Por fuente:');
Object.entries(callesData.metadata.fuentes).forEach(([fuente, count]) => {
    console.log(`   - ${fuente}: ${count}`);
});

console.log('\n' + '═'.repeat(80));
console.log('\n⚠️  DISCREPANCIAS DETECTADAS\n');

if (discrepancias.length === 0) {
    console.log('✅ No se detectaron discrepancias significativas');
} else {
    discrepancias.forEach((disc, index) => {
        console.log(`${index + 1}. ${disc.tipo}`);
        console.log(`   Cantidad:       ${disc.cantidad}`);
        console.log(`   Severidad:      ${disc.severidad}`);
        console.log(`   Recomendación:  ${disc.recomendacion}`);
        console.log(`   Ejemplos:`);
        disc.ejemplos.forEach(ej => console.log(`      - ${ej}`));
        console.log('');
    });
}

console.log('═'.repeat(80));
console.log('\n📝 RECOMENDACIONES DE MANTENIMIENTO\n');

console.log('🔄 Frecuencia de actualización:');
Object.entries(reporte.recomendacionesMantenimiento.frecuenciaActualizacion).forEach(([fuente, freq]) => {
    console.log(`   - ${fuente}: ${freq}`);
});

console.log('\n📋 Pasos para actualizar:');
reporte.recomendacionesMantenimiento.pasosActualizacion.forEach(paso => {
    console.log(`   ${paso}`);
});

console.log('\n' + '═'.repeat(80));
console.log(`\n💾 Reporte generado: ${reportePath}`);
console.log(`   Tamaño: ${(fs.statSync(reportePath).size / 1024).toFixed(1)} KB`);
console.log('\n✅ VALIDACIÓN COMPLETADA\n');
console.log('═'.repeat(80));
