// The Royal Race — build sans dépendance : src/ -> index.html (un seul fichier jouable)
// node tools/build.mjs          construit index.html
// node tools/build.mjs --check  vérifie seulement la syntaxe de chaque module
// Chaque module est inséré dans sa propre balise <script> : une erreur au chargement d'un module n'empêche plus les suivants de démarrer
// (les const / let de premier niveau restent partagés entre les balises, comme dans un seul fichier).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { Script } from 'node:vm';
const root = new URL('..', import.meta.url).pathname;
const list = d => readdirSync(root + d).filter(f => !f.startsWith('.')).sort();
const js = list('src/js').map(f => [f, readFileSync(`${root}src/js/${f}`, 'utf8')]);
let bad = 0;
for (const [f, code] of js) { try { new Script(code, { filename: f }) } catch (e) { bad++; console.error(`✗ ${f}: ${e.message}`) } if (/<\/script/i.test(code)) { bad++; console.error(`✗ ${f}: contient « </script » (couperait la page)`) } }
try { new Script(js.map(x => x[1]).join('\n'), { filename: 'bundle.js' }) } catch (e) { bad++; console.error(`✗ bundle: ${e.message}`) }
if (bad) process.exit(1);
console.log(`✓ ${js.length} modules JS valides`);
if (process.argv.includes('--check')) process.exit(0);
const css = list('src/css').map(f => readFileSync(`${root}src/css/${f}`, 'utf8')).join('');
const html = readFileSync(root + 'src/index.html', 'utf8')
  .replace('<!--STYLES-->', () => `<style>\n${css}  </style>`)
  .replace('<!--SCRIPTS-->', () => js.map(([f, c]) => `<script>/* --- ${f} --- */\n${c}</script>\n`).join(''));
writeFileSync(root + 'index.html', html);
console.log(`✓ index.html (${(html.length / 1024).toFixed(0)} Ko)`);
