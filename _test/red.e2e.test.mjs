// La página no llama a nadie más: ni fuentes de Google, ni analítica, ni CDN.
// Todo lo que pide sale del mismo servidor que la sirve.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir, UA } from './navegador.mjs';

let sitio;
before(async () => { sitio = await servir(fileURLToPath(new URL('..', import.meta.url))); });
after(async () => { await sitio.cerrar(); });

// Carga la ruta, la recorre hasta el final para que todo lo diferido se pida
// y devuelve las peticiones que salieron hacia otro origen (sin dejarlas pasar).
async function peticionesAfuera(ruta) {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900, ua: UA.windows });
  const afuera = [];
  await page.route('**/*', (r) => {
    const url = r.request().url();
    if (url.startsWith(sitio.url)) return r.continue();
    afuera.push(url);
    return r.abort();
  });
  try {
    await page.goto(`${sitio.url}${ruta}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    return { afuera, page, browser };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

for (const ruta of ['/', '/?c=ABC123', '/unirse/?c=ABC123']) {
  test(`${ruta}: todas las peticiones van al mismo servidor`, async () => {
    const { afuera, browser } = await peticionesAfuera(ruta);
    try { assert.deepEqual(afuera, []); } finally { await browser.close(); }
  });
}

test('/tt/: en un computador solo sale hacia la landing, nada más', async () => {
  const { afuera, browser } = await peticionesAfuera('/tt/');
  try { assert.deepEqual(afuera, ['https://clarasapp.com/']); } finally { await browser.close(); }
});

test('toda imagen tiene texto alternativo y todo botón de acción tiene destino', async () => {
  const { browser, page } = await peticionesAfuera('/');
  try {
    const sinAlt = await page.$$eval('img', (imgs) => imgs.filter((i) => !(i.getAttribute('alt') ?? '').trim()).map((i) => i.src));
    assert.deepEqual(sinAlt, []);
    const sinDestino = await page.$$eval('[data-accion]', (as) => as.filter((a) => !a.getAttribute('href')).length);
    assert.equal(sinDestino, 0);
    assert.ok(await page.$$eval('[data-accion]', (as) => as.length) >= 3);
  } finally { await browser.close(); }
});
