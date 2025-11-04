/**
 * Script para descargar y procesar asentamientos de INEGI para García
 * Fuente: API INEGI - Marco Geoestadístico
 * URL: https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/19/018
 *
 * Código Geo: 19/018 (19=Nuevo León, 018=García)
 */

const fs = require('fs');
const https = require('https');

console.log('📥 Descargando asentamientos de INEGI para García...');
console.log('🌐 API: https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/19/018');

https.get('https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/19/018', (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('✅ Datos descargados, procesando...');

        const inegiData = JSON.parse(data);
        const asentamientos = inegiData.datos || [];

        console.log(`📊 Total asentamientos INEGI: ${asentamientos.length}`);

        // Procesar y limpiar asentamientos
        const coloniasProcesadas = asentamientos
            // Filtrar solo asentamientos con nombre válido
            .filter(a => {
                const nombre = a.nom_asen;
                if (!nombre || nombre === 'SIN NOMBRE') return false;
                return true;
            })
            // Mapear a estructura limpia
            .map(a => ({
                tipo: a.tipo_asen || 'Colonia',
                nombre: a.nom_asen,
                codigoPostal: a.codigo_postal || '',
                ciudad: 'García',
                estado: 'Nuevo León',
                zona: a.ambito || 'Urbano',
                fuente: 'INEGI'
            }))
            // Eliminar duplicados (mismo nombre)
            .filter((a, index, self) =>
                index === self.findIndex(t => t.nombre === a.nombre)
            )
            // Ordenar alfabéticamente
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

        console.log(`🔍 Asentamientos después de filtrar: ${coloniasProcesadas.length}`);

        // Contar por tipo
        const porTipo = coloniasProcesadas.reduce((acc, a) => {
            acc[a.tipo] = (acc[a.tipo] || 0) + 1;
            return acc;
        }, {});

        console.log('📊 Distribución por tipo:');
        Object.entries(porTipo)
            .sort((a, b) => b[1] - a[1])
            .forEach(([tipo, count]) => {
                console.log(`   - ${tipo}: ${count}`);
            });

        // Crear objeto final
        const output = {
            metadata: {
                origen: 'INEGI - Marco Geoestadístico Nacional',
                url: 'https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/19/018',
                fechaConsulta: new Date().toISOString().split('T')[0],
                municipio: 'García',
                estado: 'Nuevo León',
                claveGeo: '19018',
                codigoGeoestadistico: '19/018',
                totalOriginal: asentamientos.length,
                totalProcesadas: coloniasProcesadas.length,
                tipos: porTipo
            },
            colonias: coloniasProcesadas
        };

        // Guardar archivo
        const outputPath = 'colonias-inegi-garcia.json';
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
        console.log('✅ Archivo creado:', outputPath);

        console.log(`\n📈 RESUMEN:`);
        console.log(`   - Total INEGI: ${asentamientos.length}`);
        console.log(`   - Procesadas (sin duplicados): ${coloniasProcesadas.length}`);
        console.log(`   - Tipos diferentes: ${Object.keys(porTipo).length}`);
    });
}).on('error', (err) => {
    console.error('❌ Error:', err.message);
});
