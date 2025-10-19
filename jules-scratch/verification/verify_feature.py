from playwright.sync_api import Page, expect

def test_chatbot_interaction(page: Page):

    page.goto("http://localhost:5173")


    expect(page.get_by_role("heading", name="Elastic + Google Cloud")).to_be_visible()


    page.get_by_placeholder("Ask a question...").fill("What is Elasticsearch?")
    page.get_by_role("button", name="Send").click()


    expect(page.locator(".message.human").get_by_text("What is Elasticsearch?")).to_be_visible()
    expect(page.locator(".message.ai")).to_be_visible()


    page.screenshot(path="jules-scratch/verification/verification.png")
