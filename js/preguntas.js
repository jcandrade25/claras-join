// Las preguntas: una ficha abierta a la vez. Los navegadores nuevos ya lo
// hacen con <details name="preguntas">; esto cubre a los que no.
export function montarFichas(raiz) {
  const fichas = [...raiz.querySelectorAll('[data-pregunta]')];
  for (const f of fichas) {
    f.addEventListener('toggle', () => {
      if (f.open) for (const otra of fichas) if (otra !== f && otra.open) otra.open = false;
    });
  }
}

const raiz = document.querySelector('[data-preguntas]');
if (raiz) montarFichas(raiz);
