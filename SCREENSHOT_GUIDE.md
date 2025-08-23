# Screenshot Testing Guide

This guide explains how to use screenshots in your E2E tests for the Lumina learning platform.

## Overview

Screenshots are automatically captured during test execution to:
- Document UI states for debugging
- Detect visual regressions
- Provide evidence of successful test outcomes
- Help with test maintenance and troubleshooting

## Configuration

Screenshots are configured in `playwright.config.ts`:

```typescript
use: {
  screenshot: 'only-on-failure',  // Take screenshots only when tests fail
  // OR
  screenshot: 'on',              // Take screenshots for all tests
}
```

Visual regression testing is configured with:

```typescript
expect: {
  toHaveScreenshot: {
    threshold: 0.2,        // Allow 20% pixel difference
    maxDiffPixels: 1000,   // Maximum different pixels
    mode: 'strict',        // Strict comparison
    animations: 'disabled' // Disable animations
  }
}
```

## Using Screenshot Helpers

### Basic Usage

```typescript
import { VisualHelpers } from './utils/visual-helpers';
import { ScreenshotHelpers } from './utils/screenshot-helpers';

test.describe('My Feature', () => {
  let visualHelpers: VisualHelpers;
  let screenshotHelpers: ScreenshotHelpers;
  
  test.beforeEach(async ({ page }) => {
    visualHelpers = new VisualHelpers(page);
    screenshotHelpers = new ScreenshotHelpers(page);
  });
  
  test('should display correctly', async ({ page }) => {
    // Take a full page screenshot
    await screenshotHelpers.takePageScreenshot('initial-state');
    
    // Take element screenshot
    const button = page.getByRole('button', { name: 'Submit' });
    await screenshotHelpers.takeElementScreenshot(button, 'submit-button');
  });
});
```

### Interaction Screenshots

Capture before and after states of user interactions:

```typescript
test('should update when clicked', async ({ page }) => {
  const feedbackButton = page.getByRole('button', { name: 'Like' });
  
  await screenshotHelpers.captureInteraction(
    'feedback-interaction',
    async () => {
      await feedbackButton.click();
    },
    { element: feedbackButton }
  );
});
```

### Component State Screenshots

Capture different states of interactive components:

```typescript
test('should show all button states', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Submit' });
  
  await screenshotHelpers.captureComponentStates(
    button,
    'submit-button',
    ['default', 'hover', 'focus', 'active']
  );
});
```

### Loading State Screenshots

Capture loading sequences:

```typescript
test('should show loading state', async ({ page }) => {
  await screenshotHelpers.captureLoadingSequence(
    'form-submission',
    async () => {
      await page.getByRole('button', { name: 'Submit' }).click();
    },
    {
      loadingSelector: '[data-testid="loading"]',
      maxWait: 5000
    }
  );
});
```

### Responsive Screenshots

Test across different viewport sizes:

```typescript
test('should be responsive', async ({ page }) => {
  await page.goto('/dashboard');
  
  await screenshotHelpers.captureResponsiveStates('dashboard', [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 },
  ]);
});
```

## Best Practices

### Naming Conventions

Use descriptive, hierarchical names:
- `component-name-state.png` (e.g., `feedback-button-active.png`)
- `page-name-scenario.png` (e.g., `login-page-error-state.png`)
- `feature-action-result.png` (e.g., `course-enrollment-success.png`)

### Screenshot Preparation

Always prepare screenshots for consistency:

```typescript
// Automatic preparation (recommended)
await screenshotHelpers.takePageScreenshot('my-page', { prepare: true });

// Manual preparation
await visualHelpers.prepareForScreenshot();
await expect(page).toHaveScreenshot('my-page.png');
```

### Masking Dynamic Content

Mask elements that change between runs:

```typescript
const dynamicElements = [
  page.locator('[data-testid="timestamp"]'),
  page.locator('.user-avatar')
];

await screenshotHelpers.takePageScreenshot('dashboard', {
  mask: dynamicElements
});
```

### Error State Capture

Automatically capture error states:

```typescript
test('should handle errors gracefully', async ({ page }) => {
  try {
    // Test logic that might fail
    await somethingThatMightFail();
  } catch (error) {
    await screenshotHelpers.captureErrorState('test-name', error, {
      includeConsole: true,
      includeNetwork: true
    });
    throw error;
  }
});
```

## Visual Regression Testing

### Baseline Screenshots

Generate baseline screenshots:

```bash
pnpm test:screenshots-update
```

### Comparing Screenshots

Screenshots are automatically compared against baselines during test runs. Differences are highlighted in the test report.

### Updating Screenshots

When UI changes are intentional:

```bash
# Update all visual test screenshots
pnpm test:visual-update

# Update specific test screenshots
pnpm test:screenshots-update
```

## Test Organization

### Directory Structure

```
apps/e2e/
├── screenshots/                 # Generated screenshots
├── test-results/               # Test artifacts
│   └── screenshots/           # Runtime screenshots
├── playwright/
│   ├── utils/
│   │   ├── visual-helpers.ts  # Visual preparation utilities
│   │   └── screenshot-helpers.ts # Screenshot capture utilities
│   └── *.spec.ts             # Test files with screenshots
```

### Test Categories

Use tags to organize visual tests:

```typescript
test('should display correctly @visual', async ({ page }) => {
  // Visual regression test
});

test('should work on mobile @visual @mobile', async ({ page }) => {
  // Mobile-specific visual test
});
```

Run specific categories:

```bash
pnpm test:visual              # Run all visual tests
pnpm test:visual-component   # Run component visual tests
```

## Debugging with Screenshots

### Viewing Screenshots

- Screenshots are saved in `test-results/` after test runs
- HTML reports include screenshot comparisons
- Use `pnpm test:report` to view the interactive report

### Screenshot Failures

When screenshots don't match:
1. Review the diff in the HTML report
2. Determine if change is intentional
3. Update baseline if needed: `pnpm test:screenshots-update`
4. Investigate if change is a regression

### Performance Considerations

- Screenshots add time to test execution
- Use `screenshot: 'only-on-failure'` for faster feedback loops
- Limit full-page screenshots for large pages
- Consider element-specific screenshots for faster execution

## Common Patterns

### Authentication State Screenshots

```typescript
test.describe('Authenticated Features', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    // Take authenticated state screenshot
    await screenshotHelpers.takePageScreenshot('authenticated-dashboard');
  });
});
```

### Form Validation Screenshots

```typescript
test('should show validation errors', async ({ page }) => {
  const form = page.getByTestId('contact-form');
  
  // Empty form
  await screenshotHelpers.takeElementScreenshot(form, 'form-empty');
  
  // Submit without data
  await screenshotHelpers.captureInteraction(
    'form-validation',
    async () => {
      await page.getByRole('button', { name: 'Submit' }).click();
    },
    { element: form }
  );
});
```

### Multi-step Process Screenshots

```typescript
test('should complete onboarding flow', async ({ page }) => {
  const steps = ['university-selection', 'degree-selection', 'preferences', 'summary'];
  
  for (const step of steps) {
    await screenshotHelpers.takePageScreenshot(`onboarding-${step}`);
    // Navigate to next step
  }
});
```

This guide should help you implement comprehensive screenshot testing that improves debugging capabilities and catches visual regressions early in your development process.