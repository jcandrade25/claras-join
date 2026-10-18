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

test('HTML, CSS, JS y fuentes comprimidos pesan 200 KB o menos', () => {
  const html = leer('index.html').toString('utf8');
  const modulos = modulosDeLaPagina(html);
  assert.ok(modulos.includes('js/motor.js'), 'sigue los imports hasta el motor');
  const archivos = ['index.html', 'css/landing.css', ...modulos, 'fonts/Archivo-titulos.woff2', 'fonts/Archivo-texto.woff2'];
  const total = archivos.reduce((suma, ruta) => suma + gzipSync(leer(ruta)).length, 0);
  assert.ok(total <= 200 * 1024, `${Math.round(total / 1024)} KB`);
});
