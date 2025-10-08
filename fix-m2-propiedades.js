const fs = require('fs');
const { execSync } = require('child_process');

const propiedadesAfectadas = [
    {
        propertyId: "145915393",
        slug: "venta-de-casa-3-recamaras-en-portalegre-en-culiacan",
        url: "https://www.inmuebles24.com/propiedades/clasificado/veclcain-venta-de-casa-3-recamaras-en-portalegre-en-culiacan-145915393.html"
    },
    {
        propertyId: "147424326",
        slug: "casa-en-privada-monaco-paseos-del-rey",
        url: "https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-privada-monaco-paseos-del-rey-147424326.html"
    },
    {
        propertyId: "143635683",
        slug: "casa-en-adolfo-lopez-mateos",
        url: "https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-adolfo-lopez-mateos-143635683.html"
    },
    {
        propertyId: "146594849",
        slug: "casa-en-venta-las-americas-br56",
        url: "https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-las-americas-br56-146594849.html"
    },
    {
        propertyId: "147048897",
        slug: "casa-en-fraccionamiento-stanza",
        url: "https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-fraccionamiento-stanza-147048897.html"
    },
    {
        propertyId: "146675321",
        slug: "casa-en-venta-en-inf-barrancos",
        url: "https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-en-inf.-barrancos-146675321.html"
    }
];

console.log('\n🔧 CORRECCIÓN AUTOMÁTICA DE M² INCORRECTOS');
console.log('='.repeat(60));
console.log(`📊 Total propiedades a corregir: ${propiedadesAfectadas.length}\n`);

async function corregirPropiedad(propiedad, index) {
    console.log(`\n[${ index + 1}/${propiedadesAfectadas.length}] 🏠 ${propiedad.slug}`);
    console.log('─'.repeat(60));

    try {
        // PASO 1: Eliminar del registro de duplicados
        console.log('   1️⃣  Eliminando del registro de duplicados...');
        const registroPath = 'inmuebles24-scraped-properties.json';
        let registro = JSON.parse(fs.readFileSync(registroPath, 'utf8'));
        const countBefore = registro.length;
        registro = registro.filter(p => p.propertyId !== propiedad.propertyId);
        const countAfter = registro.length;
        fs.writeFileSync(registroPath, JSON.stringify(registro, null, 2));
        console.log(`      ✅ Eliminada (${countBefore} → ${countAfter} propiedades)`);

        // PASO 2: Eliminar carpeta de la propiedad
        console.log('   2️⃣  Eliminando carpeta antigua...');
        const carpeta = `culiacan/${propiedad.slug}`;
        if (fs.existsSync(carpeta)) {
            fs.rmSync(carpeta, { recursive: true, force: true });
            console.log(`      ✅ Carpeta eliminada: ${carpeta}/`);
        } else {
            console.log(`      ⚠️  Carpeta no existe: ${carpeta}/`);
        }

        // PASO 3: Eliminar tarjeta del index
        console.log('   3️⃣  Eliminando tarjeta del index...');
        const indexPath = 'culiacan/index.html';
        let indexHtml = fs.readFileSync(indexPath, 'utf8');
        const cardStart = `<!-- BEGIN CARD-ADV ${propiedad.slug} -->`;
        const cardEnd = `<!-- END CARD-ADV ${propiedad.slug} -->`;

        if (indexHtml.includes(cardStart)) {
            const startIndex = indexHtml.indexOf(cardStart);
            const endIndex = indexHtml.indexOf(cardEnd, startIndex) + cardEnd.length;
            indexHtml = indexHtml.substring(0, startIndex) + indexHtml.substring(endIndex);

            // Limpiar líneas vacías extra
            indexHtml = indexHtml.replace(/\n\n\n+/g, '\n\n');

            fs.writeFileSync(indexPath, indexHtml);
            console.log(`      ✅ Tarjeta eliminada de culiacan/index.html`);
        } else {
            console.log(`      ⚠️  Tarjeta no encontrada en culiacan/index.html`);
        }

        // PASO 4: Re-scrapear con scraper corregido
        console.log('   4️⃣  Re-scrapeando con scraper corregido...');
        console.log(`      🔗 URL: ${propiedad.url}`);

        const result = execSync(
            `node inmuebles24-scraper-y-publicar.js "${propiedad.url}"`,
            {
                encoding: 'utf8',
                stdio: 'pipe',
                timeout: 180000 // 3 minutos timeout
            }
        );

        // Verificar si fue exitoso
        if (result.includes('✅ PROCESO COMPLETADO') || result.includes('publicado en GitHub')) {
            console.log(`      ✅ Re-scrapeada exitosamente`);

            // Extraer m² del resultado si aparecen
            const m2Match = result.match(/✅ M² detectados: (\d+)m² lote, (\d+)m² construcción/);
            if (m2Match) {
                console.log(`      📐 M² correctos: ${m2Match[1]}m² lote, ${m2Match[2]}m² construcción`);
            }
        } else if (result.includes('PROPIEDAD DUPLICADA')) {
            console.log(`      ⚠️  Detectada como duplicada (verificar registro)`);
        } else {
            console.log(`      ⚠️  Resultado incierto, revisar logs`);
        }

        // Pausa de 10 segundos entre propiedades para no saturar
        if (index < propiedadesAfectadas.length - 1) {
            console.log(`\n   ⏳ Esperando 10 segundos antes de la siguiente...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }

        return { slug: propiedad.slug, status: 'success' };

    } catch (error) {
        console.log(`      ❌ ERROR: ${error.message}`);
        return { slug: propiedad.slug, status: 'error', error: error.message };
    }
}

(async () => {
    const resultados = [];

    for (let i = 0; i < propiedadesAfectadas.length; i++) {
        const resultado = await corregirPropiedad(propiedadesAfectadas[i], i);
        resultados.push(resultado);
    }

    // RESUMEN FINAL
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(60));

    const exitosas = resultados.filter(r => r.status === 'success').length;
    const fallidas = resultados.filter(r => r.status === 'error').length;

    console.log(`✅ Exitosas: ${exitosas}/${propiedadesAfectadas.length}`);
    console.log(`❌ Fallidas: ${fallidas}/${propiedadesAfectadas.length}`);

    if (fallidas > 0) {
        console.log('\n❌ Propiedades con errores:');
        resultados.filter(r => r.status === 'error').forEach(r => {
            console.log(`   - ${r.slug}: ${r.error}`);
        });
    }

    console.log('\n✅ CORRECCIÓN COMPLETADA\n');
    console.log('📋 Próximos pasos:');
    console.log('   1. Verificar propiedades en culiacan/index.html');
    console.log('   2. Revisar m² en cada propiedad individual');
    console.log('   3. Commit cambios:');
    console.log('      git add .');
    console.log('      git commit -m "Fix: Corrección m² incorrectos en 6 propiedades Inmuebles24"');
    console.log('   4. Publicar: "publica ya"\n');

})();
