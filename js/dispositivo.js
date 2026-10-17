// A dónde lleva cada botón según el celular: Android va a Play; iPhone y
// computadores, a la versión web (no hay app de iPhone en la tienda). Sirve
// también dentro de los navegadores de Instagram, TikTok y Facebook.

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

const TEXTOS = {
  android: { corto: 'Descargar', largo: 'Descargar en Google Play' },
  otro: { corto: 'Abrir en el navegador', largo: 'Abrir Claras en el navegador' },
};

// Cada [data-accion] lleva a Play o a la web; "corto" y "largo" también
// cambian su texto, "enlace" conserva el suyo.
export function aplicarDestinos(doc, tipo) {
  const destino = tipo === 'android' ? URL_PLAY : URL_WEB;
  const textos = tipo === 'android' ? TEXTOS.android : TEXTOS.otro;
  for (const a of doc.querySelectorAll('[data-accion]')) {
    a.setAttribute('href', destino);
    if (textos[a.dataset.accion]) a.textContent = textos[a.dataset.accion];
  }
}
