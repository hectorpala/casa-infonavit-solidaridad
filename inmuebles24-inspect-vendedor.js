const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-venta-de-casa-por-calle-mariano-escobedo-centro-de-la-143508352.html', {
        waitUntil: 'networkidle2'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const vendedorData = await page.evaluate(() => {
        const results = {
            nombres: [],
            telefonos: [],
            elementos: []
        };
        
        const bodyText = document.body.innerText;
        const bodyHTML = document.body.innerHTML;
        
        // Buscar "Alejandra" o nombres similares
        const nombreMatch = bodyText.match(/Alejandra/gi);
        if (nombreMatch) {
            results.nombres = [...new Set(nombreMatch)];
        }
        
        // Buscar patrones de teléfono "6671..." o "667 1..."
        const telefonoMatches = bodyText.matchAll(/\b(66[67]\s*\d)\s*[\d\s]{0,10}/gi);
        for (const match of telefonoMatches) {
            results.telefonos.push(match[0]);
        }
        
        // Buscar elementos que contengan "vendedor", "agente", "contacto"
        const allElements = Array.from(document.querySelectorAll('*'));
        allElements.forEach(el => {
            const text = el.textContent.trim();
            if (text.length < 200 && (
                text.toLowerCase().includes('alejandra') ||
                text.toLowerCase().includes('vendedor') ||
                text.toLowerCase().includes('agente') ||
                text.toLowerCase().includes('contacto')
            )) {
                results.elementos.push({
                    tag: el.tagName,
                    class: el.className,
                    text: text.substring(0, 100)
                });
            }
        });
        
        // Buscar en atributos data-* que puedan contener teléfono
        const dataAttributes = [];
        allElements.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('data-') && attr.value.includes('667')) {
                    dataAttributes.push({
                        element: el.tagName,
                        attr: attr.name,
                        value: attr.value
                    });
                }
            });
        });
        results.dataAttributes = dataAttributes;
        
        return results;
    });
    
    console.log('\n📊 DATOS DEL VENDEDOR EN HTML:\n');
    
    console.log('👤 Nombres encontrados:');
    if (vendedorData.nombres.length > 0) {
        vendedorData.nombres.forEach(n => console.log('   -', n));
    } else {
        console.log('   ❌ No encontrado');
    }
    
    console.log('\n📞 Teléfonos encontrados:');
    if (vendedorData.telefonos.length > 0) {
        vendedorData.telefonos.forEach(t => console.log('   -', t));
    } else {
        console.log('   ❌ No encontrado');
    }
    
    console.log('\n📋 Elementos relevantes (primeros 5):');
    vendedorData.elementos.slice(0, 5).forEach(el => {
        console.log(`   <${el.tag}> class="${el.class}"`);
        console.log(`   Text: "${el.text}"`);
        console.log('');
    });
    
    console.log('🔍 Data attributes con teléfono:');
    if (vendedorData.dataAttributes.length > 0) {
        vendedorData.dataAttributes.forEach(attr => {
            console.log(`   <${attr.element}> ${attr.attr}="${attr.value}"`);
        });
    } else {
        console.log('   ❌ No encontrado');
    }
    
    await browser.close();
})();
