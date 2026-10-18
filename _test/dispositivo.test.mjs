// Qué celular es (también dentro de Instagram, TikTok o Facebook) y qué código
// de invitación trae el enlace.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { URL_PLAY, URL_WEB, codigoDeInvitacion, tipoDispositivo } from '../js/dispositivo.js';

const UA = {
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; SM-A145M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  instagramAndroid: 'Mozilla/5.0 (Linux; Android 14; SM-A145M Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.102 Mobile Safari/537.36 Instagram 350.0.0.38.105 Android (34/14; 450dpi; 1080x2210; samsung; SM-A145M; a14; mt6769; es_US; 643456789)',
  tiktokAndroid: 'Mozilla/5.0 (Linux; Android 13; moto g54 5G Build/T1TDS33.73; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36 trill_310102 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/31.1.2 ByteLocale/es',
  facebookAndroid: 'Mozilla/5.0 (Linux; Android 14; 23053RN02L Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.107 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.47.109;]',
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  instagramIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.29.88 (iPhone15,2; iOS 18_0; es_CO; es; scale=3.00; 1179x2556; 643213213)',
  tiktokIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_35.2.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/es Region/CO',
  ipadEscritorio: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
};

test('Android, también dentro de Instagram, TikTok y Facebook', () => {
  for (const ua of [UA.androidChrome, UA.instagramAndroid, UA.tiktokAndroid, UA.facebookAndroid]) {
    assert.equal(tipoDispositivo(ua), 'android', ua);
  }
});

test('iPhone, también dentro de Instagram y TikTok, y el iPad que se presenta como Mac', () => {
  for (const ua of [UA.iphoneSafari, UA.instagramIphone, UA.tiktokIphone]) assert.equal(tipoDispositivo(ua), 'ios', ua);
  assert.equal(tipoDispositivo(UA.ipadEscritorio, 'MacIntel', 5), 'ios');
  assert.equal(tipoDispositivo(UA.ipadEscritorio, 'MacIntel', 0), 'otro');
});

test('un computador es otro', () => {
  assert.equal(tipoDispositivo(UA.windows, 'Win32', 0), 'otro');
});

test('el código de invitación se limpia como antes', () => {
  assert.equal(codigoDeInvitacion('?c=%20abc123%20'), 'ABC123');
  assert.equal(codigoDeInvitacion('?code=XYZ789'), 'XYZ789');
  assert.equal(codigoDeInvitacion('?c=%3Cscript%3E'), '');
  assert.equal(codigoDeInvitacion('?c=AB'), '');
  assert.equal(codigoDeInvitacion(''), '');
});

test('los destinos: Play con su campaña y la versión web', () => {
  assert.equal(URL_WEB, 'https://app.clarasapp.com/');
  assert.equal(URL_PLAY, 'https://play.google.com/store/apps/details?id=com.jcandrade.cuentas_claras'
    + '&referrer=utm_source%3Dclarasapp%26utm_medium%3Dweb%26utm_campaign%3Dlanding');
});
