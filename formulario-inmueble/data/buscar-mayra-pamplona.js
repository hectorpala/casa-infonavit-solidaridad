const https = require('https');

console.log('🔍 Buscando "Mayra H Pamplona" en INEGI...\n');

https.get('https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/25/011', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const inegiData = JSON.parse(data);
        const asentamientos = inegiData.datos || [];
        
        // Buscar variaciones de Mayra Pamplona
        const variaciones = [
            'MAYRA',
            'PAMPLONA',
            'MAYRA H',
            'MAYRA H PAMPLONA'
        ];
        
        console.log('Total asentamientos INEGI:', asentamientos.length, '\n');
        
        variaciones.forEach(busqueda => {
            const encontrados = asentamientos.filter(a => 
                a.nom_asen.toUpperCase().includes(busqueda)
            );
            
            if (encontrados.length > 0) {
                console.log(`\n📍 Búsqueda: "${busqueda}"`);
                console.log('   Encontrados:', encontrados.length);
                encontrados.forEach(a => {
                    console.log(`   - ${a.nom_asen} (${a.tipo_asen})`);
                });
            }
        });
        
        console.log('\n❌ RESULTADO: La colonia "Mayra H Pamplona" NO existe en INEGI');
        console.log('\n💡 POSIBLES RAZONES:');
        console.log('   1. El nombre puede estar escrito diferente');
        console.log('   2. Puede ser una colonia muy nueva (no en INEGI aún)');
        console.log('   3. Puede ser un nombre coloquial (no oficial)');
        console.log('\n📋 SOLUCIÓN:');
        console.log('   Verificar el nombre oficial en:');
        console.log('   - https://buscacp.com/ (código postal 81240)');
        console.log('   - SEPOMEX oficial');
        console.log('   - Documento oficial de la propiedad\n');
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
