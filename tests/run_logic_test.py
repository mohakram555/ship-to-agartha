from playwright.sync_api import sync_playwright
import os
import sys

def verify_logic():
    cwd = os.getcwd()
    file_path = f"file://{cwd}/tests/verify_shield_logic.html"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(file_path)

        results = page.locator("#results div")
        count = results.count()

        all_passed = True

        print(f"Running {count} tests...")

        for i in range(count):
            text = results.nth(i).text_content()
            print(text)
            if "FAIL" in text:
                all_passed = False

        browser.close()

        if all_passed:
            print("\nAll logic tests PASSED.")
            sys.exit(0)
        else:
            print("\nSome tests FAILED.")
            sys.exit(1)

if __name__ == "__main__":
    verify_logic()
