import { Page, Locator } from '@playwright/test';

export class VisualHelpers {
  constructor(private page: Page) {}

  /**
   * Prepare page for consistent screenshot capture
   */
  async prepareForScreenshot(options: {
    hideScrollbars?: boolean;
    disableAnimations?: boolean;
    maskDynamicContent?: boolean;
    waitForFonts?: boolean;
  } = {}) {
    const {
      hideScrollbars = true,
      disableAnimations = true,
      maskDynamicContent = true,
      waitForFonts = true,
    } = options;

    // Wait for page to be fully loaded
    await this.page.waitForLoadState('networkidle');

    // Wait for fonts to load
    if (waitForFonts) {
      await this.page.waitForFunction(() => document.fonts.ready);
    }

    // Disable animations for consistent screenshots
    if (disableAnimations) {
      await this.page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            scroll-behavior: auto !important;
          }
        `,
      });
    }

    // Hide scrollbars
    if (hideScrollbars) {
      await this.page.addStyleTag({
        content: `
          ::-webkit-scrollbar {
            display: none !important;
          }
          html {
            scrollbar-width: none !important;
          }
        `,
      });
    }

    // Mask dynamic content like timestamps, user-specific data
    if (maskDynamicContent) {
      await this.maskDynamicElements();
    }

    // Wait for any remaining layout shifts
    await this.page.waitForTimeout(300);
  }

  /**
   * Mask dynamic elements that change between test runs
   */
  async maskDynamicElements() {
    const dynamicSelectors = [
      '[data-testid*="timestamp"]',
      '[data-testid*="date"]',
      '[data-testid*="time"]',
      '.timestamp',
      '.date-time',
      '[aria-label*="current time"]',
      '[aria-label*="last updated"]',
    ];

    for (const selector of dynamicSelectors) {
      const elements = await this.page.locator(selector).all();
      for (const element of elements) {
        if (await element.isVisible()) {
          await element.evaluate(el => {
            el.style.backgroundColor = '#f0f0f0';
            el.style.color = 'transparent';
            el.textContent = 'MASKED_DYNAMIC_CONTENT';
          });
        }
      }
    }
  }

  /**
   * Take a screenshot with masking of specific elements
   */
  async screenshotWithMask(
    screenshotName: string,
    options: {
      mask?: Locator[];
      fullPage?: boolean;
      clip?: { x: number; y: number; width: number; height: number };
    } = {}
  ) {
    await this.prepareForScreenshot();

    return this.page.screenshot({
      path: `test-results/screenshots/${screenshotName}`,
      fullPage: options.fullPage ?? false,
      mask: options.mask ?? [],
      clip: options.clip,
    });
  }

  /**
   * Compare element screenshots across different states
   */
  async compareElementStates(
    element: Locator,
    states: Array<{
      name: string;
      setup: () => Promise<void>;
    }>,
    baseScreenshotName: string
  ) {
    const results: { name: string; screenshot: Buffer }[] = [];

    for (const state of states) {
      await state.setup();
      await this.prepareForScreenshot();
      
      const screenshot = await element.screenshot();
      results.push({
        name: state.name,
        screenshot,
      });
    }

    return results;
  }

  /**
   * Capture screenshots at different scroll positions
   */
  async captureScrollableContent(
    screenshotBaseName: string,
    options: {
      scrollStep?: number;
      maxScrolls?: number;
    } = {}
  ) {
    const { scrollStep = 500, maxScrolls = 5 } = options;
    const screenshots: Buffer[] = [];

    await this.prepareForScreenshot();

    // Initial screenshot
    screenshots.push(await this.page.screenshot());

    // Scroll and capture
    for (let i = 0; i < maxScrolls; i++) {
      await this.page.mouse.wheel(0, scrollStep);
      await this.page.waitForTimeout(200);
      
      const currentScroll = await this.page.evaluate(() => window.scrollY);
      const maxScroll = await this.page.evaluate(() => 
        document.documentElement.scrollHeight - window.innerHeight
      );

      screenshots.push(await this.page.screenshot());

      // Stop if we've reached the bottom
      if (currentScroll >= maxScroll - 50) {
        break;
      }
    }

    return screenshots;
  }

  /**
   * Test responsive design by capturing screenshots at different viewport sizes
   */
  async captureResponsiveBreakpoints(
    screenshotBaseName: string,
    breakpoints = [
      { name: 'mobile-sm', width: 320, height: 568 },
      { name: 'mobile-md', width: 375, height: 667 },
      { name: 'mobile-lg', width: 414, height: 896 },
      { name: 'tablet-sm', width: 768, height: 1024 },
      { name: 'tablet-lg', width: 1024, height: 768 },
      { name: 'desktop-sm', width: 1280, height: 720 },
      { name: 'desktop-md', width: 1440, height: 900 },
      { name: 'desktop-lg', width: 1920, height: 1080 },
    ]
  ) {
    const screenshots: { name: string; screenshot: Buffer }[] = [];

    for (const breakpoint of breakpoints) {
      await this.page.setViewportSize({
        width: breakpoint.width,
        height: breakpoint.height,
      });

      await this.prepareForScreenshot();
      
      const screenshot = await this.page.screenshot();
      screenshots.push({
        name: `${screenshotBaseName}-${breakpoint.name}`,
        screenshot,
      });
    }

    return screenshots;
  }

  /**
   * Capture element in different pseudo-states (hover, focus, active)
   */
  async captureInteractionStates(
    element: Locator,
    screenshotBaseName: string,
    states: ('hover' | 'focus' | 'active' | 'disabled')[] = ['hover', 'focus']
  ) {
    const screenshots: { state: string; screenshot: Buffer }[] = [];

    await this.prepareForScreenshot();

    // Default state
    screenshots.push({
      state: 'default',
      screenshot: await element.screenshot(),
    });

    for (const state of states) {
      switch (state) {
        case 'hover':
          await element.hover();
          await this.page.waitForTimeout(200);
          break;
        case 'focus':
          await element.focus();
          await this.page.waitForTimeout(200);
          break;
        case 'active':
          await element.hover();
          await this.page.mouse.down();
          await this.page.waitForTimeout(200);
          break;
        case 'disabled':
          await element.evaluate(el => {
            (el as HTMLElement).style.pointerEvents = 'none';
            (el as HTMLElement).style.opacity = '0.5';
          });
          await this.page.waitForTimeout(200);
          break;
      }

      screenshots.push({
        state,
        screenshot: await element.screenshot(),
      });

      // Reset state
      if (state === 'active') {
        await this.page.mouse.up();
      }
    }

    return screenshots;
  }

  /**
   * Wait for stable visual state (no layout shifts)
   */
  async waitForVisualStability(options: {
    timeout?: number;
    pollInterval?: number;
  } = {}) {
    const { timeout = 5000, pollInterval = 100 } = options;
    const startTime = Date.now();

    let lastScreenshot: Buffer | null = null;
    let stableCount = 0;
    const requiredStableCount = 3;

    while (Date.now() - startTime < timeout) {
      const currentScreenshot = await this.page.screenshot();
      
      if (lastScreenshot && Buffer.compare(currentScreenshot, lastScreenshot) === 0) {
        stableCount++;
        if (stableCount >= requiredStableCount) {
          return true;
        }
      } else {
        stableCount = 0;
      }

      lastScreenshot = currentScreenshot;
      await this.page.waitForTimeout(pollInterval);
    }

    return false;
  }
}