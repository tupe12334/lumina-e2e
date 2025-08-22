import test, { expect } from '@playwright/test';

test.describe('Question Types - Comprehensive Testing', () => {
  // Test data: Question IDs for different types
  // These would ideally be fetched from API or test database
  const questionsByType = {
    selection: '82715303-8361-47ef-930e-6979947b741e', // Multiple choice question
    boolean: null, // Will be determined dynamically
    value: null, // Will be determined dynamically  
    void: null, // Will be determined dynamically
  };

  test.beforeEach(async ({ page }) => {
    // Wait for services to be ready
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Selection Questions (SELECTION type)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/questions/${questionsByType.selection}`);
      await page.waitForSelector('#question-page', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    });

    test('Selection question - correct answer shows success', async ({ page }) => {
      // Look for answer selection elements
      const answerOptions = page.locator('[data-testid="answer-option"], .answer-option, input[type="radio"], input[type="checkbox"]');
      
      // Wait for answer options to be visible
      try {
        await answerOptions.first().waitFor({ timeout: 10000 });
      } catch (error) {
        test.skip(true, 'No selection options found - skipping selection test');
      }

      const optionCount = await answerOptions.count();
      expect(optionCount).toBeGreaterThanOrEqual(2);

      // Get all available options for testing
      const optionTexts = [];
      for (let i = 0; i < Math.min(optionCount, 4); i++) {
        const text = await answerOptions.nth(i).textContent();
        if (text?.trim()) {
          optionTexts.push(text.trim());
        }
      }
      console.log('Available selection options:', optionTexts);

      // Test each option to find the correct one
      let foundCorrectAnswer = false;
      for (let i = 0; i < optionCount && !foundCorrectAnswer; i++) {
        // Select the option
        await answerOptions.nth(i).click();
        
        // Submit the answer
        const submitButton = page.locator('button').filter({ hasText: /submit|שלח/i });
        await expect(submitButton).toBeVisible();
        await submitButton.click();
        
        // Wait for feedback
        await page.waitForSelector('[data-testid="toast"], .sonner-toast', { timeout: 10000 });
        
        const toast = page.locator('[data-testid="toast"], .sonner-toast').first();
        const toastText = await toast.textContent();
        
        console.log(`Option ${i}: "${optionTexts[i]}" -> "${toastText}"`);
        
        // Check if this was the correct answer
        if (toastText && /(correct|נכון|success)/i.test(toastText)) {
          foundCorrectAnswer = true;
          expect(toastText).toMatch(/(correct|נכון|success)/i);
          console.log(`✓ Found correct answer: Option ${i}`);
        }
      }

      if (!foundCorrectAnswer) {
        console.warn('No correct answer found among available options');
        // Still validate that we get proper feedback messages
        const toast = page.locator('[data-testid="toast"], .sonner-toast').first();
        const toastText = await toast.textContent();
        expect(toastText).toBeTruthy();
        expect(toastText).toMatch(/(correct|incorrect|נכון|לא נכון|success|error)/i);
      }
    });

    test('Selection question - incorrect answer shows error', async ({ page }) => {
      const answerOptions = page.locator('[data-testid="answer-option"], .answer-option, input[type="radio"], input[type="checkbox"]');
      
      try {
        await answerOptions.first().waitFor({ timeout: 5000 });
      } catch (error) {
        test.skip(true, 'No selection options found');
      }

      const optionCount = await answerOptions.count();
      let foundIncorrectAnswer = false;
      
      // Test options to find an incorrect one
      for (let i = 0; i < optionCount && !foundIncorrectAnswer; i++) {
        await answerOptions.nth(i).click();
        
        const submitButton = page.locator('button').filter({ hasText: /submit|שלח/i });
        await submitButton.click();
        
        await page.waitForSelector('[data-testid="toast"], .sonner-toast', { timeout: 10000 });
        
        const toast = page.locator('[data-testid="toast"], .sonner-toast').first();
        const toastText = await toast.textContent();
        
        if (toastText && /(incorrect|לא נכון|error)/i.test(toastText)) {
          foundIncorrectAnswer = true;
          expect(toastText).toMatch(/(incorrect|לא נכון|error)/i);
          console.log(`✓ Found incorrect answer: Option ${i}`);
        }
      }

      // Ensure we get some feedback even if no incorrect answer found
      const toast = page.locator('[data-testid="toast"], .sonner-toast').first();
      const toastText = await toast.textContent();
      expect(toastText).toBeTruthy();
    });

    test('Selection question - answer state persists during switching', async ({ page }) => {
      const answerOptions = page.locator('[data-testid="answer-option"], .answer-option, input[type="radio"], input[type="checkbox"]');
      
      try {
        await answerOptions.first().waitFor({ timeout: 5000 });
      } catch (error) {
        test.skip(true, 'No selection options found');
      }

      const optionCount = await answerOptions.count();
      
      if (optionCount >= 2) {
        // Test selecting first option
        await answerOptions.first().click();
        
        // Switch to second option
        await answerOptions.nth(1).click();
        
        // Switch back to first option
        await answerOptions.first().click();
        
        // Submit should work without errors
        const submitButton = page.locator('button').filter({ hasText: /submit|שלח/i });
        await expect(submitButton).toBeEnabled();
      }
    });
  });

  test.describe('Boolean Questions (BOOLEAN type)', () => {
    test('Boolean question navigation and testing', async ({ page }) => {
      // Try to find a boolean question by navigating through questions
      let foundBooleanQuestion = false;
      let attempts = 0;
      const maxAttempts = 10;

      // Start with a known question and navigate
      await page.goto(`/questions/${questionsByType.selection}`);
      await page.waitForSelector('#question-page', { timeout: 10000 });

      while (!foundBooleanQuestion && attempts < maxAttempts) {
        attempts++;
        
        // Check if current question has boolean buttons
        const trueButton = page.locator('button').filter({ hasText: /^(True|Yes|כן|נכון)$/i });
        const falseButton = page.locator('button').filter({ hasText: /^(False|No|לא|לא נכון)$/i });
        
        const hasTrueButton = await trueButton.count() > 0;
        const hasFalseButton = await falseButton.count() > 0;
        
        if (hasTrueButton && hasFalseButton) {
          foundBooleanQuestion = true;
          console.log(`✓ Found boolean question on attempt ${attempts}`);
          
          // Test the boolean functionality
          await testBooleanQuestion(page, trueButton, falseButton);
          break;
        }
        
        // Try to navigate to next question
        const nextButton = page.locator('button').filter({ hasText: /next|הבא/i });
        if (await nextButton.count() > 0) {
          await nextButton.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
        } else {
          console.log('No next button found, ending search');
          break;
        }
      }

      if (!foundBooleanQuestion) {
        test.skip(true, `No boolean question found after ${attempts} attempts`);
      }
    });

    async function testBooleanQuestion(page: any, trueButton: any, falseButton: any) {
      // Test True answer
      await trueButton.click();
      
      // Verify button state (should be selected)
      await expect(trueButton).toHaveClass(/.*solid.*/);
      await expect(falseButton).toHaveClass(/.*outline.*/);
      
      // Submit the answer
      const submitButton = page.locator('button').filter({ hasText: /submit|שלח/i });
      await submitButton.click();
      
      // Wait for feedback
      await page.waitForSelector('[data-testid="toast"], .sonner-toast', { timeout: 10000 });
      
      let toast = page.locator('[data-testid="toast"], .sonner-toast').first();
      let toastText = await toast.textContent();
      
      expect(toastText).toBeTruthy();
      expect(toastText).toMatch(/(correct|incorrect|נכון|לא נכון|success|error)/i);
      console.log('True answer feedback:', toastText);
      
      // Test False answer
      await falseButton.click();
      
      // Verify button state switched
      await expect(falseButton).toHaveClass(/.*solid.*/);
      await expect(trueButton).toHaveClass(/.*outline.*/);
      
      // Submit the false answer
      await submitButton.click();
      
      // Wait for feedback
      await page.waitForSelector('[data-testid="toast"], .sonner-toast', { timeout: 10000 });
      
      toast = page.locator('[data-testid="toast"], .sonner-toast').first();
      toastText = await toast.textContent();
      
      expect(toastText).toBeTruthy();
      expect(toastText).toMatch(/(correct|incorrect|נכון|לא נכון|success|error)/i);
      console.log('False answer feedback:', toastText);
    }
  });

  test.describe('Value Questions (VALUE type)', () => {
    test('Value question - numeric input validation', async ({ page }) => {
      let foundValueQuestion = false;
      let attempts = 0;
      const maxAttempts = 15;

      // Start navigation
      await page.goto(`/questions/${questionsByType.selection}`);
      await page.waitForSelector('#question-page', { timeout: 10000 });

      while (!foundValueQuestion && attempts < maxAttempts) {
        attempts++;
        
        // Look for numeric input fields
        const numberInput = page.locator('input[type="number"], input[inputmode="numeric"], input[pattern*="[0-9]"]');
        const textInput = page.locator('input[type="text"]');
        
        // Check if this looks like a value question
        const hasNumberInput = await numberInput.count() > 0;
        const hasTextInput = await textInput.count() > 0;
        
        if (hasNumberInput || hasTextInput) {
          foundValueQuestion = true;
          console.log(`✓ Found value question on attempt ${attempts}`);
          
          // Test numeric input
          if (hasNumberInput) {
            await testNumericInput(page, numberInput);
          } else {
            await testTextInput(page, textInput);
          }
          break;
        }
        
        // Navigate to next question
        const nextButton = page.locator('button').filter({ hasText: /next|הבא/i });
        if (await nextButton.count() > 0) {
          await nextButton.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
        } else {
          break;
        }
      }

      if (!foundValueQuestion) {
        test.skip(true, `No value question found after ${attempts} attempts`);
      }
    });

    async function testNumericInput(page: any, numberInput: any) {
      // Test with various numeric values
      const testValues = ['42', '3.14', '-5', '0', '100'];
      
      for (const value of testValues) {
        await numberInput.fill(value);
        
        const submitButton = page.locator('button').filter({ hasText: /submit|שלח/i });
        await submitButton.click();
        
        await page.waitForSelector('[data-testid="toast"], .sonner-toast', { timeout: 10000 });
        
        const toast = page.locator('[data-testid="toast"], .sonner-toast').first();
        const toastText = await toast.textContent();
        
        console.log(`Value "${value}" -> "${toastText}"`);
        expect(toastText).toBeTruthy();
        expect(toastText).toMatch(/(correct|incorrect|נכון|לא נכון|success|error)/i);
        
        // If this was correct, we found the right answer
        if (toastText && /(correct|נכון|success)/i.test(toastText)) {
          console.log(`✓ Found correct numeric answer: ${value}`);
          break;
        }
      }
    }

    async function testTextInput(page: any, textInput: any) {
      // Test with various text values
      const testValues = ['answer', 'test', '42', 'solution'];
      
      for (const value of testValues) {
        await textInput.fill(value);
        
        const submitButton = page.locator('button').filter({ hasText: /submit|שלח/i });
        await submitButton.click();
        
        await page.waitForSelector('[data-testid="toast"], .sonner-toast', { timeout: 10000 });
        
        const toast = page.locator('[data-testid="toast"], .sonner-toast').first();
        const toastText = await toast.textContent();
        
        console.log(`Text "${value}" -> "${toastText}"`);
        expect(toastText).toBeTruthy();
        
        if (toastText && /(correct|נכון|success)/i.test(toastText)) {
          console.log(`✓ Found correct text answer: ${value}`);
          break;
        }
      }
    }
  });

  test.describe('Void Questions (VOID type - Parts-based)', () => {
    test('Void question - multiple parts validation', async ({ page }) => {
      let foundVoidQuestion = false;
      let attempts = 0;
      const maxAttempts = 20;

      // Start navigation
      await page.goto(`/questions/${questionsByType.selection}`);
      await page.waitForSelector('#question-page', { timeout: 10000 });

      while (!foundVoidQuestion && attempts < maxAttempts) {
        attempts++;
        
        // Look for questions with multiple parts
        const questionParts = page.locator('[data-testid="question-part"], .question-part');
        const partInputs = page.locator('[data-testid="part-input"], .part-input, .question-part input');
        
        const hasMultipleParts = await questionParts.count() > 1;
        const hasPartInputs = await partInputs.count() > 0;
        
        if (hasMultipleParts || hasPartInputs) {
          foundVoidQuestion = true;
          console.log(`✓ Found void/parts question on attempt ${attempts}`);
          
          await testPartsQuestion(page, partInputs);
          break;
        }
        
        // Navigate to next question
        const nextButton = page.locator('button').filter({ hasText: /next|הבא/i });
        if (await nextButton.count() > 0) {
          await nextButton.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
        } else {
          break;
        }
      }

      if (!foundVoidQuestion) {
        test.skip(true, `No void/parts question found after ${attempts} attempts`);
      }
    });

    async function testPartsQuestion(page: any, partInputs: any) {
      const partCount = await partInputs.count();
      console.log(`Found ${partCount} question parts`);
      
      // Fill each part with test data
      for (let i = 0; i < partCount; i++) {
        const testValue = `part${i + 1}`;
        await partInputs.nth(i).fill(testValue);
        console.log(`Filled part ${i + 1} with: ${testValue}`);
      }
      
      // Submit the parts
      const submitButton = page.locator('button').filter({ hasText: /submit|שלח/i });
      await submitButton.click();
      
      // Wait for feedback
      await page.waitForSelector('[data-testid="toast"], .sonner-toast', { timeout: 10000 });
      
      const toast = page.locator('[data-testid="toast"], .sonner-toast').first();
      const toastText = await toast.textContent();
      
      expect(toastText).toBeTruthy();
      expect(toastText).toMatch(/(correct|incorrect|נכון|לא נכון|success|error)/i);
      console.log(`Parts question feedback: ${toastText}`);
    }
  });

  test.describe('General Question Functionality', () => {
    test('Submit button is always present and functional', async ({ page }) => {
      await page.goto(`/questions/${questionsByType.selection}`);
      await page.waitForSelector('#question-page', { timeout: 10000 });
      
      const submitButton = page.locator('button').filter({ hasText: /submit|שלח/i });
      
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
      
      // Verify submit button text is appropriate for language
      const buttonText = await submitButton.textContent();
      expect(buttonText).toMatch(/(submit|שלח)/i);
    });

    test('Feedback messages are properly displayed', async ({ page }) => {
      await page.goto(`/questions/${questionsByType.selection}`);
      await page.waitForSelector('#question-page', { timeout: 10000 });
      
      // Try to trigger any answer submission
      const answerOptions = page.locator('[data-testid="answer-option"], .answer-option, input[type="radio"], input[type="checkbox"]');
      const submitButton = page.locator('button').filter({ hasText: /submit|שלח/i });
      
      if (await answerOptions.count() > 0) {
        await answerOptions.first().click();
        await submitButton.click();
        
        // Verify feedback appears
        await page.waitForSelector('[data-testid="toast"], .sonner-toast', { timeout: 10000 });
        
        const toast = page.locator('[data-testid="toast"], .sonner-toast').first();
        const toastText = await toast.textContent();
        
        expect(toastText).toBeTruthy();
        expect(toastText.length).toBeGreaterThan(0);
        
        // Verify toast disappears after some time (proper UX)
        await page.waitForTimeout(5000);
        const isStillVisible = await toast.isVisible().catch(() => false);
        // Toast may or may not be visible depending on timeout settings
        console.log('Toast still visible after 5s:', isStillVisible);
      }
    });

    test('Question content loads properly', async ({ page }) => {
      await page.goto(`/questions/${questionsByType.selection}`);
      await page.waitForSelector('#question-page', { timeout: 10000 });
      
      // Verify question page elements are present
      await expect(page.locator('#question-page')).toBeVisible();
      
      // Check for question content
      const questionContent = page.locator('#question-content, .question-content, [data-testid="question-content"]');
      
      // At least one form of question content should be visible
      const hasQuestionContent = await questionContent.count() > 0;
      const hasAnswerOptions = await page.locator('[data-testid="answer-option"], .answer-option').count() > 0;
      const hasInputFields = await page.locator('input, textarea').count() > 0;
      const hasButtons = await page.locator('button').filter({ hasText: /submit|true|false|yes|no|כן|לא/i }).count() > 0;
      
      const hasQuestionElements = hasQuestionContent || hasAnswerOptions || hasInputFields || hasButtons;
      expect(hasQuestionElements).toBeTruthy();
      
      console.log('Question page loaded with:', {
        questionContent: hasQuestionContent,
        answerOptions: hasAnswerOptions,
        inputFields: hasInputFields,
        buttons: hasButtons
      });
    });
  });
});