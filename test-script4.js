const { chromium } = require('playwright');

(async () => {
  console.log("Testing Product Page Cart Addition...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => { errors.push(err.message); });

  try {
    await page.goto('http://localhost:3000/shop/products/lunarelief-smart-heat-vibration-belt', { waitUntil: 'networkidle', timeout: 30000 });

    // Just try clicking Add to Cart directly
    const addToCartBtn = await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 5000 });
    await addToCartBtn.click();
    console.log("Clicked Add to Cart");

    // Check cart drawer
    await page.waitForTimeout(1500);
    const cartDrawer = await page.isVisible('[role="dialog"]');
    console.log("Cart drawer visible:", cartDrawer);

    // Screenshot
    await page.screenshot({ path: 'product_page.png' });

    // Now navigate to checkout directly
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'checkout_final.png' });

    const checkoutHeader = await page.isVisible('header');
    const checkoutFooter = await page.isVisible('footer');
    console.log("Checkout header visible:", checkoutHeader);
    console.log("Checkout footer visible:", checkoutFooter);
    console.log("Errors:", errors);
  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    await browser.close();
  }
})();
