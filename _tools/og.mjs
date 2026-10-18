// La imagen que muestran WhatsApp, redes y buscadores al compartir el enlace:
// el primer pantallazo a 1200x630. Correr cuando cambie la portada:
//   node _tools/og.mjs   →   img/og.png
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { servir } from '../_test/servidor.mjs';
import { abrir } from '../_test/navegador.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const salida = fileURLToPath(new URL('../img/og.png', import.meta.url));
await mkdir(fileURLToPath(new URL('../img/', import.meta.url)), { recursive: true });

const { url, cerrar } = await servir(raiz);
const { browser, page } = await abrir({ ancho: 1200, alto: 630, movimientoReducido: true });
await page.goto(`${url}/`);
// La marca, el titular y la cuenta entera: sin menú, bajada, botón ni pista.
await page.addStyleTag({ content: `
  .barra-enlaces, .boton-barra, .pista, .bajada, .boton-principal { display: none !important; }
  .portada { min-height: 0; padding: 0 var(--margen); align-items: center; overflow: hidden; }
  .portada-cuenta { align-self: center; }
  .cuenta-pie { position: static; }
` });
await page.evaluate(() => document.fonts.ready);
// La cuenta se encoge hasta caber en la franja bajo la barra.
await page.evaluate(() => {
  const portada = document.querySelector('.portada');
  const cuenta = document.querySelector('.cuenta');
  portada.style.height = `${630 - document.querySelector('.barra').offsetHeight}px`;
  const escala = Math.min(1, (portada.clientHeight - 24) / cuenta.offsetHeight);
  cuenta.style.transform = `rotate(-1.2deg) scale(${escala.toFixed(3)})`;
  cuenta.style.margin = `${(-(1 - escala) * cuenta.offsetHeight) / 2}px 0`;
});
await page.waitForTimeout(400);
await page.screenshot({ path: salida, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
await cerrar();
console.log(`img/og.png: ${Math.round((await stat(salida)).size / 1024)} KB`);
