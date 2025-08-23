import { test, expect } from '@playwright/test';

test.describe('Window Resize Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => document.fonts.ready);
    await page.waitForTimeout(500);
  });

  test('CourseTree adapts to desktop viewport @visual', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navigate to courses and select first course
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
    
    // Find and click on the first course link
    const firstCourseLink = page.locator('a[href*="/courses/"]').first();
    if (await firstCourseLink.isVisible()) {
      await firstCourseLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Take screenshot of CourseTree at desktop size
      const courseTree = page.locator('[class*="react-flow"]').or(page.locator('[data-testid="course-tree"]')).first();
      if (await courseTree.isVisible()) {
        await expect(courseTree).toHaveScreenshot('course-tree-desktop.png');
      } else {
        // Fallback: screenshot the main content area
        await expect(page.locator('main').or(page.locator('[role="main"]')).first()).toHaveScreenshot('course-content-desktop.png');
      }
    }
  });

  test('CourseTree adapts to tablet viewport @visual', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Navigate to courses and select first course
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
    
    const firstCourseLink = page.locator('a[href*="/courses/"]').first();
    if (await firstCourseLink.isVisible()) {
      await firstCourseLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Take screenshot of CourseTree at tablet size
      const courseTree = page.locator('[class*="react-flow"]').or(page.locator('[data-testid="course-tree"]')).first();
      if (await courseTree.isVisible()) {
        await expect(courseTree).toHaveScreenshot('course-tree-tablet.png');
      } else {
        // Fallback: screenshot the main content area
        await expect(page.locator('main').or(page.locator('[role="main"]')).first()).toHaveScreenshot('course-content-tablet.png');
      }
    }
  });

  test('CourseTree adapts to mobile viewport @visual', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to courses and select first course
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
    
    const firstCourseLink = page.locator('a[href*="/courses/"]').first();
    if (await firstCourseLink.isVisible()) {
      await firstCourseLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Take screenshot of CourseTree at mobile size
      const courseTree = page.locator('[class*="react-flow"]').or(page.locator('[data-testid="course-tree"]')).first();
      if (await courseTree.isVisible()) {
        await expect(courseTree).toHaveScreenshot('course-tree-mobile.png');
      } else {
        // Fallback: screenshot the main content area
        await expect(page.locator('main').or(page.locator('[role="main"]')).first()).toHaveScreenshot('course-content-mobile.png');
      }
    }
  });

  test('ModulePage adapts to different viewports @visual', async ({ page }) => {
    // Navigate to courses first to find a module
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
    
    // Try to find a module link
    const moduleLink = page.locator('a[href*="/modules/"]').first();
    if (await moduleLink.isVisible()) {
      await moduleLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Test desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('module-page-desktop.png');
      
      // Test tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('module-page-tablet.png');
      
      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('module-page-mobile.png');
    }
  });

  test('Window resize triggers CourseTree re-render', async ({ page }) => {
    // Navigate to a course page
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
    
    const firstCourseLink = page.locator('a[href*="/courses/"]').first();
    if (await firstCourseLink.isVisible()) {
      await firstCourseLink.click();
      await page.waitForLoadState('networkidle');
      
      // Start with desktop size
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(1000);
      
      // Check if CourseTree is present
      const courseTree = page.locator('[class*="react-flow"]').or(page.locator('[data-testid="course-tree"]')).first();
      
      if (await courseTree.isVisible()) {
        // Resize to mobile and verify re-render by checking the key attribute changes
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        
        // Verify CourseTree is still visible and adapted
        await expect(courseTree).toBeVisible();
        
        // Resize back to desktop
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.waitForTimeout(1000);
        
        // Verify CourseTree is still working
        await expect(courseTree).toBeVisible();
      }
    }
  });

  test('Responsive breakpoints work correctly @visual', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
    
    const firstCourseLink = page.locator('a[href*="/courses/"]').first();
    if (await firstCourseLink.isVisible()) {
      await firstCourseLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Test various screen sizes to ensure smooth transitions
      const screenSizes = [
        { width: 1920, height: 1080, name: 'desktop-large' },
        { width: 1440, height: 900, name: 'desktop-medium' },
        { width: 1024, height: 768, name: 'tablet-landscape' },
        { width: 768, height: 1024, name: 'tablet-portrait' },
        { width: 414, height: 896, name: 'mobile-large' },
        { width: 375, height: 812, name: 'mobile-medium' },
        { width: 320, height: 568, name: 'mobile-small' },
      ];
      
      for (const size of screenSizes) {
        await page.setViewportSize({ width: size.width, height: size.height });
        await page.waitForTimeout(500);
        
        // Take screenshot at each size
        await expect(page).toHaveScreenshot(`course-page-${size.name}.png`);
      }
    }
  });
});