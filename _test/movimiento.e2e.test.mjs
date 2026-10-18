// El movimiento: cada sección entra una vez, por partes y en orden de lectura;
// el titular sube al cargar; las capturas se funden al cambiar de pestaña; los
// botones responden al puntero. Nada queda escondido sin JavaScript ni con
// movimiento reducido.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir } from './navegador.mjs';

let sitio;
before(async () => { sitio = await servir(fileURLToPath(new URL('..', import.meta.url))); });
after(async () => { await sitio.cerrar(); });

const SECCIONES = ['#como-funciona', '#app', '#precio', '#preguntas', '.pie'];
const terminar = (page) => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
const opacidades = (page, selector) => page.$$eval(selector, (els) => els.map((e) => getComputedStyle(e).opacity));
// Las guardas no valen si no encuentran nada que mirar.
const todasVisibles = async (page) => {
  const ops = await opacidades(page, '[data-parte], .titular-linea, .bajada');
  return ops.length > 10 && ops.every((o) => o === '1');
};

test('cada sección y el pie tienen su entrada, con sus partes', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900 });
  try {
    await page.goto(`${sitio.url}/`);
    for (const s of SECCIONES) {
      assert.ok(await page.$(`${s}[data-entrada]`), `${s} sin data-entrada`);
      assert.ok((await page.$$(`${s} [data-parte]`)).length >= 2, `${s} con menos de dos partes`);
    }
  } finally { await browser.close(); }
});

test('una sección entra al aparecer, por partes, y se queda a la vista', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900 });
  try {
    await page.goto(`${sitio.url}/`);
    await page.waitForLoadState('networkidle');
    // Antes de verla, sus partes esperan escondidas.
    const antes = await opacidades(page, '#precio [data-parte]');
    assert.ok(antes.length >= 2 && antes.every((o) => o === '0'));
    await page.$eval('#precio', (e) => e.scrollIntoView());
    await page.waitForFunction(() => document.querySelector('#precio').classList.contains('entro'));
    const retrasos = await page.$$eval('#precio [data-parte]', (els) => els.map((e) => parseFloat(getComputedStyle(e).animationDelay)));
    assert.ok(retrasos.at(-1) > retrasos[0], 'las partes no llegan en orden');
    await terminar(page);
    assert.ok((await opacidades(page, '#precio [data-parte]')).every((o) => o === '1'));
    // Una sola vez: al volver, nada se repite ni se esconde.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.$eval('#precio', (e) => e.scrollIntoView());
    assert.equal(await page.evaluate(() => document.getAnimations().filter((a) => a.effect.target.closest('#precio')).length), 0);
    assert.ok((await opacidades(page, '#precio [data-parte]')).every((o) => o === '1'));
  } finally { await browser.close(); }
});

test('con movimiento reducido no se esconde nada', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900, movimientoReducido: true });
  try {
    await page.goto(`${sitio.url}/`);
    assert.ok(await todasVisibles(page));
  } finally { await browser.close(); }
});

test('sin JavaScript no se esconde nada', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900, sinJs: true });
  try {
    await page.goto(`${sitio.url}/`);
    assert.ok(await todasVisibles(page));
  } finally { await browser.close(); }
});

test('el titular sube al cargar, línea por línea, y termina a la vista', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900 });
  try {
    await page.goto(`${sitio.url}/`);
    assert.equal(await page.textContent('.titular'), '¿Quién debe qué?');
    const lineas = await page.$$eval('.titular-linea', (els) => els.map((e) => e.getAnimations().length));
    assert.deepEqual(lineas, [1, 1]);
    await terminar(page);
    assert.ok((await opacidades(page, '.titular-linea')).every((o) => o === '1'));
  } finally { await browser.close(); }
});

test('al cambiar de pestaña la captura se funde', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900 });
  try {
    await page.goto(`${sitio.url}/`);
    await page.click('[data-pestana="balances"]');
    assert.ok(await page.$eval('img[data-plato]', (img) => img.getAnimations().some((a) => a.animationName === 'fundir')));
    await terminar(page);
    assert.equal(await page.$eval('img[data-plato]', (img) => getComputedStyle(img).opacity), '1');
  } finally { await browser.close(); }
});

test('los botones responden al puntero', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900 });
  try {
    await page.goto(`${sitio.url}/`);
    const fondo = () => page.$eval('.boton-barra', (b) => getComputedStyle(b).backgroundColor);
    const antes = await fondo();
    await page.hover('.boton-barra');
    await page.waitForTimeout(300);
    assert.notEqual(await fondo(), antes);
  } finally { await browser.close(); }
});
