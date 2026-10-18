// Las preguntas como fichas de archivador: una abierta a la vez, y sin
// JavaScript cada una se sigue abriendo.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir } from './navegador.mjs';

let sitio;
before(async () => { sitio = await servir(fileURLToPath(new URL('..', import.meta.url))); });
after(async () => { await sitio.cerrar(); });

const PREGUNTAS = [
  '¿Necesito crear una cuenta?',
  '¿Todos tienen que tener la app?',
  '¿Claras mueve plata?',
  '¿Funciona en iPhone?',
  '¿Qué pasa con mis datos?',
  '¿Cuánto cuesta?',
];
const abiertas = (page) => page.$$eval('[data-pregunta]', (ps) => ps.map((p) => p.open));

test('seis preguntas en orden, la primera abierta', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900 });
  try {
    await page.goto(`${sitio.url}/`);
    const textos = await page.$$eval('[data-pregunta] summary .pregunta-texto', (s) => s.map((x) => x.textContent.trim()));
    assert.deepEqual(textos, PREGUNTAS);
    assert.deepEqual(await abiertas(page), [true, false, false, false, false, false]);
  } finally { await browser.close(); }
});

test('abrir una cierra la que estaba abierta', async () => {
  const { browser, page } = await abrir({ ancho: 390, alto: 844, tactil: true });
  try {
    await page.goto(`${sitio.url}/`);
    await page.locator('[data-pregunta]').nth(2).locator('summary').tap();
    assert.deepEqual(await abiertas(page), [false, false, true, false, false, false]);
  } finally { await browser.close(); }
});

test('sin JavaScript cada pregunta se abre', async () => {
  const { browser, page } = await abrir({ ancho: 390, alto: 844, sinJs: true });
  try {
    await page.goto(`${sitio.url}/`);
    for (let i = 1; i < PREGUNTAS.length; i++) {
      await page.locator('[data-pregunta]').nth(i).locator('summary').click();
      assert.ok((await abiertas(page))[i], PREGUNTAS[i]);
    }
  } finally { await browser.close(); }
});

test('las respuestas dicen lo que la app hace, sin prometer de más', async () => {
  const { browser, page } = await abrir({ ancho: 1440, alto: 900 });
  try {
    await page.goto(`${sitio.url}/`);
    const respuesta = (i) => page.locator('[data-pregunta]').nth(i).locator('.respuesta').textContent();
    assert.match(await respuesta(2), /No\. .*Claras nunca pide claves/s);
    assert.match(await respuesta(3), /desde el navegador/);
    assert.doesNotMatch(await respuesta(3), /app de iPhone/);
    assert.match(await respuesta(4), /no vendemos tus datos/);
  } finally { await browser.close(); }
});
