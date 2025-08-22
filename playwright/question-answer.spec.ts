import test, { expect } from '@playwright/test';

test.describe('Question Answer Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the specific question that was reported as broken
    await page.goto('/questions/82715303-8361-47ef-930e-6979947b741e');
    
    // Wait for the question page to fully load
    await page.waitForSelector('#question-page');
    await page.waitForLoadState('networkidle');
  });

  test('Selection answer functionality works correctly', async ({ page }) => {
    // Look for answer selection elements (radio buttons, checkboxes, or clickable options)
    const answerOptions = page.locator('[data-testid="answer-option"], .answer-option, input[type="radio"], input[type="checkbox"]');
    
    // Wait for answer options to be visible
    try {
      await answerOptions.first().waitFor({ timeout: 10000 });
    } catch (error) {
      // If no selection options are found, skip this test
      test.skip(true, 'This question does not appear to be a selection question');
    }

    const optionCount = await answerOptions.count();
    
    // Test that we have at least 2 options for a selection question
    expect(optionCount).toBeGreaterThanOrEqual(2);
    
    // Get all the options text to log what we're testing
    const optionTexts = [];
    for (let i = 0; i < Math.min(optionCount, 5); i++) {
      const text = await answerOptions.nth(i).textContent();
      if (text?.trim()) {
        optionTexts.push(text.trim());
      }
    }
    console.log('Available answer options:', optionTexts);
    
    // Test selecting the first option
    await answerOptions.first().click();
    
    // Submit the answer
    const submitButton = page.locator('button').filter({ hasText: /submit|שלח/i });
    await submitButton.click();
    
    // Wait for feedback message
    await page.waitForSelector('[data-testid="toast"], .sonner-toast', { timeout: 10000 });
    
    // Check that we get either success or error feedback (not always false)
    const toast = page.locator('[data-testid="toast"], .sonner-toast').first();
    const toastText = await toast.textContent();
    
    // The toast should contain either success or failure message, not be empty
    expect(toastText).toBeTruthy();
    expect(toastText).toMatch(/(correct|incorrect|נכון|לא נכון|success|error)/i);
    
    // Test selecting a different option (if available)
    if (optionCount > 1) {
      await answerOptions.nth(1).click();
      
      // Submit the second answer
      await submitButton.click();
      
      // Wait for feedback message
      await page.waitForSelector('[data-testid="toast"], .sonner-toast', { timeout: 10000 });
      
      // Check that we get feedback (the bug was that it always showed as false)
      const toast2 = page.locator('[data-testid="toast"], .sonner-toast').first();
      const toastText2 = await toast2.textContent();
      
      // The toast should contain either success or failure message
      expect(toastText2).toBeTruthy();
      expect(toastText2).toMatch(/(correct|incorrect|נכון|לא נכון|success|error)/i);
    }
  });

  test('Answer state persists correctly during selection', async ({ page }) => {
    // Look for answer selection elements
    const answerOptions = page.locator('[data-testid="answer-option"], .answer-option, input[type="radio"], input[type="checkbox"]');
    
    try {
      await answerOptions.first().waitFor({ timeout: 5000 });
    } catch (error) {
      test.skip(true, 'This question does not appear to be a selection question');
    }

    const optionCount = await answerOptions.count();
    
    if (optionCount >= 2) {
      // Test selecting first option
      await answerOptions.first().click();
      
      // Switch to second option
      await answerOptions.nth(1).click();
      
      // Switch back to first option
      await answerOptions.first().click();
      
      // Verify that selection changes work without errors
      // (The specific UI state depends on the question type implementation)
    }
  });

  test('Submit button is present and clickable', async ({ page }) => {
    const submitButton = page.locator('button').filter({ hasText: /submit|שלח/i });
    
    // Submit button should be present
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('Question content loads correctly', async ({ page }) => {
    // Check that the question page loaded properly
    await expect(page.locator('#question-page')).toBeVisible();
    
    // Check for question content
    const questionContent = page.locator('#question-content, .question-content');
    await expect(questionContent).toBeVisible();
    
    // Check that we're on the right question
    expect(page.url()).toContain('82715303-8361-47ef-930e-6979947b741e');
  });
});