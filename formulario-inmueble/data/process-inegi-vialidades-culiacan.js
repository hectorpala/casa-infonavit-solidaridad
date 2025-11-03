/**
 * Script para descargar y procesar vialidades de INEGI para Culiacán
 * Fuente: API INEGI - Catálogo de Vialidades
 * URL: https://gaia.inegi.org.mx/wscatgeo/v2/vialidades/25/006
 *
 * Código Geo: 25/006 (25=Sinaloa, 006=Culiacán)
 */

const fs = require('fs');
const https = require('https');

console.log('📥 Descargando vialidades de INEGI para Culiacán...');
console.log('🌐 API: https://gaia.inegi.org.mx/wscatgeo/v2/vialidades/25/006');

https.get('https://gaia.inegi.org.mx/wscatgeo/v2/vialidades/25/006', (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('✅ Datos descargados, procesando...');

        const inegiData = JSON.parse(data);
        const vialidades = inegiData.datos || [];

        console.log(`📊 Total vialidades INEGI: ${vialidades.length}`);

        // Procesar y limpiar vialidades
        const callesProcesadas = vialidades
            // Filtrar solo vialidades con nombre válido
            .filter(v => {
                const nombre = v.nomvial;
                // Excluir nombres numéricos cortos (1, 2, 3, etc.)
                if (/^\d{1,2}$/.test(nombre)) return false;
                // Excluir nombres vacíos o "SIN NOMBRE"
                if (!nombre || nombre === 'SIN NOMBRE') return false;
                return true;
            })
            // Crear nombre completo con tipo de vialidad
            .map(v => {
                const tipo = v.tipovial;
                const nombre = v.nomvial;

                // Construir nombre completo
                let nombreCompleto;
                if (tipo === 'CALLE') {
                    nombreCompleto = `Calle ${nombre}`;
                } else if (tipo === 'AVENIDA') {
                    nombreCompleto = `Av. ${nombre}`;
                } else if (tipo === 'BOULEVARD') {
                    nombreCompleto = `Blvd. ${nombre}`;
                } else if (tipo === 'PRIVADA') {
                    nombreCompleto = `Privada ${nombre}`;
                } else if (tipo === 'ANDADOR') {
                    nombreCompleto = `Andador ${nombre}`;
                } else if (tipo === 'CERRADA') {
                    nombreCompleto = `Cerrada ${nombre}`;
                } else if (tipo === 'PASEO') {
                    nombreCompleto = `Paseo ${nombre}`;
                } else if (tipo === 'CALZADA') {
                    nombreCompleto = `Calzada ${nombre}`;
                } else if (tipo === 'PROLONGACIÓN') {
                    nombreCompleto = `Prolongación ${nombre}`;
                } else {
                    nombreCompleto = `${tipo} ${nombre}`;
                }

                return {
                    nombre: nombreCompleto,
                    nombreOriginal: nombre,
                    tipo: tipo,
                    ambito: v.ambito
                };
            })
            // Eliminar duplicados por nombre completo
            .filter((v, index, self) =>
                index === self.findIndex(t => t.nombre === v.nombre)
            )
            // Ordenar alfabéticamente
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

        console.log(`🔍 Vialidades después de filtrar: ${callesProcesadas.length}`);

        // Contar por tipo
        const porTipo = callesProcesadas.reduce((acc, v) => {
            acc[v.tipo] = (acc[v.tipo] || 0) + 1;
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
                origen: 'INEGI - Catálogo de Vialidades',
                url: 'https://gaia.inegi.org.mx/wscatgeo/v2/vialidades/25/006',
                fechaConsulta: new Date().toISOString(),
                municipio: 'Culiacán',
                estado: 'Sinaloa',
                claveGeo: '25006',
                totalOriginal: vialidades.length,
                totalProcesadas: callesProcesadas.length,
                tipos: porTipo
            },
            calles: callesProcesadas.map(v => v.nombre)
        };

        // Guardar archivo completo
        const outputPath = 'calles-culiacan-completo.json';
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
        console.log('✅ Archivo completo creado:', outputPath);

        // Guardar versión detallada (con metadata por calle)
        const outputDetailed = {
            ...output,
            callesDetalle: callesProcesadas
        };
        const outputPathDetailed = 'calles-culiacan-detallado.json';
        fs.writeFileSync(outputPathDetailed, JSON.stringify(outputDetailed, null, 2), 'utf8');
        console.log('✅ Archivo detallado creado:', outputPathDetailed);

        console.log(`\n📈 RESUMEN:`);
        console.log(`   - Total INEGI: ${vialidades.length}`);
        console.log(`   - Procesadas (sin duplicados): ${callesProcesadas.length}`);
        console.log(`   - Tipos diferentes: ${Object.keys(porTipo).length}`);
    });
}).on('error', (err) => {
    console.error('❌ Error:', err.message);
});
