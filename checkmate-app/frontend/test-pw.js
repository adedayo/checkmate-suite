const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
  const html = await page.content();
  console.log("HTML Snippet:", html.substring(0, 500));
  await browser.close();
})();
