const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Encontrando línea EXACTA del error con new Function()...\n');

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

    console.log('\n🔎 PASO 1: Extraer el script #5 y ejecutar con new Function()...\n');

    const errorInfo = await page.evaluate(() => {
        const scriptIndex = 5;
        const scriptText = document.scripts[scriptIndex].textContent;

        let errorResult = null;

        try {
            new Function(scriptText);
            errorResult = { success: true, message: '✅ new Function pasó sin errores' };
        } catch (err) {
            window.__errorLine = err.lineNumber;
            window.__errorColumn = err.columnNumber;
            window.__scriptText = scriptText;

            errorResult = {
                success: false,
                message: err.message,
                lineNumber: err.lineNumber,
                columnNumber: err.columnNumber
            };
        }

        return errorResult;
    });

    if (errorInfo.success) {
        console.log(errorInfo.message);
        console.log('\n⚠️  El script pasa new Function() sin errores, pero el navegador reporta error.');
        console.log('    Esto sugiere que el error es contextual (relacionado con el DOM/HTML).\n');
    } else {
        console.log('❌ ERROR ENCONTRADO:');
        console.log(`   Mensaje: ${errorInfo.message}`);
        console.log(`   Línea: ${errorInfo.lineNumber}`);
        console.log(`   Columna: ${errorInfo.columnNumber}\n`);

        console.log('🔎 PASO 2: Extraer el fragmento de código problemático...\n');

        const codeFragment = await page.evaluate(() => {
            const lines = window.__scriptText.split('\n');
            const errorLine = window.__errorLine;
            const errorCol = window.__errorColumn;

            const contextStart = Math.max(0, errorLine - 5);
            const contextEnd = Math.min(lines.length, errorLine + 3);

            const fragment = {
                errorLine: errorLine,
                errorColumn: errorCol,
                lineContent: lines[errorLine - 1],
                context: []
            };

            for (let i = contextStart; i < contextEnd; i++) {
                const marker = (i === errorLine - 1) ? '>>> ' : '    ';
                fragment.context.push({
                    lineNum: i + 1,
                    marker: marker,
                    content: lines[i].substring(0, 100)
                });
            }

            return fragment;
        });

        console.log('📍 FRAGMENTO DE CÓDIGO:\n');
        console.log(`Línea ${codeFragment.errorLine}, Columna ${codeFragment.errorColumn}:\n`);

        codeFragment.context.forEach(line => {
            console.log(`${line.marker}${line.lineNum}: ${line.content}`);
        });

        console.log('\n📋 LÍNEA EXACTA DEL ERROR:');
        console.log(`   ${codeFragment.lineContent}`);

        if (codeFragment.errorColumn) {
            const pointer = ' '.repeat(codeFragment.errorColumn - 1) + '^';
            console.log(`   ${pointer}`);
        }
    }

    console.log('\n⏸️  Navegador abierto por 20 segundos para inspección manual...\n');
    await new Promise(resolve => setTimeout(resolve, 20000));

    await browser.close();
})().catch(e => console.error('❌ Error fatal:', e.message));
