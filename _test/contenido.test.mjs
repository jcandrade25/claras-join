// Lo que la página afirma, contra el motor y contra lo verificado en la ficha.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PASEO, htmlTirilla, resumenPaseo } from '../js/paseo.js';
import { formatoPesos } from '../js/motor.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const seccion = (id) => {
  const m = html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`));
  assert.ok(m, `falta la sección ${id}`);
  return m[0];
};
const texto = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('la tirilla del paseo trae los pagos que calcula el motor', () => {
  const t = seccion('como-funciona');
  const pagos = [...t.matchAll(/data-de="(\w+)" data-a="(\w+)"[\s\S]*?data-monto>([^<]+)</g)]
    .map(([, de, a, monto]) => ({ de, a, monto }));
  assert.deepEqual(pagos, resumenPaseo().transferencias.map((x) => ({ de: x.de, a: x.a, monto: formatoPesos(x.monto) })));
  assert.deepEqual(pagos.map((p) => p.monto), ['$232.500', '$178.500', '$124.500']);
  assert.ok(pagos.every((p) => p.a === 'valen'));
  assert.match(texto(t), /Domingo: todo liquidado en 3 pagos/);
});

test('la tirilla es la que pinta el módulo, con cada gasto del paseo', () => {
  const t = seccion('como-funciona');
  const m = t.match(/<!-- estatico:tirilla -->([\s\S]*?)<!-- \/estatico:tirilla -->/);
  assert.ok(m);
  assert.equal(m[1].trim(), htmlTirilla());
  for (const f of PASEO.dias.flatMap((d) => d.filas)) assert.ok(texto(t).includes(formatoPesos(f.monto)), f.que);
});

test('la carta: todo lo gratis a $0 y Pro a $14.900 una sola vez, dentro de Pro', () => {
  const c = seccion('precio');
  const gratis = c.match(/data-grupo="gratis"[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? '';
  assert.equal((gratis.match(/\$0</g) ?? []).length, 5);
  assert.equal((html.match(/\$14\.900/g) ?? []).length, 1);
  const pro = c.match(/data-grupo="pro"[\s\S]*$/)?.[0] ?? '';
  assert.ok(pro.includes('$14.900'));
  assert.match(texto(c), /se compra en la app de Android/);
  assert.match(texto(c), /En la versión web, Personas es gratis y escanear recibos no está disponible/);
});

test('el texto de la página no lleva rayas largas ni puntos medios', () => {
  const visible = texto(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''));
  assert.ok(!visible.includes('—'), 'raya larga');
  assert.ok(!visible.includes('·'), 'punto medio');
});
