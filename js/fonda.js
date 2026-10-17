// La cuenta de ejemplo del primer pantallazo. Fonda La Vaca no existe: es un
// ejemplo para jugar ("hacer la vaca"). Mafe pagó todo; tres platos llegan sin
// dueño para que el visitante los reparta.
export const FONDA = {
  restaurante: 'Fonda La Vaca',
  grupo: 'Almuerzo en Fonda La Vaca',
  pagador: 'mafe',
  llaveEjemplo: '@mafe.ejemplo',
  personas: [
    { id: 'mafe', nombre: 'Mafe' },
    { id: 'pacho', nombre: 'Pacho' },
    { id: 'valen', nombre: 'Valen' },
    { id: 'pipe', nombre: 'Pipe' },
  ],
  items: [
    { id: 'bandeja', nombre: 'Bandeja paisa', cantidad: 2, unitario: 36000, inicial: ['pacho', 'pipe'] },
    { id: 'sancocho', nombre: 'Sancocho trifásico', cantidad: 1, unitario: 32000, inicial: ['mafe'] },
    { id: 'empanadas', nombre: 'Empanadas', cantidad: 2, unitario: 3500, inicial: ['valen'] },
    { id: 'chicharron', nombre: 'Chicharrón', cantidad: 1, unitario: 25000, inicial: [] },
    { id: 'limonada', nombre: 'Limonada de coco', cantidad: 3, unitario: 12000, inicial: ['mafe', 'valen', 'pacho'] },
    { id: 'cerveza', nombre: 'Cerveza', cantidad: 2, unitario: 7000, inicial: [] },
    { id: 'natas', nombre: 'Postre de natas', cantidad: 1, unitario: 9000, inicial: [] },
  ],
  completa: {
    chicharron: ['mafe', 'pacho', 'pipe'],
    cerveza: ['pipe'],
    natas: ['mafe'],
  },
};
