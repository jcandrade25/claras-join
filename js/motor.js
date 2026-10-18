// Motor de reparto de Claras, copiado de la app (cuentas_claras/lib/core):
// division.dart, balances.dart (repartirItems), propina.dart (propinaSugerida),
// liquidacion.dart y cobro.dart. Todo en pesos enteros. Se prueba peso por peso
// contra el motor de Dart con _test/fixture-motor.json; si la app cambia su
// motor, se cambia aquí igual y se vuelve a exportar el fixture.

const signo = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);

// Reparte [total] en [n] partes iguales; el sobrante va de a 1 a los primeros.
export function repartirIgual(total, n) {
  if (n <= 0) throw new Error('No hay participantes en el reparto.');
  const base = Math.trunc(total / n);
  const resto = total - base * n;
  const unidad = signo(resto);
  const k = Math.abs(resto);
  const partes = new Array(n).fill(base);
  for (let i = 0; i < k; i++) partes[i] += unidad;
  return partes;
}

// Reparto proporcional por pesos enteros (Hamilton, mayor resto). Los
// productos caben en un número exacto: los montos de la página son pequeños.
export function repartirPorPesos(total, pesos) {
  const n = pesos.length;
  if (n === 0) throw new Error('No hay participantes en el reparto.');
  if (pesos.some((w) => w < 0)) throw new Error('Las partes no pueden ser negativas.');
  const pesoTotal = pesos.reduce((a, b) => a + b, 0);
  if (pesoTotal === 0) throw new Error('La suma de las partes es 0; asigna al menos una parte.');

  const s = signo(total);
  const t = Math.abs(total);
  const partes = new Array(n).fill(0);
  const resto = new Array(n).fill(0);
  let repartido = 0;
  for (let i = 0; i < n; i++) {
    const producto = t * pesos[i];
    partes[i] = Math.floor(producto / pesoTotal);
    resto[i] = producto - partes[i] * pesoTotal;
    repartido += partes[i];
  }
  const faltan = t - repartido;
  if (faltan < 0 || faltan >= n) throw new Error('No se pudo repartir el gasto.');

  // Orden por resto DESC, índice ASC: determinista y estable.
  const orden = [...partes.keys()].sort((a, b) => resto[b] - resto[a] || a - b);
  for (let j = 0; j < faltan; j++) partes[orden[j]] += 1;

  return s < 0 ? partes.map((p) => -p) : partes;
}

// Propina sugerida: el 10 % de [base], redondeado al peso (0 sin base).
export function propinaSugerida(base) {
  return base <= 0 ? 0 : Math.trunc((base + 5) / 10);
}

// Ítems repartidos por igual entre quienes los consumieron, más la propina a
// prorrata del consumo. Devuelve un Map en el mismo orden que el de Dart.
export function repartirItems(items, extra, orden) {
  const sub = new Map();
  for (const item of items) {
    let ids = orden.filter((id) => item.participantes.includes(id));
    if (ids.length === 0) ids = orden;
    if (ids.length === 0) continue;
    const partes = repartirIgual(item.monto, ids.length);
    ids.forEach((id, i) => sub.set(id, (sub.get(id) ?? 0) + partes[i]));
  }
  if (extra !== 0) {
    if (sub.size === 0) {
      if (orden.length === 0) return sub;
      const partes = repartirIgual(extra, orden.length);
      orden.forEach((id, i) => sub.set(id, (sub.get(id) ?? 0) + partes[i]));
    } else {
      const ids = orden.filter((id) => sub.has(id));
      const pesos = ids.map((id) => sub.get(id));
      const pesoTotal = pesos.reduce((a, b) => a + b, 0);
      const hayNegativo = pesos.some((w) => w < 0);
      const extras = pesoTotal === 0 || hayNegativo
        ? repartirIgual(extra, ids.length)
        : repartirPorPesos(extra, pesos);
      ids.forEach((id, i) => sub.set(id, sub.get(id) + extras[i]));
    }
  }
  return sub;
}

// ¿Quién le paga a quién? Mayor acreedor con mayor deudor, repetidamente:
// a lo sumo n-1 pagos, por monto DESC e id ASC.
export function liquidar(balances) {
  const acreedores = [];
  const deudores = [];
  for (const [id, b] of balances) {
    if (b > 0) acreedores.push([id, b]);
    else if (b < 0) deudores.push([id, -b]);
  }
  const porMonto = (x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0);
  acreedores.sort(porMonto);
  deudores.sort(porMonto);

  const res = [];
  let i = 0;
  let j = 0;
  let credito = acreedores.length ? acreedores[0][1] : 0;
  let deuda = deudores.length ? deudores[0][1] : 0;
  while (i < acreedores.length && j < deudores.length) {
    const monto = Math.min(credito, deuda);
    res.push({ de: deudores[j][0], a: acreedores[i][0], monto });
    credito -= monto;
    deuda -= monto;
    if (credito === 0) {
      i++;
      if (i < acreedores.length) credito = acreedores[i][1];
    }
    if (deuda === 0) {
      j++;
      if (j < deudores.length) deuda = deudores[j][1];
    }
  }
  return res;
}

// Una cuenta de grupo completa: lo que le toca a cada uno, su balance (pagó
// menos le toca) y los pagos para quedar a mano.
export function cuentaDelGrupo({ orden, items, extra, pagos }) {
  const deuda = repartirItems(items, extra, orden);
  const balances = new Map(
    orden.map((id) => [id, (pagos[id] ?? 0) - (deuda.get(id) ?? 0)]));
  return { deuda, balances, transferencias: liquidar(balances) };
}

// Pesos como en la app: "$1.234.567", negativo con "-" delante.
export function formatoPesos(n) {
  const miles = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '-' : ''}$${miles}`;
}

// El mensaje de "Cobrar" de la app (cobroMensaje en app_es.arb).
export function mensajeCobro({ deudor, grupo, monto, llave }) {
  let texto = `Hola ${deudor}, en «${grupo}» me debes ${formatoPesos(monto)}.`;
  if (llave.trim()) texto += ` Puedes pagarme por Bre-B a la llave ${llave.trim()}.`;
  return `${texto} ¡Gracias!`;
}
