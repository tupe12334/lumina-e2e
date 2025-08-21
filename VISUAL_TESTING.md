# Visual Testing Guide

This guide covers the comprehensive visual regression testing setup for the Lumina E2E test suite.

## 🎯 Overview

Visual testing helps catch visual regressions, layout issues, and design inconsistencies across different browsers and devices. Our visual testing suite includes:

- **Full-page screenshots** for major pages and user journeys
- **Component-level screenshots** for individual UI elements
- **Responsive design testing** across multiple viewport sizes
- **Cross-browser visual consistency** testing
- **Interactive state testing** (hover, focus, active states)
- **Theme variation testing** (light/dark mode)

## 📁 Test Files

### Core Visual Test Files

- **`visual-regression.spec.ts`** - Main visual regression tests for pages and layouts
- **`component-screenshots.spec.ts`** - Component-level visual testing
- **`utils/visual-helpers.ts`** - Utility functions for visual testing

### Visual Test Categories

#### Page-Level Visual Tests (`@visual`)
```typescript
test('Home page visual appearance @visual', async ({ page }) => {
  await expect(page).toHaveScreenshot('home-page.png');
});
```

#### Component-Level Tests (`@visual-component`)
```typescript
test('Navigation components @visual-component', async ({ page }) => {
  const navBar = page.locator('nav').first();
  await expect(navBar).toHaveScreenshot('navigation-bar.png');
});
```

#### Cross-Browser Tests (`@cross-browser`)
```typescript
test('Home page consistency @visual @cross-browser', async ({ page }) => {
  // Tests across multiple viewport sizes and browsers
});
```

## 🚀 Running Visual Tests

### Basic Commands

```bash
# Run all visual tests
pnpm test:visual

# Run component-level visual tests only
pnpm test:visual-component

# Run visual regression tests
pnpm test:visual-regression

# Run component screenshot tests
pnpm test:screenshots

# Run cross-browser visual tests
pnpm test:cross-browser-visual
```

### Updating Screenshots

```bash
# Update all visual test screenshots (use with caution)
pnpm test:visual-update

# Update component screenshots only
pnpm test:screenshots-update

# Update all snapshots (including visual ones)
pnpm test:update-snapshots
```

### Browser-Specific Visual Tests

```bash
# Test visual consistency in Chrome only
pnpm test:visual -- --project=chromium

# Test visual consistency across all browsers
pnpm test:visual -- --project=chromium --project=firefox --project=webkit
```

## 🛠️ Visual Test Configuration

### Screenshot Settings

The visual tests are configured in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    threshold: 0.2,        // Allow 20% pixel difference
    maxDiffPixels: 1000,   // Maximum different pixels allowed
    mode: 'strict',        // Strict comparison mode
    animations: 'disabled' // Disable animations for consistency
  }
}
```

### Visual Helpers Utilities

The `VisualHelpers` class provides advanced visual testing capabilities:

```typescript
import { VisualHelpers } from './utils/visual-helpers';

test('Advanced visual test', async ({ page }) => {
  const visualHelpers = new VisualHelpers(page);
  
  // Prepare page for consistent screenshots
  await visualHelpers.prepareForScreenshot({
    hideScrollbars: true,
    disableAnimations: true,
    maskDynamicContent: true
  });
  
  // Capture responsive breakpoints
  const screenshots = await visualHelpers.captureResponsiveBreakpoints('home-page');
  
  // Capture element interaction states
  const button = page.getByRole('button', { name: 'Login' });
  const states = await visualHelpers.captureInteractionStates(button, 'login-button');
});
```

## 📊 Visual Test Features

### 1. Responsive Design Testing

Tests visual appearance across multiple viewport sizes:

- **Mobile**: 320px, 375px, 414px widths
- **Tablet**: 768px, 1024px widths  
- **Desktop**: 1280px, 1440px, 1920px widths

### 2. Component State Testing

Captures components in different interactive states:

- **Default state**
- **Hover state**
- **Focus state** 
- **Active/pressed state**
- **Disabled state**

### 3. Theme Variation Testing

Tests visual consistency across different themes:

- **Light theme**
- **Dark theme**
- **High contrast mode** (if available)

### 4. Cross-Language Visual Testing

Ensures layout consistency across different languages:

- **English (LTR)**
- **Hebrew (RTL)**
- **Long text handling**

### 5. Loading and Error State Testing

Captures visual states for:

- **Loading spinners and skeletons**
- **Empty states**
- **Error messages and 404 pages**
- **Network error states**

### 6. Dynamic Content Masking

Automatically masks dynamic elements that change between test runs:

- **Timestamps and dates**
- **User-specific data**
- **Dynamic counters**
- **Real-time data**

## 🎨 Best Practices

### 1. Screenshot Naming Convention

Use descriptive, consistent names:

```typescript
// Good
await expect(page).toHaveScreenshot('home-page-mobile-dark-mode.png');

// Bad  
await expect(page).toHaveScreenshot('test1.png');
```

### 2. Preparing Pages for Screenshots

Always prepare pages for consistent visual capture:

```typescript
// Wait for fonts and animations
await page.waitForLoadState('networkidle');
await page.waitForFunction(() => document.fonts.ready);
await visualHelpers.prepareForScreenshot();
```

### 3. Handling Dynamic Content

Mask or stabilize dynamic content before screenshots:

```typescript
// Mask timestamps
await visualHelpers.prepareForScreenshot({
  maskDynamicContent: true
});

// Or manually mask specific elements
await page.locator('[data-testid="timestamp"]').evaluate(el => {
  el.textContent = 'MASKED_TIMESTAMP';
});
```

### 4. Component-Level Testing

Test individual components rather than entire pages when possible:

```typescript
// Component-level (preferred for detailed testing)
const navigation = page.locator('nav').first();
await expect(navigation).toHaveScreenshot('navigation.png');

// Full page (good for integration testing)
await expect(page).toHaveScreenshot('full-page.png');
```

## 🔍 Debugging Visual Test Failures

### 1. Review Test Results

When visual tests fail, Playwright generates comparison images:

```bash
test-results/
├── actual.png      # What the test captured
├── expected.png    # What was expected
└── diff.png       # Visual difference highlighted
```

### 2. Use Playwright Trace Viewer

```bash
pnpm exec playwright show-trace test-results/trace.zip
```

### 3. Run Tests in Headed Mode

```bash
pnpm test:visual -- --headed --slow-mo=1000
```

### 4. Update Screenshots When Intentional

If visual changes are intentional, update the screenshots:

```bash
pnpm test:visual-update
```

## 📈 Visual Test Reports

Visual test results are included in the standard Playwright HTML report:

```bash
# Generate and view report
pnpm test:visual
pnpm test:report
```

The report includes:
- **Screenshot comparison results**
- **Diff images for failures**
- **Test execution times**
- **Browser/device coverage**

## 🚨 CI/CD Integration

### GitHub Actions

Visual tests run automatically in CI with:

- **Consistent browser versions**
- **Stable fonts and rendering**
- **Screenshot artifact storage**
- **Visual diff reporting**

### Handling CI Visual Differences

1. **Font differences**: Ensure consistent font loading
2. **Timing issues**: Add proper waits before screenshots  
3. **Browser differences**: Use browser-specific screenshot sets
4. **Environment differences**: Mask environment-specific content

## 🔧 Troubleshooting

### Common Issues

#### Screenshots Don't Match
- **Fonts not loaded**: Add `await page.waitForFunction(() => document.fonts.ready)`
- **Animations running**: Use `animations: 'disabled'` in config
- **Dynamic content**: Implement content masking
- **Timing issues**: Add appropriate waits

#### Tests Are Flaky
- **Inconsistent loading**: Use `waitForLoadState('networkidle')`
- **Layout shifts**: Implement visual stability waiting
- **Random content**: Seed random generators or mask content

#### Performance Issues
- **Too many screenshots**: Focus on critical user journeys
- **Large screenshot files**: Optimize viewport sizes
- **Slow test execution**: Run visual tests in parallel

## 📚 Examples

### Basic Page Screenshot
```typescript
test('Page visual test', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('page.png');
});
```

### Component with States
```typescript
test('Button states', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Submit' });
  
  // Default state
  await expect(button).toHaveScreenshot('button-default.png');
  
  // Hover state
  await button.hover();
  await expect(button).toHaveScreenshot('button-hover.png');
  
  // Focus state
  await button.focus();
  await expect(button).toHaveScreenshot('button-focus.png');
});
```

### Responsive Testing
```typescript
test('Responsive design', async ({ page }) => {
  const viewports = [
    { width: 375, height: 667 },   // Mobile
    { width: 768, height: 1024 },  // Tablet
    { width: 1280, height: 720 }   // Desktop
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`home-${viewport.width}w.png`);
  }
});
```

This comprehensive visual testing setup ensures that UI changes are caught early and visual consistency is maintained across the Lumina learning platform.