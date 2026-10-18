// Contraste: el texto de los botones y el anillo del foco se leen sobre su fondo
// (WCAG: 4,5 a 1 para texto normal, 3 a 1 para texto grande y para el anillo).
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir } from './navegador.mjs';

let sitio;
before(async () => { sitio = await servir(fileURLToPath(new URL('..', import.meta.url))); });
after(async () => { await sitio.cerrar(); });

// Corre en la página: contraste entre dos colores rgb() y el fondo visible de un elemento.
const AYUDAS = `
  window.__rgb = (c) => c.match(/[\\d.]+/g).slice(0, 4).map(Number);
  window.__lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  window.__contraste = (a, b) => {
    const [x, y] = [__lum(__rgb(a)), __lum(__rgb(b))].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  window.__fondo = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      const p = __rgb(c);
      if (p.length < 4 || p[3] > 0) return c;
    }
    return 'rgb(255, 255, 255)';
  };
`;

test('los botones de texto se leen: 4,5 a 1, o 3 a 1 si el texto es grande', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900 });
  try {
    await page.addInitScript(AYUDAS);
    await page.goto(`${sitio.url}/?c=ABC123`);
    const pobres = await page.$$eval('a.boton, button.boton:not(:disabled)', (bs) => bs
      .filter((b) => b.offsetParent !== null)
      .map((b) => {
        const cs = getComputedStyle(b);
        const grande = parseFloat(cs.fontSize) >= 24 || (+cs.fontWeight >= 700 && parseFloat(cs.fontSize) >= 18.66);
        return [b.textContent.trim(), +__contraste(cs.color, cs.backgroundColor).toFixed(2), grande ? 3 : 4.5];
      })
      .filter(([, c, minimo]) => c < minimo));
    assert.deepEqual(pobres, []);
  } finally { await browser.close(); }
});

test('el anillo del foco se ve en cada superficie de papel', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900 });
  try {
    await page.addInitScript(AYUDAS);
    await page.goto(`${sitio.url}/?c=ABC123`);
    // Se completa la cuenta y se liquida para que salgan los talones.
    for (const [item, quien] of [['chicharron', 'dani'], ['cerveza', 'pipe'], ['natas', 'dani']]) {
      const fila = `li:has([data-item="${item}"])`;
      if (await page.locator(`${fila} [data-ficha="todos"]`).count() === 0) await page.click(`[data-item="${item}"]`);
      await page.click(`${fila} [data-ficha="${quien}"]`);
    }
    await page.click('[data-liquidar]');
    await page.keyboard.press('Tab');
    const superficies = ['.invitacion-talon .boton', '[data-talon] summary', '.pregunta:nth-child(1) summary',
      '.pregunta:nth-child(3) summary', '.pie-recibo .boton', '.pie-recibo .pie-enlaces a'];
    const malos = [];
    for (const s of superficies) {
      await page.focus(s);
      const [visible, c] = await page.$eval(s, (el) => {
        const cs = getComputedStyle(el);
        return [el.matches(':focus-visible') && cs.outlineStyle !== 'none', +__contraste(cs.outlineColor, __fondo(el.parentElement)).toFixed(2)];
      });
      if (!visible || c < 3) malos.push(`${s}: ${visible ? c : 'sin anillo'}`);
    }
    assert.deepEqual(malos, []);
  } finally { await browser.close(); }
});
