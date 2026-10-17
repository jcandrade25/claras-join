// Los enlaces de invitación siguen funcionando como antes de la landing, y cada
// botón de acción lleva a Play en Android y a la versión web en lo demás.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir, UA } from './navegador.mjs';
import { URL_PLAY, URL_WEB } from '../js/dispositivo.js';

let sitio;
before(async () => { sitio = await servir(fileURLToPath(new URL('..', import.meta.url))); });
after(async () => { await sitio.cerrar(); });

async function pagina(ruta, ua, ancho = 390) {
  const { browser, page } = await abrir({ ancho, alto: 844, ua });
  // El intento automático de abrir la app (claras://) no debe sacar la página.
  await page.route('claras://**', (r) => r.abort());
  await page.goto(`${sitio.url}${ruta}`);
  return { browser, page };
}

test('con ?c= se ve el talón de la invitación con el código', async () => {
  const { browser, page } = await pagina('/?c=ABC123', UA.iphone);
  try {
    assert.ok(await page.isVisible('[data-invitacion]'));
    assert.equal((await page.textContent('[data-codigo]')).trim(), 'ABC123');
    // Quien viene a unirse no tiene el pie de la cuenta pegado abajo compitiendo.
    assert.equal(await page.$eval('.cuenta-pie', (e) => getComputedStyle(e).position), 'static');
  } finally { await browser.close(); }
});

test('en Android la invitación abre la app y ofrece Play y la web', async () => {
  const { browser, page } = await pagina('/?c=ABC123', UA.android);
  try {
    assert.equal(await page.getAttribute('[data-abrir]', 'href'), 'claras://join/ABC123');
    assert.ok(await page.isVisible('[data-tienda]'));
    assert.equal(await page.getAttribute('[data-web]', 'href'), `${URL_WEB}?c=ABC123`);
  } finally { await browser.close(); }
});

test('en iPhone la invitación entra a la web y deja copiar el código', async () => {
  const { browser, page } = await pagina('/?c=ABC123', UA.iphone);
  try {
    assert.equal(await page.getAttribute('[data-abrir]', 'href'), `${URL_WEB}?c=ABC123`);
    assert.ok(await page.isVisible('[data-copiar]'));
    assert.ok(await page.isHidden('[data-tienda]'));
  } finally { await browser.close(); }
});

test('sin código, o con uno que no sirve, no hay talón', async () => {
  for (const ruta of ['/', '/?c=AB', '/?c=%3Cb%3Ehola%3C%2Fb%3E']) {
    const { browser, page } = await pagina(ruta, UA.iphone);
    try {
      assert.ok(await page.isHidden('[data-invitacion]'), ruta);
    } finally { await browser.close(); }
  }
});

test('los botones de acción van a Play en Android y a la web en lo demás', async () => {
  for (const [ua, destino, corto, largo] of [
    [UA.android, URL_PLAY, 'Descargar', 'Descargar en Google Play'],
    [UA.iphone, URL_WEB, 'Abrir en el navegador', 'Abrir Claras en el navegador'],
    [UA.windows, URL_WEB, 'Abrir en el navegador', 'Abrir Claras en el navegador'],
  ]) {
    const { browser, page } = await pagina('/', ua, 1440);
    try {
      const enlaces = await page.$$eval('[data-accion]', (es) => es.map((e) => [e.dataset.accion, e.getAttribute('href'), e.textContent.trim()]));
      assert.ok(enlaces.length >= 2);
      for (const [tipo, href, texto] of enlaces) {
        assert.equal(href, destino, `${ua.slice(0, 40)} ${tipo}`);
        if (tipo === 'corto') assert.equal(texto, corto);
        if (tipo === 'largo') assert.equal(texto, largo);
      }
    } finally { await browser.close(); }
  }
});
