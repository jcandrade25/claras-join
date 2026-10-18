// Escribe las páginas de los enlaces cortos (tt, ig, yt, fb, wa). Correr si
// cambia la plantilla: node _tools/cortos.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const FUENTES = { tt: 'tiktok', ig: 'instagram', yt: 'youtube', fb: 'facebook', wa: 'whatsapp' };

for (const [ruta, fuente] of Object.entries(FUENTES)) {
  const carpeta = new URL(`../${ruta}/`, import.meta.url);
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(new URL('index.html', carpeta), `<!doctype html>
<html lang="es-CO">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Claras</title>
  <script type="module">
    import { destinoCorto } from '../js/corto.js';
    import { tipoDispositivo } from '../js/dispositivo.js';
    location.replace(destinoCorto('${fuente}', tipoDispositivo(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)));
  </script>
  <style>body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #b3482a; color: #f5f6f4; font: 18px system-ui, sans-serif; } a { color: inherit; }</style>
</head>
<body>
  <noscript><a href="https://clarasapp.com/">Ir a Claras</a></noscript>
  <p><a href="https://clarasapp.com/">Abriendo Claras…</a></p>
</body>
</html>
`);
  console.log(`${ruta}/index.html`);
}
