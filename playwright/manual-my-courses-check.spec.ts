import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';

test.describe('My Courses Page Manual Check', () => {
  test('Check my-courses page after auth-service fixes', async ({ page }) => {
    // Set up listeners for network and console before navigation
    const networkRequests: Array<{ url: string; status: number; method: string }> = [];
    const consoleMessages: Array<{ type: string; text: string }> = [];

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('/courses')) {
        networkRequests.push({
          url,
          status: response.status(),
          method: response.request().method(),
        });
      }
    });

    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Navigate to homepage
    console.log('=== Step 1: Navigating to homepage ===');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true });
    console.log('Screenshot saved: test-results/01-homepage.png');

    // Check if user is already logged in
    const isLoggedIn = await page.evaluate(() => {
      return localStorage.getItem('token') !== null ||
             localStorage.getItem('authToken') !== null ||
             document.cookie.includes('token') ||
             document.cookie.includes('authToken');
    });

    console.log(`User logged in status: ${isLoggedIn}`);

    if (!isLoggedIn) {
      console.log('\n=== Step 2: Logging in with test user ===');

      // Navigate directly to login page
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
      await page.screenshot({ path: 'test-results/02-login-page.png', fullPage: true });
      console.log('Screenshot saved: test-results/02-login-page.png');

      // Login with new user
      const loginPage = new LoginPage(page);
      const email = faker.internet.email();
      const password = faker.internet.password();

      console.log(`Logging in with: ${email}`);
      await loginPage.login(email, password);

      await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });
      console.log('Screenshot saved: test-results/03-after-login.png');

      // Complete onboarding if needed
      const currentUrl = page.url();
      if (currentUrl.includes('onboarding')) {
        console.log('\n=== Step 3: Completing onboarding ===');
        const onboarding = new OnboardingPage(page);
        await onboarding.selectInstitution('The Open University Of Israel');
        await onboarding.selectDegree('Economics');
        await onboarding.agreeAndFinish();
        await page.waitForLoadState('networkidle');

        await page.screenshot({ path: 'test-results/03b-after-onboarding.png', fullPage: true });
        console.log('Screenshot saved: test-results/03b-after-onboarding.png');
      }
    } else {
      console.log('User already logged in, skipping login step');
    }

    // Clear previous network requests
    networkRequests.length = 0;

    // Navigate to my-courses page
    console.log('\n=== Step 4: Navigating to /my-courses ===');
    await page.goto('http://localhost:5173/my-courses', { waitUntil: 'networkidle' });

    // Wait for page to fully load
    await page.waitForTimeout(5000);

    // Take screenshot of my-courses page
    await page.screenshot({ path: 'test-results/04-my-courses-page.png', fullPage: true });
    console.log('Screenshot saved: test-results/04-my-courses-page.png');

    // Check page content
    const pageContent = await page.content();
    const pageText = await page.textContent('body');

    const hasLoginRequired = pageContent.includes('Login Required') || pageContent.includes('login required');
    const hasNoCourses = pageContent.includes('No courses') || pageContent.includes('no courses');
    const hasLoading = pageContent.includes('Loading') || pageContent.includes('loading');
    const hasError = pageContent.includes('Error') && !pageContent.includes('Error boundary'); // Exclude error boundary text
    const hasCoursesList = pageContent.includes('course-item') || pageContent.includes('course-card');

    // Filter relevant network requests
    const coursesApiRequests = networkRequests.filter(req =>
      req.url.includes('/courses/my') || req.url.includes('/api/courses')
    );

    // Get console errors
    const consoleErrors = consoleMessages.filter(msg => msg.type === 'error');

    // Report detailed results
    console.log('\n=== TEST RESULTS ===');
    console.log(`Page URL: ${page.url()}`);
    console.log(`Page Title: ${await page.title()}`);
    console.log('\nPage State:');
    console.log(`  - Shows "Login Required": ${hasLoginRequired}`);
    console.log(`  - Shows "No courses": ${hasNoCourses}`);
    console.log(`  - Shows loading state: ${hasLoading}`);
    console.log(`  - Shows error: ${hasError}`);
    console.log(`  - Has courses list: ${hasCoursesList}`);

    console.log('\nAPI Requests to /courses:');
    if (coursesApiRequests.length > 0) {
      coursesApiRequests.forEach(req => {
        console.log(`  - ${req.method} ${req.url} → ${req.status}`);
      });
    } else {
      console.log('  - No API requests to /courses endpoints detected');
    }

    console.log('\nConsole Errors:');
    if (consoleErrors.length > 0) {
      consoleErrors.slice(0, 5).forEach(err => {
        console.log(`  - ${err.text}`);
      });
    } else {
      console.log('  - No console errors');
    }

    console.log('\nPage Text Preview:');
    console.log(pageText?.substring(0, 300));

    // Assertions
    expect(page.url()).toContain('/my-courses');

    // The page should NOT show login required if we're logged in
    if (!hasLoginRequired) {
      console.log('\n✓ SUCCESS: Page loaded without login barrier');
    } else {
      console.log('\n✗ ISSUE: Page is showing login required despite being logged in');
    }
  });
});
