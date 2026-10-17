import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FONDA } from '../js/fonda.js';
import {
  asignar,
  completar,
  crearEstado,
  faltaAsignar,
  quitar,
  resultado,
  subtotales,
} from '../js/estado-cuenta.js';

const suma = (xs) => xs.reduce((a, b) => a + b, 0);

test('al llegar faltan $48.000', () => {
  const e = crearEstado(FONDA);
  assert.equal(faltaAsignar(e), 48000);
  assert.equal(resultado(e), null);
});

test('asignar y quitar devuelven el contador', () => {
  const con = asignar(crearEstado(FONDA), 'chicharron', 'pacho');
  assert.equal(faltaAsignar(con), 23000);
  assert.equal(faltaAsignar(quitar(con, 'chicharron', 'pacho')), 48000);
});

test('asignar dos veces no duplica', () => {
  const una = asignar(crearEstado(FONDA), 'cerveza', 'pipe');
  const dos = asignar(una, 'cerveza', 'pipe');
  assert.deepEqual(dos.asignacion.cerveza, ['pipe']);
});

test('la cuenta completa da los tres pagos a Mafe', () => {
  assert.deepEqual(resultado(completar(crearEstado(FONDA))).transferencias, [
    { de: 'pipe', a: 'mafe', monto: 64166 },
    { de: 'pacho', a: 'mafe', monto: 61966 },
    { de: 'valen', a: 'mafe', monto: 20900 },
  ]);
});

test('la deuda suma 214.500', () => {
  const r = resultado(completar(crearEstado(FONDA)));
  assert.equal(suma([...r.deuda.values()]), 214500);
});

test('crearEstado no comparte arreglos con FONDA', () => {
  const e = crearEstado(FONDA);
  e.asignacion.bandeja.push('valen');
  assert.deepEqual(FONDA.items.find((it) => it.id === 'bandeja').inicial, ['pacho', 'pipe']);
});

test('los subtotales en vivo solo cuentan platos con dueño', () => {
  const e = crearEstado(FONDA);
  const sub = subtotales(e);
  // 147.000 asignados al llegar más su propina del 10 %.
  assert.equal(suma([...sub.values()]), 147000 + 14700);
  assert.deepEqual(Object.fromEntries(subtotales(completar(e))),
    Object.fromEntries(resultado(completar(e)).deuda));
});
