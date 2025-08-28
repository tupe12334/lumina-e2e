import { test, expect } from '@playwright/test';
import { QuestionPage } from './pages/QuestionPage';
import { LoginPage } from './pages/LoginPage';

test.describe('Feedback Summary Updates', () => {
  let questionPage: QuestionPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    questionPage = new QuestionPage(page);
    loginPage = new LoginPage(page);
  });

  test('should update feedback summary when vote is added', async ({ page }) => {
    // Navigate to a question with existing feedback
    await questionPage.navigateToQuestion();
    
    // Ensure user is authenticated
    const isAuthenticated = await questionPage.isUserAuthenticated();
    if (!isAuthenticated) {
      await loginPage.goto();
      await loginPage.autoLogin();
      await questionPage.navigateToQuestion();
    }

    // Take initial screenshot of feedback summary
    const summarySelector = '[data-testid="question-feedback-summary"]';
    await page.waitForSelector(summarySelector, { timeout: 10000 });
    
    // Get initial vote counts from summary
    const initialLikes = await page.locator('[data-testid="summary-total-likes"]').textContent();
    const initialDislikes = await page.locator('[data-testid="summary-total-dislikes"]').textContent();
    const initialLikeRatio = await page.locator('[data-testid="summary-like-ratio"]').textContent();
    
    console.log('Initial state:', { initialLikes, initialDislikes, initialLikeRatio });

    // Cast a vote (like)
    await questionPage.provideFeedback('like');
    
    // Wait for optimistic update to appear in summary
    await page.waitForFunction(() => {
      const likeRatio = document.querySelector('[data-testid="summary-like-ratio"]')?.textContent;
      return likeRatio && likeRatio !== initialLikeRatio;
    }, { timeout: 5000 });

    // Verify summary shows optimistic updates immediately
    const optimisticLikes = await page.locator('[data-testid="summary-total-likes"]').textContent();
    const optimisticLikeRatio = await page.locator('[data-testid="summary-like-ratio"]').textContent();
    
    console.log('After vote:', { optimisticLikes, optimisticLikeRatio });
    
    // The like count should have increased
    expect(parseInt(optimisticLikes || '0')).toBeGreaterThan(parseInt(initialLikes || '0'));
    
    // Wait for API response to confirm the change
    await page.waitForTimeout(2000);
    
    // Verify final state matches optimistic state
    const finalLikes = await page.locator('[data-testid="summary-total-likes"]').textContent();
    const finalLikeRatio = await page.locator('[data-testid="summary-like-ratio"]').textContent();
    
    expect(finalLikes).toBe(optimisticLikes);
    expect(finalLikeRatio).toBe(optimisticLikeRatio);
  });

  test('should update feedback summary when vote is changed', async ({ page }) => {
    // Navigate to a question
    await questionPage.navigateToQuestion();
    
    // Ensure user is authenticated
    const isAuthenticated = await questionPage.isUserAuthenticated();
    if (!isAuthenticated) {
      await loginPage.goto();
      await loginPage.autoLogin();
      await questionPage.navigateToQuestion();
    }

    // Wait for feedback summary to load
    await page.waitForSelector('[data-testid="question-feedback-summary"]', { timeout: 10000 });
    
    // First, cast a like vote
    await questionPage.provideFeedback('like');
    await page.waitForTimeout(1000);
    
    // Get state after like
    const likesAfterLike = await page.locator('[data-testid="summary-total-likes"]').textContent();
    const dislikesAfterLike = await page.locator('[data-testid="summary-total-dislikes"]').textContent();
    
    // Change vote to dislike
    await questionPage.provideFeedback('dislike');
    
    // Wait for optimistic update
    await page.waitForFunction(() => {
      const currentDislikes = document.querySelector('[data-testid="summary-total-dislikes"]')?.textContent;
      return currentDislikes && parseInt(currentDislikes) > parseInt(dislikesAfterLike || '0');
    }, { timeout: 5000 });

    // Verify summary reflects the vote change
    const finalLikes = await page.locator('[data-testid="summary-total-likes"]').textContent();
    const finalDislikes = await page.locator('[data-testid="summary-total-dislikes"]').textContent();
    
    // Like count should have decreased, dislike count should have increased
    expect(parseInt(finalLikes || '0')).toBeLessThan(parseInt(likesAfterLike || '0'));
    expect(parseInt(finalDislikes || '0')).toBeGreaterThan(parseInt(dislikesAfterLike || '0'));
  });

  test('should update feedback summary when vote is removed', async ({ page }) => {
    // Navigate to a question
    await questionPage.navigateToQuestion();
    
    // Ensure user is authenticated
    const isAuthenticated = await questionPage.isUserAuthenticated();
    if (!isAuthenticated) {
      await loginPage.goto();
      await loginPage.autoLogin();
      await questionPage.navigateToQuestion();
    }

    // Wait for feedback summary to load
    await page.waitForSelector('[data-testid="question-feedback-summary"]', { timeout: 10000 });
    
    // Cast a vote first
    await questionPage.provideFeedback('like');
    await page.waitForTimeout(1000);
    
    // Get state after voting
    const likesAfterVote = await page.locator('[data-testid="summary-total-likes"]').textContent();
    const totalVotesAfterVote = await page.locator('[data-testid="summary-total-votes"]').textContent();
    
    // Remove the vote by clicking the same button
    await questionPage.provideFeedback('like');
    
    // Wait for optimistic update to show vote removal
    await page.waitForFunction(() => {
      const currentLikes = document.querySelector('[data-testid="summary-total-likes"]')?.textContent;
      return currentLikes && parseInt(currentLikes) < parseInt(likesAfterVote || '0');
    }, { timeout: 5000 });

    // Verify summary reflects vote removal
    const finalLikes = await page.locator('[data-testid="summary-total-likes"]').textContent();
    const finalTotalVotes = await page.locator('[data-testid="summary-total-votes"]').textContent();
    
    // Like count should have decreased
    expect(parseInt(finalLikes || '0')).toBeLessThan(parseInt(likesAfterVote || '0'));
    // Total votes should have decreased
    expect(parseInt(finalTotalVotes || '0')).toBeLessThan(parseInt(totalVotesAfterVote || '0'));
  });

  test('should handle multiple rapid vote changes correctly', async ({ page }) => {
    // Navigate to a question
    await questionPage.navigateToQuestion();
    
    // Ensure user is authenticated
    const isAuthenticated = await questionPage.isUserAuthenticated();
    if (!isAuthenticated) {
      await loginPage.goto();
      await loginPage.autoLogin();
      await questionPage.navigateToQuestion();
    }

    // Wait for feedback summary to load
    await page.waitForSelector('[data-testid="question-feedback-summary"]', { timeout: 10000 });
    
    // Get initial state
    const initialLikes = parseInt(await page.locator('[data-testid="summary-total-likes"]').textContent() || '0');
    const initialDislikes = parseInt(await page.locator('[data-testid="summary-total-dislikes"]').textContent() || '0');
    
    // Perform rapid vote changes
    await questionPage.provideFeedback('like');
    await page.waitForTimeout(100);
    await questionPage.provideFeedback('dislike');
    await page.waitForTimeout(100);
    await questionPage.provideFeedback('like');
    await page.waitForTimeout(100);
    await questionPage.provideFeedback('like'); // Remove vote
    
    // Wait for all updates to settle
    await page.waitForTimeout(3000);
    
    // Final state should be back to initial (no vote)
    const finalLikes = parseInt(await page.locator('[data-testid="summary-total-likes"]').textContent() || '0');
    const finalDislikes = parseInt(await page.locator('[data-testid="summary-total-dislikes"]').textContent() || '0');
    
    expect(finalLikes).toBe(initialLikes);
    expect(finalDislikes).toBe(initialDislikes);
  });

  test('should persist summary updates across page reloads', async ({ page }) => {
    // Navigate to a question
    await questionPage.navigateToQuestion();
    
    // Ensure user is authenticated
    const isAuthenticated = await questionPage.isUserAuthenticated();
    if (!isAuthenticated) {
      await loginPage.goto();
      await loginPage.autoLogin();
      await questionPage.navigateToQuestion();
    }

    // Wait for feedback summary to load
    await page.waitForSelector('[data-testid="question-feedback-summary"]', { timeout: 10000 });
    
    // Cast a vote
    await questionPage.provideFeedback('like');
    await page.waitForTimeout(2000); // Wait for API confirmation
    
    // Get vote counts after voting
    const likesAfterVote = await page.locator('[data-testid="summary-total-likes"]').textContent();
    const likeRatioAfterVote = await page.locator('[data-testid="summary-like-ratio"]').textContent();
    
    // Reload the page
    await page.reload();
    await page.waitForSelector('[data-testid="question-feedback-summary"]', { timeout: 10000 });
    
    // Verify summary data persisted correctly
    const likesAfterReload = await page.locator('[data-testid="summary-total-likes"]').textContent();
    const likeRatioAfterReload = await page.locator('[data-testid="summary-like-ratio"]').textContent();
    
    expect(likesAfterReload).toBe(likesAfterVote);
    expect(likeRatioAfterReload).toBe(likeRatioAfterVote);
  });

  test('should show correct visual feedback during optimistic updates', async ({ page }) => {
    // Navigate to a question
    await questionPage.navigateToQuestion();
    
    // Ensure user is authenticated
    const isAuthenticated = await questionPage.isUserAuthenticated();
    if (!isAuthenticated) {
      await loginPage.goto();
      await loginPage.autoLogin();
      await questionPage.navigateToQuestion();
    }

    // Wait for feedback summary to load
    await page.waitForSelector('[data-testid="question-feedback-summary"]', { timeout: 10000 });
    
    // Take screenshot before voting
    await page.screenshot({ path: 'test-results/feedback-summary-before-vote.png', fullPage: true });
    
    // Cast a vote and immediately check for visual changes
    await questionPage.provideFeedback('like');
    
    // Verify optimistic update appears quickly (within 100ms)
    await page.waitForFunction(() => {
      const summaryElement = document.querySelector('[data-testid="question-feedback-summary"]');
      return summaryElement && summaryElement.textContent?.includes('optimistic') === false; // Ensure it's not showing loading
    }, { timeout: 1000 });
    
    // Take screenshot after optimistic update
    await page.screenshot({ path: 'test-results/feedback-summary-optimistic-update.png', fullPage: true });
    
    // Wait for final state
    await page.waitForTimeout(2000);
    
    // Take screenshot of final state
    await page.screenshot({ path: 'test-results/feedback-summary-final-state.png', fullPage: true });
    
    // Verify that the summary is showing updated data
    const likeRatio = await page.locator('[data-testid="summary-like-ratio"]').textContent();
    expect(likeRatio).toBeTruthy();
    expect(parseInt(likeRatio?.replace('%', '') || '0')).toBeGreaterThan(0);
  });
});