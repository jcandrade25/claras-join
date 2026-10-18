// La cuenta jugable en un navegador de verdad (Edge), como la usaría un visitante.
// Se reparte como en la app: cada plato abre sus fichas (Todos y cada persona) y
// se tocan las de quienes comieron. Arrastrar el plato a una persona es un atajo.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { servir } from './servidor.mjs';
import { abrir } from './navegador.mjs';
import { mensajeCobro } from '../js/motor.js';

let sitio;
before(async () => { sitio = await servir(fileURLToPath(new URL('..', import.meta.url))); });
after(async () => { await sitio.cerrar(); });

const plato = (id) => `[data-item="${id}"]`;
const persona = (id) => `[data-persona="${id}"]`;
const fila = (item) => `li:has(${plato(item)})`;
const ficha = (item, id) => `${fila(item)} [data-ficha="${id}"]`;

async function pagina(opciones) {
  const { browser, page } = await abrir(opciones);
  await page.goto(`${sitio.url}/`);
  return { browser, page };
}

// Abre el plato si sus fichas no están a la vista.
async function abrirPlato(page, tocar, item) {
  if (await page.locator(ficha(item, 'todos')).count() === 0) await tocar(plato(item));
}

// Los tres platos que llegan sin dueño, repartidos como en la cuenta completa.
async function completar(page, tocar) {
  for (const [item, quienes] of [['chicharron', ['dani', 'juanma', 'pipe']], ['cerveza', ['pipe']], ['natas', ['dani']]]) {
    await abrirPlato(page, tocar, item);
    for (const id of quienes) await tocar(ficha(item, id));
  }
}

const montos = (page) => page.$$eval('[data-talon]', (ts) =>
  ts.map((t) => [t.dataset.talon, t.querySelector('[data-monto]').textContent.trim()]));
const prendida = (page, s) => page.getAttribute(s, 'aria-pressed');

test('al llegar, el primer plato sin dueño muestra sus fichas como en la app', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    const nombres = await page.$$eval(`${fila('chicharron')} [data-ficha]`, (fs) => fs.map((f) => f.textContent.trim()));
    assert.deepEqual(nombres, ['Todos', 'Dani', 'Juanma', 'Valen', 'Pipe']);
    for (const id of ['dani', 'juanma', 'valen', 'pipe']) assert.equal(await prendida(page, ficha('chicharron', id)), 'false');
    assert.equal(await page.locator('[data-ficha]').count(), 5);
  } finally { await browser.close(); }
});

test('asignar los tres platos con las fichas y liquidar da tres talones', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    assert.equal(await page.textContent('[data-falta]'), '$48.000');
    await completar(page, (s) => page.tap(s));
    assert.equal(await page.textContent('[data-falta]'), '$0');
    await page.tap('[data-liquidar]');
    assert.deepEqual(await montos(page), [['pipe', '$64.166'], ['juanma', '$61.966'], ['valen', '$20.900']]);
    for (const [id, nombre, monto] of [['pipe', 'Pipe', 64166], ['juanma', 'Juanma', 61966], ['valen', 'Valen', 20900]]) {
      const texto = await page.textContent(`[data-talon="${id}"]`);
      assert.match(texto, /Cobrar por WhatsApp/);
      assert.ok(texto.includes(mensajeCobro({ deudor: nombre, grupo: 'Almuerzo en Fonda La Vaca', monto, llave: '@dani.ejemplo' })));
      assert.match(texto, /En la app, este botón abre tu WhatsApp con el mensaje listo/);
    }
  } finally { await browser.close(); }
});

test('la ficha Todos reparte el plato entre los cuatro', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    await page.tap(plato('cerveza'));
    await page.tap(ficha('cerveza', 'todos'));
    for (const id of ['dani', 'juanma', 'valen', 'pipe']) assert.equal(await prendida(page, ficha('cerveza', id)), 'true');
    assert.equal(await prendida(page, ficha('cerveza', 'todos')), 'true');
    assert.equal(await page.textContent('[data-falta]'), '$34.000');
  } finally { await browser.close(); }
});

test('tocar una ficha prendida la apaga', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    await page.tap(plato('cerveza'));
    await page.tap(ficha('cerveza', 'pipe'));
    assert.equal(await prendida(page, ficha('cerveza', 'pipe')), 'true');
    assert.equal(await page.textContent('[data-falta]'), '$34.000');
    await page.tap(ficha('cerveza', 'pipe'));
    assert.equal(await prendida(page, ficha('cerveza', 'pipe')), 'false');
    assert.equal(await page.textContent('[data-falta]'), '$48.000');
  } finally { await browser.close(); }
});

test('arrastrar un plato a una persona también lo asigna', async () => {
  const { browser, page } = await pagina({ ancho: 1440, alto: 900 });
  try {
    // La cuenta entra moviéndose: medir cuando ya quedó quieta.
    await page.evaluate(() => Promise.all(document.querySelector('.cuenta').getAnimations().map((a) => a.finished)));
    const desde = await page.locator(plato('cerveza')).boundingBox();
    const hasta = await page.locator(persona('pipe')).boundingBox();
    await page.mouse.move(desde.x + desde.width / 2, desde.y + desde.height / 2);
    await page.mouse.down();
    await page.mouse.move(hasta.x + hasta.width / 2, hasta.y + hasta.height / 2, { steps: 12 });
    await page.mouse.up();
    assert.equal(await page.textContent(`${fila('cerveza')} .duenos`), 'Pipe');
    assert.equal(await page.textContent('[data-falta]'), '$34.000');
  } finally { await browser.close(); }
});

test('otra vez y de nuevo liquidar no duplica', async () => {
  const { browser, page } = await pagina({ ancho: 1440, alto: 900 });
  try {
    const clic = (s) => page.click(s);
    await completar(page, clic);
    await page.click('[data-liquidar]');
    await page.click('[data-otra-vez]');
    assert.equal(await page.locator('[data-talon]').count(), 0);
    assert.equal(await page.textContent('[data-falta]'), '$48.000');
    await completar(page, clic);
    await page.click('[data-liquidar]');
    assert.deepEqual(await montos(page), [['pipe', '$64.166'], ['juanma', '$61.966'], ['valen', '$20.900']]);
  } finally { await browser.close(); }
});

test('Liquidar se ve desde el principio, apagado hasta que no falte nada', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    assert.ok(await page.isVisible('[data-liquidar]'));
    assert.ok(await page.isDisabled('[data-liquidar]'));
    await completar(page, (s) => page.tap(s));
    assert.ok(await page.isEnabled('[data-liquidar]'));
    await abrirPlato(page, (s) => page.tap(s), 'cerveza');
    await page.tap(ficha('cerveza', 'pipe'));
    assert.ok(await page.isVisible('[data-liquidar]'));
    assert.ok(await page.isDisabled('[data-liquidar]'));
    assert.equal(await page.textContent('[data-falta]'), '$14.000');
  } finally { await browser.close(); }
});

test('en el celular nada de la cuenta bloquea el scroll', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    const gesto = (s) => page.$eval(s, (e) => getComputedStyle(e).touchAction);
    for (const s of [plato('chicharron'), '.cuenta', '.plato', ficha('chicharron', 'dani')]) {
      assert.notEqual(await gesto(s), 'none', s);
    }
  } finally { await browser.close(); }
});

test('con mouse el nombre del plato se puede arrastrar', async () => {
  const { browser, page } = await pagina({ ancho: 1440, alto: 900 });
  try {
    assert.equal(await page.$eval(plato('chicharron'), (e) => getComputedStyle(e).touchAction), 'none');
  } finally { await browser.close(); }
});

test('arriba, la cuenta dice que es de ejemplo y cómo se usa', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    const texto = await page.textContent('.cuenta-cabeza');
    assert.match(texto, /Cuenta de ejemplo/);
    assert.match(texto, /Toca un plato y escoge quién lo comió/);
    assert.ok(await page.isVisible('.cuenta-cabeza'));
  } finally { await browser.close(); }
});

test('en el celular, lo que falta y Liquidar se quedan a la vista', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    assert.equal(await page.$eval('.cuenta-pie', (e) => getComputedStyle(e).position), 'sticky');
    const caja = await page.locator('[data-liquidar]').boundingBox();
    assert.ok(caja.y + caja.height <= 844, `Liquidar queda en y=${caja.y}`);
    const falta = await page.locator('[data-falta]').boundingBox();
    assert.ok(falta.y + falta.height <= 844, `Falta queda en y=${falta.y}`);
  } finally { await browser.close(); }
});

test('con movimiento reducido los talones aparecen igual', async () => {
  const { browser, page } = await pagina({ ancho: 1440, alto: 900, movimientoReducido: true });
  try {
    await completar(page, (s) => page.click(s));
    await page.click('[data-liquidar]');
    assert.equal(await page.locator('[data-talon]').count(), 3);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
  } finally { await browser.close(); }
});

test('sin JavaScript se ve la cuenta resuelta', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, sinJs: true });
  try {
    assert.deepEqual(await montos(page), [['pipe', '$64.166'], ['juanma', '$61.966'], ['valen', '$20.900']]);
    for (const id of ['pipe', 'juanma', 'valen']) assert.ok(await page.isVisible(`[data-talon="${id}"]`));
    assert.equal(await page.textContent('[data-falta]'), '$0');
  } finally { await browser.close(); }
});

test('con teclado se puede repartir', async () => {
  const { browser, page } = await pagina({ ancho: 1440, alto: 900 });
  try {
    const antes = await page.textContent(`${persona('pipe')} [data-total]`);
    await page.focus(ficha('chicharron', 'pipe'));
    await page.keyboard.press('Enter');
    assert.equal(await prendida(page, ficha('chicharron', 'pipe')), 'true');
    assert.notEqual(await page.textContent(`${persona('pipe')} [data-total]`), antes);
    assert.match(await page.textContent('[data-anuncio]'), /Pipe/);
  } finally { await browser.close(); }
});

test('al llegar, una demostración toca las fichas del primer plato', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    await page.waitForSelector('[data-demo]', { timeout: 3000 });
    assert.ok(await page.$eval('[data-demo]', (d) => d.getAnimations({ subtree: true }).length > 0));
  } finally { await browser.close(); }
});

test('la demostración se quita en cuanto uno toca la cuenta', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    await page.waitForSelector('[data-demo]', { timeout: 3000 });
    await page.tap(plato('cerveza'));
    assert.equal(await page.locator('[data-demo]').count(), 0);
  } finally { await browser.close(); }
});

test('con movimiento reducido no hay demostración', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, movimientoReducido: true });
  try {
    await page.waitForTimeout(2000);
    assert.equal(await page.locator('[data-demo]').count(), 0);
  } finally { await browser.close(); }
});

// Revisión final: la carga, el pie pegado en pantallas cortas y el foco.

const bajoElPie = (page) => page.evaluate(() => {
  const fichas = document.querySelector('.plato-abierto').getBoundingClientRect().bottom;
  const pie = document.querySelector('.cuenta-pie').getBoundingClientRect().top;
  return { fichas: Math.round(fichas), pie: Math.round(pie) };
});

test('mientras llega el JavaScript de la cuenta no se ven talones ni salta la portada', async () => {
  async function medir(bloquear) {
    const { browser, page } = await abrir({ ancho: 1440, alto: 900, movimientoReducido: true });
    try {
      if (bloquear) await page.route('**/js/cuenta.js', (r) => r.abort());
      await page.goto(`${sitio.url}/`);
      await page.waitForLoadState('networkidle');
      return {
        titular: await page.$eval('.titular', (e) => Math.round(e.getBoundingClientRect().top)),
        talones: await page.$eval('[data-talones]', (e) => getComputedStyle(e).display),
      };
    } finally { await browser.close(); }
  }
  const montada = await medir(false);
  const cargando = await medir(true);
  assert.equal(cargando.talones, 'none');
  assert.ok(Math.abs(cargando.titular - montada.titular) <= 24, `titular en ${cargando.titular}, luego en ${montada.titular}`);
});

test('en un Android de pantalla corta las fichas del plato abierto quedan sobre el pie', async () => {
  for (const [ancho, alto] of [[360, 672], [360, 720], [390, 844]]) {
    const { browser, page } = await pagina({ ancho, alto, tactil: true });
    try {
      const { fichas, pie } = await bajoElPie(page);
      assert.ok(fichas <= pie, `${ancho}x${alto}: fichas hasta ${fichas}, pie desde ${pie}`);
    } finally { await browser.close(); }
  }
});

test('al abrir un plato que queda bajo el pie, la página lo sube a la vista', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true, movimientoReducido: true });
  try {
    // El último plato, tocado sin que el navegador de pruebas mueva la página.
    await page.$eval(plato('natas'), (b) => b.click());
    await page.waitForTimeout(200);
    const { fichas, pie } = await bajoElPie(page);
    assert.ok(fichas <= pie, `fichas hasta ${fichas}, pie desde ${pie}`);
  } finally { await browser.close(); }
});

test('si las fichas quedan bajo el pie, la demostración no toca el pie', async () => {
  const { browser, page } = await pagina({ ancho: 390, alto: 844, tactil: true });
  try {
    // Un pie más alto tapa las fichas del primer plato.
    await page.addStyleTag({ content: '.cuenta-pie { padding-top: 14rem; }' });
    await page.waitForTimeout(2000);
    assert.equal(await page.locator('[data-demo]').count(), 0);
  } finally { await browser.close(); }
});

test('con teclado, el foco sigue a la acción: Liquidar, Otra vez y Escape', async () => {
  const { browser, page } = await pagina({ ancho: 1440, alto: 900 });
  try {
    const activo = (s) => page.evaluate((sel) => document.activeElement?.matches(sel) ?? false, s);
    await completar(page, (s) => page.click(s));
    await page.focus('[data-liquidar]');
    await page.keyboard.press('Enter');
    assert.ok(await activo('[data-talon] summary'), 'Liquidar deja el foco en el primer talón');
    await page.focus('[data-otra-vez]');
    await page.keyboard.press('Enter');
    assert.ok(await activo('.plato-abierto [data-ficha]'), 'Otra vez deja el foco en las fichas del plato abierto');
    await page.keyboard.press('Escape');
    assert.ok(await activo(plato('chicharron')), 'Escape deja el foco en el plato que se cerró');
  } finally { await browser.close(); }
});
