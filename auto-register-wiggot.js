const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Generador de email temporal
function generateTempEmail() {
    const random = Math.random().toString(36).substring(7);
    return `wiggot_${random}@temporary-mail.net`;
}

// Generador de contraseña
function generatePassword() {
    return 'Wiggot2025!' + Math.random().toString(36).substring(7);
}

async function autoRegisterWiggot() {
    console.log('🤖 Iniciando registro automático en Wiggot...\n');
    
    const email = generateTempEmail();
    const password = generatePassword();
    
    console.log('📧 Email generado:', email);
    console.log('🔑 Contraseña generada:', password);
    console.log('\n⏳ Abriendo navegador...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        // Ir a página de registro
        await page.goto('https://new.wiggot.com/register', { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        
        console.log('✅ Página de registro cargada');
        console.log('\n📝 Por favor completa el registro manualmente con:');
        console.log('   Email:', email);
        console.log('   Contraseña:', password);
        console.log('\n⚠️  IMPORTANTE: Necesitarás un número de teléfono real');
        console.log('   Opciones:');
        console.log('   1. Tu número personal (más confiable)');
        console.log('   2. SMS-Activate: https://sms-activate.org/ ($0.50)');
        console.log('   3. Números temporales: https://receive-smss.com/ (gratis, puede fallar)');
        console.log('\n🔄 El navegador quedará abierto para que completes el registro...\n');
        
        // Esperar a que el usuario complete el registro
        await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minutos
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log('\n💾 Guardando credenciales en .env...');
    
    // Actualizar .env
    const fs = require('fs');
    let envContent = fs.readFileSync('.env', 'utf8');
    envContent = envContent.replace(/WIGGOT_EMAIL=.*/, `WIGGOT_EMAIL=${email}`);
    envContent = envContent.replace(/WIGGOT_PASSWORD=.*/, `WIGGOT_PASSWORD=${password}`);
    fs.writeFileSync('.env', envContent);
    
    console.log('✅ Credenciales guardadas en .env');
    console.log('\n📋 Resumen:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('\n🎉 ¡Listo! Ahora puedes usar el scraper de Wiggot');
}

autoRegisterWiggot().catch(console.error);
