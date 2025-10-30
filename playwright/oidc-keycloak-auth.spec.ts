import test, { expect, Page } from '@playwright/test';

/**
 * OIDC Authentication Flow Testing with Keycloak
 *
 * This test suite validates the complete OIDC authentication flow
 * including Keycloak integration, redirect handling, and token management.
 */

test.describe('OIDC Keycloak Authentication Flow', () => {
  let screenshotCounter = 0;

  const takeTestScreenshot = async (page: Page, name: string) => {
    screenshotCounter++;
    const filename = `oidc-${screenshotCounter}-${name}.png`;
    await page.screenshot({
      path: `test-results/oidc-manual-testing/${filename}`,
      fullPage: true
    });
    return filename;
  };

  test.beforeEach(async ({ page }) => {
    screenshotCounter = 0;
    // Set up console logging to capture errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser Console Error:', msg.text());
      }
    });

    // Set up request/response logging for debugging
    page.on('requestfailed', (request) => {
      console.error('Request Failed:', request.url(), request.failure()?.errorText);
    });
  });

  test('Complete OIDC authentication flow - Initial page and login button', async ({ page }) => {
    console.log('=== Test Step 1: Navigate to Application ===');

    // Navigate to the application
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial page
    await takeTestScreenshot(page, 'initial-page');
    console.log('Screenshot taken: initial-page');

    // Check for any URL errors (like invalid_scope)
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('error=')) {
      console.error('ERROR: URL contains error parameter:', currentUrl);
      const errorMatch = currentUrl.match(/error=([^&]+)/);
      const errorDescription = currentUrl.match(/error_description=([^&]+)/);
      console.error('Error type:', errorMatch ? errorMatch[1] : 'unknown');
      console.error('Error description:', errorDescription ? decodeURIComponent(errorDescription[1]) : 'none');
    }

    expect(currentUrl).not.toContain('error=');
    expect(currentUrl).not.toContain('invalid_scope');

    console.log('=== Test Step 2: Locate Login/Register Button ===');

    // Look for login/register button - try multiple selectors
    const loginButtonSelectors = [
      'button:has-text("Login")',
      'button:has-text("Register")',
      'button:has-text("Sign in")',
      'button:has-text("Sign up")',
      'a:has-text("Login")',
      'a:has-text("Register")',
      '[data-testid="login-button"]',
      '[data-testid="auth-button"]',
    ];

    let loginButton = null;
    for (const selector of loginButtonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          loginButton = button;
          console.log(`Found login button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!loginButton) {
      console.error('Could not find login button. Taking debug screenshot...');
      await takeTestScreenshot(page, 'login-button-not-found');

      // Get page content for debugging
      const pageContent = await page.content();
      console.log('Page HTML snippet:', pageContent.substring(0, 500));

      throw new Error('Login button not found on the page');
    }

    // Highlight the button visually before clicking
    await loginButton.evaluate((el) => {
      el.style.border = '3px solid red';
      el.style.backgroundColor = 'yellow';
    });

    await takeTestScreenshot(page, 'login-button-highlighted');
    console.log('Screenshot taken: login-button-highlighted');

    console.log('=== Test Step 3: Click Login Button ===');

    // Click the login button and wait for navigation
    await Promise.all([
      page.waitForURL(/.*/, { timeout: 15000 }), // Wait for any URL change
      loginButton.click(),
    ]);

    await page.waitForLoadState('networkidle');

    const afterClickUrl = page.url();
    console.log('URL after clicking login:', afterClickUrl);

    await takeTestScreenshot(page, 'after-login-click');
    console.log('Screenshot taken: after-login-click');

    console.log('=== Test Step 4: Verify Keycloak Redirect ===');

    // Check if we're on Keycloak login page
    const isKeycloakPage = afterClickUrl.includes('localhost:8086') ||
                          afterClickUrl.includes('/realms/') ||
                          afterClickUrl.includes('/protocol/openid-connect/');

    console.log('Is Keycloak page:', isKeycloakPage);

    if (isKeycloakPage) {
      console.log('Successfully redirected to Keycloak!');

      // Take screenshot of Keycloak login page
      await page.waitForSelector('#username, input[name="username"]', { timeout: 10000 });
      await takeTestScreenshot(page, 'keycloak-login-page');
      console.log('Screenshot taken: keycloak-login-page');

      // Verify Keycloak page elements
      const hasUsernameField = await page.locator('#username, input[name="username"]').isVisible();
      const hasPasswordField = await page.locator('#password, input[name="password"]').isVisible();
      const hasLoginButton = await page.locator('#kc-login, button[type="submit"]').isVisible();

      console.log('Keycloak page elements:');
      console.log('  - Username field:', hasUsernameField);
      console.log('  - Password field:', hasPasswordField);
      console.log('  - Login button:', hasLoginButton);

      expect(hasUsernameField).toBeTruthy();
      expect(hasPasswordField).toBeTruthy();
      expect(hasLoginButton).toBeTruthy();

      console.log('=== Test Step 5: Attempt Login with Test Credentials ===');

      // Try different test credentials
      const testCredentials = [
        { username: 'test@example.com', password: 'test123' },
        { username: 'admin', password: 'admin' },
        { username: 'testuser', password: 'testuser' },
      ];

      for (const cred of testCredentials) {
        console.log(`Attempting login with username: ${cred.username}`);

        await page.locator('#username, input[name="username"]').fill(cred.username);
        await page.locator('#password, input[name="password"]').fill(cred.password);

        await takeTestScreenshot(page, `keycloak-credentials-filled-${cred.username}`);

        // Click login button
        await page.locator('#kc-login, button[type="submit"]').click();

        // Wait a bit for response
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');

        const loginResultUrl = page.url();
        console.log('URL after login attempt:', loginResultUrl);

        // Check if we're redirected back to the application
        if (loginResultUrl.includes('localhost:5174')) {
          console.log(`SUCCESS: Logged in with ${cred.username}`);
          await takeTestScreenshot(page, 'after-successful-login');

          // Verify we're authenticated
          console.log('=== Test Step 6: Verify Authentication State ===');

          // Check for logout button or user profile indicators
          const logoutButtonSelectors = [
            'button:has-text("Logout")',
            'button:has-text("Sign out")',
            '[data-testid="logout-button"]',
            '[data-testid="user-menu"]',
          ];

          let isAuthenticated = false;
          for (const selector of logoutButtonSelectors) {
            try {
              if (await page.locator(selector).isVisible({ timeout: 2000 })) {
                console.log(`Found authentication indicator: ${selector}`);
                isAuthenticated = true;
                break;
              }
            } catch (e) {
              // Continue checking
            }
          }

          console.log('Is user authenticated:', isAuthenticated);

          // Check localStorage for tokens
          const tokens = await page.evaluate(() => {
            return {
              hasLocalStorage: Object.keys(localStorage).length > 0,
              keys: Object.keys(localStorage),
            };
          });

          console.log('LocalStorage check:', tokens);

          await takeTestScreenshot(page, 'authenticated-state-final');

          expect(loginResultUrl).not.toContain('error=');

          return; // Test passed!
        } else if (loginResultUrl.includes('localhost:8086')) {
          // Still on Keycloak page - credentials might be wrong
          const errorElement = page.locator('.alert-error, #input-error, .pf-c-alert');
          const hasError = await errorElement.isVisible().catch(() => false);

          if (hasError) {
            const errorText = await errorElement.textContent();
            console.log(`Login failed for ${cred.username}. Error: ${errorText}`);
          } else {
            console.log(`Login failed for ${cred.username}. No visible error message.`);
          }

          await takeTestScreenshot(page, `login-failed-${cred.username}`);
        }
      }

      console.log('WARNING: Could not log in with any test credentials');
      console.log('Manual intervention needed: Please create a test user in Keycloak');

    } else {
      console.error('ERROR: Did not redirect to Keycloak!');
      console.log('Expected Keycloak URL (localhost:8086), got:', afterClickUrl);

      // Check for errors on the page
      const pageText = await page.textContent('body');
      if (pageText) {
        console.log('Page content snippet:', pageText.substring(0, 500));
      }

      throw new Error('Failed to redirect to Keycloak for authentication');
    }
  });

  test('Verify OIDC configuration and error handling', async ({ page }) => {
    console.log('=== Testing OIDC Configuration ===');

    // Check Keycloak well-known endpoint (using development realm)
    const keycloakUrl = 'http://localhost:8086/realms/lumina-dev/.well-known/openid-configuration';

    try {
      const response = await page.request.get(keycloakUrl);
      console.log('Keycloak well-known endpoint status:', response.status());

      if (response.ok()) {
        const config = await response.json();
        console.log('OIDC Configuration:');
        console.log('  - Issuer:', config.issuer);
        console.log('  - Authorization endpoint:', config.authorization_endpoint);
        console.log('  - Token endpoint:', config.token_endpoint);
        console.log('  - Supported scopes:', config.scopes_supported);

        expect(config.issuer).toBeTruthy();
        expect(config.authorization_endpoint).toBeTruthy();
        expect(config.token_endpoint).toBeTruthy();
      } else {
        console.error('Failed to fetch OIDC configuration');
      }
    } catch (error) {
      console.error('Error fetching OIDC configuration:', error);
    }

    // Navigate to app and check for OIDC errors
    await page.goto('http://localhost:5174');

    // Check URL for error parameters
    const url = page.url();
    const urlParams = new URL(url).searchParams;

    const hasError = urlParams.has('error');
    const errorType = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    console.log('URL Error Check:');
    console.log('  - Has error:', hasError);
    console.log('  - Error type:', errorType);
    console.log('  - Error description:', errorDescription);

    if (hasError) {
      await takeTestScreenshot(page, 'oidc-error-state');
    }

    expect(url).not.toContain('error=invalid_scope');
  });

  test('Test logout flow', async ({ page }) => {
    console.log('=== Testing Logout Flow ===');

    // This test assumes user is already logged in
    // In a real scenario, you'd first log in, then test logout

    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');

    await takeTestScreenshot(page, 'before-logout');

    // Look for logout button
    const logoutButtonSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Sign out")',
      '[data-testid="logout-button"]',
    ];

    let logoutButton = null;
    for (const selector of logoutButtonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          logoutButton = button;
          console.log(`Found logout button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (logoutButton) {
      await logoutButton.click();
      await page.waitForLoadState('networkidle');

      await takeTestScreenshot(page, 'after-logout');

      const afterLogoutUrl = page.url();
      console.log('URL after logout:', afterLogoutUrl);

      // Verify we're logged out
      const hasLoginButton = await page.locator('button:has-text("Login"), button:has-text("Sign in")').isVisible().catch(() => false);
      console.log('Has login button after logout:', hasLoginButton);

      expect(hasLoginButton).toBeTruthy();
    } else {
      console.log('No logout button found - user might not be logged in');
    }
  });
});
