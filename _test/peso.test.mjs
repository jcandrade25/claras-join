// La página pesa poco en un plan de datos prepago: el HTML, el CSS, el JS que
// importa y las dos fuentes, comprimidos, no pasan de 200 KB.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const raiz = new URL('..', import.meta.url);
const leer = (ruta) => readFileSync(new URL(ruta, raiz));

// Los módulos que la página carga y todo lo que ellos importan.
function modulosDeLaPagina(html) {
  const pendientes = [...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1].replace(/^\//, ''));
  const vistos = new Set();
  while (pendientes.length) {
    const ruta = pendientes.pop();
    if (vistos.has(ruta)) continue;
    vistos.add(ruta);
    const codigo = leer(ruta).toString('utf8');
    for (const [, relativa] of codigo.matchAll(/from '(\.[^']+)'/g)) {
      pendientes.push(new URL(relativa, new URL(ruta, 'http://x/')).pathname.slice(1));
    }
  }
  return [...vistos];
}

const FUENTES = ['fonts/Archivo-titulos.woff2', 'fonts/Archivo-texto.woff2'];

test('la cabeza pide de una vez todos los módulos que la página usa', () => {
  // Sin esto, cada import es otra vuelta a la red antes de que la cuenta se arme.
  const html = leer('index.html').toString('utf8');
  const pedidos = new Set([...html.matchAll(/<(?:script type="module" src|link rel="modulepreload" href)="([^"]+)"/g)]
    .map((m) => m[1].replace(/^\//, '')));
  const faltan = modulosDeLaPagina(html).filter((m) => !pedidos.has(m));
  assert.deepEqual(faltan, []);
});

test('las fuentes son WOFF2 de verdad, no TrueType con otro nombre', () => {
  for (const ruta of FUENTES) assert.equal(leer(ruta).subarray(0, 4).toString('latin1'), 'wOF2', ruta);
});

test('HTML, CSS, JS y fuentes, como viajan, pesan 200 KB o menos', () => {
  const html = leer('index.html').toString('utf8');
  const modulos = modulosDeLaPagina(html);
  assert.ok(modulos.includes('js/motor.js'), 'sigue los imports hasta el motor');
  // El texto viaja comprimido; las fuentes WOFF2 ya vienen comprimidas y el
  // servidor las manda tal cual.
  const texto = ['index.html', 'css/landing.css', ...modulos].reduce((suma, ruta) => suma + gzipSync(leer(ruta)).length, 0);
  const fuentes = FUENTES.reduce((suma, ruta) => suma + leer(ruta).length, 0);
  const total = texto + fuentes;
  assert.ok(total <= 200 * 1024, `${Math.round(total / 1024)} KB`);
});
