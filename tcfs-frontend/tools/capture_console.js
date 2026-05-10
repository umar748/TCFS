const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    const logs = [];
    page.on('console', msg => {
      const text = `${msg.type().toUpperCase()}: ${msg.text()}`;
      logs.push(text);
      console.log(text);
    });

    page.on('pageerror', err => {
      const text = `PAGEERROR: ${err.toString()}`;
      logs.push(text);
      console.error(text);
    });

    page.on('requestfailed', req => {
      const text = `REQUESTFAILED: ${req.url()} [${req.failure().errorText}]`;
      logs.push(text);
      console.warn(text);
    });

    const url = process.argv[2] || 'http://localhost:5173/';
    console.log('Visiting', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Give the page a moment to render
    await page.waitForTimeout(1000);

    const html = await page.evaluate(() => document.documentElement.outerHTML);
    console.log('\n----- PAGE HTML START -----\n');
    console.log(html.slice(0, 2000));
    if (html.length > 2000) console.log('\n... (truncated)');
    console.log('\n----- PAGE HTML END -----\n');

    await page.screenshot({ path: 'capture.png', fullPage: true }).catch(()=>{});
    console.log('Saved screenshot to capture.png (if supported)');

    await browser.close();
    // Exit with non-zero if any errors logged
    const hasError = logs.some(l => /ERROR|PAGEERROR|SEVERE|Request failed/i.test(l));
    process.exit(hasError ? 2 : 0);
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(3);
  }
})();
