// "Cobra sin pena": tres pestañas cambian la captura de la app y su texto.
// Con las flechas se pasa de una pestaña a la otra.
export function montarVitrina(raiz) {
  const pestanas = [...raiz.querySelectorAll('[data-pestana]')];
  const plato = raiz.querySelector('img[data-plato]');

  function escoger(pestana, enfocar = false) {
    for (const p of pestanas) {
      const activa = p === pestana;
      p.setAttribute('aria-selected', String(activa));
      p.tabIndex = activa ? 0 : -1;
      raiz.querySelector(`[data-panel="${p.dataset.pestana}"]`).hidden = !activa;
    }
    plato.src = pestana.dataset.imagen;
    plato.alt = pestana.dataset.alt;
    // La captura nueva aparece fundiéndose sobre el plato.
    plato.classList.remove('fundir');
    void plato.offsetWidth;
    plato.classList.add('fundir');
    if (enfocar) pestana.focus();
  }

  raiz.addEventListener('click', (ev) => {
    const p = ev.target.closest('[data-pestana]');
    if (p) escoger(p);
  });
  raiz.addEventListener('keydown', (ev) => {
    const i = pestanas.indexOf(document.activeElement);
    if (i < 0 || (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft')) return;
    ev.preventDefault();
    const paso = ev.key === 'ArrowRight' ? 1 : -1;
    escoger(pestanas[(i + paso + pestanas.length) % pestanas.length], true);
  });
}

const raiz = document.querySelector('[data-vitrina]');
if (raiz) montarVitrina(raiz);
