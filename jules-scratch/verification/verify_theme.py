
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.on("console", lambda msg: print(msg.text))
    page.goto("http://localhost:3000")
    page.wait_for_timeout(10000)
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
