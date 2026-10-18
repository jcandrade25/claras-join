// Para revisar los textos: todo lo que dice la página, sección por sección, y
// la página entera en teléfono y computador.
// Uso: node _test/textos.mjs  →  _test/out/textos-landing.md, pagina-390.png, pagina-1440.png
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir } from './navegador.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const salida = fileURLToPath(new URL('./out/', import.meta.url));
await mkdir(salida, { recursive: true });
const { url, cerrar } = await servir(raiz);

const { browser, page } = await abrir({ ancho: 1440, alto: 900, movimientoReducido: true });
await page.goto(`${url}/`);
const partes = await page.evaluate(() => {
  const bloques = [...document.querySelectorAll('header.barra, main > section:not([hidden]), footer')];
  return bloques.map((b) => {
    // Abre las preguntas y el cobro para que su texto también salga.
    b.querySelectorAll('details').forEach((d) => { d.removeAttribute('name'); d.open = true; });
    b.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = false; });
    const titulo = b.querySelector('h1, h2')?.innerText.replace(/\s+/g, ' ').trim() ?? b.tagName.toLowerCase();
    return `## ${titulo}\n\n${b.innerText.replace(/\n{3,}/g, '\n\n').trim()}`;
  });
});
await writeFile(`${salida}textos-landing.md`, `# Textos de la landing\n\n${partes.join('\n\n')}\n`);
await browser.close();

for (const m of [{ ancho: 390, alto: 844, tactil: true }, { ancho: 1440, alto: 900 }]) {
  const { browser: b, page: p } = await abrir({ ...m, movimientoReducido: true });
  await p.goto(`${url}/`);
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${salida}pagina-${m.ancho}.png`, fullPage: true });
  await b.close();
}
await cerrar();
console.log('listo');
