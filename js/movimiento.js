// Cada sección entra una vez, cuando aparece: sus partes llegan en orden de
// lectura. Las partes solo se esconden cuando este módulo corre (clase
// `mueve`), así que sin JavaScript todo se ve desde el principio.
export function montarEntradas(doc = document) {
  const secciones = [...doc.querySelectorAll('[data-entrada]')];
  if (!secciones.length || !('IntersectionObserver' in window)) return;
  for (const seccion of secciones) {
    seccion.querySelectorAll('[data-parte]').forEach((parte, i) => parte.style.setProperty('--i', i));
  }
  const vigia = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('entro');
      vigia.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  doc.documentElement.classList.add('mueve');
  secciones.forEach((s) => vigia.observe(s));
}

montarEntradas();
