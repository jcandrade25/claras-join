// Estado de la cuenta jugable, sin DOM: quién se comió qué. Cada función
// devuelve un estado nuevo; las cuentas las hace el motor de la app.
import { cuentaDelGrupo, propinaSugerida, repartirItems } from './motor.js';

const totalItem = (it) => it.cantidad * it.unitario;
const orden = (e) => e.fonda.personas.map((p) => p.id);

const conAsignacion = (e, itemId, quienes) => ({
  ...e,
  asignacion: { ...e.asignacion, [itemId]: quienes },
});

export function crearEstado(fonda) {
  return {
    fonda,
    asignacion: Object.fromEntries(fonda.items.map((it) => [it.id, [...it.inicial]])),
  };
}

export function asignar(e, itemId, personaId) {
  const quienes = e.asignacion[itemId];
  if (quienes.includes(personaId)) return e;
  // En el orden del grupo, como los guarda la app.
  return conAsignacion(e, itemId, orden(e).filter((id) => id === personaId || quienes.includes(id)));
}

export function quitar(e, itemId, personaId) {
  return conAsignacion(e, itemId, e.asignacion[itemId].filter((id) => id !== personaId));
}

export function faltaAsignar(e) {
  return e.fonda.items
    .filter((it) => e.asignacion[it.id].length === 0)
    .reduce((a, it) => a + totalItem(it), 0);
}

function itemsConDueno(e) {
  return e.fonda.items
    .filter((it) => e.asignacion[it.id].length > 0)
    .map((it) => ({ monto: totalItem(it), participantes: e.asignacion[it.id] }));
}

// Lo que va debiendo cada uno con los platos que ya tienen dueño, con la
// propina del 10 % sobre esos platos.
export function subtotales(e) {
  const items = itemsConDueno(e);
  const base = items.reduce((a, it) => a + it.monto, 0);
  return repartirItems(items, propinaSugerida(base), orden(e));
}

export function resultado(e) {
  if (faltaAsignar(e) > 0) return null;
  const items = itemsConDueno(e);
  const base = items.reduce((a, it) => a + it.monto, 0);
  const extra = propinaSugerida(base);
  return cuentaDelGrupo({
    orden: orden(e),
    items,
    extra,
    pagos: { [e.fonda.pagador]: base + extra },
  });
}

export function completar(e) {
  return Object.entries(e.fonda.completa).reduce(
    (est, [itemId, quienes]) => quienes.reduce((x, id) => asignar(x, itemId, id), est), e);
}
