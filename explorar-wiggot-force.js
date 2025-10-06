const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Abriendo navegador...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // User-Agent realista
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('📡 Navegando a wiggot.com...');
  await page.goto('https://wiggot.com', {
    waitUntil: 'networkidle2'
  });

  // Esperar a que cargue
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('⚡ FORZANDO cierre del modal (removiendo del DOM)...');

  await page.evaluate(() => {
    // Remover todos los modales y overlays del DOM
    const selectors = [
      '[role="dialog"]',
      '.modal',
      '[class*="modal"]',
      '[class*="Modal"]',
      '[id*="modal"]',
      '[id*="Modal"]',
      '.overlay',
      '[class*="overlay"]',
      '[class*="backdrop"]',
      '[class*="Backdrop"]',
      '[class*="Overlay"]'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        console.log('Removiendo:', el.className || el.id);
        el.remove();
      });
    });

    // Restaurar scroll del body (los modales suelen bloquearlo)
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';

    // Remover clases que bloquean scroll
    document.body.classList.forEach(cls => {
      if (cls.includes('modal') || cls.includes('no-scroll') || cls.includes('overflow')) {
        document.body.classList.remove(cls);
      }
    });

    console.log('✅ Modal removido del DOM');
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('✅ Navegador listo - Modal eliminado completamente');
  console.log('💡 Ahora puedes navegar libremente sin el login');
  console.log('💡 El navegador permanecerá abierto. Presiona Ctrl+C para cerrar.\n');

  // Mantener abierto
  await new Promise(() => {});
})();
