// A dónde lleva cada botón: todos van a Play, en cualquier celular o
// computador. La versión web solo se ofrece en iPhone, como un enlace discreto
// (no hay app de iPhone en la tienda). Sirve también dentro de los navegadores
// de Instagram, TikTok y Facebook.

const PLAY = 'https://play.google.com/store/apps/details?id=com.jcandrade.cuentas_claras';

export const urlPlay = (campana) =>
  `${PLAY}&referrer=utm_source%3Dclarasapp%26utm_medium%3Dweb%26utm_campaign%3D${campana}`;
export const URL_PLAY = urlPlay('landing');
export const URL_WEB = 'https://app.clarasapp.com/';

// iPadOS se presenta como Mac; se distingue porque tiene pantalla táctil.
export function tipoDispositivo(ua = '', plataforma = '', puntosTactiles = 0) {
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua) || (plataforma === 'MacIntel' && puntosTactiles > 1)) return 'ios';
  return 'otro';
}

// Solo un código de verdad (6 u 8 letras y números; margen de 4 a 12): sin
// esto la página mostraría y copiaría cualquier texto puesto en el enlace.
export function codigoDeInvitacion(search) {
  const params = new URLSearchParams(search);
  const codigo = (params.get('c') || params.get('code') || '').trim().toUpperCase();
  return /^[A-Z0-9]{4,12}$/.test(codigo) ? codigo : '';
}

const TEXTOS = { corto: 'Descargar', largo: 'Descargar en Google Play' };

// Cada [data-accion] lleva a Play en cualquier aparato (la app es lo que se
// promociona; desde un computador, Play deja instalarla en el celular). La
// versión web solo se ofrece, discreta, en iPhone: los [data-solo-iphone].
export function aplicarDestinos(doc, tipo) {
  for (const a of doc.querySelectorAll('[data-accion]')) {
    a.setAttribute('href', URL_PLAY);
    if (TEXTOS[a.dataset.accion]) a.textContent = TEXTOS[a.dataset.accion];
  }
  for (const a of doc.querySelectorAll('[data-solo-iphone]')) a.hidden = tipo !== 'ios';
}
