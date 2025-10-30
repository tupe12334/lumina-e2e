import { test, expect } from '@playwright/test';

test.describe('My Courses Page Quick Check', () => {
  test('Check my-courses page status without login', async ({ page }) => {
    // Set up listeners for network and console
    const networkRequests: Array<{ url: string; status: number; method: string }> = [];
    const consoleMessages: Array<{ type: string; text: string }> = [];

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('/courses') || url.includes('/auth')) {
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

    console.log('=== Navigating directly to /my-courses ===');
    await page.goto('http://localhost:5173/my-courses', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/my-courses-status.png', fullPage: true });
    console.log('Screenshot saved: test-results/my-courses-status.png');

    // Check page content
    const pageContent = await page.content();
    const pageText = await page.textContent('body');

    const hasLoginRequired = pageContent.includes('Login Required') || pageContent.includes('login required');
    const hasNoCourses = pageContent.includes('No courses') || pageContent.includes('no courses');
    const hasLoading = pageContent.includes('Loading') || pageContent.includes('loading');
    const hasError = pageContent.includes('Error') && !pageContent.includes('Error boundary');
    const hasCoursesList = pageContent.includes('course-item') || pageContent.includes('course-card');
    const hasKeycloakRedirect = page.url().includes('keycloak') || page.url().includes('auth/realms');

    // Filter relevant network requests
    const coursesApiRequests = networkRequests.filter(req =>
      req.url.includes('/courses/my') || req.url.includes('/api/courses')
    );

    const authRequests = networkRequests.filter(req =>
      req.url.includes('/auth') || req.url.includes('token')
    );

    // Get console errors
    const consoleErrors = consoleMessages.filter(msg => msg.type === 'error');

    // Report detailed results
    console.log('\n=== TEST RESULTS ===');
    console.log(`Final URL: ${page.url()}`);
    console.log(`Page Title: ${await page.title()}`);

    console.log('\nPage State:');
    console.log(`  - Redirected to Keycloak: ${hasKeycloakRedirect}`);
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
      console.log('  - No API requests to /courses endpoints');
    }

    console.log('\nAuth-related requests:');
    if (authRequests.length > 0) {
      authRequests.slice(0, 5).forEach(req => {
        console.log(`  - ${req.method} ${req.url} → ${req.status}`);
      });
    } else {
      console.log('  - No auth requests detected');
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
    console.log(pageText?.substring(0, 400));

    console.log('\n=== ANALYSIS ===');

    if (hasKeycloakRedirect) {
      console.log('✓ Application properly redirects to Keycloak for authentication');
    } else if (hasLoginRequired) {
      console.log('✓ Application shows login required screen (Keycloak may be integrated)');
    } else if (hasNoCourses) {
      console.log('✓ Page loaded successfully, showing "No courses" empty state');
    } else if (hasCoursesList) {
      console.log('✓ Page loaded successfully with courses displayed');
    } else if (hasError) {
      console.log('✗ ISSUE: Page shows error state');
    } else if (hasLoading) {
      console.log('⚠ WARNING: Page stuck in loading state');
    } else {
      console.log('? UNCLEAR: Page state is ambiguous');
    }

    // Basic assertion
    expect(page.url()).toBeDefined();
  });
});
