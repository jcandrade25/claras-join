// La invitación a un grupo (clarasapp.com/?c=CODIGO), con la misma lógica de
// la página que había antes de la landing: en Android abre la app (y si no
// está, ofrece Play y la web); en iPhone y computadores entra a la versión web
// con el código puesto y deja copiarlo.
import { URL_WEB, codigoDeInvitacion, tipoDispositivo, urlPlay } from './dispositivo.js';

export function montarInvitacion(doc, location, nav) {
  const raiz = doc.querySelector('[data-invitacion]');
  if (!raiz) return;
  const codigo = codigoDeInvitacion(location.search);
  if (!codigo) { raiz.hidden = true; return; }

  const $ = (s) => raiz.querySelector(s);
  const abrir = $('[data-abrir]');
  const tienda = $('[data-tienda]');
  const enlaceWeb = $('[data-web]');
  const copiar = $('[data-copiar]');
  const pista = $('[data-pista-invitacion]');
  const tipo = tipoDispositivo(nav.userAgent, nav.platform, nav.maxTouchPoints);
  const web = `${URL_WEB}?c=${encodeURIComponent(codigo)}`;
  const deepLink = `claras://join/${encodeURIComponent(codigo)}`;

  $('[data-codigo]').textContent = codigo;
  raiz.hidden = false;
  doc.documentElement.classList.add('con-invitacion');

  if (tipo === 'android') {
    // La app abre claras://join/CODIGO; si no está instalada, quedan la tienda y la web.
    abrir.textContent = 'Abrir en Claras';
    abrir.setAttribute('href', deepLink);
    abrir.addEventListener('click', (ev) => { ev.preventDefault(); location.href = deepLink; });
    tienda.setAttribute('href', urlPlay('invitacion'));
    tienda.hidden = false;
    enlaceWeb.setAttribute('href', web);
    enlaceWeb.hidden = false;
    pista.textContent = '¿No se abrió? Instala Claras y vuelve a tocar el enlace. Tu código quedará listo.';
    // Intento automático: si la app está instalada, Android cambia a Claras.
    setTimeout(() => { location.href = deepLink; }, 600);
  } else {
    // iPhone y computador: no hay app que abrir (claras:// da error en Safari).
    abrir.textContent = 'Abrir Claras';
    abrir.setAttribute('href', web);
    copiar.hidden = false;
    pista.textContent = tipo === 'ios'
      ? '¿Ya usas Claras desde la pantalla de inicio? Ábrela, toca "Unirse con código" y pega el código.'
      : 'Claras funciona en el navegador. En Android también puedes instalar la app.';
  }

  copiar.addEventListener('click', () => {
    const copiado = () => { copiar.textContent = 'Código copiado'; };
    const seleccionar = () => {
      const r = doc.createRange();
      r.selectNodeContents($('[data-codigo]'));
      const s = doc.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    };
    if (nav.clipboard?.writeText) nav.clipboard.writeText(codigo).then(copiado, seleccionar);
    else seleccionar();
  });
}
