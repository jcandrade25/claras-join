// El archivo que le dice al iPhone que los enlaces de invitación de
// clarasapp.com abren la app de Claras (Universal Links). Apple lo baja de
// https://clarasapp.com/.well-known/apple-app-site-association, sin redirección.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

test('el archivo de Apple nombra solo la app de iPhone de Claras', () => {
  const aasa = JSON.parse(leer('../.well-known/apple-app-site-association'));
  const detalles = aasa.applinks.details;
  assert.equal(detalles.length, 1);
  assert.deepEqual(detalles[0].appIDs, ['A75LYU82HA.com.jcandrade.cuentasClaras']);
});

test('abren la app las invitaciones, no la portada', () => {
  const aasa = JSON.parse(leer('../.well-known/apple-app-site-association'));
  const comps = aasa.applinks.details[0].components;
  assert.ok(comps.some((c) => c['/'] === '/join/*' && !c.exclude), 'clarasapp.com/join/?c=');
  assert.ok(comps.some((c) => c['/'] === '/' && c['?']?.c === '?*'), 'clarasapp.com/?c= (enlaces viejos)');
  assert.ok(!comps.some((c) => c['/'] === '/' && !c['?']), 'la portada sin código queda en Safari');
  assert.ok(!comps.some((c) => ['*', '/*'].includes(c['/'])), 'nada de todo el sitio');
});

test('GitHub Pages publica .well-known (Jekyll esconde las carpetas con punto)', () => {
  assert.match(leer('../_config.yml'), /^include:\s*\[\s*"\.well-known"\s*\]\s*$/m);
});
