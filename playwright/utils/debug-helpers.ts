import type { Page, TestInfo, Locator } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Enhanced debugging utilities for E2E tests
 */
export class DebugHelpers {
  constructor(private readonly page: Page, private readonly testInfo: TestInfo) {}

  /**
   * Capture comprehensive debug information when a test fails
   */
  async captureDebugInfo(error: Error, context: string = ''): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const debugDir = path.join(this.testInfo.outputDir, `debug-${timestamp}`);
    
    await fs.mkdir(debugDir, { recursive: true });
    
    try {
      // 1. Capture screenshot
      await this.captureScreenshot(debugDir, 'error-screenshot.png');
      
      // 2. Capture page HTML
      await this.capturePageHTML(debugDir, 'page-source.html');
      
      // 3. Capture console logs
      await this.captureConsoleLogs(debugDir, 'console-logs.txt');
      
      // 4. Capture network logs
      await this.captureNetworkActivity(debugDir, 'network-activity.json');
      
      // 5. Capture local storage and session storage
      await this.captureStorageState(debugDir, 'storage-state.json');
      
      // 6. Capture DOM snapshot
      await this.captureDOMSnapshot(debugDir, 'dom-snapshot.txt');
      
      // 7. Create debug report
      await this.createDebugReport(debugDir, error, context);
      
      console.log(`Debug information captured in: ${debugDir}`);
    } catch (debugError) {
      console.warn('Failed to capture debug information:', debugError);
    }
  }

  /**
   * Capture high-quality screenshot with annotations
   */
  private async captureScreenshot(debugDir: string, filename: string): Promise<void> {
    try {
      await this.page.screenshot({
        path: path.join(debugDir, filename),
        fullPage: true,
        type: 'png',
      });
    } catch (error) {
      console.warn('Failed to capture screenshot:', error);
    }
  }

  /**
   * Save current page HTML source
   */
  private async capturePageHTML(debugDir: string, filename: string): Promise<void> {
    try {
      const html = await this.page.content();
      await fs.writeFile(path.join(debugDir, filename), html, 'utf8');
    } catch (error) {
      console.warn('Failed to capture page HTML:', error);
    }
  }

  /**
   * Capture console logs from the browser
   */
  private async captureConsoleLogs(debugDir: string, filename: string): Promise<void> {
    try {
      // Note: This requires setting up console log collection in global setup
      const logs = await this.page.evaluate(() => {
        return (window as any).__consoleLogs__ || [];
      });
      
      await fs.writeFile(
        path.join(debugDir, filename),
        JSON.stringify(logs, null, 2),
        'utf8'
      );
    } catch (error) {
      console.warn('Failed to capture console logs:', error);
    }
  }

  /**
   * Capture network activity
   */
  private async captureNetworkActivity(debugDir: string, filename: string): Promise<void> {
    try {
      const networkActivity = await this.page.evaluate(() => {
        return (window as any).__networkActivity__ || [];
      });
      
      await fs.writeFile(
        path.join(debugDir, filename),
        JSON.stringify(networkActivity, null, 2),
        'utf8'
      );
    } catch (error) {
      console.warn('Failed to capture network activity:', error);
    }
  }

  /**
   * Capture browser storage state
   */
  private async captureStorageState(debugDir: string, filename: string): Promise<void> {
    try {
      const storageState = await this.page.evaluate(() => {
        const localStorage = Object.keys(window.localStorage).reduce((acc, key) => {
          acc[key] = window.localStorage.getItem(key);
          return acc;
        }, {} as Record<string, string | null>);
        
        const sessionStorage = Object.keys(window.sessionStorage).reduce((acc, key) => {
          acc[key] = window.sessionStorage.getItem(key);
          return acc;
        }, {} as Record<string, string | null>);
        
        return { localStorage, sessionStorage };
      });
      
      await fs.writeFile(
        path.join(debugDir, filename),
        JSON.stringify(storageState, null, 2),
        'utf8'
      );
    } catch (error) {
      console.warn('Failed to capture storage state:', error);
    }
  }

  /**
   * Capture DOM structure snapshot
   */
  private async captureDOMSnapshot(debugDir: string, filename: string): Promise<void> {
    try {
      const domSnapshot = await this.page.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT,
          null,
        );
        
        const elements = [];
        let node = walker.nextNode();
        
        while (node && elements.length < 1000) { // Limit to prevent huge files
          const element = node as Element;
          elements.push({
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            textContent: element.textContent?.substring(0, 100), // First 100 chars
          });
          node = walker.nextNode();
        }
        
        return elements;
      });
      
      await fs.writeFile(
        path.join(debugDir, filename),
        JSON.stringify(domSnapshot, null, 2),
        'utf8'
      );
    } catch (error) {
      console.warn('Failed to capture DOM snapshot:', error);
    }
  }

  /**
   * Create comprehensive debug report
   */
  private async createDebugReport(
    debugDir: string,
    error: Error,
    context: string
  ): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      test: {
        title: this.testInfo.title,
        file: this.testInfo.file,
        line: this.testInfo.line,
        column: this.testInfo.column,
      },
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      page: {
        url: this.page.url(),
        title: await this.page.title().catch(() => 'Unknown'),
        viewport: this.page.viewportSize(),
      },
      browser: {
        name: this.testInfo.project.name,
        version: this.testInfo.project.use?.channel || 'default',
      },
    };
    
    await fs.writeFile(
      path.join(debugDir, 'debug-report.json'),
      JSON.stringify(report, null, 2),
      'utf8'
    );
  }

  /**
   * Wait for element with enhanced debugging
   */
  async waitForElementWithDebug(
    locator: Locator,
    options: { timeout?: number; state?: 'visible' | 'attached' | 'detached' | 'hidden' } = {}
  ): Promise<void> {
    const timeout = options.timeout || 10000;
    const state = options.state || 'visible';
    
    try {
      await locator.waitFor({ ...options, timeout });
    } catch (error) {
      // Enhanced error information
      const selector = locator.toString();
      const count = await locator.count();
      
      const enhancedError = new Error(
        `Element wait failed: ${selector}\n` +
        `Expected state: ${state}\n` +
        `Element count: ${count}\n` +
        `Page URL: ${this.page.url()}\n` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
      
      await this.captureDebugInfo(enhancedError, `waitForElement: ${selector}`);
      throw enhancedError;
    }
  }

  /**
   * Click with enhanced debugging
   */
  async clickWithDebug(locator: Locator, options: Parameters<Locator['click']>[0] = {}): Promise<void> {
    const selector = locator.toString();
    
    try {
      // Ensure element is ready for interaction
      await locator.waitFor({ state: 'visible' });
      await locator.scrollIntoViewIfNeeded();
      
      // Highlight element before clicking (in debug mode)
      if (process.env.DEBUG_TESTS) {
        await locator.highlight();
        await this.page.waitForTimeout(500);
      }
      
      await locator.click(options);
    } catch (error) {
      const count = await locator.count();
      const isVisible = count > 0 ? await locator.first().isVisible() : false;
      
      const enhancedError = new Error(
        `Click failed: ${selector}\n` +
        `Element count: ${count}\n` +
        `First element visible: ${isVisible}\n` +
        `Page URL: ${this.page.url()}\n` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
      
      await this.captureDebugInfo(enhancedError, `click: ${selector}`);
      throw enhancedError;
    }
  }

  /**
   * Fill input with enhanced debugging
   */
  async fillWithDebug(locator: Locator, value: string): Promise<void> {
    const selector = locator.toString();
    
    try {
      await locator.waitFor({ state: 'visible' });
      await locator.scrollIntoViewIfNeeded();
      
      if (process.env.DEBUG_TESTS) {
        await locator.highlight();
        await this.page.waitForTimeout(300);
      }
      
      await locator.clear();
      await locator.fill(value);
      
      // Verify the value was set correctly
      const actualValue = await locator.inputValue();
      if (actualValue !== value) {
        throw new Error(`Fill verification failed: expected "${value}", got "${actualValue}"`);
      }
    } catch (error) {
      const enhancedError = new Error(
        `Fill failed: ${selector}\n` +
        `Value: ${value}\n` +
        `Page URL: ${this.page.url()}\n` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
      
      await this.captureDebugInfo(enhancedError, `fill: ${selector}`);
      throw enhancedError;
    }
  }

  /**
   * Log test step for better debugging
   */
  logStep(step: string, details?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] STEP: ${step}`;
    
    if (details) {
      console.log(logMessage, details);
    } else {
      console.log(logMessage);
    }
  }

  /**
   * Assert with enhanced error context
   */
  async assertWithContext<T>(
    assertion: () => Promise<T> | T,
    context: string,
    additionalInfo?: Record<string, unknown>
  ): Promise<T> {
    try {
      return await assertion();
    } catch (error) {
      const enhancedError = new Error(
        `Assertion failed: ${context}\n` +
        `Page URL: ${this.page.url()}\n` +
        `Additional info: ${additionalInfo ? JSON.stringify(additionalInfo) : 'None'}\n` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
      
      await this.captureDebugInfo(enhancedError, `assertion: ${context}`);
      throw enhancedError;
    }
  }
}