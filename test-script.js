const { chromium } = require('playwright');

(async () => {
  console.log("Starting browser test suite...");
  const results = [];

  const testPage = async (url, name) => {
    console.log(`\nTesting ${name} (${url})...`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => { errors.push(err.message); });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      const title = await page.title();
      const headerVisible = await page.isVisible('header');
      const footerVisible = await page.isVisible('footer');
      await page.screenshot({ path: `${name.replace(/\s+/g, '_').toLowerCase()}.png` });

      results.push({
        url,
        name,
        title,
        headerVisible,
        footerVisible,
        errors: errors.slice(0, 5)
      });
      console.log(`Finished ${name}. Errors: ${errors.length}`);
    } catch (err) {
      console.error(`Failed ${name}:`, err.message);
      results.push({ url, name, error: err.message });
    } finally {
      await browser.close();
    }
  };

  await testPage('http://localhost:3000', 'Home');
  await testPage('http://localhost:3000/shop', 'Shop');

  // Try to find a product slug from the shop page
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle' });
  const firstProductLink = await page.$eval('a[href*="/shop/products/"]', a => a.getAttribute('href'));
  await browser.close();

  if (firstProductLink) {
    await testPage(`http://localhost:3000${firstProductLink}`, 'Product Page');

    // Test Cart & Checkout Flow
    console.log("\nTesting Cart Flow...");
    const browser2 = await chromium.launch({ headless: true });
    const page2 = await browser2.newPage();
    try {
      await page2.goto(`http://localhost:3000${firstProductLink}`, { waitUntil: 'networkidle' });

      // Click Add to Cart
      // Note: Might need to select variants first. Let's look for buttons.
      const variantButtons = await page2.$$('button:has-text("Select")');
      if (variantButtons.length > 0) {
          // Simplistic selection - click first of each type
          const containers = await page2.$$('.space-y-3'); // Adjust based on HTML
          for (const c of containers) {
              const btn = await c.$('button:not([disabled])');
              if (btn) await btn.click();
          }
      }

      const addToCartBtn = await page2.waitForSelector('button:has-text("Add to Cart"), button:has-text("Buy Now")', { timeout: 5000 });
      await addToCartBtn.click();
      console.log("Clicked Add to Cart");

      // Open Cart (if not automatic)
      await page2.waitForTimeout(1000);
      const cartDrawer = await page2.isVisible('[role="dialog"]'); // Assuming shadcn drawer
      console.log("Cart drawer visible:", cartDrawer);
      await page2.screenshot({ path: 'cart_drawer.png' });

      // Go to Checkout
      const checkoutBtn = await page2.waitForSelector('a[href="/checkout"], button:has-text("Checkout")', { timeout: 5000 });
      await checkoutBtn.click();
      await page2.waitForLoadState('networkidle');
      console.log("Navigated to Checkout");

      await testPage('http://localhost:3000/checkout', 'Checkout');
    } catch (e) {
      console.error("Cart flow failed:", e.message);
    } finally {
      await browser2.close();
    }
  }

  await testPage('http://localhost:3000/about', 'About');
  await testPage('http://localhost:3000/faq', 'FAQ');

  console.log("\nFINAL RESULTS:");
  console.log(JSON.stringify(results, null, 2));
})();