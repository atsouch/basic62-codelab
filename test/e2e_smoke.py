"""End-to-end smoke test for BASIC62 in a headless browser.

Usage:
    pip install playwright && python -m playwright install chromium
    python build.py
    python test/e2e_smoke.py            # add --shots to save screenshots in test/shots/
"""
import os
import sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file://' + os.path.join(ROOT, 'dist', 'index.html')
SHOTS = '--shots' in sys.argv
INPUTS = {'hello': ['Sam', '12'], 'grades': ['abc', '77']}

checks = []
errors = []


def check(name, ok, detail=''):
    checks.append((name, bool(ok), detail))
    print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail and not ok else ''))


def shot(page, name):
    if SHOTS:
        os.makedirs(os.path.join(ROOT, 'test', 'shots'), exist_ok=True)
        page.screenshot(path=os.path.join(ROOT, 'test', 'shots', name + '.png'))


def open_example(page, ex_id):
    i = page.evaluate(f"BL.SAMPLES.examples.findIndex(e => e.id == '{ex_id}')")
    page.click('#btnExamples')
    page.click(f'#menu button >> nth={i}')
    page.wait_for_timeout(200)


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    page.goto(URL)
    page.wait_for_timeout(500)
    shot(page, '01_start')

    # identity
    check('title names BASIC62', 'BASIC62' in page.title())
    page.click('#btnBrand')
    about = page.inner_text('#modalBody')
    check('about dialog attribution', all(s in about for s in ['Andreas Tsouchlaris', 'Claude (Anthropic)', 'Binary Logic', 'Kemeny', 'Kurtz']), about[:200])
    shot(page, '02_about')
    page.keyboard.press('Escape')
    check('footer credits', 'Binary Logic' in page.inner_text('#credits'))

    # run with input, tests
    open_example(page, 'grades')
    page.click('#btnRun')
    for a in INPUTS['grades']:
        page.wait_for_selector('.console .ask input', timeout=5000)
        page.fill('.console .ask input', a)
        page.keyboard.press('Enter')
    page.wait_for_timeout(400)
    check('grades run with input', 'Result: pass' in page.inner_text('#console'))
    page.click('#btnTests')
    page.wait_for_timeout(400)
    check('grades tests 4/4', '4 of 4 tests passed' in page.inner_text('#tab-tests'))

    # every example runs without an error box
    ids = page.evaluate('BL.SAMPLES.examples.map(e => e.id)')
    for ex in ids:
        open_example(page, ex)
        page.click('#btnRun')
        for a in INPUTS.get(ex, []):
            page.wait_for_selector('.console .ask input', timeout=5000)
            page.fill('.console .ask input', a)
            page.keyboard.press('Enter')
        page.wait_for_timeout(1200 if ex in ('security', 'network') else 600)
        check(f'example {ex} runs', not page.query_selector_all('.console .err'), page.inner_text('#status'))
        shot(page, 'ex_' + ex)

    # debugger: breakpoint, step, step back, conditional breakpoint
    open_example(page, 'sorting')
    page.click('[data-tab=debug]')
    page.click('.gutter .gl[data-l="7"]')
    page.click('#btnRun')
    page.wait_for_timeout(400)
    check('breakpoint pauses', 'Paused at line 7' in page.inner_text('#status'))
    page.keyboard.press('F11')
    page.wait_for_timeout(100)
    before = page.inner_text('#status')
    page.click('button[data-step=back]')
    page.wait_for_timeout(300)
    check('step back', page.inner_text('#status') == 'Paused at line 7', before)
    page.fill('#dbgSide input[aria-label="Condition for line 7"]', 'i == 3')
    page.keyboard.press('Tab')
    page.click('button[data-step=continue]')
    page.wait_for_timeout(300)
    i_val = page.evaluate("String(S.runner.stack[S.runner.stack.length - 1].vars.get('i'))")
    check('conditional breakpoint', i_val == '3', i_val)
    for view in ['Memory', 'Trace table', 'Classes', 'Flowchart', 'Variables']:
        page.click(f'button.seg2:has-text("{view}")')
        page.wait_for_timeout(120)
        check(f'debug view {view}', page.inner_text('#dbgMain').strip() != '')
    shot(page, '03_debug')
    page.click('#btnStop')

    # history
    open_example(page, 'grades')
    page.click('[data-tab=history]')
    page.fill('#hWhat', 'First working version')
    page.click('button:has-text("Save version")')
    page.wait_for_timeout(150)
    check('history commit', page.evaluate('repoObj.log().length') == 1)

    # Spanish edition
    open_example(page, 'pets')
    page.click('.edition .seg[data-ed=es]')
    page.wait_for_timeout(200)
    page.click('#btnRun')
    page.wait_for_timeout(400)
    check('Spanish edition runs', 'CLASE' in page.evaluate('editor.value') and not page.query_selector_all('.console .err'))
    page.click('.edition .seg[data-ed=en]')

    # python and reference tabs render
    page.click('[data-tab=python]')
    check('python tab', 'def ' in page.inner_text('#tab-python'))
    page.click('[data-tab=reference]')
    page.fill('.refSearch', 'hash')
    page.wait_for_timeout(100)
    check('reference search', 'hash_text' in page.inner_text('#tab-reference'))

    # phone layout
    phone = browser.new_page(viewport={'width': 390, 'height': 844})
    phone.goto(URL)
    phone.wait_for_timeout(400)
    check('no horizontal overflow on phone', not phone.evaluate('document.documentElement.scrollWidth > window.innerWidth'))
    shot(phone, '04_phone')
    browser.close()

check('no JavaScript errors', not errors, '; '.join(errors[:3]))
failed = [c for c in checks if not c[1]]
print(f'\n{len(checks) - len(failed)} passed, {len(failed)} failed')
sys.exit(1 if failed else 0)
