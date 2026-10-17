// La cuenta jugable en un navegador de verdad (Edge), como la usaría un visitante.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir } from './navegador.mjs';
import { mensajeCobro } from '../js/motor.js';

let sitio;
before(async () => { sitio = await servir(fileURLToPath(new URL('..', import.meta.url))); });
after(async () => { await sitio.cerrar(); });

const plato = (id) => `[data-item="${id}"]`;
const persona = (id) => `[data-persona="${id}"]`;
const quitar = (item, id) => `li:has(${plato(item)}) [data-quitar="${id}"]`;

async function pagina(opciones) {
  const { browser, page } = await abrir(opciones);
  await page.goto(`${sitio.url}/`);
  return { browser, page };
}

// Los tres platos que llegan sin dueño, repartidos como en la cuenta completa.
async function completar(page, tocar) {
  for (const [item, quienes] of [['chicharron', ['mafe', 'pacho', 'pipe']], ['cerveza', ['pipe']], ['natas', ['mafe']]]) {
    await tocar(plato(item));
    for (const id of quienes) await tocar(persona(id));
  }
}

const montos = (page) => page.$$eval('[data-talon]', (ts) =>
  ts.map((t) => [t.dataset.talon, t.querySelector('[data-monto]').textContent.trim()]));

test('asignar los tres platos y liquidar da tres talones', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    assert.equal(await page.textContent('[data-falta]'), '$48.000');
    await completar(page, (s) => page.tap(s));
    assert.equal(await page.textContent('[data-falta]'), '$0');
    await page.tap('[data-liquidar]');
    assert.deepEqual(await montos(page), [['pipe', '$64.166'], ['pacho', '$61.966'], ['valen', '$20.900']]);
    for (const [id, nombre, monto] of [['pipe', 'Pipe', 64166], ['pacho', 'Pacho', 61966], ['valen', 'Valen', 20900]]) {
      const texto = await page.textContent(`[data-talon="${id}"]`);
      assert.match(texto, /Cobrar por WhatsApp/);
      assert.ok(texto.includes(mensajeCobro({ deudor: nombre, grupo: 'Almuerzo en Fonda La Vaca', monto, llave: '@mafe.ejemplo' })));
    }
  } finally { await browser.close(); }
});

test('arrastrar un plato con el dedo lo asigna', async () => {
  const { browser, page } = await pagina({ ancho: 1440, alto: 900 });
  try {
    const desde = await page.locator(plato('cerveza')).boundingBox();
    const hasta = await page.locator(persona('pipe')).boundingBox();
    await page.mouse.move(desde.x + desde.width / 2, desde.y + desde.height / 2);
    await page.mouse.down();
    await page.mouse.move(hasta.x + hasta.width / 2, hasta.y + hasta.height / 2, { steps: 12 });
    await page.mouse.up();
    assert.equal(await page.locator(quitar('cerveza', 'pipe')).count(), 1);
    assert.equal(await page.textContent('[data-falta]'), '$34.000');
  } finally { await browser.close(); }
});

test('otra vez y de nuevo liquidar no duplica', async () => {
  const { browser, page } = await pagina({ ancho: 1440, alto: 900 });
  try {
    const clic = (s) => page.click(s);
    await completar(page, clic);
    await page.click('[data-liquidar]');
    await page.click('[data-otra-vez]');
    assert.equal(await page.locator('[data-talon]').count(), 0);
    assert.equal(await page.textContent('[data-falta]'), '$48.000');
    await completar(page, clic);
    await page.click('[data-liquidar]');
    assert.deepEqual(await montos(page), [['pipe', '$64.166'], ['pacho', '$61.966'], ['valen', '$20.900']]);
  } finally { await browser.close(); }
});

test('quitar a todos de un plato esconde Liquidar', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    await completar(page, (s) => page.tap(s));
    assert.ok(await page.isVisible('[data-liquidar]'));
    await page.tap(quitar('cerveza', 'pipe'));
    assert.ok(await page.isHidden('[data-liquidar]'));
    assert.equal(await page.textContent('[data-falta]'), '$14.000');
  } finally { await browser.close(); }
});

test('solo los platos bloquean el gesto de scroll', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    const gesto = (s) => page.$eval(s, (e) => getComputedStyle(e).touchAction);
    assert.equal(await gesto(plato('chicharron')), 'none');
    assert.notEqual(await gesto('.cuenta'), 'none');
    assert.notEqual(await gesto('.plato'), 'none');
  } finally { await browser.close(); }
});

test('con movimiento reducido los talones aparecen igual', async () => {
  const { browser, page } = await pagina({ ancho: 1440, alto: 900, movimientoReducido: true });
  try {
    await completar(page, (s) => page.click(s));
    await page.click('[data-liquidar]');
    assert.equal(await page.locator('[data-talon]').count(), 3);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
  } finally { await browser.close(); }
});

test('sin JavaScript se ve la cuenta resuelta', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, sinJs: true });
  try {
    assert.deepEqual(await montos(page), [['pipe', '$64.166'], ['pacho', '$61.966'], ['valen', '$20.900']]);
    for (const id of ['pipe', 'pacho', 'valen']) assert.ok(await page.isVisible(`[data-talon="${id}"]`));
    assert.equal(await page.textContent('[data-falta]'), '$0');
  } finally { await browser.close(); }
});

test('con teclado se puede repartir', async () => {
  const { browser, page } = await pagina({ ancho: 1440, alto: 900 });
  try {
    const antes = await page.textContent(`${persona('pipe')} [data-total]`);
    await page.focus(plato('cerveza'));
    await page.keyboard.press('Enter');
    await page.focus(persona('pipe'));
    await page.keyboard.press('Enter');
    assert.notEqual(await page.textContent(`${persona('pipe')} [data-total]`), antes);
    assert.match(await page.textContent('[data-anuncio]'), /Pipe/);
  } finally { await browser.close(); }
});
