# Enhanced Screenshot Testing Guide

## Overview

The Enhanced Screenshot Testing Suite provides comprehensive visual regression testing capabilities for the Lumina application. This guide covers all the screenshot testing features, best practices, and usage instructions.

## Features

### 1. Comprehensive Screenshot Types

#### Full Page Screenshots with Annotations
- Complete page captures with metadata
- Annotated with test type, viewport, and description
- Support for masking sensitive elements

#### Component-Focused Screenshots
- Individual component isolation
- Detailed component descriptions
- Automatic component metadata collection

#### Interactive State Screenshots
- Default, hover, focus, and active states
- Button and link interaction capturing
- Form field state variations

#### Responsive Screenshots
- Cross-breakpoint testing (320px to 2560px)
- Mobile, tablet, and desktop viewports
- Portrait and landscape orientations

### 2. Advanced Screenshot Capabilities

#### Element Highlighting
```typescript
await screenshotHelpers.takeScreenshotWithHighlight(
  element,
  'hero-highlighted',
  { borderColor: 'red', borderWidth: 3 }
);
```

#### Form Field States
```typescript
await screenshotHelpers.captureFormFieldStates(element, 'email-input');
// Captures: empty, focused, filled states
```

#### Animation Frames
```typescript
await screenshotHelpers.takeAnimationFrames(element, 'loading-spinner', 3);
// Captures multiple frames of animations
```

#### Theme Variations
- Light, dark, and system themes
- Automatic theme switching
- Theme-specific component rendering

## Usage Instructions

### Running Screenshot Tests

#### Basic Screenshot Tests
```bash
# Run existing screenshot tests
pnpm test:screenshots

# Run enhanced screenshot suite
pnpm test:screenshots-enhanced

# Run comprehensive screenshot tests
pnpm test:screenshots-comprehensive
```

#### Updating Screenshots
```bash
# Update existing screenshots
pnpm test:screenshots-update

# Update enhanced screenshots
pnpm test:screenshots-enhanced-update

# Update all screenshot baselines
pnpm test:screenshots-comprehensive-update
```

#### Cross-Browser Screenshot Testing
```bash
# Run across all browsers
pnpm test:cross-browser-screenshots

# Run on specific browser
pnpm test:screenshots-enhanced --project=chromium-screenshots
```

### Configuration

#### Screenshot-Optimized Config
- Uses `playwright.config.screenshots.ts`
- Single worker to avoid conflicts
- Disabled animations for consistency
- Extended timeouts for stability
- Cross-browser projects included

#### Visual Comparison Settings
```typescript
expect: {
  toHaveScreenshot: {
    threshold: 0.15,          // 15% pixel difference allowed
    maxDiffPixels: 2000,      // Max different pixels
    mode: 'strict',           // Strict comparison
    animations: 'disabled',   // Consistent rendering
  },
}
```

## Test Types and Tags

### Available Tags
- `@screenshot` - All enhanced screenshot tests
- `@visual` - Basic visual regression tests
- `@visual-component` - Component-specific visuals
- `@cross-browser` - Cross-browser compatibility

### Test Categories

#### 1. Full Page Screenshots (`@screenshot`)
- Complete page layouts
- Responsive breakpoints
- Theme variations
- Error states

#### 2. Component Screenshots (`@screenshot`)
- Navigation components
- Form elements
- Interactive buttons
- Content sections

#### 3. Interactive State Screenshots (`@screenshot`)
- Hover states
- Focus states
- Active states
- Loading states

#### 4. Accessibility Screenshots (`@screenshot`)
- Focus indicators
- High contrast mode
- Screen reader compatibility
- Keyboard navigation

## Best Practices

### 1. Screenshot Stability
- Always use `prepareForScreenshot()` before capturing
- Disable animations and transitions
- Wait for fonts and images to load
- Use consistent viewports

### 2. Test Organization
- Group related screenshots by component/page
- Use descriptive naming conventions
- Include metadata for context
- Separate cross-browser tests

### 3. Maintenance
- Regular baseline updates
- Review failed screenshots carefully
- Use masking for dynamic content
- Document expected visual changes

### 4. Performance Optimization
- Single worker for screenshot tests
- Minimal retries
- Disable unnecessary features (video, trace)
- Use specific browser configurations

## File Structure

```
apps/e2e/
├── playwright/
│   ├── enhanced-screenshot-testing.spec.ts    # Main screenshot tests
│   ├── component-screenshots.spec.ts          # Component-focused tests
│   ├── visual-regression.spec.ts              # Basic visual tests
│   └── utils/
│       ├── screenshot-helpers.ts              # Screenshot utilities
│       └── visual-helpers.ts                  # Visual test helpers
├── playwright.config.screenshots.ts           # Screenshot-optimized config
└── ENHANCED_SCREENSHOT_GUIDE.md              # This guide
```

## Screenshot Helpers API

### Core Methods

#### `takeAnnotatedScreenshot(name, metadata, options)`
Take a screenshot with descriptive metadata.

#### `takeScreenshotWithHighlight(element, name, highlightOptions)`
Highlight an element and capture the page.

#### `captureInteractionStates(element, baseName, states)`
Capture multiple interaction states of an element.

#### `takeResponsiveScreenshot(name, viewport)`
Take a screenshot at a specific viewport size.

#### `captureFormFieldStates(element, baseName)`
Capture form field in different states (empty, focused, filled).

#### `takeAnimationFrames(element, baseName, frameCount)`
Capture multiple frames of animated elements.

### Utility Methods

#### `getCurrentViewport()`
Get current viewport size as string.

#### `prepareForScreenshot()`
Prepare page for consistent screenshot capture.

#### `generateReport()`
Generate metadata report of captured screenshots.

## Troubleshooting

### Common Issues

#### 1. Screenshot Mismatches
- Check for dynamic content (dates, times, random IDs)
- Verify font loading completion
- Ensure consistent animation states
- Review browser-specific rendering differences

#### 2. Timeout Issues
- Increase test timeout for slow-loading pages
- Check network conditions
- Verify element visibility before capture
- Use appropriate wait strategies

#### 3. Cross-Browser Differences
- Review browser-specific CSS
- Check font rendering variations
- Verify JavaScript execution timing
- Consider browser-specific configurations

### Debugging Commands

```bash
# Run with debug mode
pnpm test:screenshots-enhanced --debug

# Run with headed browser
pnpm test:screenshots-enhanced --headed

# Generate HTML report
npx playwright show-report
```

## Integration with CI/CD

### Environment Variables
```bash
E2E_BASE_URL=http://localhost:5173  # Test target URL
CI=true                             # Enable CI mode
```

### Recommended CI Flow
1. Build application
2. Start application server
3. Run screenshot tests
4. Compare with baselines
5. Generate visual diff reports
6. Archive screenshot artifacts

## Examples

### Basic Usage
```typescript
test('Component screenshots @screenshot', async ({ page }) => {
  const screenshotHelpers = new ScreenshotHelpers(page);
  await page.goto('/');
  
  // Take annotated full page screenshot
  await screenshotHelpers.takeAnnotatedScreenshot('homepage', {
    description: 'Main homepage layout',
    testType: 'full-page',
    viewport: '1280x720'
  });
  
  // Capture button interactions
  const button = page.getByRole('button', { name: 'Get Started' });
  await screenshotHelpers.captureInteractionStates(
    button,
    'get-started-button',
    ['default', 'hover', 'focus']
  );
});
```

### Advanced Usage
```typescript
test('Responsive component @screenshot', async ({ page }) => {
  const screenshotHelpers = new ScreenshotHelpers(page);
  await page.goto('/');
  
  // Test across multiple breakpoints
  const breakpoints = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 }
  ];
  
  for (const breakpoint of breakpoints) {
    await screenshotHelpers.takeResponsiveScreenshot(
      `homepage-${breakpoint.name}`,
      { width: breakpoint.width, height: breakpoint.height }
    );
  }
});
```

This enhanced screenshot testing suite provides comprehensive visual regression testing capabilities to ensure consistent UI rendering across browsers, devices, and user interactions.