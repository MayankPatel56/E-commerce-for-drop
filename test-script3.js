const { chromium } = require('playwright');

(async () => {
  console.log("Testing Cart Flow...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => { errors.push(err.message); });

  try {
    // First go to a product page
    await page.goto('http://localhost:3000/shop/products/lunarelief-smart-heat-vibration-belt', { waitUntil: 'networkidle', timeout: 30000 });
    console.log("On product page");

    // Check for variant selectors
    const variantSelectors = await page.$$('.space-y-3 button:not([disabled])');
    console.log(`Found ${variantSelectors.length} variant buttons`);

    // Click first variant of each type
    const containers = await page.$$('.space-y-3');
    for (const c of containers) {
      const btn = await c.$('button:not([disabled])');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(100);
      }
    }

    // Click Add to Cart
    const addToCartBtn = await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 5000 });
    await addToCartBtn.click();
    console.log("Clicked Add to Cart");

    // Wait for cart drawer to open (it should open automatically)
    await page.waitForTimeout(1000);

    // Check for cart drawer
    const cartDrawer = await page.isVisible('[role="dialog"]');
    console.log("Cart drawer visible:", cartDrawer);

    // Look for checkout link in drawer
    const checkoutLink = await page.$('a[href="/checkout"]');
    if (checkoutLink) {
      console.log("Found checkout link in drawer");
      await checkoutLink.click();
      await page.waitForLoadState('networkidle');
      console.log("Navigated to checkout");

      const checkoutHeader = await page.isVisible('header');
      console.log("Checkout header visible:", checkoutHeader);
      await page.screenshot({ path: 'checkout_after_cart.png' });
    } else {
      // Try finding Buy Now button
      const buyNowBtn = await page.waitForSelector('button:has-text("Buy Now")', { timeout: 5000 });
      await buyNowBtn.click();
      await page.waitForLoadState('networkidle');
      console.log("Clicked Buy Now");
      await page.screenshot({ path: 'checkout_after_buynow.png' });
    }

  } catch (err) {
    console.error("Cart flow failed:", err.message);
  } finally {
    console.log("Errors:", errors.slice(0, 10));
    await browser.close();
  }
})();