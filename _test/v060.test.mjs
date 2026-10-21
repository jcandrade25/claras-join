// La política de la 0.6.0 (fotos de recibos, «Ayuda a mejorar Claras», llave y
// QR compartidos, historial y conteos): lo que esa versión volvió falso ya no
// está, lo nuevo está en los dos idiomas, las anclas que usan la app y Google
// Play siguen, la fecha nueva está marcada en sus seis lugares y no hay rayas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const privacidad = leer('privacidad.html');
const eliminar = leer('eliminar-cuenta.html');
const portada = leer('index.html');
const texto = (s) => s
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ');
const seccion = (html, id) => {
  const m = html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`));
  assert.ok(m, `falta la sección ${id}`);
  return texto(m[0]);
};

test('lo que la 0.6.0 volvió falso ya no está', () => {
  for (const [html, frase] of [
    [privacidad, 'La foto no se sube a ningún servidor'],
    [privacidad, 'The photo is not uploaded to any server'],
    [privacidad, 'no medimos cómo usas la app'],
    [privacidad, "we don't measure how you use the app"],
    [privacidad, 'Solo sale de tu celular dentro de un cobro'],
    [privacidad, 'It only leaves your phone inside a WhatsApp payment request'],
    [eliminar, 'los gastos no guardan quién los anotó'],
    [eliminar, "expenses don't record who entered them"],
    [portada, 'Tu llave se queda en tu celular'],
  ]) assert.ok(!texto(html).includes(frase), frase);
});

test('la política dice lo nuevo, en español y en inglés', () => {
  const es = seccion(privacidad, 'es');
  for (const frase of [
    'desde la versión 0.6.0',
    '«Ayuda a mejorar Claras»',
    '«Compartir mi llave y mi QR en mis grupos»',
    'máximo 2 años',
    'un año',
    'sin nombres, montos ni nada que diga quién eres',
    '«Alguien que ya no está»',
  ]) assert.ok(es.includes(frase), frase);
  const en = seccion(privacidad, 'en');
  for (const frase of [
    'since version 0.6.0',
    '“Help improve Claras”',
    '“Share my key and QR in my groups”',
    'at most 2 years',
    'one year',
    'without names, amounts or anything that says who you are',
    '“Someone who\'s no longer here”',
  ]) assert.ok(en.includes(frase), frase);
});

test('borrar la cuenta dice qué se va y qué se queda, en los dos idiomas', () => {
  const es = seccion(eliminar, 'es');
  for (const frase of ['fotos', 'historial', '«Ayuda a mejorar Claras»', 'tu llave y tu QR']) {
    assert.ok(es.includes(frase), frase);
  }
  const en = seccion(eliminar, 'en');
  for (const frase of ['photos', 'history', '“Help improve Claras”', 'your key and QR']) {
    assert.ok(en.includes(frase), frase);
  }
});

test('las anclas que usan la app y Google Play siguen, y las nuevas existen', () => {
  for (const id of ['es', 'en', 'fotos', 'ayuda', 'llave', 'conteos', 'quien-ve',
    'photos', 'help', 'key', 'counts', 'who-sees']) {
    assert.match(privacidad, new RegExp(`id="${id}"`), id);
  }
  for (const id of ['es', 'en', 'parcial', 'anterior', 'correo', 'anonima', 'partial',
    'earlier', 'email', 'anonymous']) {
    assert.match(eliminar, new RegExp(`id="${id}"`), id);
  }
});

test('la fecha nueva está marcada en sus seis lugares', () => {
  assert.equal((privacidad.match(/<!-- FECHA -->/g) ?? []).length, 4);
  assert.equal((eliminar.match(/<!-- FECHA -->/g) ?? []).length, 2);
});

test('ninguna raya larga en las tres páginas', () => {
  for (const [nombre, html] of [['privacidad', privacidad], ['eliminar', eliminar], ['portada', portada]]) {
    assert.ok(!texto(html).includes('—'), nombre);
  }
});
