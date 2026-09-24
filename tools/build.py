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
html = html.replace('<!--SCRIPTS-->', '<script>\n' + ''.join(f'/* --- {f} --- */\n{c}' for f, c in js) + '</script>', 1)
open(os.path.join(root, 'index.html'), 'w', encoding='utf-8').write(html)
print(f'✓ {len(js)} modules · index.html ({len(html)/1024:.0f} Ko)')
