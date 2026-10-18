// El HTML de la cuenta, sin DOM: lo pinta cuenta.js en la página y lo escribe
// _tools/cuenta-estatica.mjs en index.html (la cuenta resuelta, para quien
// llega sin JavaScript). Una sola fuente, así las dos nunca se separan.
import { formatoPesos, mensajeCobro } from './motor.js';
import { faltaAsignar, resultado, subtotales } from './estado-cuenta.js';

const miles = (n) => formatoPesos(n).slice(1);
const nombre = (fonda, id) => fonda.personas.find((p) => p.id === id).nombre;

// Cada plato muestra quién lo comió; el plato abierto muestra en cambio sus
// fichas (Todos y cada persona), como la tarjeta de ítem de la app.
export function htmlPlatos(e, abierto = null) {
  return e.fonda.items.map((it) => {
    const quienes = e.asignacion[it.id];
    const esAbierto = it.id === abierto;
    const duenos = quienes.length
      ? quienes.map((id) => `<span class="dueno">${nombre(e.fonda, id)}</span>`).join('')
      : '<span class="sin-dueno">¿De quién?</span>';
    const todos = e.fonda.personas.every((p) => quienes.includes(p.id));
    const fichas = esAbierto
      ? `<span class="fichas" role="group" aria-label="Quién comió ${it.nombre}">`
        + `<button type="button" class="ficha" data-ficha="todos" aria-pressed="${todos}">Todos</button>`
        + e.fonda.personas.map((p) => `<button type="button" class="ficha" data-ficha="${p.id}" aria-pressed="${quienes.includes(p.id)}">${p.nombre}</button>`).join('')
        + '</span>'
      : '';
    return `<li class="plato${quienes.length ? '' : ' plato-libre'}${esAbierto ? ' plato-abierto' : ''}">`
      + `<span class="plato-cant">${it.cantidad}</span>`
      + `<span class="plato-centro"><button type="button" class="plato-nombre" data-item="${it.id}" aria-expanded="${esAbierto}">${it.nombre}</button>`
      + (esAbierto ? '' : ` <span class="duenos">${duenos}</span>`) + '</span>'
      + `<span class="plato-valor">${miles(it.cantidad * it.unitario)}</span>${fichas}</li>`;
  }).join('\n');
}

export function htmlPersonas(e) {
  const sub = subtotales(e);
  return e.fonda.personas.map((p) => `<li><button class="persona" type="button" data-persona="${p.id}">`
    + `<span class="persona-nombre">${p.nombre}</span>`
    + `<span class="persona-total" data-total>${formatoPesos(sub.get(p.id) ?? 0)}</span></button></li>`).join('\n');
}

export function htmlTalones(e) {
  const r = resultado(e);
  if (!r) return '';
  return r.transferencias.map((t, i) => {
    const deudor = nombre(e.fonda, t.de);
    const mensaje = mensajeCobro({ deudor, grupo: e.fonda.grupo, monto: t.monto, llave: e.fonda.llaveEjemplo });
    return `<article class="talon" data-talon="${t.de}" style="--i: ${i}">`
      + `<p class="talon-quien">${deudor} le paga a ${nombre(e.fonda, t.a)}</p>`
      + `<p class="talon-monto" data-monto>${formatoPesos(t.monto)}</p>`
      + '<details class="talon-cobro"><summary>Cobrar por WhatsApp</summary>'
      + `<p class="talon-intro">Así le llega a ${deudor} por WhatsApp:</p>`
      + `<p class="talon-mensaje">${mensaje}</p>`
      + '<p class="talon-nota">En la app, este botón abre tu WhatsApp con el mensaje listo. '
      + 'Claras no mueve plata ni pide claves.</p></details></article>';
  }).join('\n');
}

export const textoFalta = (e) => formatoPesos(faltaAsignar(e));
