"""Run the campaign by interacting with the rendered board in mobile Chromium."""
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080/"
routes = json.loads(subprocess.check_output(["node", "tests/routes.js"], cwd=ROOT))
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.getenv("CHROMIUM") or shutil.which("chromium"))
    page = browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.goto(URL)
    page.locator("#help").tap()
    page.locator("#guideOK").tap()
    page.locator("#logNav").tap()
    assert page.locator(".entry").count() == 6
    page.locator("#toMap").tap()
    page.locator(".island.locked").first.tap()
    assert "三つの航路" in page.locator("#dialogBody").inner_text()
    page.locator(".close").tap()
    page.locator("#start").tap()
    page.locator("#depart").tap()
    assert page.evaluate("document.documentElement.scrollWidth === innerWidth")
    for idx, route in enumerate(routes):
        for shot, angle in enumerate(route):
            rect = page.locator("#board").bounding_box()
            x = rect["x"] + (200 + math.sin(angle)*170)*rect["width"]/400
            y = rect["y"] + (410 - math.cos(angle)*170)*rect["height"]/440
            page.touchscreen.tap(x, y)
            page.wait_for_function("""() => document.querySelector('#advance') &&
                document.querySelector('dialog').open || document.querySelector('#fire')?.textContent.includes('風を放つ')""",
                                   timeout=8000)
            if page.locator("#advance").is_visible():
                break
            if idx == 1 and shot == 0:
                before = page.locator("#counter").inner_text(), page.locator("#turn").inner_text()
                page.reload()
                page.locator("#start").tap()
                assert before == (page.locator("#counter").inner_text(), page.locator("#turn").inner_text())
        # Input coordinates on real touchscreens are rounded to physical pixels.
        # Recover by aiming at the remaining visible lamp layout if a bank shot drifts.
        for retry in range(10):
            if page.locator("#advance").is_visible():
                break
            saved = page.evaluate("JSON.parse(localStorage.getItem('alexia.wind-atlas.v1')).rest")
            script = """const W=require('./engine'),D=require('./data'),R=require('./tests/routes');
              const a=JSON.parse(process.argv[1]),s=W.create(D.courses[a.index],Math.floor(a.index/3));
              s.lights.forEach((l,i)=>l.hp=a.hp[i]);s.lit=s.lights.filter(l=>!l.hp).length;
              console.log(R.chooseShot(s));"""
            angle = float(subprocess.check_output(["node","-e",script,json.dumps(saved)],cwd=ROOT))
            page.touchscreen.tap(rect["x"]+(200+math.sin(angle)*170)*rect["width"]/400,
                                 rect["y"]+(410-math.cos(angle)*170)*rect["height"]/440)
            page.wait_for_function("""() => document.querySelector('dialog').open ||
                document.querySelector('#fire').textContent.includes('風を放つ')""",timeout=8000)
        assert page.locator("#advance").is_visible(), f"Course {idx+1} did not finish"
        print(f"{idx+1:02}/18  {page.locator('#modalTitle').inner_text()}",flush=True)
        page.locator("#advance").tap()
        if idx % 3 == 2 and idx != 17:
            page.locator("#depart").tap()
    assert "明日も、追い風" in page.locator("#dialogBody").inner_text()
    page.locator("#readJournal").tap()
    assert page.locator(".power").count() == 6
    page.reload()
    page.locator("#start").tap()
    page.locator("#seeEnd").tap()
    assert "全18航路 踏破" in page.locator("#dialogBody").inner_text()
    assert not errors, errors
    browser.close()
    print("Ending, journal, save/resume and page error checks passed.")
