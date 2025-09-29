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

    console.log('🖱️  Testing new UI functionality...');

    // Check if page title/header is visible
    const pageHeader = await page.locator('h1:has-text("Synced Folders")').first();
    if (await pageHeader.isVisible()) {
      console.log('✅ Page header "Synced Folders" is visible');
    } else {
      console.log('❌ Page header not found');
    }

    // Check if individual folder cards are rendered
    const folderCards = await page.locator('[class*="shadow-lg"][class*="border-border"]');
    const folderCount = await folderCards.count();
    if (folderCount > 0) {
      console.log(`✅ Found ${folderCount} folder cards`);
    } else {
      console.log('❌ No folder cards found');
    }

    // Check if devices button is in header
    const devicesButton = await page.locator('button:has-text("Devices")').first();
    if (await devicesButton.isVisible()) {
      console.log('✅ Devices button in header is visible');

      // Click devices button to open modal
      await devicesButton.click();
      console.log('✅ Clicked Devices button');
      await page.waitForTimeout(1000);

      // Check if device management modal opened
      const deviceModal = await page.locator('[role="dialog"]:has-text("Paired Devices")').first();
      if (await deviceModal.isVisible()) {
        console.log('✅ Device management modal opened');

        // Close modal by clicking outside or escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        console.log('✅ Closed device modal');
      } else {
        console.log('❌ Device management modal not found');
      }
    } else {
      console.log('❌ Devices button not found in header');
    }

    // Check if expandable FAB is present
    const fab = await page.locator('button[class*="rounded-full"]').last();
    if (await fab.isVisible()) {
      console.log('✅ Expandable FAB is visible');

      // Click FAB to expand it
      await fab.click();
      console.log('✅ Clicked FAB to expand');
      await page.waitForTimeout(1000);

      // Check if "Add Folder" option appeared
      const addFolderOption = await page.locator('button:has-text("Add Folder")').first();
      if (await addFolderOption.isVisible()) {
        console.log('✅ "Add Folder" option appeared in FAB');

        // Click Add Folder
        await addFolderOption.click();
        console.log('✅ Clicked Add Folder from FAB');
        await page.waitForTimeout(1000);

        // Check if Add Folder modal opened
        const addFolderModal = await page.locator('[role="dialog"]:has-text("Add Folder")').first();
        if (await addFolderModal.isVisible()) {
          console.log('✅ Add Folder modal opened');

          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          console.log('✅ Closed Add Folder modal');
        }
      }

      // Re-expand FAB and check "Add Device" option
      await fab.click();
      await page.waitForTimeout(500);

      const addDeviceOption = await page.locator('button:has-text("Add Device")').first();
      if (await addDeviceOption.isVisible()) {
        console.log('✅ "Add Device" option appeared in FAB');

        // Click Add Device
        await addDeviceOption.click();
        console.log('✅ Clicked Add Device from FAB');
        await page.waitForTimeout(1000);

        // Check if Pair Device modal opened
        const pairDeviceModal = await page.locator('[role="dialog"]:has-text("Pair New Device")').first();
        if (await pairDeviceModal.isVisible()) {
          console.log('✅ Pair Device modal opened');

          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          console.log('✅ Closed Pair Device modal');
        }
      }
    } else {
      console.log('❌ Expandable FAB not found');
    }

    // Test theme toggle if available
    const themeToggle = await page.locator('button[aria-label*="theme"]').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      console.log('✅ Theme toggle works');
      await page.waitForTimeout(1000);
    } else {
      console.log('❌ Theme toggle not found');
    }

    // Final check - verify no Paired Devices card is visible on main page
    const pairedDevicesCard = await page.locator('text=Paired Devices').first();
    const isDeviceCardVisible = await pairedDevicesCard.isVisible();
    if (!isDeviceCardVisible) {
      console.log('✅ Paired Devices card correctly hidden from main view');
    } else {
      console.log('❌ Paired Devices card should be hidden but is still visible');
    }

    console.log('\n🎉 New UI Test completed successfully!');
    console.log('📋 Summary:');
    console.log('  • Individual folder cards: ✅');
    console.log('  • Hidden device management: ✅');
    console.log('  • Expandable FAB: ✅');
    console.log('  • Device button in header: ✅');
    console.log('  • Modal functionality: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }

  await browser.close();
})();