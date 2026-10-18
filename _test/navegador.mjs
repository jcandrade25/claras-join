// Abre Edge con playwright-core (el que ya usa el video de Claras en
// cuentas_claras/store/video) para probar la página como un visitante.
import { createRequire } from 'node:module';

const require = createRequire(process.env.PLAYWRIGHT_CORE_FROM
  ?? 'C:/Users/juank/dev/cuentas_claras/store/video/package.json');
const { chromium } = require('playwright-core');

export const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; SM-A145M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
};

export async function abrir({ ancho = 1440, alto = 900, ua, sinJs = false, movimientoReducido = false, tactil = false } = {}) {
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({
    viewport: { width: ancho, height: alto },
    userAgent: ua,
    javaScriptEnabled: !sinJs,
    reducedMotion: movimientoReducido ? 'reduce' : 'no-preference',
    hasTouch: tactil,
    isMobile: tactil,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  return { browser, page };
}
