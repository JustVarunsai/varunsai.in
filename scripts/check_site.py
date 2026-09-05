"""Browser checks for the portfolio. Run against the local server on port 4173."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import json
import os
import re
import sys

BASE = os.environ.get('PORTFOLIO_URL', 'http://127.0.0.1:4173')
ARTIFACTS = Path(os.environ.get('PORTFOLIO_SCREENSHOTS', '/private/tmp/varunsai-review'))
ARTIFACTS.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={'width':1440,'height':1000}, permissions=['clipboard-read','clipboard-write'])
    page = context.new_page()
    if '--layout-only' in sys.argv:
        for width in [320, 390, 768, 1024, 1440]:
            page.set_viewport_size({'width': width, 'height': 900})
            page.goto(BASE, wait_until='networkidle')
            issues = page.evaluate("""() => [...document.querySelectorAll('body *')].filter(e => { const r=e.getBoundingClientRect(); return r.width && (r.right>innerWidth+1 || r.left<-1) && !e.closest('.photo-roll'); }).map(e=>({tag:e.tagName,cls:e.className,x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width}))""")
            print(json.dumps({'width':width,'scrollWidth':page.evaluate('document.documentElement.scrollWidth'),'elements':issues}), flush=True)
            if width in [390,1440]:
                page.screenshot(path=str(ARTIFACTS/f'home-{width}.png'),full_page=True)
                page.locator('.pip-note').screenshot(path=str(ARTIFACTS/f'pip-note-{width}.png'))
                page.locator('#hello').screenshot(path=str(ARTIFACTS/f'contact-{width}.png'))
        browser.close()
        raise SystemExit(0)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE, wait_until='networkidle')
    assert page.title() == 'Varun Sai | Built with GPT Astra'
    assert page.locator('h1').count() == 1
    assert page.locator('iframe').count() == 0, 'Spotify must not load before consent'
    assert page.locator('[data-scenario][aria-pressed="true"]').get_attribute('data-scenario') == 'search'
    for scenario, title in [('inbox', 'Which of these needs me?'), ('document', 'Can I skip the copy-and-paste?'), ('search', 'Where did we write that down?')]:
        page.locator(f'[data-scenario="{scenario}"]').click()
        assert title in page.locator('[data-bench-title]').inner_text()
        for step in range(3):
            page.locator(f'[data-step="{step}"]').click()
            assert page.locator('[data-step][aria-pressed="true"]').get_attribute('data-step') == str(step)
            assert len(page.locator('[data-step-detail]').inner_text()) > 30
    page.locator('[data-approval]').uncheck()
    assert 'appears directly' in page.locator('[data-approval-note]').inner_text()
    preview = page.locator('#brief-preview').input_value()
    assert '3. Answer: The answer appears directly' in preview
    page.locator('[data-scenario="document"]').click()
    assert 'Missing fields still need review' in page.locator('#brief-preview').input_value()
    page.locator('[data-scenario="search"]').click()
    page.locator('[data-approval]').check()
    page.locator('[data-open-brief]').click()
    page.locator('#brief-context').fill('Help new teammates find their onboarding steps.')
    page.locator('#brief-audience').fill('New teammates')
    page.locator('#brief-constraint').fill('Use only approved documents.')
    page.locator('[data-copy-brief]').click()
    page.wait_for_function("document.querySelector('[data-copy-status]').textContent.includes('Copied')")
    copied = page.evaluate('navigator.clipboard.readText()')
    assert 'Help new teammates find their onboarding steps.' in copied
    assert copied == page.locator('#brief-preview').input_value()
    assert page.locator('[data-open-brief]').get_attribute('aria-expanded') == 'true'
    assert 'Cite sources' in copied
    assert 'Audience: New teammates' in copied
    assert 'Constraint: Use only approved documents.' in copied
    assert 'planning document' in copied
    with page.expect_download() as direct:
        page.locator('[data-download-brief]').click()
    assert Path(direct.value.path()).read_text() == copied
    # Force denied clipboard access and verify the useful download fallback.
    page.evaluate("() => { navigator.clipboard.writeText = () => Promise.reject(new Error('denied')); }")
    with page.expect_download() as info:
        page.locator('[data-copy-brief]').click()
    assert info.value.suggested_filename == 'system-brief.txt'
    page.locator('[data-photo="0"]').click()
    assert page.locator('dialog').is_visible()
    assert 'Hyderabad' in page.locator('#photo-title').inner_text()
    page.keyboard.press('ArrowRight')
    assert 'person behind' in page.locator('#photo-title').inner_text()
    page.keyboard.press('ArrowLeft')
    page.keyboard.press('ArrowLeft')
    assert 'log off' in page.locator('#photo-title').inner_text()
    page.keyboard.press('Escape')
    assert not page.locator('dialog').is_visible()
    assert page.locator('[data-photo="0"]').evaluate('(e)=>e===document.activeElement')
    page.locator('[data-music-open]').click()
    assert page.locator('#music-player').is_visible()
    assert '0HE9a9ndSFMCELuobaW5yK' in page.locator('iframe').get_attribute('src')
    assert page.locator('iframe').get_attribute('title')
    page.screenshot(path=str(ARTIFACTS/'player-open.png'))
    page.locator('[data-music-close]').click()
    assert page.locator('iframe').count() == 0
    assert page.locator('[data-music-open]').get_attribute('aria-expanded') == 'false'
    # The companion moves on scroll, stops at its target, and can be paused or hidden.
    page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
    page.wait_for_timeout(800)
    before = page.locator('.companion').bounding_box()['x']
    page.evaluate("window.scrollTo({top:850,behavior:'instant'})")
    page.wait_for_timeout(1000)
    assert abs(page.locator('.companion').bounding_box()['x'] - before) > 40
    page.locator('.companion-hint').click()
    assert page.locator('#guide-panel').is_visible()
    page.locator('[data-pip-shades]').click()
    assert 'shades-up' in page.locator('.companion').get_attribute('class')
    assert page.locator('[data-pip-shades]').get_attribute('aria-pressed') == 'false'
    page.screenshot(path=str(ARTIFACTS/'pip-shades-up.png'))
    page.locator('[data-guide-pause]').click()
    page.locator('[data-guide-close]').click()
    still = page.locator('.companion').bounding_box()['x']
    page.evaluate("window.scrollTo({top:2000,behavior:'instant'})")
    page.wait_for_timeout(200)
    assert abs(page.locator('.companion').bounding_box()['x'] - still) < 1
    page.locator('.companion-hint').click()
    page.locator('[data-guide-hide]').click()
    assert not page.locator('.companion').is_visible()
    page.reload(wait_until='domcontentloaded')
    assert not page.locator('.companion').is_visible()
    assert 'shades-up' in page.locator('.companion').get_attribute('class')
    page.locator('.companion-hint').click()
    assert page.locator('.companion').is_visible()
    page.keyboard.press('Escape')
    assert not page.locator('#guide-panel').is_visible()
    print('PASS: workbench, clipboard/download, gallery, music, and companion controls', flush=True)
    # Every authored route and every local href/src must resolve.
    checked_paths = {}
    paths = ['/', '/notes/', '/builds/', '/newsletter/', '/debug/', '/404.html']
    for path in paths:
        response = page.goto(BASE + path, wait_until='networkidle')
        assert response.status == 200, path
        assert page.locator('h1').count() == 1, path
        assert page.locator('main').is_visible(), path
        if path == '/newsletter/':
            page.wait_for_url(BASE+'/notes/')
        assert '—' not in page.locator('body').inner_text(), path
        tiny = page.locator('body *').evaluate_all("els => els.filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && e.getClientRects().length && !e.closest('[aria-hidden=\"true\"],svg') && parseFloat(getComputedStyle(e).fontSize) < 14).map(e => ({tag:e.tagName,cls:e.className,size:getComputedStyle(e).fontSize}))")
        assert not tiny, (path, tiny)
        for ref in page.locator('a[href],img[src],script[src],link[rel="stylesheet"]').evaluate_all('(els)=>els.map(e=>e.href||e.src)'):
            if not ref.startswith(BASE):
                continue
            parsed = urlparse(ref)
            if parsed.path not in checked_paths:
                response = context.request.get(BASE+parsed.path)
                assert response.status == 200, ref
                checked_paths[parsed.path] = response.text() if 'text/html' in response.headers.get('content-type', '') else ''
            if parsed.fragment:
                assert f'id="{parsed.fragment}"' in checked_paths[parsed.path], ref
        for img in page.locator('main img').all():
            img.scroll_into_view_if_needed()
            img.evaluate('(e)=>e.decode()')
            assert img.evaluate('(e)=>e.naturalWidth>0'), path
    print('PASS: all six routes, local assets, and anchors', flush=True)
    for width in [320,390,768,1024,1440]:
        page.set_viewport_size({'width':width,'height':900})
        page.goto(BASE,wait_until='networkidle')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}'
        assert page.locator('.hero').bounding_box()['width'] <= width
        if width in [390,1440]:
            page.screenshot(path=str(ARTIFACTS/f'home-{width}.png'),full_page=True)
            page.screenshot(path=str(ARTIFACTS/f'hero-{width}.png'))
    # Mobile entry points and photo discovery must remain available.
    page.set_viewport_size({'width':390,'height':844})
    page.goto(BASE,wait_until='networkidle')
    assert page.locator('.site-header nav a[href="/#workbench"]').is_visible()
    assert page.locator('.gallery-navigation').is_visible()
    assert page.locator('[data-roll-prev]').is_disabled()
    page.locator('[data-roll-next]').click()
    page.wait_for_function("document.querySelector('[data-roll-count]').textContent.startsWith('02')")
    page.locator('[data-roll-prev]').click()
    page.wait_for_function("document.querySelector('[data-roll-count]').textContent.startsWith('01')")
    assert page.locator('.approval-toggle').bounding_box()['height'] >= 44
    assert page.locator('.companion').bounding_box()['y'] >= page.locator('.companion-rail').bounding_box()['y']
    page.locator('[data-music-open]').click()
    frame = page.locator('iframe').bounding_box()
    player = page.locator('.music-card').bounding_box()
    assert frame['y'] + frame['height'] <= player['y'] + player['height']
    page.locator('[data-music-close]').click()
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto(BASE,wait_until='networkidle')
    assert not page.locator('.gallery-navigation').is_visible()
    # A 200% text-size check catches fixed small labels and cramped controls.
    page.add_style_tag(content='html { font-size: 200%; }')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    print('PASS: five viewport sizes, mobile navigation, photo roll, and player layout', flush=True)
    page.goto(BASE+'/notes/',wait_until='networkidle')
    page.screenshot(path=str(ARTIFACTS/'notes-desktop.png'),full_page=True)
    reduced = browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
    quiet = reduced.new_page()
    quiet.goto(BASE,wait_until='networkidle')
    start = quiet.locator('.companion').bounding_box()['x']
    quiet.evaluate("window.scrollTo({top:1500,behavior:'instant'})")
    quiet.wait_for_timeout(200)
    assert quiet.locator('.companion').bounding_box()['x'] == start
    assert 'walking' not in quiet.locator('.companion').get_attribute('class')
    # Storage denial must not break the rest of the page.
    limited = browser.new_context(viewport={'width':390,'height':844})
    limited.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('denied')}})")
    resilient = limited.new_page()
    resilient.goto(BASE,wait_until='networkidle')
    resilient.locator('[data-scenario="inbox"]').click()
    assert 'Which' in resilient.locator('[data-bench-title]').inner_text()
    resilient.locator('.companion-hint').click()
    assert resilient.locator('#guide-panel').is_visible()
    nojs = browser.new_context(java_script_enabled=False, viewport={'width':390,'height':844})
    fallback = nojs.new_page()
    fallback.goto(BASE,wait_until='networkidle')
    assert fallback.locator('#hero-title').is_visible()
    assert fallback.locator('#hello').inner_text()
    assert fallback.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert not errors, errors
    browser.close()
    print(json.dumps({'result':'PASS','routes':len(paths),'viewports':[320,390,768,1024,1440],'screenshots':str(ARTIFACTS),'browser_errors':errors}))
