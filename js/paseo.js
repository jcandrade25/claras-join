// El paseo de ejemplo de "El paseo entero": cuatro gastos de un fin de semana,
// cada uno entre los cuatro, y los pagos que calcula el motor para quedar a
// mano. La tirilla se escribe en index.html con _tools/cuenta-estatica.mjs.
import { cuentaDelGrupo, formatoPesos } from './motor.js';

export const PASEO = {
  grupo: 'Paseo a la finca',
  orden: ['dani', 'juanma', 'valen', 'pipe'],
  nombres: { dani: 'Dani', juanma: 'Juanma', valen: 'Valen', pipe: 'Pipe' },
  dias: [
    { dia: 'Viernes', filas: [{ id: 'gasolina', que: 'Gasolina y peajes', quien: 'pipe', monto: 186000 }] },
    {
      dia: 'Sábado',
      filas: [
        { id: 'mercado', que: 'Mercado para la finca', quien: 'dani', monto: 240000 },
        { id: 'finca', que: 'La finca, dos noches', quien: 'valen', monto: 900000 },
      ],
    },
    { dia: 'Domingo', filas: [{ id: 'almuerzo', que: 'Almuerzo en el pueblo', quien: 'juanma', monto: 132000 }] },
  ],
};

export function resumenPaseo() {
  const filas = PASEO.dias.flatMap((d) => d.filas);
  return cuentaDelGrupo({
    orden: PASEO.orden,
    items: filas.map((f) => ({ monto: f.monto, participantes: PASEO.orden })),
    extra: 0,
    pagos: Object.fromEntries(filas.map((f) => [f.quien, f.monto])),
  });
}

const fila = (izquierda, derecha, atributos = '') =>
  `<li class="tirilla-fila"${atributos}><span>${izquierda}</span><span class="lider" aria-hidden="true"></span><span${atributos ? ' data-monto' : ''}>${derecha}</span></li>`;

export function htmlTirilla() {
  const n = (id) => PASEO.nombres[id];
  const dias = PASEO.dias.map((d) => `<li class="tirilla-dia"><p class="tirilla-cuando">${d.dia}</p><ul>`
    + d.filas.map((f) => fila(`${f.que}<span class="tirilla-quien">${n(f.quien)} pagó</span>`, formatoPesos(f.monto))).join('')
    + '</ul></li>').join('\n');
  const { transferencias } = resumenPaseo();
  const pagos = '<li class="tirilla-dia"><p class="tirilla-cuando">Para quedar a mano</p><ul>'
    + transferencias.map((t) => fila(`${n(t.de)} le paga a ${n(t.a)}`, formatoPesos(t.monto), ` data-de="${t.de}" data-a="${t.a}"`)).join('')
    + '</ul></li>';
  return `${dias}\n${pagos}`;
}
