import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console logs and errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    } else if (msg.type() === 'warning') {
      console.log('⚠️  Console Warning:', msg.text());
    } else {
      console.log('💬 Console Log:', msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', err => {
    console.log('🚨 Page Error:', err.message);
  });

  // Listen for failed requests
  page.on('requestfailed', request => {
    console.log('🔴 Failed Request:', request.url(), request.failure().errorText);
  });

  try {
    console.log('🌐 Navigating to http://localhost:9002/');
    await page.goto('http://localhost:9002/', { waitUntil: 'networkidle' });

    console.log('📄 Page title:', await page.title());

    // Wait a bit to see if any errors occur after initial load
    await page.waitForTimeout(3000);

    // Try to click around to test functionality
    console.log('🖱️  Testing navigation...');

    // Check if "Pair New Device" button exists and click it
    const pairButton = await page.locator('text=Pair New Device').first();
    if (await pairButton.isVisible()) {
      await pairButton.click();
      console.log('✅ Clicked Pair New Device button');
      await page.waitForTimeout(1000);
    }

    // Check if "Add Folder" button exists and click it
    const addFolderButton = await page.locator('text=Add Folder').first();
    if (await addFolderButton.isVisible()) {
      await addFolderButton.click();
      console.log('✅ Clicked Add Folder button');
      await page.waitForTimeout(1000);
    }

    // Check if main components are rendered
    const syncedFoldersCard = await page.locator('text=Synced Folders').first();
    const pairedDevicesCard = await page.locator('text=Paired Devices').first();

    if (await syncedFoldersCard.isVisible()) {
      console.log('✅ Synced Folders card is visible');
    }

    if (await pairedDevicesCard.isVisible()) {
      console.log('✅ Paired Devices card is visible');
    }

    // Test theme toggle if available
    const themeToggle = await page.locator('[aria-label*="theme"]').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      console.log('✅ Theme toggle works');
      await page.waitForTimeout(1000);
    }

    console.log('✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  await browser.close();
})();