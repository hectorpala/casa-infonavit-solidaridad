/**
 * Script para obtener códigos postales de Los Mochis desde micodigopostal.org
 * y actualizar el archivo colonias-los-mochis.json
 */

const https = require('https');
const fs = require('fs');

console.log('📥 Obteniendo códigos postales de Los Mochis desde micodigopostal.org...\n');

const url = 'https://micodigopostal.org/sinaloa/ahome/';

https.get(url, (res) => {
    let html = '';

    res.on('data', (chunk) => {
        html += chunk;
    });

    res.on('end', () => {
        console.log('✅ Página descargada, extrayendo códigos postales...\n');

        // Regex para extraer colonias y CPs del HTML
        // Formato: <td>Colonia</td><td>CP</td>
        const regex = /<tr[^>]*>.*?<td[^>]*>([^<]+)<\/td>.*?<td[^>]*>(\d{5})<\/td>/gs;

        const cpMap = {};
        let match;
        let count = 0;

        while ((match = regex.exec(html)) !== null) {
            const colonia = match[1].trim();
            const cp = match[2].trim();

            // Solo tomar colonias de Los Mochis (excluir otros municipios de Ahome)
            // Por ahora tomamos todas y luego filtramos manualmente
            cpMap[colonia] = cp;
            count++;
        }

        console.log(`Códigos postales extraídos: ${count}`);

        // Cargar nuestro archivo actual de colonias
        const coloniasData = JSON.parse(fs.readFileSync('colonias-los-mochis.json', 'utf8'));

        console.log(`\nColonias en nuestro archivo: ${coloniasData.colonias.length}`);

        // Actualizar códigos postales
        let updated = 0;
        let notFound = 0;

        coloniasData.colonias.forEach(col => {
            const nombre = col.nombre.toUpperCase();

            // Buscar coincidencia exacta primero
            if (cpMap[nombre]) {
                col.codigoPostal = cpMap[nombre];
                updated++;
            } else {
                // Buscar coincidencia parcial
                const found = Object.keys(cpMap).find(key =>
                    key.includes(nombre) || nombre.includes(key)
                );

                if (found) {
                    col.codigoPostal = cpMap[found];
                    updated++;
                } else {
                    // Asignar CP genérico de Los Mochis centro
                    col.codigoPostal = '81200';
                    notFound++;
                }
            }
        });

        console.log(`\nActualizadas: ${updated}`);
        console.log(`No encontradas (asignado 81200): ${notFound}`);

        // Guardar archivo actualizado
        fs.writeFileSync('colonias-los-mochis.json', JSON.stringify(coloniasData, null, 2), 'utf8');
        console.log('\n✅ Archivo colonias-los-mochis.json actualizado con códigos postales');
    });
}).on('error', (err) => {
    console.error('❌ Error:', err.message);
});
