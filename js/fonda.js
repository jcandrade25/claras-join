// La cuenta de ejemplo del primer pantallazo. Fonda La Vaca no existe: es un
// ejemplo para jugar ("hacer la vaca"). Dani pagó todo; tres platos llegan sin
// dueño para que el visitante los reparta.
export const FONDA = {
  restaurante: 'Fonda La Vaca',
  grupo: 'Almuerzo en Fonda La Vaca',
  pagador: 'dani',
  llaveEjemplo: '@dani.ejemplo',
  personas: [
    { id: 'dani', nombre: 'Dani' },
    { id: 'juanma', nombre: 'Juanma' },
    { id: 'valen', nombre: 'Valen' },
    { id: 'pipe', nombre: 'Pipe' },
  ],
  items: [
    { id: 'bandeja', nombre: 'Bandeja paisa', cantidad: 2, unitario: 36000, inicial: ['juanma', 'pipe'] },
    { id: 'sancocho', nombre: 'Sancocho trifásico', cantidad: 1, unitario: 32000, inicial: ['dani'] },
    { id: 'empanadas', nombre: 'Empanadas', cantidad: 2, unitario: 3500, inicial: ['valen'] },
    { id: 'chicharron', nombre: 'Chicharrón', cantidad: 1, unitario: 25000, inicial: [] },
    { id: 'limonada', nombre: 'Limonada de coco', cantidad: 3, unitario: 12000, inicial: ['dani', 'valen', 'juanma'] },
    { id: 'cerveza', nombre: 'Cerveza', cantidad: 2, unitario: 7000, inicial: [] },
    { id: 'natas', nombre: 'Postre de natas', cantidad: 1, unitario: 9000, inicial: [] },
  ],
  completa: {
    chicharron: ['dani', 'juanma', 'pipe'],
    cerveza: ['pipe'],
    natas: ['dani'],
  },
};
