// La cuenta jugable, repartida como en la app: se toca un plato y se escoge en
// sus fichas quién lo comió (Todos o cada persona). Arrastrar el plato hasta una
// persona es un atajo. "Liquidar" la rasga en talones. Las cuentas las hace
// estado-cuenta.js con el motor de la app.
import { FONDA } from './fonda.js';
import { asignar, crearEstado, faltaAsignar, quitar, subtotales } from './estado-cuenta.js';
import { htmlPersonas, htmlPlatos, htmlTalones, textoFalta } from './cuenta-html.js';
import { formatoPesos } from './motor.js';

const UMBRAL_ARRASTRE = 6;

export function montarCuenta(raiz, fonda = FONDA) {
  const $ = (s) => raiz.querySelector(s);
  const platos = $('[data-platos]');
  const personas = $('[data-personas]');
  const falta = $('[data-falta]');
  const liquidar = $('[data-liquidar]');
  const talones = $('[data-talones]');
  const anuncio = $('[data-anuncio]');
  const reducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nombre = (id) => fonda.personas.find((p) => p.id === id).nombre;
  const nombrePlato = (id) => fonda.items.find((it) => it.id === id).nombre;
  const primerLibre = () => fonda.items.find((it) => it.inicial.length === 0)?.id ?? null;

  let estado;
  let abierto = null;
  let liquidado = false;

  function pintar() {
    // Volver a pintar cambia los botones: el foco vuelve al mismo botón.
    const foco = document.activeElement;
    const clave = foco && raiz.contains(foco)
      ? ['item', 'persona', 'ficha'].find((k) => foco.dataset[k] !== undefined) : null;
    const valor = clave && foco.dataset[clave];

    platos.innerHTML = htmlPlatos(estado, liquidado ? null : abierto);
    personas.innerHTML = htmlPersonas(estado);
    falta.textContent = textoFalta(estado);
    liquidar.hidden = liquidado;
    liquidar.disabled = faltaAsignar(estado) > 0;
    raiz.classList.toggle('con-seleccion', abierto !== null && !liquidado);

    if (clave) raiz.querySelector(`[data-${clave}="${valor}"]`)?.focus();
  }

  function decir(texto) { anuncio.textContent = texto; }

  function cambiar(nuevo, itemId) {
    estado = nuevo;
    if (liquidado) {
      liquidado = false;
      talones.innerHTML = '';
      talones.hidden = true;
      raiz.classList.remove('liquidada');
    }
    pintar();
    const quienes = estado.asignacion[itemId];
    decir(`${nombrePlato(itemId)}: ${quienes.length ? quienes.map(nombre).join(', ') : 'sin dueño'}. `
      + `Falta asignar ${textoFalta(estado)}.`);
  }

  function darPlato(itemId, personaId) {
    cambiar(asignar(estado, itemId, personaId), itemId);
    decir(`${nombrePlato(itemId)}: ${estado.asignacion[itemId].map(nombre).join(', ')}. `
      + `${nombre(personaId)} lleva ${formatoPesos(subtotales(estado).get(personaId))}.`);
  }

  function tocarFicha(itemId, ficha) {
    const quienes = estado.asignacion[itemId];
    let nuevo = estado;
    if (ficha === 'todos') {
      const todos = fonda.personas.every((p) => quienes.includes(p.id));
      for (const p of fonda.personas) nuevo = todos ? quitar(nuevo, itemId, p.id) : asignar(nuevo, itemId, p.id);
      cambiar(nuevo, itemId);
    } else if (quienes.includes(ficha)) {
      cambiar(quitar(estado, itemId, ficha), itemId);
    } else {
      darPlato(itemId, ficha);
    }
  }

  function reiniciar() {
    estado = crearEstado(fonda);
    abierto = primerLibre();
    liquidado = false;
    talones.innerHTML = '';
    talones.hidden = true;
    raiz.classList.remove('liquidada');
    pintar();
  }

  function hacerLiquidar() {
    liquidado = true;
    abierto = null;
    pintar();
    talones.innerHTML = `${htmlTalones(estado)}\n<button type="button" class="boton boton-otra-vez" data-otra-vez>Otra vez</button>`;
    talones.hidden = false;
    raiz.classList.add('liquidada');
    decir(`Cuenta liquidada en ${talones.querySelectorAll('[data-talon]').length} pagos.`);
    talones.scrollIntoView({ block: 'nearest', behavior: reducido() ? 'auto' : 'smooth' });
  }

  // Tocar o hacer clic (también Enter y espacio en un botón).
  let suprimirClic = false;
  raiz.addEventListener('click', (ev) => {
    if (suprimirClic) { suprimirClic = false; return; }
    const t = ev.target;
    const fichaBtn = t.closest('[data-ficha]');
    if (fichaBtn) {
      tocarFicha(fichaBtn.closest('.plato').querySelector('[data-item]').dataset.item, fichaBtn.dataset.ficha);
      return;
    }
    const platoBtn = t.closest('[data-item]');
    if (platoBtn) {
      abierto = abierto === platoBtn.dataset.item ? null : platoBtn.dataset.item;
      pintar();
      if (abierto) decir(`${nombrePlato(abierto)}: escoge quién lo comió.`);
      return;
    }
    const personaBtn = t.closest('[data-persona]');
    if (personaBtn) {
      if (abierto) darPlato(abierto, personaBtn.dataset.persona);
      else decir('Primero toca un plato.');
      return;
    }
    if (t.closest('[data-liquidar]')) { hacerLiquidar(); return; }
    if (t.closest('[data-otra-vez]')) reiniciar();
  });

  raiz.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && abierto) { abierto = null; pintar(); }
  });

  // Atajo: arrastrar el plato con el dedo o el mouse hasta una persona.
  let arrastre = null;
  raiz.addEventListener('pointerdown', (ev) => {
    const platoBtn = ev.target.closest('[data-item]');
    // En el celular se toca, como en la app; arrastrar es solo para el mouse.
    if (!platoBtn || ev.button !== 0 || ev.pointerType === 'touch') return;
    arrastre = { itemId: platoBtn.dataset.item, x: ev.clientX, y: ev.clientY, fantasma: null, encima: null, origen: platoBtn };
    platoBtn.setPointerCapture(ev.pointerId);
  });

  raiz.addEventListener('pointermove', (ev) => {
    if (!arrastre) return;
    if (!arrastre.fantasma) {
      if (Math.hypot(ev.clientX - arrastre.x, ev.clientY - arrastre.y) < UMBRAL_ARRASTRE) return;
      const f = document.createElement('div');
      f.className = 'fantasma';
      f.textContent = nombrePlato(arrastre.itemId);
      document.body.append(f);
      arrastre.fantasma = f;
      arrastre.origen.classList.add('arrastrando');
    }
    arrastre.fantasma.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px) translate(-50%, -140%)`;
    const debajo = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-persona]') ?? null;
    if (debajo !== arrastre.encima) {
      arrastre.encima?.classList.remove('encima');
      debajo?.classList.add('encima');
      arrastre.encima = debajo;
    }
  });

  function soltar(valido) {
    if (!arrastre) return;
    const { itemId, fantasma, encima, origen } = arrastre;
    arrastre = null;
    if (!fantasma) return; // fue un toque: lo maneja el clic
    fantasma.remove();
    origen.classList.remove('arrastrando');
    encima?.classList.remove('encima');
    suprimirClic = true;
    setTimeout(() => { suprimirClic = false; }, 0);
    if (valido && encima) darPlato(itemId, encima.dataset.persona);
  }
  raiz.addEventListener('pointerup', () => soltar(true));
  raiz.addEventListener('pointercancel', () => soltar(false));

  // Al llegar, un dedo toca dos fichas del plato abierto, dos veces, para que se
  // vea que se reparte tocando nombres, como en la app. Se quita al primer toque.
  let demo = null;
  let yaTocaron = false;
  function detenerDemo() {
    yaTocaron = true;
    demo?.remove();
    demo = null;
    raiz.querySelectorAll('.demo-toque-1, .demo-toque-2').forEach((f) => f.classList.remove('demo-toque-1', 'demo-toque-2'));
  }
  function demostrar() {
    if (reducido() || demo || yaTocaron || !abierto) return;
    const fichas = [...platos.querySelectorAll('.plato-abierto [data-ficha]')].filter((f) => f.dataset.ficha !== 'todos');
    if (fichas.length < 2) return;
    const base = raiz.getBoundingClientRect();
    const centro = (el) => {
      const r = el.getBoundingClientRect();
      return [r.left - base.left + r.width / 2, r.top - base.top + r.height / 2];
    };
    const [x0, y0] = centro(fichas[0]);
    const [x1, y1] = centro(fichas[1]);
    demo = document.createElement('div');
    demo.className = 'demo';
    demo.dataset.demo = '';
    demo.setAttribute('aria-hidden', 'true');
    for (const [k, v] of Object.entries({ x0, y0, x1, y1 })) demo.style.setProperty(`--${k}`, `${Math.round(v)}px`);
    demo.addEventListener('animationend', detenerDemo);
    raiz.append(demo);
    fichas[0].classList.add('demo-toque-1');
    fichas[1].classList.add('demo-toque-2');
  }
  for (const tipo of ['pointerdown', 'keydown']) raiz.addEventListener(tipo, detenerDemo, { capture: true });
  const cuenta = raiz.querySelector('.cuenta');
  if ('IntersectionObserver' in window && cuenta) {
    const vigia = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) { vigia.disconnect(); setTimeout(demostrar, 900); }
    }, { threshold: 0.5 });
    vigia.observe(cuenta);
  }

  reiniciar();
  return { reiniciar };
}

const raiz = document.querySelector('[data-cuenta]');
if (raiz) montarCuenta(raiz);
