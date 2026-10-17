// Capturas de la cuenta en sus estados (llegada, plato escogido, liquidada con
// un cobro abierto), en teléfono y computador, para mirarlas antes de mostrar.
// Uso: node _test/estados.mjs  →  _test/out/estado-<ancho>-<n>.png
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir } from './navegador.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const salida = fileURLToPath(new URL('./out/', import.meta.url));
await mkdir(salida, { recursive: true });
const { url, cerrar } = await servir(raiz);

for (const m of [{ ancho: 390, alto: 844, tactil: true }, { ancho: 1440, alto: 900 }]) {
  const { browser, page } = await abrir(m);
  const tocar = (s) => (m.tactil ? page.tap(s) : page.click(s));
  await page.goto(`${url}/`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${salida}estado-${m.ancho}-1.png` });
  await tocar('[data-item="chicharron"]');
  await tocar('[data-persona="mafe"]');
  await tocar('[data-persona="pacho"]');
  await page.screenshot({ path: `${salida}estado-${m.ancho}-2.png` });
  await tocar('[data-persona="pipe"]');
  for (const [item, id] of [['cerveza', 'pipe'], ['natas', 'mafe']]) { await tocar(`[data-item="${item}"]`); await tocar(`[data-persona="${id}"]`); }
  await tocar('[data-liquidar]');
  await page.waitForTimeout(900);
  await tocar('[data-talon="pipe"] summary');
  await page.locator('[data-talon="pipe"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${salida}estado-${m.ancho}-3.png` });
  await browser.close();
}
await cerrar();
console.log('listo');
