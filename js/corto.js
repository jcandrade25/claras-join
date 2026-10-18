// Enlaces cortos para las biografías de las redes (clarasapp.com/tt, /ig, /yt,
// /fb, /wa): en Android van directo a Play con su campaña, para medir en Play
// Console de qué red vino cada instalación; en lo demás, a la landing.

const PLAY = 'https://play.google.com/store/apps/details?id=com.jcandrade.cuentas_claras';
export const URL_LANDING = 'https://clarasapp.com/';

export function destinoCorto(fuente, tipo) {
  if (tipo !== 'android') return URL_LANDING;
  return `${PLAY}&referrer=utm_source%3D${fuente}%26utm_medium%3Dsocial%26utm_campaign%3Dbio`;
}
