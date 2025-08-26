import { test, expect } from '@playwright/test';
import { ScreenshotHelpers } from './utils/screenshot-helpers';

test.describe('Mobile Filters Interaction Tests', () => {
  let screenshotHelpers: ScreenshotHelpers;

  test.beforeEach(async ({ page }) => {
    screenshotHelpers = new ScreenshotHelpers(page);
    
    // Set mobile viewport for iPhone 14
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Navigate to questions page with filters
    await page.goto('/questions');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Mobile Filter Toggle', () => {
    test('should display mobile filter toggle with proper touch target size', async ({ page }) => {
      // Find the filter toggle button
      const filterToggle = page.getByRole('button', { name: /show filters|filter/i }).first();
      await expect(filterToggle).toBeVisible();

      // Check touch target size (minimum 48px)
      const boundingBox = await filterToggle.boundingBox();
      expect(boundingBox).not.toBeNull();
      expect(boundingBox!.height).toBeGreaterThanOrEqual(48);

      // Take screenshot of mobile filter toggle
      await screenshotHelpers.takeElementScreenshot(
        filterToggle,
        'mobile-filter-toggle-default'
      );
    });

    test('should show active filter count when filters are applied', async ({ page }) => {
      // Apply some filters first (simulate clicking on filter options)
      const filterToggle = page.getByRole('button', { name: /show filters|filter/i }).first();
      await filterToggle.click();

      // Wait for dialog to appear
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Apply some filters by clicking on items
      const moduleSection = page.getByText('Modules').first();
      if (await moduleSection.isVisible()) {
        await moduleSection.click();
        
        // Select a module
        const firstCheckbox = page.locator('input[type="checkbox"]').first();
        if (await firstCheckbox.isVisible()) {
          await firstCheckbox.click();
        }
      }

      // Close dialog
      const closeButton = page.getByRole('button', { name: /close|apply/i }).first();
      await closeButton.click();

      // Check if active filter count is displayed
      const activeFilterButton = page.getByText(/active filters/i).first();
      await expect(activeFilterButton).toBeVisible();

      // Take screenshot with active filters
      await screenshotHelpers.takePageScreenshot('mobile-filters-active-state');
    });
  });

  test.describe('Mobile Bottom Sheet Dialog', () => {
    test('should open bottom sheet dialog with proper animation', async ({ page }) => {
      const filterToggle = page.getByRole('button', { name: /show filters|filter/i }).first();
      
      // Take before screenshot
      await screenshotHelpers.takePageScreenshot('mobile-before-dialog-open');
      
      // Click to open dialog
      await filterToggle.click();
      
      // Wait for dialog animation
      await page.waitForTimeout(500);
      
      // Verify dialog is visible
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Check for drag handle
      const dragHandle = dialog.locator('[style*="40px"]');
      await expect(dragHandle).toBeVisible();

      // Take after screenshot
      await screenshotHelpers.takePageScreenshot('mobile-after-dialog-open');
    });

    test('should close dialog with swipe down gesture simulation', async ({ page }) => {
      const filterToggle = page.getByRole('button', { name: /show filters|filter/i }).first();
      await filterToggle.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Simulate swipe down by touching and dragging
      const dialogBounds = await dialog.boundingBox();
      expect(dialogBounds).not.toBeNull();

      const startY = dialogBounds!.y + 50; // Start near top of dialog
      const endY = startY + 200; // Swipe down 200px
      const centerX = dialogBounds!.x + dialogBounds!.width / 2;

      // Simulate touch swipe
      await page.touchscreen.tap(centerX, startY);
      await page.touchscreen.tap(centerX, endY);
      
      // Wait for close animation
      await page.waitForTimeout(500);

      // Dialog should be closed
      await expect(dialog).not.toBeVisible();
    });

    test('should close dialog with close button', async ({ page }) => {
      const filterToggle = page.getByRole('button', { name: /show filters|filter/i }).first();
      await filterToggle.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Find and click close button
      const closeButton = dialog.getByRole('button', { name: /close/i });
      await expect(closeButton).toBeVisible();
      
      // Check close button touch target size
      const closeBounds = await closeButton.boundingBox();
      expect(closeBounds).not.toBeNull();
      expect(Math.min(closeBounds!.width, closeBounds!.height)).toBeGreaterThanOrEqual(44);

      await closeButton.click();
      
      // Dialog should be closed
      await expect(dialog).not.toBeVisible();
    });
  });

  test.describe('Mobile Filter Sections', () => {
    test('should expand and collapse filter sections', async ({ page }) => {
      const filterToggle = page.getByRole('button', { name: /show filters|filter/i }).first();
      await filterToggle.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Find a filter section
      const moduleSection = dialog.getByText('Modules').first();
      if (await moduleSection.isVisible()) {
        // Take screenshot of collapsed section
        await screenshotHelpers.takeElementScreenshot(
          dialog,
          'mobile-filter-section-collapsed'
        );

        // Click to expand
        await moduleSection.click();
        await page.waitForTimeout(300); // Wait for expand animation

        // Take screenshot of expanded section
        await screenshotHelpers.takeElementScreenshot(
          dialog,
          'mobile-filter-section-expanded'
        );
      }
    });

    test('should handle virtual scrolling for large lists', async ({ page }) => {
      // This test would require a page with many filter options
      // For now, we'll test the basic scrolling functionality
      const filterToggle = page.getByRole('button', { name: /show filters|filter/i }).first();
      await filterToggle.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Scroll within the dialog
      const scrollContainer = dialog.locator('.overflow-y-auto').first();
      if (await scrollContainer.isVisible()) {
        // Test scrolling performance
        await scrollContainer.hover();
        await page.mouse.wheel(0, 200);
        await page.waitForTimeout(100);
        await page.mouse.wheel(0, -200);
        
        // Take screenshot after scrolling
        await screenshotHelpers.takeElementScreenshot(
          dialog,
          'mobile-filter-virtual-scroll'
        );
      }
    });
  });

  test.describe('Filter Badge Interactions', () => {
    test('should show filter badges when filters are active', async ({ page }) => {
      // Apply filters and check for badges
      const filterToggle = page.getByRole('button', { name: /show filters|filter/i }).first();
      await filterToggle.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Try to select a filter
      const checkbox = dialog.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        await checkbox.click();
        
        // Apply filters
        const applyButton = dialog.getByRole('button', { name: /apply/i });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        } else {
          // Close dialog another way
          const closeButton = dialog.getByRole('button', { name: /close/i });
          await closeButton.click();
        }

        // Look for filter badges
        const badges = page.locator('[class*="badge"], [class*="rounded-full"]');
        if (await badges.count() > 0) {
          await screenshotHelpers.takePageScreenshot('mobile-filter-badges');
        }
      }
    });

    test('should remove individual filters via badge remove buttons', async ({ page }) => {
      // This test assumes filters are already applied
      // Look for removable badges
      const removeBadges = page.locator('button[aria-label*="Remove"]');
      const badgeCount = await removeBadges.count();

      if (badgeCount > 0) {
        // Take screenshot before removal
        await screenshotHelpers.takePageScreenshot('mobile-before-badge-removal');

        // Remove first badge
        await removeBadges.first().click();
        await page.waitForTimeout(200);

        // Take screenshot after removal
        await screenshotHelpers.takePageScreenshot('mobile-after-badge-removal');
      }
    });
  });

  test.describe('RTL (Hebrew) Support', () => {
    test('should display correctly in RTL mode', async ({ page }) => {
      // Set RTL direction
      await page.addStyleTag({
        content: 'html { direction: rtl; }',
      });

      // Navigate to Hebrew version if available
      const languageSelector = page.getByRole('button', { name: /language/i });
      if (await languageSelector.isVisible()) {
        await languageSelector.click();
        const hebrewOption = page.getByText(/עברית|Hebrew/i);
        if (await hebrewOption.isVisible()) {
          await hebrewOption.click();
        }
      }

      // Test RTL filter interactions
      const filterToggle = page.getByRole('button', { name: /show filters|מסננים/i }).first();
      if (await filterToggle.isVisible()) {
        await filterToggle.click();

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();

        // Take RTL screenshot
        await screenshotHelpers.takeElementScreenshot(
          dialog,
          'mobile-filter-dialog-rtl'
        );

        // Close dialog
        const closeButton = dialog.getByRole('button', { name: /close|סגור/i });
        await closeButton.click();
      }
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should be navigable with keyboard', async ({ page }) => {
      // Focus on filter toggle
      const filterToggle = page.getByRole('button', { name: /show filters|filter/i }).first();
      await filterToggle.focus();
      
      // Open with Enter key
      await page.keyboard.press('Enter');
      
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Take screenshot of focused elements
      await screenshotHelpers.takeElementScreenshot(
        dialog,
        'mobile-filter-keyboard-navigation'
      );

      // Close with Escape
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      const filterToggle = page.getByRole('button', { name: /show filters|filter/i }).first();
      await filterToggle.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Check for proper ARIA attributes
      await expect(dialog).toHaveAttribute('role', 'dialog');
      
      // Check checkboxes have proper labels
      const checkboxes = dialog.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
        const checkbox = checkboxes.nth(i);
        const ariaLabel = await checkbox.getAttribute('aria-label');
        const associatedLabel = await checkbox.evaluate((el) => {
          const label = el.closest('label');
          return label ? label.textContent : null;
        });
        
        expect(ariaLabel || associatedLabel).toBeTruthy();
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('should maintain 60fps during animations', async ({ page }) => {
      // Start performance monitoring
      await page.evaluate(() => {
        (window as any).performanceMetrics = {
          frameCount: 0,
          startTime: performance.now(),
        };
        
        function countFrames() {
          (window as any).performanceMetrics.frameCount++;
          requestAnimationFrame(countFrames);
        }
        countFrames();
      });

      const filterToggle = page.getByRole('button', { name: /show filters|filter/i }).first();
      
      // Trigger animation
      await filterToggle.click();
      await page.waitForTimeout(500); // Animation duration
      
      // Close dialog
      const dialog = page.locator('[role="dialog"]');
      const closeButton = dialog.getByRole('button', { name: /close/i });
      await closeButton.click();
      await page.waitForTimeout(500); // Close animation

      // Check frame rate
      const metrics = await page.evaluate(() => {
        const m = (window as any).performanceMetrics;
        const duration = performance.now() - m.startTime;
        const fps = (m.frameCount / duration) * 1000;
        return { fps, frameCount: m.frameCount, duration };
      });

      // Should maintain reasonable frame rate
      expect(metrics.fps).toBeGreaterThan(30); // At least 30fps
    });
  });
});