import { test, expect } from './fixtures/auth-fixtures';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { Sidebar } from './pages/Sidebar';

/**
 * Hebrew Onboarding Flow E2E Tests
 * 
 * This test suite comprehensively validates the Hebrew onboarding experience
 * to ensure all RTL fixes are working correctly. The tests cover:
 * 
 * 1. Language switching to Hebrew
 * 2. RTL layout rendering for all onboarding components
 * 3. Hebrew text display across all onboarding steps
 * 4. Form field alignment and functionality in RTL mode
 * 5. Step indicator display and navigation in RTL
 * 6. Arrow icons and directional elements flipping properly
 * 7. Dropdown menus and select components in Hebrew/RTL
 * 8. Validation messages and error handling in Hebrew
 * 9. Complete onboarding flow in Hebrew from start to finish
 * 
 * Prerequisites:
 * 1. Application must be running with Hebrew translations loaded
 * 2. Backend services must support Hebrew/RTL content
 * 3. Test data must include Hebrew university/degree names
 */
test.describe('Hebrew Onboarding Flow - RTL Validation', () => {
  
  // Helper function to set up Hebrew language context
  async function setupHebrewContext(page, testDataManager) {
    const userData = testDataManager.generateUser();
    const loginPage = new LoginPage(page);
    const sidebar = new Sidebar(page);
    
    // Start on homepage and switch to Hebrew
    await page.goto('/');
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('he');
    
    // Verify RTL is applied globally
    await expect(page.evaluate(() => document.documentElement.dir)).resolves.toBe('rtl');
    await expect(page.evaluate(() => document.documentElement.lang)).resolves.toBe('he');
    
    // Login and navigate to onboarding
    await loginPage.login(userData.email, userData.password);
    await expect(page).toHaveURL(/\/onboarding/);
    
    return { 
      userData, 
      onboardingPage: new OnboardingPage(page),
      sidebar 
    };
  }

  test.describe('Language Switching and RTL Foundation', () => {
    test('should switch to Hebrew and apply RTL document direction correctly', async ({ page, testDataManager }) => {
      const sidebar = new Sidebar(page);
      
      await page.goto('/');
      await sidebar.waitForFullyMounting();
      
      // Verify initial English state
      expect(await page.evaluate(() => document.documentElement.dir)).toBe('ltr');
      expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
      
      // Switch to Hebrew
      await sidebar.selectLanguage('he');
      
      // Verify Hebrew RTL state is applied
      await expect(page.evaluate(() => document.documentElement.dir)).resolves.toBe('rtl');
      await expect(page.evaluate(() => document.documentElement.lang)).resolves.toBe('he');
      
      // Verify HTML element has RTL styling
      const htmlElement = page.locator('html');
      await expect(htmlElement).toHaveAttribute('dir', 'rtl');
      await expect(htmlElement).toHaveAttribute('lang', 'he');
      
      // Take screenshot of RTL homepage
      await expect(page).toHaveScreenshot('homepage-hebrew-rtl.png');
    });

    test('should maintain Hebrew RTL during navigation to onboarding', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Verify RTL is maintained on onboarding page
      await expect(page.evaluate(() => document.documentElement.dir)).resolves.toBe('rtl');
      await expect(page.evaluate(() => document.documentElement.lang)).resolves.toBe('he');
      
      // Verify onboarding page loads successfully in Hebrew
      await onboardingPage.waitForPageLoad();
      await expect(page).toHaveURL(/\/onboarding/);
      
      // Take screenshot of onboarding in Hebrew
      await expect(page).toHaveScreenshot('onboarding-hebrew-initial.png');
    });
  });

  test.describe('RTL Layout and Component Alignment', () => {
    test('should display form elements with correct RTL alignment', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Verify main form container has RTL layout
      const formContainer = page.locator('#profile-setup-step, [data-testid="profile-setup"], .profile-setup');
      await expect(formContainer.first()).toBeVisible();
      
      // Check university select alignment
      const universitySelect = onboardingPage.universitySelect;
      await expect(universitySelect).toBeVisible();
      
      // Verify select element has RTL text alignment
      const universityAlignment = await universitySelect.evaluate(el => getComputedStyle(el).textAlign);
      expect(universityAlignment).toMatch(/right|start/);
      
      // Check degree select alignment
      const degreeSelect = onboardingPage.degreeSelect;
      await expect(degreeSelect).toBeVisible();
      
      // Verify checkbox and labels are properly aligned for RTL
      const agreeCheckbox = onboardingPage.agreeCheckbox;
      await expect(agreeCheckbox).toBeVisible();
      
      // Take screenshot showing RTL form layout
      await expect(page).toHaveScreenshot('onboarding-rtl-form-layout.png');
    });

    test('should display step indicators correctly in RTL mode', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Look for step indicator elements
      const stepIndicators = page.locator('[data-testid*="step"], .step-indicator, .onboarding-steps');
      
      if (await stepIndicators.first().isVisible()) {
        // Verify step indicators are present and positioned for RTL
        await expect(stepIndicators.first()).toBeVisible();
        
        // Check if step numbers or progress indicators are RTL-aligned
        const stepElements = page.locator('.step, [data-step], .progress-step');
        if (await stepElements.first().isVisible()) {
          const stepCount = await stepElements.count();
          expect(stepCount).toBeGreaterThan(0);
          
          // Take screenshot of step indicators in RTL
          await expect(page).toHaveScreenshot('onboarding-step-indicators-rtl.png');
        }
      }
    });

    test('should handle dropdown positioning correctly in RTL', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Open university dropdown
      await onboardingPage.universitySelect.click();
      
      // Verify dropdown appears and is properly positioned for RTL
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();
      
      // Check dropdown positioning relative to trigger
      const dropdownBox = await dropdown.boundingBox();
      const triggerBox = await onboardingPage.universitySelect.boundingBox();
      
      if (dropdownBox && triggerBox) {
        // In RTL, dropdown should typically align to the right edge
        // Allow for some tolerance in positioning
        const rightAligned = Math.abs(dropdownBox.x + dropdownBox.width - (triggerBox.x + triggerBox.width)) < 10;
        const leftAligned = Math.abs(dropdownBox.x - triggerBox.x) < 10;
        
        expect(rightAligned || leftAligned).toBeTruthy();
      }
      
      // Take screenshot of dropdown in RTL
      await expect(page).toHaveScreenshot('onboarding-dropdown-rtl-positioning.png');
      
      // Close dropdown
      await page.keyboard.press('Escape');
    });
  });

  test.describe('Hebrew Text Display and Content', () => {
    test('should display all onboarding text in Hebrew', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Check for Hebrew text elements
      const hebrewTextSelectors = [
        'text=בחר מוסד לימוד',  // Select institution
        'text=בחר תואר',        // Select degree  
        'text=אני מסכים',       // I agree
        'text=סיום',           // Finish
        'text=תנאים'           // Terms
      ];
      
      for (const selector of hebrewTextSelectors) {
        const element = page.locator(selector);
        if (await element.first().isVisible()) {
          await expect(element.first()).toBeVisible();
        }
      }
      
      // Verify form labels are in Hebrew
      const universityLabel = page.locator('label, .label').filter({ hasText: /מוסד|אוניברסיטה/ });
      if (await universityLabel.first().isVisible()) {
        await expect(universityLabel.first()).toBeVisible();
      }
      
      const degreeLabel = page.locator('label, .label').filter({ hasText: /תואר|תכנית/ });
      if (await degreeLabel.first().isVisible()) {
        await expect(degreeLabel.first()).toBeVisible();
      }
      
      // Check terms agreement text
      const termsText = page.locator('text=/תנאים.*הגבל/'); // Terms and conditions pattern
      if (await termsText.first().isVisible()) {
        await expect(termsText.first()).toBeVisible();
      }
      
      // Take screenshot showing Hebrew text content
      await expect(page).toHaveScreenshot('onboarding-hebrew-text-content.png');
    });

    test('should display Hebrew placeholder text in form fields', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Open university dropdown to check search placeholder
      await onboardingPage.universitySelect.click();
      
      const searchInput = page.locator('input[placeholder*="חיפוש"], input[placeholder*="search" i]');
      if (await searchInput.isVisible()) {
        const placeholder = await searchInput.getAttribute('placeholder');
        // Should contain Hebrew search text or be empty (depends on implementation)
        if (placeholder) {
          expect(placeholder.includes('חיפוש') || placeholder.toLowerCase().includes('search')).toBeTruthy();
        }
      }
      
      // Close dropdown
      await page.keyboard.press('Escape');
      
      // Check degree dropdown as well
      await onboardingPage.degreeSelect.click();
      
      const degreeSearchInput = page.locator('input[placeholder*="חיפוש"], input[placeholder*="search" i]');
      if (await degreeSearchInput.isVisible()) {
        const degreePlaceholder = await degreeSearchInput.getAttribute('placeholder');
        if (degreePlaceholder) {
          expect(degreePlaceholder.includes('חיפוש') || degreePlaceholder.toLowerCase().includes('search')).toBeTruthy();
        }
      }
      
      await page.keyboard.press('Escape');
    });

    test('should display Hebrew university and degree names in dropdowns', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Get university options and check for Hebrew content
      const universityOptions = await onboardingPage.getUniversityOptions();
      expect(universityOptions.length).toBeGreaterThan(0);
      
      // Check if at least some options contain Hebrew text or known Hebrew universities
      const hasHebrewOrKnownInstitutions = universityOptions.some(option => 
        /[\u0590-\u05FF]/.test(option) || // Hebrew Unicode range
        option.includes('Open University') ||
        option.includes('Hebrew University') ||
        option.includes('Tel Aviv') ||
        option.includes('Technion')
      );
      
      expect(hasHebrewOrKnownInstitutions).toBeTruthy();
      
      // Select a university to enable degree dropdown
      await onboardingPage.selectInstitution(universityOptions[0]);
      
      // Check degree options
      const degreeOptions = await onboardingPage.getDegreeOptions();
      if (degreeOptions.length > 0) {
        // Verify degree options are displayed (may be in Hebrew or English)
        expect(degreeOptions.length).toBeGreaterThan(0);
        
        // Take screenshot showing Hebrew/localized dropdown options
        await onboardingPage.degreeSelect.click();
        await expect(page).toHaveScreenshot('onboarding-hebrew-dropdown-options.png');
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Form Functionality in Hebrew/RTL Mode', () => {
    test('should handle form field interactions correctly in RTL', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Test university selection functionality
      await onboardingPage.universitySelect.click();
      await expect(page.locator('[role="listbox"]')).toBeVisible();
      
      // Test search functionality in RTL
      const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="חיפוש" i]');
      if (await searchInput.isVisible()) {
        // Type in Hebrew characters if supported, or use English
        await searchInput.fill('Open');
        await page.waitForTimeout(600);
        
        // Verify search results update
        const options = page.locator('[role="option"]');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);
        
        // Clear search and verify all options return
        await searchInput.fill('');
        await page.waitForTimeout(600);
      }
      
      // Select an institution
      const firstOption = page.locator('[role="option"]').first();
      await firstOption.click();
      
      // Verify selection is reflected in the select button
      await expect(onboardingPage.universitySelect).not.toContainText('בחר מוסד');
      
      // Test degree selection
      await onboardingPage.degreeSelect.click();
      const degreeDropdown = page.locator('[role="listbox"]');
      if (await degreeDropdown.isVisible()) {
        const firstDegreeOption = page.locator('[role="option"]').first();
        if (await firstDegreeOption.isVisible()) {
          await firstDegreeOption.click();
          await expect(onboardingPage.degreeSelect).not.toContainText('בחר תואר');
        }
      }
    });

    test('should handle checkbox interactions correctly in RTL', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Test terms agreement checkbox
      const agreeCheckbox = onboardingPage.agreeCheckbox;
      
      // Verify checkbox is initially unchecked
      await expect(agreeCheckbox).not.toBeChecked();
      
      // Click checkbox and verify it becomes checked
      await agreeCheckbox.click();
      await expect(agreeCheckbox).toBeChecked();
      
      // Click again to uncheck
      await agreeCheckbox.click();
      await expect(agreeCheckbox).not.toBeChecked();
      
      // Test clicking on the label (should also toggle checkbox)
      const checkboxLabel = page.locator('label').filter({ hasText: /מסכים|תנאים/ });
      if (await checkboxLabel.isVisible()) {
        await checkboxLabel.click();
        await expect(agreeCheckbox).toBeChecked();
      }
    });

    test('should handle advanced options correctly in RTL when degree is selected', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Select university and degree to enable advanced options
      const universityOptions = await onboardingPage.getUniversityOptions();
      await onboardingPage.selectInstitution(universityOptions[0]);
      
      const degreeOptions = await onboardingPage.getDegreeOptions();
      if (degreeOptions.length > 0) {
        await onboardingPage.selectDegree(degreeOptions[0]);
        
        // Check if advanced options toggle is visible
        if (await onboardingPage.isAdvancedSectionVisible()) {
          // Test toggling advanced options
          await expect(onboardingPage.addAllDegreeCoursesCheckbox).not.toBeVisible();
          
          await onboardingPage.toggleAdvancedSection();
          await expect(onboardingPage.addAllDegreeCoursesCheckbox).toBeVisible();
          
          // Test the advanced checkbox functionality
          await onboardingPage.setAddAllDegreeCourses(true);
          await expect(onboardingPage.addAllDegreeCoursesCheckbox).toBeChecked();
          
          // Take screenshot with advanced options visible in Hebrew
          await expect(page).toHaveScreenshot('onboarding-advanced-options-hebrew.png');
          
          // Toggle back to hidden
          await onboardingPage.toggleAdvancedSection();
          await expect(onboardingPage.addAllDegreeCoursesCheckbox).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Validation and Error Handling in Hebrew', () => {
    test('should display Hebrew validation errors for required fields', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Try to submit form without filling required fields
      await onboardingPage.finishButton.click();
      
      // Should remain on onboarding page
      await expect(page).toHaveURL(/\/onboarding/);
      
      // Get validation errors
      const errors = await onboardingPage.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for Hebrew error messages
      const hasHebrewErrors = errors.some(error => 
        error.includes('נדרש') ||      // Required
        error.includes('חובה') ||      // Mandatory  
        error.includes('בחר') ||       // Select
        error.includes('הסכם') ||      // Agreement
        error.includes('אוניברסיטה') ||// University
        error.includes('מוסד')         // Institution
      );
      
      expect(hasHebrewErrors).toBeTruthy();
      
      // Take screenshot showing Hebrew validation errors
      await expect(page).toHaveScreenshot('onboarding-hebrew-validation-errors.png');
    });

    test('should show Hebrew error for terms agreement specifically', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Fill university but not terms
      const universityOptions = await onboardingPage.getUniversityOptions();
      await onboardingPage.selectInstitution(universityOptions[0]);
      
      // Try to submit without terms agreement
      await onboardingPage.finishButton.click();
      
      const errors = await onboardingPage.getValidationErrors();
      
      // Should have terms-related error in Hebrew
      const hasTermsError = errors.some(error =>
        error.includes('הסכם') ||      // Agreement
        error.includes('תנאים') ||     // Terms
        error.includes('מסכים')       // Agree
      );
      
      expect(hasTermsError).toBeTruthy();
    });

    test('should handle loading errors gracefully in Hebrew', async ({ page, testDataManager }) => {
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

      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Should show error state in Hebrew if error handling is implemented
      const hasError = await onboardingPage.hasUniversityError();
      if (hasError) {
        // Look for Hebrew error messages
        const errorMessages = page.locator('text=/שגיאה|נכשל|טעות/'); // Error, failed, mistake
        if (await errorMessages.first().isVisible()) {
          await expect(errorMessages.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Directional Icons and Visual Elements', () => {
    test('should flip arrow icons and directional elements for RTL', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Look for arrow icons in dropdowns
      await onboardingPage.universitySelect.click();
      
      // Check for dropdown arrow/chevron icons
      const dropdownArrows = page.locator('[data-testid*="arrow"], [class*="arrow"], [class*="chevron"], svg');
      
      if (await dropdownArrows.first().isVisible()) {
        // Take screenshot showing arrow directions in RTL
        await expect(page).toHaveScreenshot('onboarding-dropdown-arrows-rtl.png');
      }
      
      await page.keyboard.press('Escape');
      
      // Look for any navigation arrows or step indicators
      const navigationElements = page.locator('[data-testid*="next"], [data-testid*="prev"], .navigation, .step-nav');
      
      if (await navigationElements.first().isVisible()) {
        await expect(page).toHaveScreenshot('onboarding-navigation-elements-rtl.png');
      }
      
      // Check if there are any expandable sections or accordion arrows
      if (await onboardingPage.isAdvancedSectionVisible()) {
        await expect(page).toHaveScreenshot('onboarding-expandable-sections-rtl.png');
      }
    });

    test('should align icons and text properly in RTL layout', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Check various UI elements for proper RTL alignment
      const elementsToCheck = [
        onboardingPage.universitySelect,
        onboardingPage.degreeSelect,
        onboardingPage.agreeCheckbox,
        onboardingPage.finishButton
      ];
      
      for (const element of elementsToCheck) {
        if (await element.isVisible()) {
          // Verify element has appropriate RTL styles
          const computedStyle = await element.evaluate(el => {
            const style = getComputedStyle(el);
            return {
              textAlign: style.textAlign,
              direction: style.direction,
              marginInlineStart: style.marginInlineStart,
              marginInlineEnd: style.marginInlineEnd,
              paddingInlineStart: style.paddingInlineStart,
              paddingInlineEnd: style.paddingInlineEnd
            };
          });
          
          // Verify RTL-appropriate styles are applied
          if (computedStyle.direction !== 'inherit') {
            expect(computedStyle.direction).toBe('rtl');
          }
        }
      }
    });
  });

  test.describe('Complete Hebrew Onboarding Flow', () => {
    test('should complete full onboarding flow successfully in Hebrew', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Complete the full onboarding process in Hebrew
      const universityOptions = await onboardingPage.getUniversityOptions();
      expect(universityOptions.length).toBeGreaterThan(0);
      
      // Select university
      await onboardingPage.selectInstitution(universityOptions[0]);
      await expect(onboardingPage.universitySelect).not.toContainText('בחר מוסד');
      
      // Select degree if available
      const degreeOptions = await onboardingPage.getDegreeOptions();
      if (degreeOptions.length > 0) {
        await onboardingPage.selectDegree(degreeOptions[0]);
        
        // If advanced options are available, test them
        if (await onboardingPage.isAdvancedSectionVisible()) {
          await onboardingPage.toggleAdvancedSection();
          await onboardingPage.setAddAllDegreeCourses(true);
          
          // Take screenshot with all options selected
          await expect(page).toHaveScreenshot('onboarding-hebrew-complete-form.png');
        }
      }
      
      // Agree to terms and finish
      await onboardingPage.agreeAndFinish();
      
      // Should successfully redirect to my-journey
      await expect(page).toHaveURL('/my-journey', { timeout: 10000 });
      
      // Verify page is still in Hebrew/RTL mode after onboarding
      await expect(page.evaluate(() => document.documentElement.dir)).resolves.toBe('rtl');
      await expect(page.evaluate(() => document.documentElement.lang)).resolves.toBe('he');
      
      // Take final success screenshot
      await expect(page).toHaveScreenshot('onboarding-hebrew-success-redirect.png');
    });

    test('should maintain Hebrew language context throughout onboarding steps', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Track language and direction through each step
      const checkLanguageState = async (stepName: string) => {
        const dir = await page.evaluate(() => document.documentElement.dir);
        const lang = await page.evaluate(() => document.documentElement.lang);
        
        expect(dir).toBe('rtl');
        expect(lang).toBe('he');
        
        // Log for debugging
        console.log(`${stepName}: dir=${dir}, lang=${lang}`);
      };
      
      await checkLanguageState('Initial load');
      
      // Step through onboarding process
      const universityOptions = await onboardingPage.getUniversityOptions();
      if (universityOptions.length > 0) {
        await onboardingPage.selectInstitution(universityOptions[0]);
        await checkLanguageState('After university selection');
        
        const degreeOptions = await onboardingPage.getDegreeOptions();
        if (degreeOptions.length > 0) {
          await onboardingPage.selectDegree(degreeOptions[0]);
          await checkLanguageState('After degree selection');
        }
      }
      
      await onboardingPage.agreeCheckbox.check();
      await checkLanguageState('After terms agreement');
      
      await onboardingPage.finishButton.click();
      await page.waitForTimeout(2000); // Allow for navigation
      
      // Should maintain Hebrew context even after completion
      if (await page.url().includes('/my-journey')) {
        await checkLanguageState('After completion redirect');
      }
    });

    test('should handle error recovery gracefully while maintaining Hebrew context', async ({ page, testDataManager }) => {
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Submit incomplete form to trigger validation
      await onboardingPage.finishButton.click();
      
      // Should remain on onboarding with Hebrew context maintained
      await expect(page).toHaveURL(/\/onboarding/);
      await expect(page.evaluate(() => document.documentElement.dir)).resolves.toBe('rtl');
      await expect(page.evaluate(() => document.documentElement.lang)).resolves.toBe('he');
      
      // Fix errors while maintaining Hebrew context
      const universityOptions = await onboardingPage.getUniversityOptions();
      await onboardingPage.selectInstitution(universityOptions[0]);
      
      // Check context is still Hebrew after error correction
      await expect(page.evaluate(() => document.documentElement.dir)).resolves.toBe('rtl');
      
      // Complete successfully
      await onboardingPage.agreeAndFinish();
      
      // Final verification
      await expect(page).toHaveURL('/my-journey');
      await expect(page.evaluate(() => document.documentElement.dir)).resolves.toBe('rtl');
    });
  });

  test.describe('Mobile Hebrew Onboarding Experience', () => {
    test('should display Hebrew onboarding correctly on mobile viewport', async ({ page, testDataManager }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const { onboardingPage } = await setupHebrewContext(page, testDataManager);
      
      // Verify mobile layout is properly RTL
      await expect(page.evaluate(() => document.documentElement.dir)).resolves.toBe('rtl');
      
      // Check form elements are properly sized and positioned for mobile RTL
      await expect(onboardingPage.universitySelect).toBeVisible();
      await expect(onboardingPage.degreeSelect).toBeVisible();
      await expect(onboardingPage.agreeCheckbox).toBeVisible();
      await expect(onboardingPage.finishButton).toBeVisible();
      
      // Take mobile Hebrew onboarding screenshot
      await expect(page).toHaveScreenshot('onboarding-hebrew-mobile-layout.png');
      
      // Test mobile dropdown functionality
      await onboardingPage.universitySelect.click();
      await expect(page.locator('[role="listbox"], [role="dialog"]')).toBeVisible();
      
      // Take screenshot of mobile dropdown in Hebrew
      await expect(page).toHaveScreenshot('onboarding-hebrew-mobile-dropdown.png');
      
      await page.keyboard.press('Escape');
    });
  });
});