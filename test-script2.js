const { chromium } = require('playwright');

(async () => {
  console.log("Testing Checkout page...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => { errors.push(err.message); });

  try {
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    const headerVisible = await page.isVisible('header');
    const footerVisible = await page.isVisible('footer');
    await page.screenshot({ path: 'checkout.png' });

    console.log("Title:", title);
    console.log("Header visible:", headerVisible);
    console.log("Footer visible:", footerVisible);
    console.log("Errors:", errors);
  } catch (err) {
    console.error("Failed:", err.message);
  } finally {
    await browser.close();
  }
})();