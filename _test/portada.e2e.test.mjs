// El titular "¿Quién debe qué?" cabe en dos líneas en cualquier ancho, del
// teléfono a la pantalla grande, con margen para otros navegadores.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir } from './navegador.mjs';

let sitio;
before(async () => { sitio = await servir(fileURLToPath(new URL('..', import.meta.url))); });
after(async () => { await sitio.cerrar(); });

test('el titular cabe en dos líneas en cualquier ancho, con margen', async () => {
  const malos = [];
  for (const ancho of [360, 390, 768, 981, 1024, 1100, 1180, 1280, 1366, 1440, 1600, 1920]) {
    const { browser, page } = await abrir({ ancho, alto: 800, movimientoReducido: true });
    try {
      await page.goto(`${sitio.url}/`);
      await page.evaluate(() => document.fonts.ready);
      const { lineas, holgura } = await page.evaluate(() => {
        const h = document.querySelector('.titular');
        const alto = parseFloat(getComputedStyle(h).lineHeight);
        // La línea más larga, medida sin que se parta, contra el ancho del titular.
        const prueba = h.cloneNode(true);
        prueba.style.cssText = 'position:absolute; visibility:hidden; width:max-content; white-space:nowrap';
        h.parentElement.append(prueba);
        const larga = Math.max(...[...prueba.querySelectorAll('.titular-linea')].map((l) => l.getBoundingClientRect().width));
        prueba.remove();
        // El espacio disponible es el de su columna (en teléfono la columna es la portada entera).
        let caja = h.parentElement;
        if (getComputedStyle(caja).display === 'contents') caja = caja.parentElement;
        const cs = getComputedStyle(caja);
        const disponible = caja.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        return { lineas: Math.round(h.getBoundingClientRect().height / alto), holgura: disponible - larga };
      });
      if (lineas > 2 || holgura < 16) malos.push(`${ancho}px: ${lineas} líneas, holgura ${Math.round(holgura)}px`);
    } finally { await browser.close(); }
  }
  assert.deepEqual(malos, []);
});
