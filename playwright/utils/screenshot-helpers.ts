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
}