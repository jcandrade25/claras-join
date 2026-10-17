// Escribe en index.html la cuenta resuelta (para quien llega sin JavaScript),
// pintada por js/cuenta-html.js. Correr cuando cambie la cuenta:
//   node _tools/cuenta-estatica.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { FONDA } from '../js/fonda.js';
import { completar, crearEstado } from '../js/estado-cuenta.js';
import { htmlPersonas, htmlPlatos, htmlTalones, textoFalta } from '../js/cuenta-html.js';
import { htmlTirilla } from '../js/paseo.js';

const ruta = new URL('../index.html', import.meta.url);
const e = completar(crearEstado(FONDA));
const partes = {
  platos: `\n${htmlPlatos(e)}\n`,
  personas: `\n${htmlPersonas(e)}\n`,
  talones: `\n${htmlTalones(e)}\n`,
  falta: textoFalta(e),
  tirilla: `\n${htmlTirilla()}\n`,
};
let html = readFileSync(ruta, 'utf8');
for (const [nombre, contenido] of Object.entries(partes)) {
  const re = new RegExp(`(<!-- estatico:${nombre} -->)[\\s\\S]*?(<!-- /estatico:${nombre} -->)`);
  if (!re.test(html)) throw new Error(`falta el marcador ${nombre}`);
  html = html.replace(re, (_, a, b) => `${a}${contenido}${b}`);
}
writeFileSync(ruta, html);
console.log('index.html: cuenta resuelta escrita');
