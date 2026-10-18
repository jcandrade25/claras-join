// El motor de la landing contra el de la app: fixture-motor.json sale de
// cuentas_claras/tool/landing_fixture_test.dart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  cuentaDelGrupo,
  formatoPesos,
  mensajeCobro,
  propinaSugerida,
  repartirIgual,
  repartirPorPesos,
} from '../js/motor.js';

const fixture = JSON.parse(
  readFileSync(new URL('./fixture-motor.json', import.meta.url), 'utf8'));

const cuenta = (c) => cuentaDelGrupo({
  orden: c.orden, items: c.items, extra: c.extra, pagos: c.pagos,
});
const suma = (xs) => xs.reduce((a, b) => a + b, 0);

test('cada caso del fixture da la misma deuda, balances y transferencias que Dart', () => {
  for (const c of fixture.casos) {
    const r = cuenta(c);
    assert.deepEqual(Object.fromEntries(r.deuda), c.deuda, c.nombre);
    assert.deepEqual([...r.deuda.keys()], Object.keys(c.deuda), c.nombre);
    assert.deepEqual(Object.fromEntries(r.balances), c.balances, c.nombre);
    assert.deepEqual(r.transferencias, c.transferencias, c.nombre);
  }
});

test('propinaSugerida coincide con Dart', () => {
  for (const { base, propina } of fixture.propinas) {
    assert.equal(propinaSugerida(base), propina, `base ${base}`);
  }
});

test('las partes siempre suman el total', () => {
  assert.equal(suma(repartirIgual(-7, 3)), -7);
  assert.deepEqual(repartirPorPesos(25000, [1, 1, 1]), [8334, 8333, 8333]);
  for (const c of fixture.casos) {
    const esperado = suma(c.items.map((it) => it.monto)) + c.extra;
    assert.equal(suma([...cuenta(c).deuda.values()]), esperado, c.nombre);
  }
});

test('nunca más de n-1 pagos', () => {
  for (const c of fixture.casos) {
    assert.ok(cuenta(c).transferencias.length <= c.orden.length - 1, c.nombre);
  }
});

test('formatoPesos escribe los pesos como la app', () => {
  assert.equal(formatoPesos(64166), '$64.166');
  assert.equal(formatoPesos(1234567), '$1.234.567');
  assert.equal(formatoPesos(-1000), '-$1.000');
  assert.equal(formatoPesos(0), '$0');
});

test('mensajeCobro dice lo mismo que el cobro de la app', () => {
  const base = { deudor: 'Pipe', grupo: 'Almuerzo en Fonda La Vaca', monto: 64166 };
  assert.equal(
    mensajeCobro({ ...base, llave: '@dani.ejemplo' }),
    'Hola Pipe, en «Almuerzo en Fonda La Vaca» me debes $64.166. ' +
      'Puedes pagarme por Bre-B a la llave @dani.ejemplo. ¡Gracias!');
  assert.equal(
    mensajeCobro({ ...base, llave: '  ' }),
    'Hola Pipe, en «Almuerzo en Fonda La Vaca» me debes $64.166. ¡Gracias!');
});
