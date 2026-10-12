#!/usr/bin/env python3
"""Build BASIC62 CodeLab.

Concatenates the engine modules in src/ into dist/core.js (usable from Node for tests)
and assembles the single-file web app dist/index.html (also copied to ./index.html so
the app can be served directly, for example with GitHub Pages).
"""
import base64, os, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
CORE_PARTS = ['c1_lex.js', 'c2_parse.js', 'c3_run.js', 'c4_lib.js', 'c5_netsec.js', 'c6_tools.js', 'c7_samples.js']
UI_PARTS = ['ui1.js', 'ui2.js', 'ui3.js', 'ui4.js', 'ui5.js']


def read(name):
    with open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read()


def main():
    core = "(function(){\n'use strict';\n" + ''.join(read(p) for p in CORE_PARTS) + '\n' + read('api.js')
    ui = ''.join(read(p) for p in UI_PARTS)
    def data_uri(name):
        with open(os.path.join(ROOT, 'assets', name), 'rb') as f:
            return 'data:image/png;base64,' + base64.b64encode(f.read()).decode('ascii')
    html = (read('index.tpl.html')
            .replace('__LOGO__', data_uri('basic62-logo-header.png'))
            .replace('__ICON__', data_uri('basic62-favicon.png'))
            .replace('/*__CSS__*/', read('style.css').rstrip('\n'))
            .replace('/*__CORE__*/', core.rstrip('\n').replace('</script', '<\\/script'))
            .replace('/*__UI__*/', ui.rstrip('\n').replace('</script', '<\\/script')))
    dist = os.path.join(ROOT, 'dist')
    os.makedirs(dist, exist_ok=True)
    with open(os.path.join(dist, 'core.js'), 'w', encoding='utf-8') as f:
        f.write(core)
    with open(os.path.join(dist, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)
    shutil.copyfile(os.path.join(dist, 'index.html'), os.path.join(ROOT, 'index.html'))
    print(f'dist/core.js {len(core):,} bytes, dist/index.html {len(html):,} bytes')


if __name__ == '__main__':
    main()
