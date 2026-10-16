"""Headless click-through test + screenshots. Usage: python tools/shoot.py [base_url] [outdir]"""
import sys, os, asyncio, json
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'screens'
os.makedirs(OUT, exist_ok=True)
errors = []

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        async def newpage(w=1280, h=720, mobile=False):
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=mobile, has_touch=mobile)
            pg = await ctx.new_page()
            pg.on('console', lambda m: errors.append(f'console.{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
            pg.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
            return ctx, pg
        ctx, pg = await newpage()
        async def scene(): return await pg.evaluate('document.body.dataset.scene')
        async def shot(name, wait=0):
            if wait: await pg.wait_for_timeout(wait)
            await pg.screenshot(path=f'{OUT}/{name}.png')
        async def wait_choices():
            await pg.wait_for_selector('#dialog .choices button', timeout=20000)
            await pg.wait_for_timeout(500)
        async def click_choice(label):
            await pg.locator('#dialog .choices button', has_text=label).first.click()
            await pg.wait_for_timeout(1300)
        async def play_dialogue():
            # click through lines quickly
            for _ in range(12):
                if await pg.locator('#dialog .choices button').count(): break
                await pg.click('#dialog'); await pg.wait_for_timeout(250)
            await wait_choices()

        await pg.goto(BASE); await pg.evaluate('localStorage.clear()'); await pg.reload()
        await shot('01_menu', 1800)
        assert await scene() == 'Menü'
        await pg.click('#menu button:has-text("Start")'); await pg.wait_for_timeout(1200)
        assert await scene() == 'Start', await scene()
        await pg.click('#namecard button'); await pg.wait_for_timeout(200)
        await shot('02_name_empty_error')
        await pg.fill('#nameInput', '   Munir   '); await shot('02_name')
        await pg.click('#namecard button'); await pg.wait_for_timeout(1500)
        assert await scene() == 'Continue'
        await shot('03_cutscene_a', 1000)
        await shot('03_cutscene_b', 2000)
        await shot('03_cutscene_c', 2600)
        await pg.wait_for_selector('#cutchoices button', timeout=30000); await pg.wait_for_timeout(600)
        await shot('03_cutscene_d')
        name = await pg.evaluate('JSON.parse(localStorage.getItem("life.save.v1")).name'); assert name == 'Munir', name
        await pg.click('#cutchoices button'); await pg.wait_for_timeout(1300)
        assert await scene() == "Yes, I'm Ready"
        await shot('04_room_line1', 1500)
        await play_dialogue(); await shot('04_room')
        # trinket paths
        await click_choice('Sarı Biber'); assert await scene() == 'Sarı Biber'
        await shot('05_tbc_saribiber', 800)
        tr = await pg.evaluate('JSON.parse(localStorage.getItem("life.save.v1")).trinket'); assert tr == 'sari_biber', tr
        await pg.click('#tbcMenu'); await pg.wait_for_timeout(1200); assert await scene() == 'Menü'
        await shot('06_menu_with_save', 300)
        await pg.click('#menu button:has-text("Start")'); await pg.wait_for_timeout(1300)
        assert await scene() == "Yes, I'm Ready", 'resume failed: ' + str(await scene())
        await play_dialogue(); await click_choice('Random Sylvanian Family')
        assert await scene() == 'Random Slyvanian Family'
        tr = await pg.evaluate('JSON.parse(localStorage.getItem("life.save.v1")).trinket'); assert tr.startswith('mole_'), tr
        await shot('05_tbc_sylvanian', 600)
        await pg.click('#tbcMenu'); await pg.wait_for_timeout(1200)
        await pg.click('#menu button:has-text("Start")'); await pg.wait_for_timeout(1300)
        await play_dialogue(); await click_choice('No'); assert await scene() == 'No'
        await shot('07_street_line1', 1500)
        await play_dialogue(); await shot('07_street')
        for lab, target in [('Get lost', 'Defol git, aptal herif!'), ('Chat with him', 'Sohbet et')]:
            await click_choice(lab); assert await scene() == target, await scene()
            await pg.click('#tbcMenu'); await pg.wait_for_timeout(1200)
            await pg.click('#menu button:has-text("Start")'); await pg.wait_for_timeout(1300)
            assert await scene() == 'No'; await play_dialogue()
        await pg.locator('#dialog .choices button', has_text='Ignore him').click()
        await pg.wait_for_timeout(1800); await shot('08_intro_card')
        await pg.wait_for_function('document.body.dataset.scene === "Görmezden gel"', timeout=15000)
        await shot('09_fight_line1', 1500)
        await play_dialogue(); await shot('09_fight')
        await shot('09_fight_b', 400)
        for lab, target in [('Keep walking', 'İlerle'), ('Intervene', 'Müdahale et'), ('Call the police', 'Polisi ara')]:
            await click_choice(lab); assert await scene() == target, await scene()
            if target == 'İlerle': await shot('10_tbc')
            await pg.click('#tbcMenu'); await pg.wait_for_timeout(1200)
            await pg.click('#menu button:has-text("Start")')
            await pg.wait_for_function('document.body.dataset.scene === "Görmezden gel"', timeout=15000); await pg.wait_for_timeout(600)
            await play_dialogue()
        # restart wipes
        await click_choice('Keep walking')
        await pg.click('#tbcMenu'); await pg.wait_for_timeout(1200)
        await pg.click('#menu button:has-text("Restart")'); await pg.wait_for_timeout(1300)
        assert await scene() == 'Start'
        st = await pg.evaluate('localStorage.getItem("life.save.v1")'); assert st is None or json.loads(st)['name'] == '', st
        v = await pg.input_value('#nameInput'); assert v == '', v
        # reload persistence test
        await pg.fill('#nameInput', 'Ayla'); await pg.click('#namecard button'); await pg.wait_for_timeout(1000)
        await pg.reload(); await pg.wait_for_timeout(800)
        await pg.click('#menu button:has-text("Start")'); await pg.wait_for_timeout(1300)
        assert await scene() == 'Continue'
        await ctx.close()
        # mobile portrait
        ctx, pg = await newpage(390, 844, True)
        await pg.goto(BASE); await pg.evaluate('localStorage.setItem("life.save.v1", JSON.stringify({name:"Munir",trinket:null,flags:{},currentScene:"No",visited:[]}))'); await pg.reload()
        await shot('11_mobile_menu', 1500)
        await pg.tap('#menu button:has-text("Start")'); await pg.wait_for_timeout(1300)
        for _ in range(6):
            if await pg.locator('#dialog .choices button').count(): break
            await pg.tap('#dialog'); await pg.wait_for_timeout(300)
        await pg.wait_for_timeout(1500); await shot('11_mobile_street')
        await ctx.close(); await b.close()
asyncio.run(main())
print('ERRORS:', errors if errors else 'none')
print('ALL PATHS OK')
