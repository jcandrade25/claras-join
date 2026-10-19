// Los enlaces de invitación siguen funcionando como antes de la landing, y cada
// botón de acción lleva a Play en cualquier aparato; la web solo se ofrece en iPhone.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir, UA } from './navegador.mjs';
import { URL_PLAY, URL_WEB } from '../js/dispositivo.js';

let sitio;
before(async () => { sitio = await servir(fileURLToPath(new URL('..', import.meta.url))); });
after(async () => { await sitio.cerrar(); });

async function pagina(ruta, ua, ancho = 390, alto = 844) {
  const { browser, page } = await abrir({ ancho, alto, ua });
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

test('/join/?c= lleva a la invitación con el código', async () => {
  const { browser, page } = await pagina('/join/?c=ABC123', UA.iphone);
  try {
    await page.waitForURL(/\/\?c=ABC123$/);
    assert.equal((await page.textContent('[data-codigo]')).trim(), 'ABC123');
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
      // Sin invitación, la barra sigue ofreciendo la descarga.
      assert.ok(await page.isVisible('.boton-barra'), ruta);
    } finally { await browser.close(); }
  }
});

test('con invitación, el talón es la primera pantalla y la landing empieza debajo', async () => {
  for (const [ua, ancho, alto] of [[UA.android, 390, 844], [UA.iphone, 375, 667], [UA.windows, 1440, 900]]) {
    const { browser, page } = await pagina('/?c=ABC123', ua, ancho, alto);
    const caso = `${ancho}x${alto}`;
    try {
      const m = await page.evaluate(() => {
        const r = (s) => document.querySelector(s).getBoundingClientRect();
        const fondo = (el) => getComputedStyle(el).backgroundColor;
        const siguiente = document.querySelector('[data-ver-landing]');
        return {
          vista: innerHeight,
          portada: Math.round(r('.portada').top),
          // La tilde de "¿QUIÉN" sobresale de su caja: el titular empieza bien abajo del borde.
          titular: Math.round(r('.titular').top),
          fondoInvitacion: fondo(document.querySelector('[data-invitacion]')),
          fondoBarra: fondo(document.querySelector('.barra')),
          fondoLanding: fondo(document.body),
          botonBarra: getComputedStyle(document.querySelector('.boton-barra')).display,
          siguiente: siguiente && { href: siguiente.getAttribute('href'), abajo: Math.round(siguiente.getBoundingClientRect().bottom) },
        };
      });
      // Lo del invitado no comparte pantalla con la landing.
      assert.ok(m.portada >= m.vista - 1, `${caso}: la portada empieza en ${m.portada}`);
      assert.ok(m.titular >= m.vista + 24, `${caso}: el titular empieza en ${m.titular} y su tilde asoma`);
      // Otro fondo, el mismo en la barra y en el talón; la landing sigue en su ladrillo.
      assert.notEqual(m.fondoInvitacion, m.fondoLanding, caso);
      assert.equal(m.fondoBarra, m.fondoInvitacion, caso);
      // Ninguna otra descarga compite con la del talón.
      assert.equal(m.botonBarra, 'none', caso);
      // Abajo, a la vista, el paso a la landing.
      assert.ok(m.siguiente, `${caso}: falta el enlace a la landing`);
      assert.equal(m.siguiente.href, '#que-es-claras', caso);
      assert.ok(m.siguiente.abajo <= m.vista, `${caso}: el enlace queda en ${m.siguiente.abajo}`);
    } finally { await browser.close(); }
  }
});

test('desde la invitación, "¿Qué es Claras?" baja a la landing', async () => {
  const { browser, page } = await pagina('/?c=ABC123', UA.iphone);
  try {
    await page.click('[data-ver-landing]');
    await page.waitForTimeout(300);
    const titular = await page.$eval('.titular', (e) => e.getBoundingClientRect().top);
    assert.ok(titular >= 0 && titular < 300, `el titular queda en ${titular}`);
  } finally { await browser.close(); }
});

test('los botones de acción llevan a Play en cualquier celular o computador', async () => {
  for (const ua of [UA.android, UA.iphone, UA.windows]) {
    const { browser, page } = await pagina('/', ua, 1440);
    try {
      const enlaces = await page.$$eval('[data-accion]', (es) => es.map((e) => [e.dataset.accion, e.getAttribute('href'), e.textContent.trim()]));
      assert.ok(enlaces.length >= 2);
      for (const [tipo, href, texto] of enlaces) {
        assert.equal(href, URL_PLAY, `${ua.slice(0, 40)} ${tipo}`);
        if (tipo === 'corto') assert.equal(texto, 'Descargar');
        if (tipo === 'largo') assert.equal(texto, 'Descargar en Google Play');
      }
    } finally { await browser.close(); }
  }
});

test('la versión web se ofrece solo en iPhone, discreta', async () => {
  for (const [ua, visible] of [[UA.iphone, true], [UA.android, false], [UA.windows, false]]) {
    const { browser, page } = await pagina('/', ua);
    try {
      const enlaces = page.locator('[data-solo-iphone]');
      assert.ok(await enlaces.count() >= 1);
      for (let i = 0; i < await enlaces.count(); i++) {
        assert.equal(await enlaces.nth(i).isVisible(), visible, ua.slice(0, 40));
        assert.equal(await enlaces.nth(i).getAttribute('href'), URL_WEB);
      }
    } finally { await browser.close(); }
  }
});
