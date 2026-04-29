import sys
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
import time

def run_server(port):
    server_address = ('', port)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    print(f"Server started on port {port}")
    httpd.serve_forever()

def verify():
    port = 8086
    server_thread = threading.Thread(target=run_server, args=(port,))
    server_thread.daemon = True
    server_thread.start()
    time.sleep(2) # Give server time to start

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Enable console logging
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        url = f'http://localhost:{port}/tests/verify_dev_unlock.html'
        print(f"Navigating to {url}")
        page.goto(url)

        # Wait for loading to finish
        print("Waiting for loading overlay to hide...")
        try:
            page.wait_for_selector('#loading-overlay', state='hidden', timeout=10000)
        except Exception as e:
            print("Timeout waiting for loading overlay.")
            browser.close()
            sys.exit(1)

        # 1. Check Dev Toggle is hidden initially
        print("Checking if Dev Toggle is hidden initially...")
        dev_toggle = page.locator('#dev-toggle')

        # Check if element exists
        if dev_toggle.count() == 0:
             print("FAIL: Dev toggle element not found")
             browser.close()
             sys.exit(1)

        # Check visibility
        if dev_toggle.is_visible():
             print("FAIL: Dev toggle is visible initially. It should be hidden.")
             browser.close()
             sys.exit(1)
        else:
             print("PASS: Dev toggle is hidden initially")

        # 2. Unlock Dev Menu
        print("Attempting to unlock dev menu...")

        # Start game to show HUD
        print("Starting game to show HUD...")
        page.click('#btn-start')

        # Wait for HUD to appear
        try:
            page.wait_for_selector('#hud', state='visible', timeout=5000)
        except:
            print("FAIL: HUD did not appear after starting game")
            browser.close()
            sys.exit(1)

        print("Clicking HUD mission 3 times...")
        hud_mission = page.locator('#hud-mission')

        # Click 3 times
        hud_mission.click()
        time.sleep(0.1)
        hud_mission.click()
        time.sleep(0.1)
        hud_mission.click()

        # Check if visible now
        if dev_toggle.is_visible():
            print("PASS: Dev toggle became visible")
        else:
            print("FAIL: Dev toggle is NOT visible after 3 clicks")
            browser.close()
            sys.exit(1)

        # 3. Open Dev Menu
        print("Opening dev menu...")
        dev_toggle.click()

        # 4. Check Milk Button
        milk_btn = page.locator('#dev-milk')
        if not milk_btn.is_visible():
            print("FAIL: Milk button not found or not visible")
            browser.close()
            sys.exit(1)
        else:
            print("PASS: Milk button found")
            page.screenshot(path="tests/dev_menu_unlocked.png")
            print("Screenshot saved to tests/dev_menu_unlocked.png")

        # 5. Check Elixir Increase
        elixir_count = page.locator('#elixir-count')
        try:
            initial_val = int(elixir_count.text_content())
        except:
             initial_val = 0

        print(f"Initial elixir: {initial_val}")

        print("Clicking Milk button...")
        milk_btn.click()

        # Wait a bit for update (though it should be sync in main.js usually, but DOM update might tick)
        time.sleep(0.1)

        try:
            new_val = int(elixir_count.text_content())
        except:
            print("FAIL: Could not read new elixir value")
            browser.close()
            sys.exit(1)

        print(f"New elixir: {new_val}")

        if new_val == initial_val + 100:
            print("PASS: Elixir increased by 100")
        else:
            print(f"FAIL: Elixir did not increase by 100. Got {new_val}, expected {initial_val + 100}")
            browser.close()
            sys.exit(1)

        browser.close()
        print("ALL TESTS PASSED")

if __name__ == "__main__":
    verify()
