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

// Lo que encontró la revisión final (2026-10-21): frases falsas para el código.
test('lo que la revisión encontró falso ya no está', () => {
  for (const [html, frase] of [
    [privacidad, 'solo para mejorar la lectura de recibos'],
    [privacidad, 'only to improve how Claras reads receipts'],
    [privacidad, 'puede tardar hasta un día en desaparecer'],
    [privacidad, 'can take up to a day to disappear'],
    [privacidad, 'un identificador anterior que no creó grupos no lo podemos encontrar'],
    [privacidad, "we can't find an earlier identifier that created no groups"],
    [privacidad, 'un identificador anónimo no tiene tu nombre ni tu correo'],
    [privacidad, 'an anonymous identifier holds neither your name nor your email'],
    [privacidad, 'si reinstalas la app o usas otro celular, se cuenta de nuevo'],
    [privacidad, 'if you reinstall the app or use another phone, it is counted again'],
    [eliminar, 'no guarda tu nombre ni tu correo'],
    [eliminar, 'holds neither your name nor your email'],
    [eliminar, 'no lo podemos encontrar para borrarlo'],
    [eliminar, "we can't find it in order to delete it"],
    [eliminar, 'no tenemos cómo encontrarlo para borrarlo'],
    [eliminar, 'we have no way to find it in order to delete it'],
  ]) assert.ok(!texto(html).includes(frase), frase);
});

test('«Ayuda a mejorar Claras» dice sus dos fines y que también copia los grupos sin compartir', () => {
  const es = seccion(privacidad, 'es');
  for (const frase of [
    'saber en qué lugares se usa Claras',
    'Cada copia queda con el identificador de tu cuenta',
    'también en grupos que están solo en tu celular',
    'salvo lo que dice cada punto',
    'Nadie más, salvo las copias de «Ayuda a mejorar Claras»',
    'también de los grupos que no compartes',
  ]) assert.ok(es.includes(frase), frase);
  const en = seccion(privacidad, 'en');
  for (const frase of [
    'learn where Claras is used',
    "Each copy is stored with your account's identifier",
    'also in groups that are only on your phone',
    'except where each item says so',
    'Nobody else, except “Help improve Claras” copies',
    "also from groups you don't share",
  ]) assert.ok(en.includes(frase), frase);
  assert.ok(seccion(eliminar, 'es').includes('no se borran con el grupo'), 'parcial es');
  assert.ok(seccion(eliminar, 'en').includes("aren't deleted with the group"), 'partial en');
  assert.ok(texto(portada).includes('Si aceptas «Ayuda a mejorar Claras», también nos llega una copia de tus recibos'),
    'portada');
});

test('la llave que compartió un identificador anterior se puede pedir borrar por correo', () => {
  const es = seccion(eliminar, 'es');
  for (const frase of [
    'Tu llave y tu QR, si los compartías con un identificador anterior:',
    'salvo por tu llave',
    'si nos das la llave',
  ]) assert.ok(es.includes(frase), frase);
  const en = seccion(eliminar, 'en');
  for (const frase of [
    'Your key and QR, if you shared them under an earlier identifier:',
    'except through your key',
    'if you give us the key',
  ]) assert.ok(en.includes(frase), frase);
  assert.ok(seccion(privacidad, 'es').includes('escríbenos con tu llave'), 'privacidad es');
  assert.ok(seccion(privacidad, 'en').includes('email us your key'), 'privacidad en');
});

test('plazos, pasos y versión exactos, en los dos idiomas', () => {
  const pes = seccion(privacidad, 'es');
  const pen = seccion(privacidad, 'en');
  for (const frase of [
    'puede tardar uno o dos días en desaparecer',
    'sin los datos de Claras',
    'No hay un interruptor para apagarlos.',
    'la que acompaña la versión 0.6.0 de la app',
    'el historial de compras',
    'que se guarda un año',
  ]) assert.ok(pes.includes(frase), frase);
  for (const frase of [
    'can take a day or two to disappear',
    "without Claras' data",
    "There's no switch to turn them off.",
    'the one that ships with app version 0.6.0',
    'purchase history',
    'kept for a year',
    'whether or not they chose one in "Who are you?"',
  ]) assert.ok(pen.includes(frase), frase);
  // Prueba manual del 2026-10-21: con la app abierta, el grupo borrado se quita al momento.
  for (const frase of ['lo quita al momento', 'ya no lo puede sincronizar']) {
    assert.ok(seccion(eliminar, 'es').includes(frase), frase);
  }
  for (const frase of ['removes it right away', 'can no longer sync it']) {
    assert.ok(seccion(eliminar, 'en').includes(frase), frase);
  }
  assert.ok(eliminar.includes('toca <strong>Editar</strong>, toca <strong>Quitar</strong> en la foto y luego '
    + '<strong>Guardar cambios</strong>'), 'quitar foto es');
  assert.ok(eliminar.includes('tap <strong>Edit</strong>, tap <strong>Remove</strong> on the photo, then '
    + '<strong>Save changes</strong>'), 'quitar foto en');
});

test('el sitemap marca sus tres fechas y no se queda con la vieja al publicar', () => {
  const sitemap = leer('sitemap.xml');
  assert.equal((sitemap.match(/<!-- FECHA -->/g) ?? []).length, 3);
  if (!privacidad.includes('FECHA_DE_PUBLICACIÓN')) {
    for (const m of sitemap.matchAll(/<!-- FECHA --><lastmod>([^<]+)</g)) assert.notEqual(m[1], '2026-10-17');
  }
});
