// Servidor estático para probar la página en un navegador de verdad (los
// módulos de JavaScript no cargan desde file://). Solo para pruebas locales.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { networkInterfaces } from 'node:os';

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

export function servir(raiz, { host = '127.0.0.1', puerto = 0 } = {}) {
  const base = resolve(raiz);
  const servidor = createServer(async (req, res) => {
    try {
      const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let archivo = normalize(join(base, ruta));
      if (archivo !== base && !archivo.startsWith(base + sep)) throw new Error('fuera');
      if ((await stat(archivo)).isDirectory()) archivo = join(archivo, 'index.html');
      const cuerpo = await readFile(archivo);
      res.writeHead(200, { 'content-type': TIPOS[extname(archivo)] ?? 'application/octet-stream' });
      res.end(cuerpo);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('no existe');
    }
  });
  return new Promise((ok) => {
    servidor.listen(puerto, host, () => {
      const { port } = servidor.address();
      ok({
        url: `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`,
        puerto: port,
        cerrar: () => new Promise((fin) => servidor.close(() => fin())),
      });
    });
  });
}

// node _test/servidor.mjs [puerto]: sirve el repo en la red local para probar
// desde el celular o BlueStacks (http://10.0.2.2:<puerto>).
if (import.meta.url === `file:///${process.argv[1]?.replaceAll('\\', '/')}`) {
  const { puerto } = await servir(new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'),
    { host: '0.0.0.0', puerto: Number(process.argv[2] ?? 8099) });
  const ips = Object.values(networkInterfaces()).flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
  console.log(`Sirviendo en el puerto ${puerto}: ${ips.map((ip) => `http://${ip}:${puerto}`).join('  ')}`);
}
