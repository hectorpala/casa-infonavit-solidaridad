/**
 * Script para procesar datos de INEGI y crear JSON de colonias de Mazatlán
 * Fuente: API INEGI - Marco Geoestadístico
 * URL: https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/25/012
 */

const fs = require('fs');
const https = require('https');

// Mapeo de códigos postales conocidos de Mazatlán
const codigosPostales = {
    'CENTRO': '82000',
    'CENTRO HISTÓRICO': '82000',
    'OLAS ALTAS': '82000',
    'PALOS PRIETOS': '82010',
    'TELLERÍA': '82017',
    'BENITO JUÁREZ': '82020',
    'JUÁREZ': '82020',
    'INSURGENTES': '82030',
    'LAZARO CÁRDENAS': '82040',
    'INDEPENDENCIA': '82040',
    'PLAYAS DEL SUR': '82040',
    'GUADALUPE VICTORIA': '82050',
    'EMILIANO ZAPATA': '82060',
    'FRANCISCO VILLA': '82070',
    'SOLIDARIDAD': '82080',
    'MORELOS': '82090',
    'CERRITOS': '82100',
    'SÁBALO COUNTRY': '82100',
    'LAS PALMAS': '82100',
    'MARINA MAZATLÁN': '82103',
    'NUEVO MAZATLÁN': '82103',
    'HACIENDA DEL MAR': '82103',
    'BAHÍA': '82103',
    'COSTA DE ORO': '82103',
    'EL CID': '82110',
    'ZONA DORADA': '82110',
    'LOMAS DE MAZATLÁN': '82110',
    'GAVIOTAS NORTE': '82110',
    'PLAYAS DE MAZATLÁN': '82110',
    'LAS GAVIOTAS': '82110',
    'BONANZA': '82112',
    'JACARANDAS': '82127',
    'FERROCARRILERA': '82130',
    'RAFAEL BUELNA': '82148',
    'VILLA LAS FLORES': '82149',
    'LOS PINOS': '82149',
    'LÓPEZ MATEOS': '82180',
    'MIGUEL ALEMÁN': '82180',
    'ESPERANZA': '82190',
    'MONTUOSA': '82194',
    'ESTRELLA DEL MAR': '82267'
};

// Función para obtener código postal (estimado o conocido)
function getCodigoPostal(nombreColonia) {
    const nombreUpper = nombreColonia.toUpperCase().trim();

    // Buscar coincidencia exacta
    if (codigosPostales[nombreUpper]) {
        return codigosPostales[nombreUpper];
    }

    // Buscar coincidencia parcial
    for (const [key, value] of Object.entries(codigosPostales)) {
        if (nombreUpper.includes(key) || key.includes(nombreUpper)) {
            return value;
        }
    }

    // Código postal genérico de Mazatlán si no se encuentra
    return '82000';
}

// Función para mapear tipo de asentamiento
function mapTipoAsentamiento(tipoInegi) {
    const mapeo = {
        'COLONIA': 'Colonia',
        'FRACCIONAMIENTO': 'Fraccionamiento',
        'CONJUNTO HABITACIONAL': 'Conjunto Habitacional',
        'RESIDENCIAL': 'Residencial',
        'PRIVADA': 'Privada',
        'AMPLIACIÓN': 'Ampliación',
        'PARQUE INDUSTRIAL': 'Parque Industrial',
        'NINGUNO': 'Colonia'
    };
    return mapeo[tipoInegi] || 'Colonia';
}

console.log('📥 Descargando datos de INEGI...');

https.get('https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/25/012', (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('✅ Datos descargados, procesando...');

        const inegiData = JSON.parse(data);
        const asentamientos = inegiData.datos || [];

        console.log(`📊 Total asentamientos: ${asentamientos.length}`);

        // Filtrar y transformar datos
        const colonias = asentamientos
            .filter(a => {
                // Excluir tipos no relevantes
                const tiposExcluir = ['NINGUNO'];
                return !tiposExcluir.includes(a.tipo_asen);
            })
            .map(a => ({
                tipo: mapTipoAsentamiento(a.tipo_asen),
                nombre: a.nom_asen,
                codigoPostal: getCodigoPostal(a.nom_asen),
                ciudad: 'Mazatlán',
                zona: 'Urbano'
            }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre));

        // Crear objeto final
        const output = {
            metadata: {
                origen: 'INEGI - Marco Geoestadístico Nacional',
                url: 'https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/25/012',
                fechaConsulta: new Date().toISOString(),
                municipio: 'Mazatlán',
                estado: 'Sinaloa',
                claveGeo: '25012',
                totalEntradas: colonias.length,
                tipos: {
                    colonias: colonias.filter(c => c.tipo === 'Colonia').length,
                    fraccionamientos: colonias.filter(c => c.tipo === 'Fraccionamiento').length,
                    otros: colonias.filter(c => !['Colonia', 'Fraccionamiento'].includes(c.tipo)).length
                }
            },
            colonias: colonias
        };

        // Guardar archivo
        const outputPath = 'colonias-mazatlan.json';
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

        console.log('✅ Archivo creado:', outputPath);
        console.log(`📊 Estadísticas:`);
        console.log(`   - Total: ${output.colonias.length}`);
        console.log(`   - Colonias: ${output.metadata.tipos.colonias}`);
        console.log(`   - Fraccionamientos: ${output.metadata.tipos.fraccionamientos}`);
        console.log(`   - Otros: ${output.metadata.tipos.otros}`);
    });
}).on('error', (err) => {
    console.error('❌ Error:', err.message);
});
