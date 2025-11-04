const https = require('https');
const fs = require('fs');

https.get('https://gaia.inegi.org.mx/wscatgeo/v2/asentamientos/25/011', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const inegiData = JSON.parse(data);
        const asentamientos = inegiData.datos || [];
        
        console.log('ANALISIS DE DUPLICADOS LOS MOCHIS:\n');
        
        // Agrupar por nombre
        const grouped = {};
        asentamientos.forEach(a => {
            const nombre = a.nom_asen;
            if (!grouped[nombre]) grouped[nombre] = [];
            grouped[nombre].push(a);
        });
        
        const nombresDuplicados = Object.keys(grouped).filter(n => grouped[n].length > 1);
        
        console.log('Total entradas INEGI:', asentamientos.length);
        console.log('Nombres unicos:', Object.keys(grouped).length);
        console.log('Nombres con duplicados:', nombresDuplicados.length);
        
        // Comparar con nuestro archivo
        const nuestro = JSON.parse(fs.readFileSync('colonias-los-mochis.json', 'utf8'));
        console.log('\nNuestro archivo:', nuestro.colonias.length, 'colonias');
        console.log('Diferencia:', asentamientos.length - nuestro.colonias.length, 'eliminados (duplicados correctos)');
    });
});
