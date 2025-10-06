const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Abriendo navegador...');

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

  console.log('📡 Navegando a wiggot.com...');
  await page.goto('https://wiggot.com', {
    waitUntil: 'domcontentloaded'
  });

  console.log('✅ Página cargada');
  console.log('💡 Cierra el modal manualmente presionando ESC varias veces');
  console.log('💡 O busca algún botón X en la esquina del modal');
  console.log('💡 El navegador permanecerá abierto.');

  // Mantener abierto
  await new Promise(() => {});
})();
