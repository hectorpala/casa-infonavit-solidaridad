const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Identificando script roto...\n');

    const browser = await puppeteer.launch({
        headless: false,
        devtools: true
    });

    const page = await browser.newPage();

    const errorScripts = [];

    // Capturar TODOS los errores con detalles completos
    page.on('pageerror', error => {
        // Intentar extraer información del stack
        const stack = error.stack || '';
        const match = stack.match(/at.*?(\d+):(\d+)/);

        errorScripts.push({
            message: error.message,
            stack: stack,
            lineMatch: match ? match[0] : 'No line info'
        });
    });

    console.log('📄 Cargando página...\n');
    await page.goto('https://casasenventa.info/culiacan/', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n📊 ERRORES CAPTURADOS:\n');

    if (errorScripts.length === 0) {
        console.log('✅ No se capturaron errores');
    } else {
        errorScripts.forEach((err, i) => {
            console.log(`\n${i + 1}. ${err.message}`);
            console.log(`   Location info: ${err.lineMatch}`);
            console.log(`   Stack (first 300 chars):`);
            console.log(`   ${err.stack.substring(0, 300)}`);
        });
    }

    // Ahora intentar evaluar cada script individualmente para ver cuál falla
    console.log('\n\n🔎 Evaluando scripts individualmente...\n');

    const scriptResults = await page.evaluate(() => {
        const results = [];
        const scripts = Array.from(document.scripts);

        scripts.forEach((script, index) => {
            if (!script.src && script.textContent.length > 100) {
                const text = script.textContent;
                const preview = text.substring(0, 80);
                const hasConst = text.includes('const ');

                results.push({
                    index,
                    length: text.length,
                    preview,
                    hasConst,
                    hasOpenMapModal: text.includes('openMapModal')
                });
            }
        });

        return results;
    });

    console.log(`Encontrados ${scriptResults.length} scripts inline:\n`);
    scriptResults.forEach((s, i) => {
        console.log(`${i + 1}. Script index ${s.index}: ${s.length} chars, hasConst: ${s.hasConst}, hasOpenMapModal: ${s.hasOpenMapModal}`);
        console.log(`   Preview: ${s.preview.substring(0, 60)}...`);
    });

    // Verificar si openMapModal existe
    console.log('\n\n🔍 Verificando openMapModal...\n');

    const modalCheck = await page.evaluate(() => {
        return {
            openMapModalExists: typeof openMapModal !== 'undefined',
            openMapModalType: typeof openMapModal,
            mapModalElement: !!document.getElementById('mapModal'),
            buttonElement: !!document.querySelector('button[onclick="openMapModal()"]')
        };
    });

    console.log('openMapModal definido:', modalCheck.openMapModalExists ? '✅' : '❌');
    console.log('Tipo:', modalCheck.openMapModalType);
    console.log('Modal element existe:', modalCheck.mapModalElement ? '✅' : '❌');
    console.log('Botón existe:', modalCheck.buttonElement ? '✅' : '❌');

    console.log('\n⏸️  Navegador abierto por 15 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 15000));

    await browser.close();
})().catch(e => console.error('❌ Error fatal:', e.message));
