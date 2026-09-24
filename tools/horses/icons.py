"""Painted-style SVG icon set replacing the emoji of the HUD (resources, rails, dock)."""
import re
def G(id, stops, x2='0', y2='1'):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{id}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'
def svg(name, defs, body):
    body = body.replace('url(#', f'url(#{name}-'); defs = re.sub(r'id="', f'id="{name}-', defs)
    return f'<svg class="ico" viewBox="0 0 64 64" aria-hidden="true"><defs>{defs}</defs>{body}</svg>'
GOLD = [(0, '#fff2b0'), (.35, '#f3c64a'), (.7, '#c98b17'), (1, '#8a5a0c')]
I = {}
I['gold'] = svg('gold', G('g', GOLD) + G('r', [(0, '#a8700f'), (1, '#f7d56b')]),
    '<circle cx="32" cy="34" r="25" fill="#5a3a06" opacity=".35"/><circle cx="32" cy="31" r="25" fill="url(#r)"/><circle cx="32" cy="31" r="20" fill="url(#g)"/>'
    '<path d="M22 38 L24 26 L29 31 L32 23 L35 31 L40 26 L42 38 Z" fill="#a8700f" opacity=".85"/><path d="M22 38 L24 26 L29 31 L32 23 L35 31 L40 26 L42 38 Z" fill="none" stroke="#fff4c4" stroke-width="1" opacity=".6"/>'
    '<ellipse cx="25" cy="21" rx="8" ry="4" fill="#fff" opacity=".45" transform="rotate(-25 25 21)"/>')
I['feed'] = svg('feed', G('s', [(0, '#fbe7a1'), (.5, '#e0b24a'), (1, '#9b6a1c')]) + G('b', [(0, '#9b3d22'), (1, '#5c1f10')]),
    ''.join(f'<g transform="rotate({a} 32 50)"><path d="M32 50 L32 16" stroke="#b98a2a" stroke-width="2"/>' + ''.join(
        f'<ellipse cx="{28.5 if k % 2 else 35.5}" cy="{14 + k * 4.2}" rx="3.4" ry="5.4" fill="url(#s)" stroke="#8d5e14" stroke-width=".7" transform="rotate({ -28 if k % 2 else 28} {28.5 if k % 2 else 35.5} {14 + k * 4.2})"/>' for k in range(6)) + '</g>'
        for a in (-24, 0, 24)) + '<rect x="24" y="40" width="16" height="7" rx="3" fill="url(#b)"/>')
I['gems'] = svg('gems', G('a', [(0, '#e9fbff'), (.45, '#62c7ff'), (1, '#1552b8')], '1', '1') + G('c', [(0, '#bfeaff'), (1, '#2a7ee0')]),
    '<path d="M14 24 L22 12 H42 L50 24 L32 54 Z" fill="url(#a)" stroke="#0b3a86" stroke-width="1.5"/><path d="M14 24 H50 M22 12 L27 24 L32 54 L37 24 L42 12 M27 24 L32 12 L37 24" fill="none" stroke="#0b3a86" stroke-width="1" opacity=".55"/>'
    '<path d="M22 12 L27 24 L14 24 Z" fill="#fff" opacity=".45"/><path d="M37 24 L50 24 L32 54Z" fill="#0b3a86" opacity=".25"/>')
I['builder'] = svg('builder', G('h', [(0, '#e6edf2'), (.5, '#9aa7b1'), (1, '#4c5761')]) + G('w', [(0, '#d18a45'), (1, '#6e3a14')], '1', '0'),
    '<rect x="29" y="22" width="7" height="36" rx="3" fill="url(#w)" transform="rotate(38 32 40)"/><path d="M14 16 L36 10 L42 18 L40 24 L20 30 Z" fill="url(#h)" stroke="#3b444c" stroke-width="1.4"/><path d="M16 17 L36 11" stroke="#fff" stroke-width="1.5" opacity=".6"/>')
I['gear'] = svg('gear', G('m', [(0, '#f0f4f7'), (.5, '#a4b0ba'), (1, '#56626c')]),
    '<path d="' + ' '.join(f'M{32 + 25 * __import__("math").cos(t)} {32 + 25 * __import__("math").sin(t)}' for t in []) + '"/>'
    '<g fill="url(#m)" stroke="#39434c" stroke-width="1.4">' + ''.join(f'<rect x="28" y="6" width="8" height="12" rx="2" transform="rotate({a} 32 32)"/>' for a in range(0, 360, 45)) +
    '<circle cx="32" cy="32" r="17"/></g><circle cx="32" cy="32" r="7" fill="#233" stroke="#39434c" stroke-width="1.4"/>')
I['missions'] = svg('missions', G('p', [(0, '#fff6dc'), (1, '#dcc38c')]) + G('e', [(0, '#c99a55'), (1, '#8a5b22')]),
    '<rect x="16" y="14" width="32" height="38" rx="3" fill="url(#p)" stroke="#8a5b22" stroke-width="1.4"/><rect x="12" y="10" width="40" height="7" rx="3.5" fill="url(#e)"/><rect x="12" y="49" width="40" height="7" rx="3.5" fill="url(#e)"/>'
    '<path d="M22 25 H42 M22 31 H42 M22 37 H36" stroke="#8a6a3a" stroke-width="2" stroke-linecap="round"/><circle cx="41" cy="42" r="5" fill="#b92c32"/>')
I['trophees'] = svg('trophees', G('t', GOLD, '1', '1'),
    '<path d="M18 12 H46 V24 A14 14 0 0 1 18 24 Z" fill="url(#t)" stroke="#7a4d08" stroke-width="1.4"/><path d="M18 16 H10 Q10 30 22 32 M46 16 H54 Q54 30 42 32" fill="none" stroke="#c98b17" stroke-width="3.5"/>'
    '<rect x="28" y="37" width="8" height="8" fill="url(#t)"/><rect x="20" y="45" width="24" height="8" rx="2" fill="#5a3a1a" stroke="#3a2410"/><path d="M23 16 V26" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>')
I['club'] = svg('club', G('s', [(0, '#3f6fb3'), (1, '#10294c')]) + G('t', GOLD),
    '<path d="M32 8 L52 15 V30 C52 44 42 52 32 57 C22 52 12 44 12 30 V15 Z" fill="url(#s)" stroke="url(#t)" stroke-width="3.5"/><path d="M22 28 L26 22 L29 26 L32 19 L35 26 L38 22 L42 28 V32 H22 Z" fill="url(#t)"/><path d="M20 38 H44" stroke="#f3c64a" stroke-width="2.5"/>')
I['boutique'] = svg('boutique', G('a', [(0, '#e8474e'), (1, '#9b1d24')]) + G('w', [(0, '#fdf6e6'), (1, '#e3d3b0')]) + G('b', [(0, '#c98a4a'), (1, '#7a4a1e')]),
    '<rect x="14" y="28" width="36" height="26" fill="url(#b)"/><rect x="20" y="34" width="24" height="20" fill="#2a1a0c"/><rect x="24" y="38" width="16" height="6" fill="#f3c64a"/>'
    + ''.join(f'<path d="M{10 + k * 8.8} 18 H{18.8 + k * 8.8} V29 Q{14.4 + k * 8.8} 34 {10 + k * 8.8} 29 Z" fill="url(#{"a" if k % 2 == 0 else "w"})"/>' for k in range(5)) + '<rect x="9" y="14" width="46" height="5" rx="2" fill="#7a4a1e"/>')
I['events'] = svg('events', G('c', [(0, '#ffffff'), (1, '#e3e8ee')]) + G('r', [(0, '#e04b4b'), (1, '#9b1d24')]),
    '<rect x="12" y="14" width="40" height="40" rx="6" fill="url(#c)" stroke="#6b7785" stroke-width="1.4"/><path d="M12 20 A6 6 0 0 1 18 14 H46 A6 6 0 0 1 52 20 V26 H12 Z" fill="url(#r)"/>'
    '<rect x="21" y="9" width="4" height="10" rx="2" fill="#6b7785"/><rect x="39" y="9" width="4" height="10" rx="2" fill="#6b7785"/><path d="M32 31 L34.6 37.6 L41.6 37.9 L36.2 42.3 L38 49 L32 45.2 L26 49 L27.8 42.3 L22.4 37.9 L29.4 37.6 Z" fill="#f3c64a" stroke="#b07a12"/>')
I['domaine'] = svg('domaine', G('w', [(0, '#fff3dc'), (1, '#d9bf8f')]) + G('r', [(0, '#3d6f9a'), (1, '#173a5a')]),
    '<rect x="14" y="26" width="36" height="28" fill="url(#w)" stroke="#8a6a3a"/><path d="M11 27 L32 12 L53 27 Z" fill="url(#r)"/><rect x="28" y="40" width="8" height="14" rx="4" fill="#5a3a1a"/>'
    '<rect x="19" y="32" width="6" height="7" fill="#f7cf6a"/><rect x="39" y="32" width="6" height="7" fill="#f7cf6a"/><path d="M32 12 V4 L40 7 L32 9" fill="#b92c32" stroke="#6b4a1a"/>')
I['chevaux'] = svg('chevaux', G('h', [(0, '#c98a52'), (.6, '#8a4a22'), (1, '#4e2610')]),
    '<path d="M20 56 C18 44 20 34 24 28 L20 16 L27 20 L30 12 L33 20 C44 22 52 32 50 44 L44 46 L40 40 C36 42 34 48 36 56 Z" fill="url(#h)" stroke="#3a1c0a" stroke-width="1.4"/>'
    '<path d="M24 28 C22 36 22 46 24 56" stroke="#2a1408" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="37" cy="28" r="2.2" fill="#1a0c04"/><path d="M26 22 L33 20" stroke="#e8c8a0" stroke-width="1.2" opacity=".6"/>')
I['courses'] = svg('courses', '', '<path d="M16 58 V8" stroke="#6b4a1a" stroke-width="4" stroke-linecap="round"/><path d="M18 10 Q32 4 50 10 V34 Q32 28 18 34 Z" fill="#fff" stroke="#222" stroke-width="1.2"/>'
    + ''.join(f'<rect x="{18 + (k % 4) * 8}" y="{10 + (k // 4) * 8}" width="8" height="8" fill="#111" transform="skewY(-3)"/>' for k in range(12) if (k % 4 + k // 4) % 2 == 0))
I['ecurie'] = svg('ecurie', G('b', [(0, '#c0533b'), (1, '#7a2a1a')]) + G('r', [(0, '#3d6f9a'), (1, '#173a5a')]),
    '<rect x="12" y="28" width="40" height="26" fill="url(#b)" stroke="#4a160c"/><path d="M8 30 L32 12 L56 30 Z" fill="url(#r)"/><rect x="24" y="36" width="16" height="18" fill="#f3e6c8"/><path d="M24 36 L40 54 M40 36 L24 54" stroke="#7a2a1a" stroke-width="2"/><circle cx="32" cy="23" r="3" fill="#f3c64a"/>')
open('/home/claude/work/icons.json', 'w').write(__import__('json').dumps(I))
print({k: len(v) for k, v in I.items()})
