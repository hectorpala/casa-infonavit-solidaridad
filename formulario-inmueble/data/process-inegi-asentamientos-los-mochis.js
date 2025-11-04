/**
 * Script para descargar y procesar asentamientos de INEGI para Los Mochis
 * Fuente: API INEGI - Marco Geoestadístico
 * URL: https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/25/011
 *
 * Código Geo: 25/011 (25=Sinaloa, 011=Ahome - Los Mochis)
 */

const fs = require('fs');
const https = require('https');

console.log('📥 Descargando asentamientos de INEGI para Los Mochis...');
console.log('🌐 API: https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/25/011');

https.get('https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/25/011', (res) => {
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
                codigoPostal: '', // Los Mochis no tiene CP en esta API
                ciudad: 'Los Mochis',
                zona: 'Urbano'
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
                url: 'https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/25/011',
                fechaConsulta: new Date().toISOString(),
                municipio: 'Los Mochis',
                estado: 'Sinaloa',
                claveGeo: '25011',
                totalOriginal: asentamientos.length,
                totalProcesadas: coloniasProcesadas.length,
                tipos: porTipo
            },
            colonias: coloniasProcesadas
        };

        // Guardar archivo
        const outputPath = 'colonias-los-mochis.json';
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
