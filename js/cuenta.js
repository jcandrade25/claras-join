// La cuenta jugable: se arrastra un plato hasta quien se lo comió (o se toca
// el plato y luego a la persona, también con teclado) y "Liquidar" la rasga en
// talones. Las cuentas las hace estado-cuenta.js con el motor de la app.
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

  let estado;
  let seleccionado = null;
  let liquidado = false;

  function pintar() {
    // Volver a pintar cambia los botones: el foco vuelve al mismo botón.
    const foco = document.activeElement;
    const clave = foco && raiz.contains(foco)
      ? ['item', 'persona', 'quitar'].find((k) => foco.dataset[k] !== undefined) : null;
    const valor = clave && foco.dataset[clave];
    const platoDelFoco = clave === 'quitar' ? foco.closest('.plato')?.querySelector('[data-item]')?.dataset.item : null;

    platos.innerHTML = htmlPlatos(estado, seleccionado);
    personas.innerHTML = htmlPersonas(estado);
    falta.textContent = textoFalta(estado);
    liquidar.hidden = liquidado || faltaAsignar(estado) > 0;
    raiz.classList.toggle('con-seleccion', seleccionado !== null);

    if (clave === 'item' || clave === 'persona') {
      raiz.querySelector(`[data-${clave}="${valor}"]`)?.focus();
    } else if (clave === 'quitar') {
      (raiz.querySelector(`[data-item="${platoDelFoco}"]`))?.focus();
    }
  }

  function decir(texto) { anuncio.textContent = texto; }

  function darPlato(itemId, personaId) {
    estado = asignar(estado, itemId, personaId);
    pintar();
    decir(`${nombrePlato(itemId)}: ${estado.asignacion[itemId].map(nombre).join(', ')}. `
      + `${nombre(personaId)} lleva ${formatoPesos(subtotales(estado).get(personaId))}.`);
  }

  function reiniciar() {
    estado = crearEstado(fonda);
    seleccionado = null;
    liquidado = false;
    talones.innerHTML = '';
    talones.hidden = true;
    raiz.classList.remove('liquidada');
    pintar();
  }

  function hacerLiquidar() {
    liquidado = true;
    seleccionado = null;
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
    const quitarBtn = t.closest('[data-quitar]');
    if (quitarBtn) {
      const itemId = quitarBtn.closest('.plato').querySelector('[data-item]').dataset.item;
      estado = quitar(estado, itemId, quitarBtn.dataset.quitar);
      liquidado = false;
      talones.innerHTML = '';
      talones.hidden = true;
      raiz.classList.remove('liquidada');
      pintar();
      decir(`${nombre(quitarBtn.dataset.quitar)} ya no está en ${nombrePlato(itemId)}.`);
      return;
    }
    const platoBtn = t.closest('[data-item]');
    if (platoBtn) {
      seleccionado = seleccionado === platoBtn.dataset.item ? null : platoBtn.dataset.item;
      pintar();
      if (seleccionado) decir(`${nombrePlato(seleccionado)} escogido. Ahora toca a quien se lo comió.`);
      return;
    }
    const personaBtn = t.closest('[data-persona]');
    if (personaBtn) {
      if (seleccionado) darPlato(seleccionado, personaBtn.dataset.persona);
      else decir('Primero toca un plato.');
      return;
    }
    if (t.closest('[data-liquidar]')) { hacerLiquidar(); return; }
    if (t.closest('[data-otra-vez]')) reiniciar();
  });

  raiz.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && seleccionado) { seleccionado = null; pintar(); }
  });

  // Arrastrar con el dedo o el mouse.
  let arrastre = null;
  raiz.addEventListener('pointerdown', (ev) => {
    const platoBtn = ev.target.closest('[data-item]');
    if (!platoBtn || ev.button !== 0) return;
    arrastre = { itemId: platoBtn.dataset.item, x: ev.clientX, y: ev.clientY, fantasma: null, encima: null, origen: platoBtn };
    platoBtn.setPointerCapture(ev.pointerId);
  });

  raiz.addEventListener('pointermove', (ev) => {
    if (!arrastre) return;
    const dx = ev.clientX - arrastre.x;
    const dy = ev.clientY - arrastre.y;
    if (!arrastre.fantasma) {
      if (Math.hypot(dx, dy) < UMBRAL_ARRASTRE) return;
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

  function soltar(ev, valido) {
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
  raiz.addEventListener('pointerup', (ev) => soltar(ev, true));
  raiz.addEventListener('pointercancel', (ev) => soltar(ev, false));

  // Al llegar, un dedo lleva el primer plato sin dueño hasta una persona, dos
  // veces, para que se vea que se puede. Se quita apenas uno toca la cuenta.
  let demo = null;
  let yaTocaron = false;
  function detenerDemo() {
    yaTocaron = true;
    demo?.remove();
    demo = null;
    raiz.querySelector('.demo-destino')?.classList.remove('demo-destino');
  }
  function demostrar() {
    if (reducido() || demo || yaTocaron) return;
    const origen = platos.querySelector('.plato-libre [data-item]');
    const destino = personas.querySelectorAll('[data-persona]')[1];
    if (!origen || !destino) return;
    const base = raiz.getBoundingClientRect();
    const centro = (el) => {
      const r = el.getBoundingClientRect();
      return [r.left - base.left + r.width / 2, r.top - base.top + r.height / 2];
    };
    const [x0, y0] = centro(origen);
    const [x1, y1] = centro(destino);
    demo = document.createElement('div');
    demo.className = 'demo';
    demo.dataset.demo = '';
    demo.setAttribute('aria-hidden', 'true');
    demo.innerHTML = `<span class="demo-plato">${origen.textContent}</span><span class="demo-dedo"></span>`;
    for (const [k, v] of Object.entries({ x0, y0, x1, y1 })) demo.style.setProperty(`--${k}`, `${Math.round(v)}px`);
    demo.addEventListener('animationend', detenerDemo);
    raiz.append(demo);
    destino.classList.add('demo-destino');
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
