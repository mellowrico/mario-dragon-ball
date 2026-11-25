import argparse
from contextlib import contextmanager
from pathlib import Path
from shutil import which
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright


HUD = """() => Object.fromEntries(
    ['percent', 'coins', 'balls', 'score'].map(id => [id, parseInt(document.getElementById(id).textContent, 10)])
)"""
RESET_HUD = {"percent": 0, "coins": 0, "balls": 0, "score": 0}


@contextmanager
def observed_page(browser, url, **context_options):
    context = browser.new_context(**context_options)
    page = context.new_page()
    errors = []
    origin = urlsplit(url)[:2]

    def relevant(resource_url):
        return urlsplit(resource_url)[:2] in (origin, urlsplit(page.url)[:2])

    def record_console(message):
        if message.type == "error":
            errors.append(f"Console error: {message.text}")

    def record_response(response):
        if response.status >= 400 and relevant(response.url):
            errors.append(f"HTTP {response.status}: {response.url}")

    def record_failure(request):
        if relevant(request.url):
            errors.append(f"{request.failure}: {request.url}")

    page.on("console", record_console)
    page.on("pageerror", lambda error: errors.append(f"Page error: {error}"))
    page.on("response", record_response)
    page.on("requestfailed", record_failure)

    try:
        response = page.goto(url, wait_until="load", timeout=20000)
        assert response and response.ok, f"Could not load {url}"
        yield page
    except Exception as error:
        if errors:
            error.add_note("\n".join(errors))
        raise
    else:
        assert not errors, "\n".join(errors)
    finally:
        context.close()


def check_assets(page):
    assert page.evaluate("""async () => {
        const font = await document.fonts.load('16px Pixel');
        return font.some(face => face.status === 'loaded');
    }"""), "Pixel font failed to load"
    assert page.evaluate("""() => {
        const images = [...document.querySelectorAll('img[src$=".png"]')];
        return images.length >= 3 && images.every(img => img.complete && img.naturalWidth > 0);
    }"""), "The arcade PNG images failed to load"
    page.wait_for_function("""() => {
        const canvas = document.getElementById('world');
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const colors = new Set();
        for (let i = 0; i < pixels.length; i += 4 * 97) {
            if (pixels[i + 3]) colors.add(pixels[i] * 65536 + pixels[i + 1] * 256 + pixels[i + 2]);
            if (colors.size >= 20) return true;
        }
        return false;
    }""", timeout=5000)


def wait_for_progress(page, threshold):
    page.wait_for_function(
        """threshold => {
            const percent = parseInt(document.getElementById('percent').textContent, 10);
            const progress = Number(document.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'));
            return percent >= threshold && percent === progress;
        }""",
        arg=threshold,
        timeout=5000,
    )


def wait_for_coin(page):
    page.wait_for_function("""() =>
        Number(document.getElementById('coins').textContent) >= 1 &&
        Number(document.getElementById('score').textContent) >= 100
    """, timeout=5000)


def check_desktop(browser, url, screenshot):
    with observed_page(browser, url, viewport={"width": 1440, "height": 900}) as page:
        check_assets(page)
        expect(page.locator("#mode")).to_have_text("GOTOWY")
        expect(page.locator("#start")).to_be_visible()
        if screenshot:
            screenshot.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=screenshot, full_page=True)

        page.keyboard.press("Enter")
        expect(page.locator("#mode")).to_have_text("W GRZE")
        assert page.evaluate(HUD) == RESET_HUD
        page.keyboard.down("d")
        try:
            wait_for_progress(page, 2)
        finally:
            page.keyboard.up("d")

        page.keyboard.down("ArrowUp")
        try:
            wait_for_coin(page)
        finally:
            page.keyboard.up("ArrowUp")

        page.keyboard.press("Escape")
        expect(page.locator("#mode")).to_have_text("PAUZA")
        expect(page.locator("#primary")).to_be_focused()
        paused_hud = page.evaluate(HUD)
        page.keyboard.down("ArrowRight")
        try:
            page.evaluate("""async () => {
                for (let frame = 0; frame < 8; frame++) await new Promise(requestAnimationFrame);
            }""")
        finally:
            page.keyboard.up("ArrowRight")
        assert page.evaluate(HUD) == paused_hud

        page.keyboard.press("Enter")
        expect(page.locator("#mode")).to_have_text("W GRZE")
        page.locator("#pause").click()
        expect(page.locator("#mode")).to_have_text("PAUZA")
        page.locator("#restart").click()
        expect(page.locator("#mode")).to_have_text("W GRZE")
        assert page.evaluate(HUD) == RESET_HUD


def touch_point(locator, point_id):
    bounds = locator.bounding_box()
    assert bounds, f"Touch control is missing or hidden: {locator}"
    return {
        "x": round(bounds["x"] + bounds["width"] / 2),
        "y": round(bounds["y"] + bounds["height"] / 2),
        "id": point_id,
    }


def check_mobile(browser, url):
    with observed_page(browser, url, viewport={"width": 390, "height": 844}, is_mobile=True,
                       has_touch=True, device_scale_factor=2) as page:
        stick = page.locator("#stick")
        knob = stick.locator("i")
        jump = page.locator("#touch-jump")
        expect(stick).to_be_visible()
        expect(jump).to_be_visible()
        page.locator("#start").tap()
        expect(page.locator("#mode")).to_have_text("W GRZE")

        cdp = page.context.new_cdp_session(page)

        def touch(event_type, *points):
            cdp.send("Input.dispatchTouchEvent", {"type": event_type, "touchPoints": list(points)})

        center = touch_point(knob, 1)
        right = {**center, "x": center["x"] + 36}
        jump_point = touch_point(jump, 2)
        try:
            touch("touchStart", center)
            touch("touchMove", right)
            assert knob.evaluate("node => parseFloat(node.style.left)") > 50
            wait_for_progress(page, 2)
            touch("touchStart", right, jump_point)
            assert jump.evaluate("node => node.classList.contains('held')")
            wait_for_coin(page)
        finally:
            touch("touchEnd")
        assert not jump.evaluate("node => node.classList.contains('held')")
        assert knob.evaluate("node => node.style.left") == ""


def main():
    parser = argparse.ArgumentParser(description="Smoke-test the desktop and touch browser controls.")
    parser.add_argument("url", help="URL of the deployed or locally served game")
    parser.add_argument("--browser", default=which("google-chrome") or which("chromium"),
                        help="Path to a Chromium or Chrome executable")
    parser.add_argument("--screenshot", type=Path, help="Optional start-screen PNG path")
    args = parser.parse_args()

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=args.browser)
        try:
            check_desktop(browser, args.url, args.screenshot)
            check_mobile(browser, args.url)
        finally:
            browser.close()
    print(f"Desktop and mobile browser smoke tests passed for {args.url}")


if __name__ == "__main__":
    main()
