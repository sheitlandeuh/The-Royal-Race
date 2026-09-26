#!/usr/bin/env python3
"""The Royal Race — build sans Node : src/ -> index.html (même résultat que tools/build.mjs, sans la vérification de syntaxe).
python3 tools/build.py"""
import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def ls(d): return sorted(f for f in os.listdir(os.path.join(root, d)) if not f.startswith('.'))
def rd(p): return open(os.path.join(root, p), encoding='utf-8').read()
js = [(f, rd('src/js/' + f)) for f in ls('src/js')]
css = ''.join(rd('src/css/' + f) for f in ls('src/css'))
html = rd('src/index.html')
html = html.replace('<!--STYLES-->', '<style>\n' + css + '  </style>', 1)
LOADER = '''<script>(()=>{const ko=[];let cur='';const on=()=>{if(cur)ko.push(cur)};addEventListener('error',on);for(const m of document.querySelectorAll('script[type="text/x-module"]')){cur=m.dataset.f;const s=document.createElement('script');s.textContent=m.textContent+'\\n//# sourceURL='+cur;document.body.appendChild(s)}cur='';removeEventListener('error',on);window.__modulesKo=ko;if(ko.length)console.error('Modules en échec :',ko.join(', '));try{hooks.emit('ready')}catch(e){}})()</script>\n'''
html = html.replace('<!--SCRIPTS-->', ''.join(f'<script type="text/x-module" data-f="{f}">{c}</script>\n' for f, c in js) + LOADER, 1)
open(os.path.join(root, 'index.html'), 'w', encoding='utf-8').write(html)
print(f'✓ {len(js)} modules · index.html ({len(html)/1024:.0f} Ko)')
