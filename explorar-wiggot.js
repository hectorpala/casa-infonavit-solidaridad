const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Abriendo navegador...');

  const browser = await puppeteer.launch({
    headless: false, // Ventana visible
    defaultViewport: null, // Viewport natural
    args: [
      '--start-maximized', // Pantalla completa
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();

  console.log('📡 Navegando a wiggot.com...');
  await page.goto('https://wiggot.com', {
    waitUntil: 'domcontentloaded'
  });

  // Esperar a que cargue
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Intentar cerrar modal de login si aparece
  try {
    console.log('🔍 Buscando modal de login...');

    // Esperar un poco más por si el modal tarda en aparecer
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Primero intentar con ESC múltiples veces
    console.log('⌨️ Intentando cerrar con tecla ESC (3 intentos)...');
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Escape');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Intentar clickear fuera del modal (en el overlay/backdrop)
    console.log('🖱️ Intentando clickear fuera del modal...');
    try {
      await page.evaluate(() => {
        // Buscar overlay/backdrop y clickear
        const backdrop = document.querySelector('.modal-backdrop, .overlay, [class*="overlay"], [class*="backdrop"], [class*="modal-bg"]');
        if (backdrop) {
          backdrop.click();
        }

        // O clickear en body en esquina superior izquierda
        document.body.click();
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.log('ℹ️ No se pudo clickear overlay');
    }

    // Buscar botones de cerrar más agresivamente
    console.log('🔍 Buscando botones de cerrar...');
    const found = await page.evaluate(() => {
      // Buscar cualquier elemento que contenga texto de cerrar/saltar
      const allButtons = Array.from(document.querySelectorAll('button, a, span, div[role="button"]'));

      for (const btn of allButtons) {
        const text = (btn.textContent || '').toLowerCase();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();

        if (text.includes('cerrar') || text.includes('saltar') || text.includes('skip') ||
            text.includes('close') || text.includes('continuar sin') ||
            ariaLabel.includes('close') || ariaLabel.includes('cerrar') ||
            btn.classList.contains('close') || btn.classList.contains('modal-close')) {
          console.log('Encontrado botón:', text || ariaLabel);
          btn.click();
          return true;
        }
      }

      // Buscar X típico de modales
      const closeIcons = Array.from(document.querySelectorAll('svg, i, span')).filter(el => {
        const classes = el.className.toString();
        return classes.includes('close') || classes.includes('times') || classes.includes('x-');
      });

      if (closeIcons.length > 0) {
        closeIcons[0].click();
        return true;
      }

      return false;
    });

    if (found) {
      console.log('✅ Modal cerrado');
    } else {
      console.log('ℹ️ No se encontró botón de cerrar');
    }

  } catch (error) {
    console.log('ℹ️ Error al cerrar modal:', error.message);
  }

  console.log('✅ Navegador abierto - Ahora tienes el control');
  console.log('💡 El navegador se quedará abierto hasta que cierres esta terminal (Ctrl+C)');
  console.log('💡 Si aparece login, puedes cerrarlo manualmente con ESC o el botón X');

  // Mantener abierto indefinidamente
  await new Promise(() => {});
})();
