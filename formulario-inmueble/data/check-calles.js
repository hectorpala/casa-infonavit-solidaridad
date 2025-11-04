const https = require('https');
const fs = require('fs');

https.get('https://gaia.inegi.org.mx/wscatgeo/v2/vialidades/25/011', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const inegiData = JSON.parse(data);
        const vialidades = inegiData.datos || [];
        
        console.log('ANALISIS DE CALLES LOS MOCHIS:\n');
        console.log('Total vialidades INEGI:', vialidades.length);
        
        // Ver cuántas excluimos por filtros
        const sinNombre = vialidades.filter(v => !v.nomvial || v.nomvial === 'SIN NOMBRE').length;
        const numericas = vialidades.filter(v => /^\d{1,2}$/.test(v.nomvial)).length;
        
        console.log('Sin nombre o "SIN NOMBRE":', sinNombre);
        console.log('Solo numeros (1, 2, 3...):', numericas);
        console.log('Validas:', vialidades.length - sinNombre - numericas);
        
        // Ahora contar duplicados en las validas
        const validas = vialidades.filter(v => {
            const nombre = v.nomvial;
            if (/^\d{1,2}$/.test(nombre)) return false;
            if (!nombre || nombre === 'SIN NOMBRE') return false;
            return true;
        });
        
        // Crear nombres completos como hacemos en el script
        const nombresCompletos = validas.map(v => {
            const tipo = v.tipovial;
            const nombre = v.nomvial;
            let nombreCompleto;
            if (tipo === 'CALLE') {
                nombreCompleto = `Calle ${nombre}`;
            } else if (tipo === 'AVENIDA') {
                nombreCompleto = `Av. ${nombre}`;
            } else if (tipo === 'BOULEVARD') {
                nombreCompleto = `Blvd. ${nombre}`;
            } else {
                nombreCompleto = `${tipo} ${nombre}`;
            }
            return nombreCompleto;
        });
        
        const unicos = new Set(nombresCompletos).size;
        
        console.log('\nDespues de crear nombres completos:');
        console.log('Total con formato:', nombresCompletos.length);
        console.log('Unicos sin duplicados:', unicos);
        console.log('Duplicados eliminados:', nombresCompletos.length - unicos);
        
        // Comparar con nuestro archivo
        const nuestro = JSON.parse(fs.readFileSync('calles-los-mochis.json', 'utf8'));
        console.log('\nNuestro archivo:', nuestro.calles.length, 'calles');
        console.log('Match:', nuestro.calles.length === unicos ? 'SI' : 'NO');
    });
});
