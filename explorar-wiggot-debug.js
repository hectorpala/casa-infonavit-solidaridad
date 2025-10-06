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

  // Esperar a que cargue completamente
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🔍 Inspeccionando estructura del modal...');

  // Inspeccionar y obtener info del modal
  const modalInfo = await page.evaluate(() => {
    const results = {
      modals: [],
      overlays: [],
      possibleCloseButtons: []
    };

    // Buscar todos los modales posibles
    const modalSelectors = [
      '[role="dialog"]',
      '.modal',
      '[class*="modal"]',
      '[class*="Modal"]',
      '[id*="modal"]',
      '[id*="Modal"]'
    ];

    modalSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.offsetParent !== null) { // Visible
          results.modals.push({
            tag: el.tagName,
            class: el.className,
            id: el.id,
            innerHTML: el.innerHTML.substring(0, 500)
          });
        }
      });
    });

    // Buscar overlays
    const overlaySelectors = [
      '.overlay',
      '[class*="overlay"]',
      '[class*="backdrop"]',
      '[class*="Backdrop"]'
    ];

    overlaySelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.offsetParent !== null) {
          results.overlays.push({
            tag: el.tagName,
            class: el.className,
            id: el.id
          });
        }
      });
    });

    // Buscar posibles botones de cerrar
    const allClickable = document.querySelectorAll('button, a, [role="button"], svg, i');
    allClickable.forEach(el => {
      const text = (el.textContent || '').trim().toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      const classes = el.className.toString().toLowerCase();

      if (text.includes('close') || text.includes('cerrar') || text.includes('saltar') || text.includes('skip') ||
          ariaLabel.includes('close') || ariaLabel.includes('cerrar') ||
          classes.includes('close') || classes.includes('x-')) {
        results.possibleCloseButtons.push({
          tag: el.tagName,
          text: text.substring(0, 50),
          ariaLabel: ariaLabel,
          class: el.className,
          id: el.id
        });
      }
    });

    return results;
  });

  console.log('\n📊 INFORMACIÓN DEL MODAL:');
  console.log('Modales encontrados:', modalInfo.modals.length);
  console.log('Overlays encontrados:', modalInfo.overlays.length);
  console.log('Posibles botones de cerrar:', modalInfo.possibleCloseButtons.length);

  if (modalInfo.possibleCloseButtons.length > 0) {
    console.log('\n🔘 BOTONES DE CERRAR DETECTADOS:');
    modalInfo.possibleCloseButtons.forEach((btn, idx) => {
      console.log(`  ${idx + 1}. ${btn.tag} - "${btn.text}" - class: ${btn.class}`);
    });
  }

  // Intentar cerrar usando la información detectada
  console.log('\n⚡ Intentando cerrar modal automáticamente...');

  const cerrado = await page.evaluate(() => {
    // Intentar clickear el primer botón de cerrar visible
    const allClickable = document.querySelectorAll('button, a, [role="button"]');

    for (const el of allClickable) {
      const text = (el.textContent || '').trim().toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      const classes = el.className.toString().toLowerCase();

      if (text.includes('close') || text.includes('cerrar') || text.includes('saltar') || text.includes('skip') ||
          ariaLabel.includes('close') || ariaLabel.includes('cerrar') ||
          classes.includes('close')) {

        // Verificar que sea visible
        if (el.offsetParent !== null) {
          console.log('Clickeando:', text || ariaLabel || classes);
          el.click();
          return true;
        }
      }
    }

    // Si no funcionó, presionar ESC via código
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 }));

    return false;
  });

  if (cerrado) {
    console.log('✅ Modal cerrado exitosamente');
  } else {
    console.log('⚠️ No se pudo cerrar automáticamente');
    console.log('💡 Intenta presionar ESC o buscar el botón X manualmente');
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n✅ Navegador listo - Tienes el control');
  console.log('💡 El navegador permanecerá abierto. Presiona Ctrl+C para cerrar.\n');

  // Mantener abierto
  await new Promise(() => {});
})();
