"""Jump to every scene (debug API), advance to its last line and screenshot it. Usage: python tools/gallery.py [base] [outdir] [ids...]"""
import sys, os, asyncio, re
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'screens/v2'
ONLY = sys.argv[3:]
os.makedirs(OUT, exist_ok=True)
errs = []
def slug(s): return re.sub(r'[^a-zA-Z0-9]+', '_', s).strip('_')[:40] or 'x'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE); await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(800)
        ids = ONLY or await pg.evaluate("Object.keys(SCENES).filter(k => !['menu','action','branch'].includes(SCENES[k].type||''))")
        for i, sid in enumerate(ids):
            await pg.wait_for_function("document.body.dataset.ready !== 'loading'")
            await pg.evaluate("(id) => { State.data.name = State.data.name || 'Munir'; Game.goTo(id, {via:'jump'}); }", sid)
            for _ in range(80):
                await pg.wait_for_timeout(250)
                r = await pg.evaluate("document.body.dataset.scene + '|' + document.body.dataset.ready")
                sc, ready = r.split('|', 1)
                if ready == 'choices' and sc == sid: break
                if ready == 'more': await pg.click('#dialog')
            await pg.wait_for_timeout(int(os.environ.get('SETTLE', '700')))
            await pg.screenshot(path=f'{OUT}/{i:02d}_{slug(sid)}.png')
        await b.close()
asyncio.run(main())
print('errors:', errs[:10] or 'none')
