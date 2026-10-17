// Pantallazos del primer pantallazo en los dos mapeos de color (A: suelo de
// ladrillo; B: suelo de tinta), lado a lado, para que Juan escoja.
// Uso: node _test/comps.mjs  →  _test/out/comps-390.png y comps-1440.png
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir } from './navegador.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const salida = fileURLToPath(new URL('./out/', import.meta.url));
await mkdir(salida, { recursive: true });

const { url, cerrar } = await servir(raiz);
const comps = process.argv.length > 2 ? process.argv.slice(2) : ['a'];
const medidas = [{ ancho: 390, alto: 844, tactil: true }, { ancho: 1440, alto: 900 }];

for (const m of medidas) {
  const capturas = {};
  for (const comp of comps) {
    const { browser, page } = await abrir(m);
    await page.goto(`${url}/`);
    await page.evaluate((c) => { document.documentElement.dataset.comp = c; }, comp);
    await page.evaluate(() => document.fonts.ready);
    capturas[comp] = await page.screenshot();
    await browser.close();
  }
  // Une las capturas en una sola imagen, con una franja entre ellas.
  const { browser, page } = await abrir({ ancho: (m.ancho + 24) * comps.length - 24, alto: m.alto });
  const b64 = (x) => `data:image/png;base64,${x.toString('base64')}`;
  await page.setContent(`<body style="margin:0;display:flex;gap:24px;background:#777">
    ${comps.map((c) => `<img src="${b64(capturas[c])}">`).join('')}</body>`);
  await page.screenshot({ path: `${salida}comps-${m.ancho}.png` });
  await browser.close();
  console.log(`comps-${m.ancho}.png`);
}
await cerrar();
