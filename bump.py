#!/usr/bin/env python3
"""Проставляет ?v=<хэш> у css/js во всех HTML, чтобы браузеры сразу видели обновления."""
import hashlib, glob, re, sys
ASSETS = ['assets/css/style.css', 'assets/js/data.js', 'assets/js/app.js']
ver = {}
for a in ASSETS:
    ver[a] = hashlib.md5(open(a, 'rb').read()).hexdigest()[:8]
changed = 0
for f in sorted(glob.glob('*.html')):
    s = old = open(f, encoding='utf-8').read()
    for a, h in ver.items():
        # заменяем и голую ссылку, и уже версионированную
        s = re.sub(re.escape(a) + r'(\?v=[0-9a-f]+)?', f'{a}?v={h}', s)
    if s != old:
        open(f, 'w', encoding='utf-8').write(s)
        changed += 1
for a, h in ver.items():
    print(f'  {a:<24} v={h}')
print(f'обновлено HTML-файлов: {changed}')
