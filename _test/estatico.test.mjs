// Lo que ve quien llega sin JavaScript es la cuenta resuelta, pintada por el
// mismo módulo que usa la página. Si cambia la cuenta, se corre
// node _tools/cuenta-estatica.mjs y esta prueba vuelve a pasar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FONDA } from '../js/fonda.js';
import { completar, crearEstado } from '../js/estado-cuenta.js';
import { htmlPersonas, htmlPlatos, htmlTalones, textoFalta } from '../js/cuenta-html.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const entre = (nombre) => {
  const m = html.match(new RegExp(`<!-- estatico:${nombre} -->([\\s\\S]*?)<!-- /estatico:${nombre} -->`));
  assert.ok(m, `falta el marcador ${nombre}`);
  return m[1].trim();
};

test('index.html trae la cuenta resuelta, igual a la que pinta el módulo', () => {
  const e = completar(crearEstado(FONDA));
  assert.equal(entre('platos'), htmlPlatos(e));
  assert.equal(entre('personas'), htmlPersonas(e));
  assert.equal(entre('talones'), htmlTalones(e));
  assert.equal(entre('falta'), textoFalta(e));
});
