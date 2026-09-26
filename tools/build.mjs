// The Royal Race — build sans dépendance : src/ -> index.html (un seul fichier jouable)
// node tools/build.mjs          construit index.html
// node tools/build.mjs --check  vérifie seulement la syntaxe de chaque module
// Chaque module est rangé dans une balise <script type="text/x-module"> (non exécutée), puis un petit chargeur les exécute tous, dans l'ordre,
// au sein d'une seule tâche : aucune minuterie ne peut tomber entre deux modules, et une erreur au chargement d'un module n'empêche plus
// les suivants de démarrer (les const / let de premier niveau restent partagés, comme dans un seul fichier). Voir LOADER.
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
// modules exécutés dans l'ordre ; window.__modulesKo liste ceux qui ont échoué ; événement « ready » quand tout est chargé
const LOADER = `<script>(()=>{const ko=[];let cur='';const on=()=>{if(cur)ko.push(cur)};addEventListener('error',on);for(const m of document.querySelectorAll('script[type="text/x-module"]')){cur=m.dataset.f;const s=document.createElement('script');s.textContent=m.textContent+'\\n//# sourceURL='+cur;document.body.appendChild(s)}cur='';removeEventListener('error',on);window.__modulesKo=ko;if(ko.length)console.error('Modules en échec :',ko.join(', '));try{hooks.emit('ready')}catch(e){}})()</script>\n`;
const css = list('src/css').map(f => readFileSync(`${root}src/css/${f}`, 'utf8')).join('');
const html = readFileSync(root + 'src/index.html', 'utf8')
  .replace('<!--STYLES-->', () => `<style>\n${css}  </style>`)
  .replace('<!--SCRIPTS-->', () => js.map(([f, c]) => `<script type="text/x-module" data-f="${f}">${c}</script>\n`).join('') + LOADER);
writeFileSync(root + 'index.html', html);
console.log(`✓ index.html (${(html.length / 1024).toFixed(0)} Ko)`);
