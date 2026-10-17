// Cada foto de Colombia tiene su crédito, y el pie de la página lo muestra con
// enlace a la fuente y a la licencia.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const carpeta = new URL('../img/mundo/', import.meta.url);
const creditos = JSON.parse(readFileSync(new URL('CREDITOS.json', carpeta), 'utf8'));
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pie = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
const escapar = (s) => s.replace(/&/g, '&amp;');

test('cada foto tiene su crédito y cada crédito su foto', () => {
  const fotos = readdirSync(carpeta).filter((f) => f.endsWith('.webp')).sort();
  assert.deepEqual(creditos.map((c) => c.archivo).sort(), fotos);
  for (const c of creditos) assert.ok(existsSync(new URL(c.archivo, carpeta)), c.archivo);
});

test('el pie nombra cada foto, su autor y su licencia, con enlace a la fuente', () => {
  assert.ok(pie, 'falta el pie');
  for (const c of creditos) {
    assert.ok(pie.includes(escapar(c.titulo)), c.titulo);
    assert.ok(pie.includes(escapar(c.autor)), c.autor);
    assert.ok(pie.includes(`href="${escapar(c.fuente)}"`), c.fuente);
    assert.ok(pie.includes(`href="${c.licencia_url}"`), c.licencia_url);
  }
});

test('las fotos de la página son las del crédito', () => {
  const usadas = [...html.matchAll(/src="img\/mundo\/([^"]+)"/g)].map((m) => m[1]);
  assert.ok(usadas.length >= 6);
  for (const u of usadas) assert.ok(creditos.some((c) => c.archivo === u), u);
});
