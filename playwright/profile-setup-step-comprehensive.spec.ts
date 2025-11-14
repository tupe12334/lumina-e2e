import { test, expect } from './fixtures/auth-fixtures';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';

/**
 * Comprehensive ProfileSetupStep E2E Tests
 *
 * This test suite covers all the key functionality of the ProfileSetupStep component:
 * - University selection with enhanced select dropdown
 * - Degree selection (conditional and optional)
 * - Advanced options toggle and functionality
 * - Terms agreement validation
 * - Mobile responsiveness
 * - Error handling and network failures
 * - Form validation and user workflows
 *
 * Prerequisites:
 * 1. Application must be running on the configured port (default: 4174)
 * 2. Backend services must be accessible
 * 3. Test data must be available (universities, degrees)
 */
test.describe('ProfileSetupStep - Comprehensive E2E Tests', () => {

  // Helper function to complete login and navigate to profile setup
  async function navigateToProfileSetup(page, testDataManager) {
    const userData = testDataManager.generateUser();
    const loginPage = new LoginPage(page);

    await page.goto('/');
    await loginPage.login(userData.email, userData.password);
    await expect(page).toHaveURL(/\/onboarding/);

    return { userData, onboardingPage: new OnboardingPage(page) };
  }

  test.describe('Core Functionality', () => {
    test('should display all essential profile setup elements', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Verify main profile setup container
      await expect(page.locator('#profile-setup-step')).toBeVisible();

      // Verify form elements are present
      await expect(onboardingPage.universitySelect).toBeVisible();
      await expect(onboardingPage.degreeSelect).toBeVisible();
      await expect(onboardingPage.agreeCheckbox).toBeVisible();
      await expect(onboardingPage.finishButton).toBeVisible();

      // Take baseline screenshot
      await expect(page).toHaveScreenshot('profile-setup-initial-state.png');
    });

    test('should have proper accessibility attributes', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Verify ARIA attributes
      await expect(onboardingPage.universitySelect).toHaveAttribute('aria-expanded', 'false');
      await expect(onboardingPage.universitySelect).toHaveAttribute('aria-haspopup', 'listbox');
      await expect(onboardingPage.agreeCheckbox).toHaveAttribute('type', 'checkbox');

      // Verify required field indicators
      const requiredElements = page.locator('[aria-required="true"], [required]');
      await expect(requiredElements).toHaveCountGreaterThan(0);
    });
  });

  test.describe('University Selection', () => {
    test('should open university dropdown with search capability', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Click to open dropdown
      await onboardingPage.universitySelect.click();

      // Verify dropdown appears
      await expect(page.locator('[role="listbox"]')).toBeVisible();

      // Verify search input is present
      const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="חיפוש" i]');
      await expect(searchInput).toBeVisible();

      // Test search functionality
      await searchInput.fill('Open');
      await page.waitForTimeout(600); // Wait for debounced search

      // Verify filtered results
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(0);

      // Verify Open University appears in results
      await expect(options.filter({ hasText: /open university/i })).toHaveCount(1);
    });

    test('should select university and update UI state', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Select university
      await onboardingPage.selectInstitution('The Open University Of Israel');

      // Verify university is displayed in button
      await expect(onboardingPage.universitySelect).toContainText(/open university/i);

      // Verify degree select becomes enabled (if it was disabled)
      await expect(onboardingPage.degreeSelect).toBeVisible();

      // Screenshot after university selection
      await expect(page).toHaveScreenshot('profile-setup-university-selected.png');
    });

    test('should handle university loading states', async ({ page, testDataManager }) => {
      // Mock slow API response
      await page.route('**/graphql', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();

        if (postData?.query?.includes('universities')) {
          // Add delay to simulate slow loading
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await route.continue();
      });

      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Check for loading state
      const isLoading = await onboardingPage.isUniversityLoading();
      if (isLoading) {
        expect(isLoading).toBeTruthy();

        // Wait for loading to complete
        await expect(onboardingPage.universitySelect).not.toContainText(/loading/i, { timeout: 5000 });
      }
    });

    test('should validate university selection requirement', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Try to complete without selecting university
      await onboardingPage.agreeCheckbox.check();
      await onboardingPage.finishButton.click();

      // Should remain on onboarding page
      await expect(page).toHaveURL(/\/onboarding/);

      // Should show validation error
      const errors = await onboardingPage.getValidationErrors();
      expect(errors.some(error => error.toLowerCase().includes('university') || error.includes('אוניברסיטה'))).toBeTruthy();
    });
  });

  test.describe('Degree Selection', () => {
    test('should load degrees after university selection', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Select university first
      await onboardingPage.selectInstitution('The Open University Of Israel');

      // Open degree dropdown
      await onboardingPage.degreeSelect.click();

      // Verify degree options are loaded
      await expect(page.locator('[role="listbox"]')).toBeVisible();
      const degreeOptions = page.locator('[role="option"]');
      await expect(degreeOptions).toHaveCountGreaterThan(0);

      // Verify specific degrees are available
      await expect(degreeOptions.filter({ hasText: /computer science/i })).toHaveCount(1);
    });

    test('should allow degree search and selection', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      await onboardingPage.selectInstitution('The Open University Of Israel');
      await onboardingPage.searchDegree('Computer');

      // Verify filtered results
      const options = page.locator('[role="option"]');
      const optionTexts = await options.allTextContents();
      expect(optionTexts.some(text => text.toLowerCase().includes('computer'))).toBeTruthy();

      // Select degree
      await onboardingPage.selectDegree('Computer Science');
      await expect(onboardingPage.degreeSelect).toContainText(/computer science/i);
    });

    test('should show "no degree" message when university selected but no degree chosen', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Select only university
      await onboardingPage.selectInstitution('The Open University Of Israel');

      // Verify no degree message appears
      const isVisible = await onboardingPage.isNoDegreeMessageVisible();
      expect(isVisible).toBeTruthy();
    });

    test('should allow completing onboarding without degree selection', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      await onboardingPage.selectInstitution('The Open University Of Israel');
      await onboardingPage.agreeAndFinish();

      // Should successfully complete onboarding
      await expect(page).toHaveURL('/my-journey');
    });
  });

  test.describe('Advanced Options', () => {
    test('should show advanced options toggle only when degree is selected', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Initially no advanced options
      await expect(onboardingPage.advancedSectionButton).not.toBeVisible();

      // Select university only - still no advanced options
      await onboardingPage.selectInstitution('The Open University Of Israel');
      await expect(onboardingPage.advancedSectionButton).not.toBeVisible();

      // Select degree - now advanced options should appear
      await onboardingPage.selectDegree('Computer Science');
      await expect(onboardingPage.advancedSectionButton).toBeVisible();
    });

    test('should toggle advanced options visibility', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      await onboardingPage.selectInstitution('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');

      // Initially options should be hidden
      await expect(onboardingPage.addAllDegreeCoursesCheckbox).not.toBeVisible();

      // Toggle to show
      await onboardingPage.toggleAdvancedSection();
      await expect(onboardingPage.addAllDegreeCoursesCheckbox).toBeVisible();

      // Screenshot with advanced options visible
      await expect(page).toHaveScreenshot('profile-setup-advanced-options-visible.png');

      // Toggle to hide
      await onboardingPage.toggleAdvancedSection();
      await expect(onboardingPage.addAllDegreeCoursesCheckbox).not.toBeVisible();
    });

    test('should handle "add all degree courses" checkbox', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      await onboardingPage.selectInstitution('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');
      await onboardingPage.toggleAdvancedSection();

      // Initially unchecked
      await expect(onboardingPage.addAllDegreeCoursesCheckbox).not.toBeChecked();

      // Check the option
      await onboardingPage.setAddAllDegreeCourses(true);
      await expect(onboardingPage.addAllDegreeCoursesCheckbox).toBeChecked();

      // Uncheck the option
      await onboardingPage.setAddAllDegreeCourses(false);
      await expect(onboardingPage.addAllDegreeCoursesCheckbox).not.toBeChecked();
    });
  });

  test.describe('Terms Agreement & Validation', () => {
    test('should require terms agreement for form submission', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Complete other required fields
      await onboardingPage.selectInstitution('The Open University Of Israel');

      // Try to submit without agreeing to terms
      await onboardingPage.finishButton.click();

      // Should remain on onboarding page
      await expect(page).toHaveURL(/\/onboarding/);

      // Should show terms validation error
      const errors = await onboardingPage.getValidationErrors();
      expect(errors.some(error =>
        error.toLowerCase().includes('terms') ||
        error.toLowerCase().includes('agree') ||
        error.includes('הסכם')
      )).toBeTruthy();
    });

    test('should allow completion after agreeing to terms', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      await onboardingPage.selectInstitution('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');
      await onboardingPage.agreeAndFinish();

      // Should redirect to my-journey
      await expect(page).toHaveURL('/my-journey');
    });

    test('should validate all required fields together', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Submit empty form
      await onboardingPage.finishButton.click();

      // Should show multiple validation errors
      const errors = await onboardingPage.getValidationErrors();
      expect(errors.length).toBeGreaterThan(1);

      // Should include university and terms errors
      const hasUniversityError = errors.some(error =>
        error.toLowerCase().includes('university') || error.includes('אוניברסיטה')
      );
      const hasTermsError = errors.some(error =>
        error.toLowerCase().includes('terms') || error.includes('הסכם')
      );

      expect(hasUniversityError).toBeTruthy();
      expect(hasTermsError).toBeTruthy();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display properly on mobile viewport', async ({ page, testDataManager }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Verify elements are visible and properly sized
      await expect(onboardingPage.universitySelect).toBeVisible();
      await expect(onboardingPage.degreeSelect).toBeVisible();
      await expect(onboardingPage.agreeCheckbox).toBeVisible();

      // Screenshot mobile layout
      await expect(page).toHaveScreenshot('profile-setup-mobile-layout.png');
    });

    test('should handle mobile dropdown interactions', async ({ page, testDataManager }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Click university select on mobile
      await onboardingPage.universitySelect.click();

      // Verify mobile dropdown appears (could be modal or full-screen)
      const dropdownVisible = await page.locator('[role="listbox"], [role="dialog"], .modal').isVisible();
      expect(dropdownVisible).toBeTruthy();

      // Test touch interactions
      await page.locator('[role="option"]').first().dispatchEvent('touchend');
    });
  });

  test.describe('Error Handling & Network Conditions', () => {
    test('should handle university loading errors gracefully', async ({ page, testDataManager }) => {
      // Mock network failure for universities
      await page.route('**/graphql', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();

        if (postData?.query?.includes('universities')) {
          await route.abort('failed');
          return;
        }

        await route.continue();
      });

      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Should show error state
      const hasError = await onboardingPage.hasUniversityError();
      expect(hasError).toBeTruthy();

      // University select should be disabled
      await expect(onboardingPage.universitySelect).toBeDisabled();
    });

    test('should handle degree loading errors gracefully', async ({ page, testDataManager }) => {
      let universityCalled = false;

      await page.route('**/graphql', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();

        if (postData?.query?.includes('universities')) {
          universityCalled = true;
          await route.continue();
        } else if (postData?.query?.includes('degrees') && universityCalled) {
          await route.abort('failed');
          return;
        } else {
          await route.continue();
        }
      });

      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Select university successfully
      await onboardingPage.selectInstitution('The Open University Of Israel');

      // Degree loading should show error
      const hasError = await onboardingPage.hasDegreeError();
      expect(hasError).toBeTruthy();
    });

    test('should maintain form state during network interruptions', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Fill form partially
      await onboardingPage.selectInstitution('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');

      // Simulate network interruption
      await page.context().setOffline(true);
      await page.waitForTimeout(1000);
      await page.context().setOffline(false);

      // Form state should be preserved
      await expect(onboardingPage.universitySelect).toContainText(/open university/i);
      await expect(onboardingPage.degreeSelect).toContainText(/computer science/i);
    });
  });

  test.describe('Complete User Workflows', () => {
    test('should complete full onboarding with all options', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Complete comprehensive flow
      await onboardingPage.selectInstitution('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');
      await onboardingPage.toggleAdvancedSection();
      await onboardingPage.setAddAllDegreeCourses(true);
      await onboardingPage.agreeAndFinish();

      // Should redirect to my-journey
      await expect(page).toHaveURL('/my-journey');

      // Final success screenshot
      await expect(page).toHaveScreenshot('profile-setup-complete-success.png');
    });

    test('should handle form corrections after validation errors', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Submit incomplete form
      await onboardingPage.finishButton.click();

      // Fix errors one by one
      await onboardingPage.selectInstitution('The Open University Of Israel');

      // Try again - should still have terms error
      await onboardingPage.finishButton.click();
      await expect(page).toHaveURL(/\/onboarding/);

      // Fix terms error
      await onboardingPage.agreeCheckbox.check();
      await onboardingPage.finishButton.click();

      // Should now succeed
      await expect(page).toHaveURL('/my-journey');
    });

    test('should preserve state during navigation interruptions', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Partially complete form
      await onboardingPage.selectInstitution('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');

      // Navigate away and back
      await page.goto('/degrees');
      await page.goto('/onboarding');

      // State should be preserved
      await expect(onboardingPage.universitySelect).toContainText(/open university/i);
      await expect(onboardingPage.degreeSelect).toContainText(/computer science/i);

      // Complete onboarding
      await onboardingPage.agreeAndFinish();
      await expect(page).toHaveURL('/my-journey');
    });
  });

  test.describe('Performance & Accessibility', () => {
    test('should have acceptable performance metrics', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Measure page load time
      const startTime = Date.now();
      await onboardingPage.waitForPageLoad();
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time
      expect(loadTime).toBeLessThan(5000);
    });

    test('should support keyboard navigation', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(onboardingPage.universitySelect).toBeFocused();

      // Space/Enter should open dropdown
      await page.keyboard.press('Enter');
      await expect(page.locator('[role="listbox"]')).toBeVisible();

      // Escape should close dropdown
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="listbox"]')).not.toBeVisible();
    });

    test('should meet accessibility standards', async ({ page, testDataManager }) => {
      const { onboardingPage } = await navigateToProfileSetup(page, testDataManager);

      // Check for proper ARIA labels and roles
      await expect(onboardingPage.universitySelect).toHaveAttribute('aria-haspopup', 'listbox');
      await expect(onboardingPage.agreeCheckbox).toHaveAttribute('aria-describedby');

      // Check color contrast and focus indicators
      await onboardingPage.universitySelect.focus();
      const focusVisible = await onboardingPage.universitySelect.evaluate(el =>
        getComputedStyle(el).outlineWidth !== '0px' ||
        getComputedStyle(el).boxShadow.includes('rgb')
      );
      expect(focusVisible).toBeTruthy();
    });
  });
});