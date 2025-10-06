const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Iniciando creación de cuenta en wiggot.com...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();

  // Generar credenciales aleatorias
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const email = `hector.test.${timestamp}@gmail.com`; // Puedes usar un email temporal real
  const password = `Wiggot2025!${randomStr}`;
  const nombre = 'Hector Palazuelos';

  console.log('\n📋 CREDENCIALES GENERADAS:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Nombre:', nombre);
  console.log('\n⚠️ GUARDA ESTAS CREDENCIALES!\n');

  console.log('📡 Navegando a wiggot.com...');
  await page.goto('https://wiggot.com', {
    waitUntil: 'networkidle2'
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('🔍 Buscando formulario de registro...');

  // Intentar encontrar y clickear botón de registro
  const registroClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    for (const btn of buttons) {
      const text = (btn.textContent || '').toLowerCase();
      if (text.includes('registr') || text.includes('sign up') ||
          text.includes('crear cuenta') || text.includes('unirse') ||
          text.includes('prueba gratuita')) {
        console.log('Clickeando:', text);
        btn.click();
        return true;
      }
    }
    return false;
  });

  if (registroClicked) {
    console.log('✅ Botón de registro clickeado');
  } else {
    console.log('⚠️ No se encontró botón de registro');
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Intentar llenar formulario
  console.log('📝 Intentando llenar formulario...');

  const formularioLlenado = await page.evaluate((email, password, nombre) => {
    // Buscar campos de email
    const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[placeholder*="email"], input[placeholder*="correo"]');
    if (emailInputs.length > 0) {
      emailInputs[0].value = email;
      emailInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Email ingresado');
    }

    // Buscar campos de password
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs.length > 0) {
      passwordInputs[0].value = password;
      passwordInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Password ingresado');
    }

    // Buscar campos de nombre
    const nameInputs = document.querySelectorAll('input[name*="name"], input[name*="nombre"], input[placeholder*="nombre"], input[placeholder*="name"]');
    if (nameInputs.length > 0) {
      nameInputs[0].value = nombre;
      nameInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Nombre ingresado');
    }

    return {
      email: emailInputs.length > 0,
      password: passwordInputs.length > 0,
      nombre: nameInputs.length > 0
    };
  }, email, password, nombre);

  console.log('Campos encontrados:', formularioLlenado);

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n✅ NAVEGADOR ABIERTO - COMPLETA EL REGISTRO MANUALMENTE');
  console.log('💡 El script llenó los campos automáticamente (si los encontró)');
  console.log('💡 Revisa el formulario y presiona "Enviar" o "Registrarse"');
  console.log('\n📋 TUS CREDENCIALES:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('\n💡 Si pide confirmación de email, dímelo y te ayudo.');
  console.log('💡 Presiona Ctrl+C cuando termines.\n');

  // Guardar credenciales en archivo
  const fs = require('fs');
  fs.writeFileSync('wiggot-credentials.txt', `
CREDENCIALES WIGGOT.COM
========================
Email: ${email}
Password: ${password}
Nombre: ${nombre}
Fecha: ${new Date().toISOString()}
  `.trim());

  console.log('✅ Credenciales guardadas en: wiggot-credentials.txt\n');

  // Mantener abierto
  await new Promise(() => {});
})();
