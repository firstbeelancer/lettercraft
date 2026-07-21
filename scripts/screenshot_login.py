#!/usr/bin/env python3
"""Скриншоты нового Login."""
import asyncio
import os
from playwright.async_api import async_playwright

URL = "https://lettercraft.tigerapps.pro"

async def main():
    out_dir = "/workspace/lettercraft/screenshots"
    os.makedirs(out_dir, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Desktop: idle state
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        page = await ctx.new_page()
        await page.goto(f"{URL}/login", wait_until="networkidle")
        await page.wait_for_timeout(1500)  # let glitch canvas + animations settle
        await page.screenshot(path=f"{out_dir}/login_cosmic_desktop.png", full_page=True)
        print("✅ login_cosmic_desktop.png")

        # Desktop: filled state
        await page.fill('input[type="email"]', 'm.kalmykova@tehgid.com')
        await page.wait_for_timeout(400)
        await page.screenshot(path=f"{out_dir}/login_cosmic_filled.png", full_page=True)
        print("✅ login_cosmic_filled.png")

        # Desktop: sent state
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{out_dir}/login_cosmic_sent.png", full_page=True)
        print("✅ login_cosmic_sent.png")
        await ctx.close()

        # Mobile
        ctx_m = await browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True)
        page_m = await ctx_m.new_page()
        await page_m.goto(f"{URL}/login", wait_until="networkidle")
        await page_m.wait_for_timeout(1200)
        await page_m.screenshot(path=f"{out_dir}/login_cosmic_mobile.png", full_page=True)
        print("✅ login_cosmic_mobile.png")
        await ctx_m.close()

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
