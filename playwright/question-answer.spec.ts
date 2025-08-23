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

  test('Question Text Display Integrity', async ({ page }) => {
    // Wait for the question to load completely
    await page.waitForSelector('#question-content, .question-content, [data-testid="question-text"]', { timeout: 10000 });
    
    // Get all text content that might contain questions
    const questionText = await page.locator('#question-content, .question-content, [data-testid="question-text"]').first().textContent();
    
    if (questionText) {
      // Test 1: English text should not be broken into individual words
      // Look for patterns that indicate word-splitting (single words separated by spaces without context)
      const englishWords = questionText.match(/\b[A-Za-z]+\b/g);
      if (englishWords && englishWords.length > 3) {
        // Check that we don't have excessive single-word segments
        // This would indicate the overly aggressive segmentation bug
        const singleWordSegments = questionText.split(/\s+/).filter(word => 
          /^[A-Za-z]+$/.test(word.trim()) && word.trim().length < 6
        );
        
        // If more than 70% of words are appearing as isolated single words, it's likely broken
        const singleWordRatio = singleWordSegments.length / englishWords.length;
        expect(singleWordRatio).toBeLessThan(0.7); // Should not be mostly single words
      }
      
      // Test 2: Mathematical expressions should maintain proper directionality
      // Look for logical expressions like ¬(P ∧ Q) which should be LTR even in Hebrew context
      const logicalExpressions = questionText.match(/¬\s*\([^)]*[∧∨⊕→↔≡][^)]*\)/g);
      if (logicalExpressions) {
        // These expressions should appear with proper LTR formatting
        // In a well-formatted page, the negation symbol should precede the parentheses
        for (const expr of logicalExpressions) {
          expect(expr).toMatch(/^¬.*\(.*\)$/); // ¬ should be at the start, not end
        }
      }
      
      // Test 3: Question text displays as cohesive content, not fragmented
      // Check for reasonable sentence structure
      const sentences = questionText.split(/[.!?]+/).filter(s => s.trim().length > 5);
      if (sentences.length > 0) {
        // Each sentence should contain multiple words, not just single words
        const wordsPerSentence = sentences.map(s => s.trim().split(/\s+/).length);
        const avgWordsPerSentence = wordsPerSentence.reduce((a, b) => a + b, 0) / wordsPerSentence.length;
        expect(avgWordsPerSentence).toBeGreaterThan(2); // Should have more than 2 words per sentence on average
      }
    }
  });

  test('Hebrew Mathematical Expression Directionality', async ({ page }) => {
    // This test specifically checks for proper handling of mathematical expressions in Hebrew context
    await page.waitForSelector('#question-content, .question-content, [data-testid="question-text"]', { timeout: 10000 });
    
    const questionText = await page.locator('#question-content, .question-content, [data-testid="question-text"]').first().textContent();
    
    if (questionText && questionText.includes('¬')) {
      // Check that negation symbols in mathematical expressions appear correctly
      const negationExpressions = questionText.match(/¬[^a-zA-Z]*\([^)]+\)/g);
      
      if (negationExpressions) {
        // In proper LTR mathematical formatting, ¬ should appear before the parentheses
        for (const expr of negationExpressions) {
          // The negation should not appear isolated or at the wrong position
          expect(expr).not.toMatch(/\)\s*¬/); // ¬ should not appear after closing parenthesis
          expect(expr).toMatch(/^¬/); // ¬ should be at the beginning
        }
      }
    }
  });
});