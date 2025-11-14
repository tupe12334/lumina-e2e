import { Page, Locator, expect } from '@playwright/test';
import { VisualHelpers } from './visual-helpers';

export class ScreenshotHelpers {
  private visualHelpers: VisualHelpers;

  constructor(private page: Page) {
    this.visualHelpers = new VisualHelpers(page);
  }

  /**
   * Take a full page screenshot with standardized naming
   */
  async takePageScreenshot(
    name: string,
    options: {
      fullPage?: boolean;
      mask?: Locator[];
      prepare?: boolean;
    } = {}
  ) {
    const { fullPage = false, mask = [], prepare = true } = options;

    if (prepare) {
      await this.visualHelpers.prepareForScreenshot();
    }

    return expect(this.page).toHaveScreenshot(`${name}.png`, {
      fullPage,
      mask,
    });
  }

  /**
   * Take an element screenshot with standardized naming
   */
  async takeElementScreenshot(
    element: Locator,
    name: string,
    options: {
      mask?: Locator[];
      prepare?: boolean;
    } = {}
  ) {
    const { mask = [], prepare = true } = options;

    if (prepare) {
      await this.visualHelpers.prepareForScreenshot();
    }

    return expect(element).toHaveScreenshot(`${name}.png`, {
      mask,
    });
  }

  /**
   * Take before and after screenshots for interactions
   */
  async captureInteraction(
    baseName: string,
    interaction: () => Promise<void>,
    options: {
      element?: Locator;
      waitAfter?: number;
      fullPage?: boolean;
    } = {}
  ) {
    const { element, waitAfter = 500, fullPage = false } = options;

    // Before screenshot
    await this.visualHelpers.prepareForScreenshot();
    if (element) {
      await expect(element).toHaveScreenshot(`${baseName}-before.png`);
    } else {
      await expect(this.page).toHaveScreenshot(`${baseName}-before.png`, { fullPage });
    }

    // Perform interaction
    await interaction();

    // Wait for changes to settle
    await this.page.waitForTimeout(waitAfter);

    // After screenshot
    await this.visualHelpers.prepareForScreenshot();
    if (element) {
      await expect(element).toHaveScreenshot(`${baseName}-after.png`);
    } else {
      await expect(this.page).toHaveScreenshot(`${baseName}-after.png`, { fullPage });
    }
  }

  /**
   * Capture error states for debugging
   */
  async captureErrorState(
    testName: string,
    error: Error,
    options: {
      includeConsole?: boolean;
      includeNetwork?: boolean;
    } = {}
  ) {
    const { includeConsole = true, includeNetwork = false } = options;

    try {
      // Screenshot of current state
      await expect(this.page).toHaveScreenshot(`error-${testName}-${Date.now()}.png`);

      if (includeConsole) {
        // Get console logs
        const logs = await this.page.evaluate(() => {
          return (window as any).__logs || [];
        });
        console.log(`Console logs for ${testName}:`, logs);
      }

      if (includeNetwork) {
        // Log network requests if available
        console.log(`Error in ${testName}:`, error.message);
      }
    } catch (screenshotError) {
      console.warn('Failed to capture error state screenshot:', screenshotError);
    }
  }

  /**
   * Take responsive screenshots across different viewport sizes
   */
  async captureResponsiveStates(
    baseName: string,
    viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
    ]
  ) {
    const originalViewport = this.page.viewportSize();

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.visualHelpers.prepareForScreenshot();
      await expect(this.page).toHaveScreenshot(`${baseName}-${viewport.name}.png`);
    }

    // Restore original viewport
    if (originalViewport) {
      await this.page.setViewportSize(originalViewport);
    }
  }

  /**
   * Capture component states (hover, focus, active)
   */
  async captureComponentStates(
    element: Locator,
    baseName: string,
    states: ('default' | 'hover' | 'focus' | 'active')[] = ['default', 'hover', 'focus']
  ) {
    await this.visualHelpers.prepareForScreenshot();

    for (const state of states) {
      switch (state) {
        case 'default':
          await expect(element).toHaveScreenshot(`${baseName}-default.png`);
          break;
        case 'hover':
          await element.hover();
          await this.page.waitForTimeout(200);
          await expect(element).toHaveScreenshot(`${baseName}-hover.png`);
          break;
        case 'focus':
          await element.focus();
          await this.page.waitForTimeout(200);
          await expect(element).toHaveScreenshot(`${baseName}-focus.png`);
          break;
        case 'active':
          await element.hover();
          await this.page.mouse.down();
          await this.page.waitForTimeout(200);
          await expect(element).toHaveScreenshot(`${baseName}-active.png`);
          await this.page.mouse.up();
          break;
      }
    }
  }

  /**
   * Take screenshots during loading states
   */
  async captureLoadingSequence(
    baseName: string,
    triggerAction: () => Promise<void>,
    options: {
      loadingSelector?: string;
      maxWait?: number;
      element?: Locator;
    } = {}
  ) {
    const { loadingSelector = '.animate-spin, [data-testid="loading"], .loading', maxWait = 5000, element } = options;

    // Before action
    await this.visualHelpers.prepareForScreenshot();
    const target = element || this.page;
    await expect(target).toHaveScreenshot(`${baseName}-initial.png`);

    // Trigger action and immediately try to capture loading
    await triggerAction();

    // Try to capture loading state
    try {
      await this.page.waitForSelector(loadingSelector, { timeout: 1000 });
      await expect(target).toHaveScreenshot(`${baseName}-loading.png`);
    } catch {
      // Loading state might be too fast to capture
    }

    // Wait for loading to complete
    await this.page.waitForLoadState('networkidle', { timeout: maxWait });

    // Final state
    await this.visualHelpers.prepareForScreenshot();
    await expect(target).toHaveScreenshot(`${baseName}-completed.png`);
  }

  /**
   * Compare element before and after data changes
   */
  async captureDataChange(
    element: Locator,
    baseName: string,
    dataChangeAction: () => Promise<void>,
    waitTime = 1000
  ) {
    // Capture initial state
    await this.visualHelpers.prepareForScreenshot();
    await expect(element).toHaveScreenshot(`${baseName}-before-change.png`);

    // Perform data change
    await dataChangeAction();

    // Wait for changes to reflect
    await this.page.waitForTimeout(waitTime);

    // Capture final state
    await this.visualHelpers.prepareForScreenshot();
    await expect(element).toHaveScreenshot(`${baseName}-after-change.png`);
  }

  /**
   * Take screenshot with metadata annotations
   */
  async takeAnnotatedScreenshot(
    name: string,
    metadata: {
      description: string;
      testType: string;
      viewport: string;
      browser?: string;
    },
    options: {
      fullPage?: boolean;
      mask?: Locator[];
    } = {}
  ) {
    const { fullPage = false, mask = [] } = options;

    // Store metadata for reporting
    const timestamp = new Date().toISOString();
    const annotationData = {
      ...metadata,
      timestamp,
      filename: `${name}.png`
    };

    // Store in page context for potential report generation
    await this.page.evaluate((data) => {
      (window as any).__screenshotMetadata = (window as any).__screenshotMetadata || [];
      (window as any).__screenshotMetadata.push(data);
    }, annotationData);

    await this.visualHelpers.prepareForScreenshot();
    return expect(this.page).toHaveScreenshot(`${name}.png`, {
      fullPage,
      mask
    });
  }

  /**
   * Take screenshot with element highlighted
   */
  async takeScreenshotWithHighlight(
    element: Locator,
    name: string,
    highlightOptions: {
      borderColor?: string;
      borderWidth?: number;
      backgroundColor?: string;
    } = {}
  ) {
    const { borderColor = 'red', borderWidth = 2, backgroundColor } = highlightOptions;

    // Add highlight styling
    await element.evaluate((el, options) => {
      el.style.outline = `${options.borderWidth}px solid ${options.borderColor}`;
      if (options.backgroundColor) {
        el.style.backgroundColor = options.backgroundColor;
      }
      el.style.outlineOffset = '2px';
    }, { borderColor, borderWidth, backgroundColor });

    await this.visualHelpers.prepareForScreenshot();
    const result = await expect(this.page).toHaveScreenshot(`${name}.png`);

    // Remove highlight styling
    await element.evaluate((el) => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.backgroundColor = '';
    });

    return result;
  }

  /**
   * Take component screenshot with description
   */
  async takeComponentScreenshot(
    element: Locator,
    name: string,
    description: string
  ) {
    await this.page.evaluate((desc) => {
      (window as any).__componentMetadata = (window as any).__componentMetadata || [];
      (window as any).__componentMetadata.push({
        name: desc.split(' ')[0],
        description: desc,
        timestamp: new Date().toISOString()
      });
    }, description);

    await this.visualHelpers.prepareForScreenshot();
    return expect(element).toHaveScreenshot(`component-${name}.png`);
  }

  /**
   * Capture interaction states (default, hover, focus, active)
   */
  async captureInteractionStates(
    element: Locator,
    baseName: string,
    states: string[]
  ) {
    const results = [];

    for (const state of states) {
      switch (state) {
        case 'default':
          await this.visualHelpers.prepareForScreenshot();
          results.push(await expect(element).toHaveScreenshot(`${baseName}-default.png`));
          break;
        case 'hover':
          await element.hover();
          await this.page.waitForTimeout(300);
          results.push(await expect(element).toHaveScreenshot(`${baseName}-hover.png`));
          break;
        case 'focus':
          await element.focus();
          await this.page.waitForTimeout(300);
          results.push(await expect(element).toHaveScreenshot(`${baseName}-focus.png`));
          break;
        case 'active':
          await element.hover();
          await this.page.mouse.down();
          await this.page.waitForTimeout(200);
          results.push(await expect(element).toHaveScreenshot(`${baseName}-active.png`));
          await this.page.mouse.up();
          break;
      }
    }

    return results;
  }

  /**
   * Take responsive screenshots at different viewports
   */
  async takeResponsiveScreenshot(
    name: string,
    viewport: { width: number; height: number }
  ) {
    const originalViewport = this.page.viewportSize();

    await this.page.setViewportSize(viewport);
    await this.visualHelpers.prepareForScreenshot();
    const result = await expect(this.page).toHaveScreenshot(`responsive-${name}.png`);

    // Restore original viewport
    if (originalViewport) {
      await this.page.setViewportSize(originalViewport);
    }

    return result;
  }

  /**
   * Capture form field states (empty, focused, filled, error)
   */
  async captureFormFieldStates(
    element: Locator,
    baseName: string
  ) {
    const results = [];

    // Empty state
    await element.clear();
    await this.visualHelpers.prepareForScreenshot();
    results.push(await expect(element).toHaveScreenshot(`${baseName}-empty.png`));

    // Focused state
    await element.focus();
    await this.page.waitForTimeout(300);
    results.push(await expect(element).toHaveScreenshot(`${baseName}-focused.png`));

    // Filled state
    await element.fill('test@example.com');
    await this.page.waitForTimeout(300);
    results.push(await expect(element).toHaveScreenshot(`${baseName}-filled.png`));

    return results;
  }

  /**
   * Get current viewport as string
   */
  async getCurrentViewport(): Promise<string> {
    const viewport = this.page.viewportSize();
    return viewport ? `${viewport.width}x${viewport.height}` : '1280x720';
  }

  /**
   * Take viewport-only screenshot (above the fold)
   */
  async takeViewportScreenshot(name: string) {
    await this.visualHelpers.prepareForScreenshot();
    return expect(this.page).toHaveScreenshot(`viewport-${name}.png`, { fullPage: false });
  }

  /**
   * Capture animation frames at different points
   */
  async takeAnimationFrames(
    element: Locator,
    baseName: string,
    frameCount = 3
  ) {
    const results = [];

    for (let i = 0; i < frameCount; i++) {
      await this.page.waitForTimeout(300 * i); // Capture at different timing
      await this.visualHelpers.prepareForScreenshot();
      results.push(await expect(element).toHaveScreenshot(`${baseName}-frame-${i}.png`));
    }

    return results;
  }

  /**
   * Generate screenshot report
   */
  async generateReport() {
    const metadata = await this.page.evaluate(() => {
      return {
        screenshots: (window as any).__screenshotMetadata || [],
        components: (window as any).__componentMetadata || []
      };
    });

    if (metadata.screenshots.length > 0 || metadata.components.length > 0) {
      console.log('Screenshot Test Report:', JSON.stringify(metadata, null, 2));
    }
  }

  /**
   * Prepare page for screenshot with loading state detection
   */
  async prepareForScreenshot() {
    return this.visualHelpers.prepareForScreenshot();
  }
}