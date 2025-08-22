import { chromium } from 'playwright';

(async () => {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Listen for console messages and errors
    page.on('console', msg => {
      console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log(`PAGE ERROR: ${error.message}`);
    });
    
    page.on('requestfailed', request => {
      console.log(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
    });
    
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 10000 });
    
    // Wait a bit for React to render
    await page.waitForTimeout(3000);
    
    // Check if root element exists
    const rootExists = await page.locator('#root').count();
    console.log(`Root element exists: ${rootExists > 0}`);
    
    // Get the content of the root element
    const rootContent = await page.locator('#root').textContent();
    console.log(`Root content: "${rootContent}"`);
    
    // Check if our test content is there
    const heading = await page.locator('h1').textContent().catch(() => null);
    console.log(`H1 content: "${heading}"`);
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: "${title}"`);
    
    // Get HTML content
    const html = await page.content();
    console.log(`Page HTML length: ${html.length}`);
    
    console.log('Debugging complete!');
    
  } catch (error) {
    console.error('Error during debugging:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();