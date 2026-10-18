// Escribe las páginas de los enlaces cortos (tt, ig, yt, fb, wa) y /unirse/, el
// puente de las invitaciones con su propia tarjeta para compartir. Correr si
// cambia la plantilla: node _tools/cortos.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const FUENTES = { tt: 'tiktok', ig: 'instagram', yt: 'youtube', fb: 'facebook', wa: 'whatsapp' };
const IMAGEN = 'https://clarasapp.com/img/og.png';

// La tarjeta que muestran WhatsApp y las redes al pegar el enlace.
const tarjeta = ({ titulo, descripcion, url }) => `  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="Claras">
  <meta property="og:locale" content="es_CO">
  <meta property="og:title" content="${titulo}">
  <meta property="og:description" content="${descripcion}">
  <meta property="og:image" content="${IMAGEN}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="¿Quién debe qué? Una cuenta de restaurante repartida con Claras">
  <meta name="twitter:card" content="summary_large_image">`;

const pagina = ({ titulo, tarjeta: meta, guion }) => `<!doctype html>
<html lang="es-CO">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${titulo}</title>
${meta}
  ${guion}
  <style>body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #b3482a; color: #f5f6f4; font: 18px system-ui, sans-serif; } a { color: inherit; }</style>
</head>
<body>
  <noscript><a href="https://clarasapp.com/">Ir a Claras</a></noscript>
  <p><a href="https://clarasapp.com/">Abriendo Claras…</a></p>
</body>
</html>
`;

function escribir(ruta, html) {
  const carpeta = new URL(`../${ruta}/`, import.meta.url);
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(new URL('index.html', carpeta), html);
  console.log(`${ruta}/index.html`);
}

const LANDING = {
  titulo: 'Claras: ¿quién debe qué?',
  descripcion: 'La app colombiana para dividir los gastos del paseo, los roomies y los planes. Gratis, sin anuncios y sin registrarte.',
  url: 'https://clarasapp.com/',
};

for (const [ruta, fuente] of Object.entries(FUENTES)) {
  escribir(ruta, pagina({
    titulo: 'Claras',
    tarjeta: tarjeta(LANDING),
    guion: `<script type="module">
    import { destinoCorto } from '../js/corto.js';
    import { tipoDispositivo } from '../js/dispositivo.js';
    location.replace(destinoCorto('${fuente}', tipoDispositivo(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)));
  </script>`,
  }));
}

// La app comparte https://clarasapp.com/?c=CODIGO; esa tarjeta es la de la
// landing. /unirse/?c=CODIGO muestra la de la invitación y pasa a /?c=CODIGO.
escribir('unirse', pagina({
  titulo: 'Únete a un grupo en Claras',
  tarjeta: tarjeta({
    titulo: 'Te invitaron a un grupo en Claras',
    descripcion: 'Toca para entrar al grupo y repartir los gastos.',
    url: 'https://clarasapp.com/unirse/',
  }),
  guion: "<script>location.replace('/' + location.search + location.hash);</script>",
}));
