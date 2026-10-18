// Lo que leen los buscadores y las redes al compartir el enlace, y los enlaces
// cortos para las biografías de las redes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { destinoCorto } from '../js/corto.js';
import { URL_PLAY } from '../js/dispositivo.js';

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');
const html = leer('index.html');
const meta = (atributo, nombre) => html.match(new RegExp(`<meta ${atributo}="${nombre}" content="([^"]*)"`))?.[1];
const FUENTES = { tt: 'tiktok', ig: 'instagram', yt: 'youtube', fb: 'facebook', wa: 'whatsapp' };

test('la cabeza de la página: idioma, título, descripción, canónica y Open Graph', () => {
  assert.match(html, /<html lang="es-CO">/);
  assert.match(html, /<title>Claras: dividir gastos con amigos<\/title>/);
  assert.ok((meta('name', 'description') ?? '').length > 60);
  assert.match(html, /<link rel="canonical" href="https:\/\/clarasapp\.com\/">/);
  assert.ok(meta('property', 'og:title'));
  assert.ok(meta('property', 'og:description'));
  assert.equal(meta('property', 'og:image'), 'https://clarasapp.com/img/og.png');
  assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
});

test('la imagen para compartir existe y pesa poco', () => {
  const ruta = new URL('../img/og.png', import.meta.url);
  assert.ok(existsSync(ruta));
  assert.ok(statSync(ruta).size < 300 * 1024);
});

test('los datos estructurados describen la app de Android, sin calificaciones inventadas', () => {
  const bloque = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(bloque);
  const datos = JSON.parse(bloque);
  const tipos = datos['@graph'].map((d) => d['@type']);
  assert.deepEqual(tipos.sort(), ['MobileApplication', 'Organization']);
  const app = datos['@graph'].find((d) => d['@type'] === 'MobileApplication');
  assert.equal(app.operatingSystem, 'ANDROID');
  assert.equal(Number(app.offers.price), 0);
  assert.equal(app.offers.priceCurrency, 'COP');
  assert.doesNotMatch(bloque, /aggregateRating|review/i);
});

test('robots.txt y sitemap.xml', () => {
  const robots = leer('robots.txt');
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/clarasapp\.com\/sitemap\.xml/);
  const mapa = leer('sitemap.xml');
  for (const url of ['https://clarasapp.com/', 'https://clarasapp.com/privacidad.html', 'https://clarasapp.com/eliminar-cuenta.html']) {
    assert.ok(mapa.includes(`<loc>${url}</loc>`), url);
  }
});

test('robots.txt deja leer el noindex de los enlaces cortos', () => {
  // Un Disallow impide que el buscador lea el noindex y la URL puede salir sola en resultados.
  assert.doesNotMatch(leer('robots.txt'), /Disallow: \/(tt|ig|yt|fb|wa|unirse)\//);
});

test('los enlaces cortos y /unirse/ muestran una tarjeta al compartirlos', () => {
  const de = (pagina, atributo, nombre) => pagina.match(new RegExp(`<meta ${atributo}="${nombre}" content="([^"]*)"`))?.[1];
  for (const ruta of [...Object.keys(FUENTES), 'unirse']) {
    const pagina = leer(`${ruta}/index.html`);
    assert.ok(de(pagina, 'property', 'og:title'), ruta);
    assert.ok(de(pagina, 'property', 'og:description'), ruta);
    assert.equal(de(pagina, 'property', 'og:image'), 'https://clarasapp.com/img/og.png', ruta);
    assert.equal(de(pagina, 'name', 'twitter:card'), 'summary_large_image', ruta);
  }
});

test('/unirse/ es el puente de las invitaciones, con su propia tarjeta', () => {
  const pagina = leer('unirse/index.html');
  assert.match(pagina, /<meta name="robots" content="noindex">/);
  assert.match(pagina, /<meta property="og:title" content="Te invitaron a un grupo en Claras">/);
  assert.match(pagina, /<meta property="og:url" content="https:\/\/clarasapp\.com\/unirse\/">/);
  assert.match(pagina, /<noscript>/);
});

test('los enlaces cortos: Android a Play con su campaña, lo demás a la landing', () => {
  for (const [ruta, fuente] of Object.entries(FUENTES)) {
    const pagina = leer(`${ruta}/index.html`);
    assert.match(pagina, /<meta name="robots" content="noindex">/, ruta);
    assert.match(pagina, /<noscript>/, ruta);
    assert.ok(pagina.includes(`destinoCorto('${fuente}'`), ruta);
  }
  assert.ok(destinoCorto('tiktok', 'android').startsWith(URL_PLAY.split('&')[0]));
  assert.ok(destinoCorto('tiktok', 'android').includes('utm_source%3Dtiktok%26utm_medium%3Dsocial%26utm_campaign%3Dbio'));
  assert.equal(destinoCorto('tiktok', 'ios'), 'https://clarasapp.com/');
  assert.equal(destinoCorto('instagram', 'otro'), 'https://clarasapp.com/');
});
