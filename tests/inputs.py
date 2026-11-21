"""Check the standalone build, keyboard input, storage fallback and mobile touch cancellation."""
import sys
import shutil

from playwright.sync_api import sync_playwright

url = sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8080/play.html'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which("chromium"))
    for width, height in [(320,568),(390,844),(844,390),(1440,900)]:
        ctx = browser.new_context(viewport={"width":width,"height":height},has_touch=True)
        ctx.add_init_script("""Storage.prototype.setItem = function(){throw new Error('Storage unavailable')};""")
        page = ctx.new_page()
        errors, outside = [], []
        page.on("pageerror",lambda e: errors.append(str(e)))
        page.on("request",lambda r: outside.append(r.url) if r.url != url and r.url.startswith(("https:", "http:")) else None)
        page.goto(url)
        ctx.set_offline(True)
        page.wait_for_function("Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)")
        assert page.evaluate("document.documentElement.scrollWidth === innerWidth")
        page.locator("#sound").tap()
        assert page.locator("#sound").get_attribute("aria-pressed") == "true"
        page.locator("#start").tap()
        page.locator("#depart").tap()
        assert "一時記録" in page.locator("#saveStatus").inner_text()
        board=page.locator("#board")
        board.scroll_into_view_if_needed()
        r=board.bounding_box()
        cdp=ctx.new_cdp_session(page)
        pt={"x":r["x"]+r["width"]/2,"y":r["y"]+r["height"]/2}
        cdp.send("Input.dispatchTouchEvent",{"type":"touchStart","touchPoints":[pt]})
        cdp.send("Input.dispatchTouchEvent",{"type":"touchCancel","touchPoints":[]})
        assert page.locator("#turn").inner_text()=="現在 0 手"
        board.focus()
        page.keyboard.press("ArrowLeft")
        page.keyboard.press("ArrowRight")
        page.keyboard.press("Space")
        page.wait_for_selector("#advance")
        page.locator("#advance").tap()
        page.locator("#roundHelp").tap()
        page.keyboard.press("Escape")
        page.locator("#retry").tap()
        page.locator("#confirmRetry").tap()
        assert page.locator("#turn").inner_text()=="現在 0 手"
        assert not errors,errors
        assert not outside,outside
        ctx.close()
        print(f"{width}×{height} offline, audio toggle, touch cancellation, keyboard, retry, storage fallback: OK",flush=True)
    browser.close()
