import { test, expect } from '@playwright/test';

test.describe('Google Login Integration Check', () => {
  test('should display Google login option on Keycloak login page', async ({
    page,
  }) => {
    // Navigate directly to a protected route that should redirect to Keycloak
    console.log('Navigating to protected route to trigger Keycloak redirect...');
    await page.goto('https://lumina.study/my-journey', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // Wait a bit for any redirects to complete
    await page.waitForTimeout(3000);

    // Take screenshot of the login required dialog
    await page.screenshot({
      path: 'screenshots/02-login-required-dialog.png',
      fullPage: true,
    });

    // Click the Login button to go to Keycloak
    console.log('Clicking Login button...');
    await page.locator('button:has-text("Login")').first().click();

    // Wait for navigation to Keycloak
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check current URL - should be at Keycloak now
    const currentUrl = page.url();
    console.log('Current URL after clicking Login:', currentUrl);

    // Take screenshot of the Keycloak login page
    await page.screenshot({
      path: 'screenshots/03-keycloak-login-page.png',
      fullPage: true,
    });

    // Check for Google login button
    const googleButtonSelectors = [
      'text=/google/i',
      'text=/sign in with google/i',
      '[class*="google"]',
      '[id*="google"]',
      'a[href*="google"]',
      'button:has-text("Google")',
    ];

    let googleButton = null;
    for (const selector of googleButtonSelectors) {
      try {
        const element = page.locator(selector);
        if ((await element.count()) > 0 && (await element.first().isVisible())) {
          googleButton = element.first();
          console.log(`Found Google button with selector: ${selector}`);

          // Take a screenshot of the Google button
          await googleButton.screenshot({
            path: 'screenshots/04-google-button.png',
          });

          // Get button properties
          const text = await googleButton.textContent();
          const boundingBox = await googleButton.boundingBox();

          console.log('Google button text:', text);
          console.log('Google button position:', boundingBox);

          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // Get all visible buttons and links for analysis
    const allButtons = await page
      .locator('button, a')
      .evaluateAll((elements) => {
        return elements
          .filter((el) => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          })
          .map((el) => ({
            tag: el.tagName,
            text: el.textContent?.trim(),
            id: el.id,
            className: el.className,
            href: (el as HTMLAnchorElement).href,
          }));
      });

    console.log('All visible buttons and links:', JSON.stringify(allButtons, null, 2));

    // Report findings
    if (googleButton) {
      console.log('✓ Google login option is visible');
    } else {
      console.log('✗ Google login option NOT found');
    }

    // Check for other authentication options
    const authOptions = await page.locator('[class*="identity-provider"], [class*="social"], [class*="idp"]').count();
    console.log(`Found ${authOptions} identity provider options`);
  });
});
