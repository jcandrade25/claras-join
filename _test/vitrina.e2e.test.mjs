// La app de verdad: tres pestañas (Cobrar, Por ítems, Balances) cambian la
// captura y su texto; sin JavaScript se ve la de Cobrar.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir } from './navegador.mjs';

let sitio;
before(async () => { sitio = await servir(fileURLToPath(new URL('..', import.meta.url))); });
after(async () => { await sitio.cerrar(); });

const seleccion = (page) => page.$$eval('[data-pestana]', (ts) => ts.map((t) => t.getAttribute('aria-selected')));
const plato = (page) => page.getAttribute('img[data-plato]', 'src');

test('cada pestaña muestra su captura y su texto', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900 });
  try {
    await page.goto(`${sitio.url}/`);
    for (const [i, id] of ['cobrar', 'items', 'balances'].entries()) {
      await page.click(`[data-pestana="${id}"]`);
      const esperado = ['false', 'false', 'false'];
      esperado[i] = 'true';
      assert.deepEqual(await seleccion(page), esperado);
      assert.match(await plato(page), new RegExp(`img/app/${id}\\.webp$`));
      assert.ok(await page.isVisible(`[data-panel="${id}"]`));
      assert.equal(await page.locator('[data-panel]:visible').count(), 1);
    }
  } finally { await browser.close(); }
});

test('las flechas pasan de una pestaña a la otra', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900 });
  try {
    await page.goto(`${sitio.url}/`);
    await page.focus('[data-pestana="cobrar"]');
    await page.keyboard.press('ArrowRight');
    assert.deepEqual(await seleccion(page), ['false', 'true', 'false']);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.pestana), 'items');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    assert.deepEqual(await seleccion(page), ['false', 'false', 'true']);
  } finally { await browser.close(); }
});

test('sin JavaScript se ve Cobrar', async () => {
  const { browser, page } = await abrir({ ancho: 390, alto: 844, sinJs: true });
  try {
    await page.goto(`${sitio.url}/`);
    assert.match(await plato(page), /img\/app\/cobrar\.webp$/);
    assert.ok(await page.isVisible('[data-panel="cobrar"]'));
    assert.equal(await page.locator('[data-panel]:visible').count(), 1);
  } finally { await browser.close(); }
});
