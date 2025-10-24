const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Buscando índice del script problemático...\n');

    const browser = await puppeteer.launch({
        headless: false,
        devtools: true
    });

    const page = await browser.newPage();

    console.log('📄 Cargando página...');
    await page.goto('https://casasenventa.info/culiacan/', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n🔎 PASO 1: Encontrar índice del script con "Carousel functionality"...\n');

    const scriptIndex = await page.evaluate(() => {
        return [...document.scripts].findIndex(s => s.textContent.includes('Carousel functionality'));
    });

    console.log(`📍 Índice del script: ${scriptIndex}`);

    console.log('\n🔎 PASO 2: Obtener información del script...\n');

    const scriptInfo = await page.evaluate((idx) => {
        const script = document.scripts[idx];
        if (!script) return { error: 'Script not found' };

        const text = script.textContent;
        return {
            index: idx,
            src: script.src || 'inline',
            length: text.length,
            firstLine: text.split('\n')[0].substring(0, 100),
            lastLine: text.split('\n').slice(-1)[0].substring(0, 100),
            lineCount: text.split('\n').length
        };
    }, scriptIndex);

    console.log('Información del script:');
    console.log(`  Índice: ${scriptInfo.index}`);
    console.log(`  Fuente: ${scriptInfo.src}`);
    console.log(`  Longitud: ${scriptInfo.length} caracteres`);
    console.log(`  Líneas: ${scriptInfo.lineCount}`);
    console.log(`  Primera línea: ${scriptInfo.firstLine}`);
    console.log(`  Última línea: ${scriptInfo.lastLine}`);

    console.log('\n🔎 PASO 3: Buscar "const" después de "}" sin punto y coma...\n');

    const constErrors = await page.evaluate((idx) => {
        const script = document.scripts[idx];
        const text = script.textContent;
        const lines = text.split('\n');
        const errors = [];

        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            const nextLine = lines[i + 1];

            // Buscar } seguido de const en la siguiente línea
            if (line.trim().endsWith('}') &&
                !line.trim().endsWith('};') &&
                !line.trim().endsWith('},') &&
                nextLine.trim().startsWith('const ')) {

                errors.push({
                    lineNum: i + 1,
                    line: line.trim().substring(Math.max(0, line.trim().length - 60)),
                    nextLine: nextLine.trim().substring(0, 60)
                });
            }
        }

        return errors;
    }, scriptIndex);

    if (constErrors.length > 0) {
        console.log(`❌ Encontrados ${constErrors.length} errores potenciales:\n`);
        constErrors.forEach((err, idx) => {
            console.log(`${idx + 1}. Línea ${err.lineNum}:`);
            console.log(`   Actual:    ...${err.line}`);
            console.log(`   Siguiente: ${err.nextLine}...`);
            console.log('');
        });
    } else {
        console.log('✅ No se encontraron patrones de } seguido de const\n');
    }

    console.log('\n⏸️  Navegador abierto por 20 segundos para inspección manual...\n');
    await new Promise(resolve => setTimeout(resolve, 20000));

    await browser.close();
})().catch(e => console.error('❌ Error fatal:', e.message));
