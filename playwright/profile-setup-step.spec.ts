import { test, expect } from './fixtures/auth-fixtures';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';

/**
 * Comprehensive E2E tests for ProfileSetupStep component in the onboarding flow.
 * Tests cover university selection, degree selection, advanced options, mobile responsiveness,
 * form validation, error handling, and complete user workflows.
 */
test.describe('ProfileSetupStep Component', () => {
  
  test.describe('University Selection', () => {
    test('should display university selection dropdown with search functionality', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      // Navigate to onboarding
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Verify university select is present and functional
      await expect(onboardingPage.universitySelect).toBeVisible();
      await expect(onboardingPage.universitySelect).toBeEnabled();
      
      // Click university dropdown to open it
      await onboardingPage.universitySelect.click();
      
      // Verify dropdown content appears
      await expect(page.locator('[role="listbox"]')).toBeVisible();
      
      // Verify search field is present
      const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="חיפוש" i]');
      await expect(searchInput).toBeVisible();
      
      // Test search functionality
      await searchInput.fill('Open');
      await page.waitForTimeout(500); // Wait for debounced search
      
      // Verify filtered options appear
      const universityOptions = page.locator('[role="option"]');
      await expect(universityOptions).toHaveCount(1);
      await expect(universityOptions.first()).toContainText('Open University');
      
      // Select university
      await universityOptions.first().click();
      
      // Verify dropdown closes and selection is displayed
      await expect(page.locator('[role="listbox"]')).not.toBeVisible();
      await expect(onboardingPage.universitySelect).toContainText('Open University');
    });

    test('should show loading state when universities are being fetched', async ({ 
      page, 
      testDataManager 
    }) => {
      // Mock slow API response
      await page.route('**/graphql', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();
        
        if (postData?.query?.includes('universities')) {
          // Delay university response
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        await route.continue();
      });

      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Verify loading state
      const universityField = onboardingPage.universitySelect;
      await expect(universityField).toContainText(/loading/i);
      await expect(universityField).toBeDisabled();
      
      // Wait for loading to complete
      await expect(universityField).not.toContainText(/loading/i, { timeout: 5000 });
      await expect(universityField).toBeEnabled();
    });

    test('should validate university selection requirement', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Try to finish onboarding without selecting university
      const finishButton = onboardingPage.finishButton;
      
      // Agreement checkbox should be available but finish should be prevented
      await expect(onboardingPage.agreeCheckbox).toBeVisible();
      await onboardingPage.agreeCheckbox.check();
      
      // Finish button should be disabled or clicking should show validation error
      await finishButton.click();
      
      // Should still be on onboarding page
      await expect(page).toHaveURL(/\/onboarding/);
      
      // Should show validation message
      const errorMessage = page.locator('text=/university.*required/i, text=/אוניברסיטה.*נדרשת/i');
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('Degree Selection', () => {
    test('should show degree dropdown only after university is selected', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Initially, degree select should not be visible or should be disabled
      const degreeSelect = onboardingPage.degreeSelect;
      await expect(degreeSelect).toBeDisabled();
      
      // Select university first
      await onboardingPage.selectUniversity('The Open University Of Israel');
      
      // Now degree select should become enabled
      await expect(degreeSelect).toBeEnabled();
      await expect(degreeSelect).toBeVisible();
    });

    test('should load degrees based on selected university', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Select university
      await onboardingPage.selectUniversity('The Open University Of Israel');
      
      // Click degree dropdown
      await onboardingPage.degreeSelect.click();
      
      // Verify degree options are loaded
      const degreeOptions = page.locator('[role="option"]');
      await expect(degreeOptions).toHaveCountGreaterThan(0);
      
      // Verify Computer Science degree is available
      const computerScienceDegree = page.locator('[role="option"]', { hasText: 'Computer Science' });
      await expect(computerScienceDegree).toBeVisible();
    });

    test('should allow searching within degree options', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      await onboardingPage.selectUniversity('The Open University Of Israel');
      await onboardingPage.degreeSelect.click();
      
      // Search for Computer Science
      const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="חיפוש" i]');
      await searchInput.fill('Computer');
      await page.waitForTimeout(500);
      
      // Should filter to Computer Science related degrees
      const filteredOptions = page.locator('[role="option"]');
      const optionTexts = await filteredOptions.allTextContents();
      
      expect(optionTexts.some(text => text.toLowerCase().includes('computer'))).toBeTruthy();
    });

    test('should allow completing onboarding without selecting a degree', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Select only university, not degree
      await onboardingPage.selectUniversity('The Open University Of Israel');
      
      // Should show "no degree" informational message
      const noDegreeMessage = page.locator('#profile-no-degree-message, text=/you can always add/i, text=/תוכל תמיד להוסיף/i');
      await expect(noDegreeMessage).toBeVisible();
      
      // Should be able to complete onboarding
      await onboardingPage.agreeAndFinish();
      await expect(page).toHaveURL('/my-journey');
    });
  });

  test.describe('Advanced Options', () => {
    test('should show advanced options toggle only when degree is selected', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Initially, advanced options should not be visible
      await expect(onboardingPage.advancedSectionButton).not.toBeVisible();
      
      // Select university only - still no advanced options
      await onboardingPage.selectUniversity('The Open University Of Israel');
      await expect(onboardingPage.advancedSectionButton).not.toBeVisible();
      
      // Select degree - now advanced options should appear
      await onboardingPage.selectDegree('Computer Science');
      await expect(onboardingPage.advancedSectionButton).toBeVisible();
    });

    test('should toggle advanced options visibility', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      await onboardingPage.selectUniversity('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');
      
      // Initially advanced options content should be hidden
      await expect(onboardingPage.addAllDegreeCoursesCheckbox).not.toBeVisible();
      
      // Toggle advanced options
      await onboardingPage.toggleAdvancedSection();
      await expect(onboardingPage.addAllDegreeCoursesCheckbox).toBeVisible();
      
      // Toggle again to hide
      await onboardingPage.toggleAdvancedSection();
      await expect(onboardingPage.addAllDegreeCoursesCheckbox).not.toBeVisible();
    });

    test('should handle "add all degree courses" checkbox functionality', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      await onboardingPage.selectUniversity('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');
      await onboardingPage.toggleAdvancedSection();
      
      // Checkbox should be unchecked initially
      await expect(onboardingPage.addAllDegreeCoursesCheckbox).not.toBeChecked();
      
      // Check the checkbox
      await onboardingPage.setAddAllDegreeCourses(true);
      await expect(onboardingPage.addAllDegreeCoursesCheckbox).toBeChecked();
      
      // Uncheck the checkbox
      await onboardingPage.setAddAllDegreeCourses(false);
      await expect(onboardingPage.addAllDegreeCoursesCheckbox).not.toBeChecked();
    });
  });

  test.describe('Terms Agreement', () => {
    test('should require terms agreement to complete onboarding', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Complete university and degree selection
      await onboardingPage.selectUniversity('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');
      
      // Try to finish without agreeing to terms
      await onboardingPage.finishButton.click();
      
      // Should remain on onboarding page
      await expect(page).toHaveURL(/\/onboarding/);
      
      // Should show validation error for terms
      const termsError = page.locator('text=/terms.*required/i, text=/הסכם.*נדרש/i');
      await expect(termsError).toBeVisible();
    });

    test('should allow completion after agreeing to terms', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Complete full onboarding flow
      await onboardingPage.selectUniversity('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');
      await onboardingPage.agreeAndFinish();
      
      // Should redirect to my-journey
      await expect(page).toHaveURL('/my-journey');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display mobile-optimized dropdowns on small screens', async ({ 
      page, 
      testDataManager 
    }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Click university select
      await onboardingPage.universitySelect.click();
      
      // On mobile, dropdown should use modal/overlay presentation
      const modalOverlay = page.locator('.fixed.inset-0, .absolute.inset-0, [role="dialog"]');
      const dropdownContent = page.locator('[role="listbox"]');
      
      // Either modal overlay should be visible or dropdown should be full-width
      const mobileDropdownPresent = 
        await modalOverlay.isVisible() || 
        await dropdownContent.isVisible();
      
      expect(mobileDropdownPresent).toBeTruthy();
    });

    test('should handle touch interactions properly on mobile', async ({ 
      page, 
      testDataManager 
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Use touch events instead of clicks
      await onboardingPage.universitySelect.dispatchEvent('touchstart');
      await onboardingPage.universitySelect.dispatchEvent('touchend');
      
      // Verify dropdown opens
      await expect(page.locator('[role="listbox"]')).toBeVisible();
      
      // Select an option via touch
      const firstOption = page.locator('[role="option"]').first();
      await firstOption.dispatchEvent('touchstart');
      await firstOption.dispatchEvent('touchend');
      
      // Verify selection worked
      await expect(page.locator('[role="listbox"]')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully during university loading', async ({ 
      page, 
      testDataManager 
    }) => {
      // Mock network failure
      await page.route('**/graphql', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();
        
        if (postData?.query?.includes('universities')) {
          await route.abort('networkfailure');
          return;
        }
        
        await route.continue();
      });

      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Should show error state for university loading
      const universitySelect = page.locator('#university-select');
      const errorMessage = page.locator('text=/failed to load/i, text=/error/i, text=/נכשל/i');
      
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      await expect(universitySelect).toBeDisabled();
    });

    test('should handle network errors during degree loading', async ({ 
      page, 
      testDataManager 
    }) => {
      let universityCallCount = 0;
      
      await page.route('**/graphql', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();
        
        if (postData?.query?.includes('universities')) {
          universityCallCount++;
          await route.continue();
        } else if (postData?.query?.includes('degrees')) {
          // Fail degree loading
          await route.abort('networkfailure');
        } else {
          await route.continue();
        }
      });

      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Select university successfully
      await onboardingPage.selectUniversity('The Open University Of Israel');
      
      // Degree loading should fail
      const degreeErrorMessage = page.locator('text=/failed to load degrees/i, text=/error.*degree/i');
      await expect(degreeErrorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should allow retry after network failure', async ({ 
      page, 
      testDataManager 
    }) => {
      let attemptCount = 0;
      
      await page.route('**/graphql', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();
        
        if (postData?.query?.includes('universities')) {
          attemptCount++;
          if (attemptCount === 1) {
            // Fail first attempt
            await route.abort('networkfailure');
          } else {
            // Succeed on retry
            await route.continue();
          }
        } else {
          await route.continue();
        }
      });

      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Should show error initially
      const errorMessage = page.locator('text=/error/i, text=/failed/i');
      await expect(errorMessage).toBeVisible();
      
      // Look for retry button and click it
      const retryButton = page.locator('button:has-text("retry"), button:has-text("נסה שוב")');
      if (await retryButton.isVisible()) {
        await retryButton.click();
      } else {
        // If no explicit retry button, reload the page
        await page.reload();
      }
      
      // Should eventually load successfully
      await expect(onboardingPage.universitySelect).toBeEnabled({ timeout: 10000 });
      await expect(onboardingPage.universitySelect).not.toContainText(/error|failed/i);
    });
  });

  test.describe('Complete User Workflows', () => {
    test('should complete full onboarding with university and degree', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Complete full workflow
      await onboardingPage.selectUniversity('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');
      await onboardingPage.toggleAdvancedSection();
      await onboardingPage.setAddAllDegreeCourses(true);
      await onboardingPage.agreeAndFinish();
      
      // Verify successful completion
      await expect(page).toHaveURL('/my-journey');
      
      // Take screenshot of successful completion
      await expect(page).toHaveScreenshot('profile-setup-complete-with-degree.png');
    });

    test('should complete onboarding with university only (no degree)', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Select university but skip degree
      await onboardingPage.selectUniversity('The Open University Of Israel');
      
      // Verify no degree message appears
      const noDegreeMessage = page.locator('#profile-no-degree-message, text=/you can always add/i');
      await expect(noDegreeMessage).toBeVisible();
      
      // Complete onboarding
      await onboardingPage.agreeAndFinish();
      
      // Verify successful completion
      await expect(page).toHaveURL('/my-journey');
      
      // Take screenshot
      await expect(page).toHaveScreenshot('profile-setup-complete-no-degree.png');
    });

    test('should handle form validation errors appropriately', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Try to submit without any selections
      await onboardingPage.finishButton.click();
      
      // Should show validation errors
      const universityError = page.locator('text=/university.*required/i');
      const termsError = page.locator('text=/terms.*required/i');
      
      await expect(universityError).toBeVisible();
      await expect(termsError).toBeVisible();
      
      // Should remain on onboarding page
      await expect(page).toHaveURL(/\/onboarding/);
      
      // Fix one error at a time
      await onboardingPage.selectUniversity('The Open University Of Israel');
      
      // University error should disappear
      await expect(universityError).not.toBeVisible();
      
      // Terms error should still be visible
      await expect(termsError).toBeVisible();
      
      // Complete form
      await onboardingPage.agreeAndFinish();
      await expect(page).toHaveURL('/my-journey');
    });

    test('should preserve form state during navigation interruptions', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Partially complete form
      await onboardingPage.selectUniversity('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');
      
      // Navigate away
      await page.goto('/degrees');
      await expect(page).toHaveURL('/degrees');
      
      // Return to onboarding
      await page.goto('/onboarding');
      
      // Form state should be preserved
      await expect(onboardingPage.universitySelect).toContainText('Open University');
      await expect(onboardingPage.degreeSelect).toContainText('Computer Science');
      
      // Should be able to complete
      await onboardingPage.agreeAndFinish();
      await expect(page).toHaveURL('/my-journey');
    });
  });

  test.describe('Visual Regression', () => {
    test('should match expected visual appearance on desktop', async ({ 
      page, 
      testDataManager 
    }) => {
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      // Take screenshot of initial state
      await expect(page.locator('#profile-setup-step')).toHaveScreenshot('profile-setup-initial-desktop.png');
      
      // After university selection
      await onboardingPage.selectUniversity('The Open University Of Israel');
      await expect(page.locator('#profile-setup-step')).toHaveScreenshot('profile-setup-university-selected-desktop.png');
      
      // After degree selection
      await onboardingPage.selectDegree('Computer Science');
      await expect(page.locator('#profile-setup-step')).toHaveScreenshot('profile-setup-degree-selected-desktop.png');
      
      // With advanced options expanded
      await onboardingPage.toggleAdvancedSection();
      await expect(page.locator('#profile-setup-step')).toHaveScreenshot('profile-setup-advanced-expanded-desktop.png');
    });

    test('should match expected visual appearance on mobile', async ({ 
      page, 
      testDataManager 
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const userData = testDataManager.generateUser();
      const loginPage = new LoginPage(page);
      const onboardingPage = new OnboardingPage(page);
      
      await page.goto('/');
      await loginPage.login(userData.email, userData.password);
      
      await expect(page.locator('#profile-setup-step')).toHaveScreenshot('profile-setup-initial-mobile.png');
      
      // Test dropdown appearance on mobile
      await onboardingPage.universitySelect.click();
      await expect(page).toHaveScreenshot('profile-setup-dropdown-mobile.png');
    });
  });
});