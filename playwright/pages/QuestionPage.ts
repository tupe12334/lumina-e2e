import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for question interactions and feedback
 */
export class QuestionPage {
  private readonly page: Page;

  readonly questionTitle: Locator;
  readonly questionContent: Locator;
  readonly answerOptions: Locator;
  readonly submitButton: Locator;
  readonly nextQuestionButton: Locator;
  readonly previousQuestionButton: Locator;
  readonly likeButton: Locator;
  readonly dislikeButton: Locator;
  readonly feedbackMessage: Locator;
  readonly progressIndicator: Locator;
  readonly hintButton: Locator;
  readonly explanationSection: Locator;
  readonly difficultyIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.questionTitle = page.getByRole('heading', { level: 1 });
    this.questionContent = page.locator('[data-testid="question-content"]');
    this.answerOptions = page.locator('[data-testid="answer-option"]');
    this.submitButton = page.getByRole('button', { name: /submit|check answer/i });
    this.nextQuestionButton = page.getByRole('button', { name: /next question|continue/i });
    this.previousQuestionButton = page.getByRole('button', { name: /previous|back/i });
    this.likeButton = page.getByRole('button', { name: /like|thumbs up/i });
    this.dislikeButton = page.getByRole('button', { name: /dislike|thumbs down/i });
    this.feedbackMessage = page.locator('[data-testid="feedback-message"]');
    this.progressIndicator = page.locator('[data-testid="progress-indicator"]');
    this.hintButton = page.getByRole('button', { name: /hint|help/i });
    this.explanationSection = page.locator('[data-testid="explanation"]');
    this.difficultyIndicator = page.locator('[data-testid="difficulty"]');
  }

  /**
   * Wait for question page to load completely
   */
  async waitForQuestionLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.questionContent.waitFor({ state: 'visible' });
    await this.answerOptions.first().waitFor({ state: 'visible' });
  }

  /**
   * Select an answer by index (0-based)
   */
  async selectAnswer(answerIndex: number): Promise<void> {
    const options = await this.answerOptions.all();
    if (answerIndex >= options.length) {
      throw new Error(`Answer index ${answerIndex} is out of range. Only ${options.length} options available.`);
    }

    await options[answerIndex].click();
  }

  /**
   * Select an answer by text content
   */
  async selectAnswerByText(answerText: string): Promise<void> {
    const option = this.answerOptions.filter({ hasText: answerText });
    await expect(option).toBeVisible();
    await option.click();
  }

  /**
   * Submit the selected answer
   */
  async submitAnswer(): Promise<void> {
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Answer a question completely (select + submit)
   */
  async answerQuestion(answerIndex: number): Promise<void> {
    await this.selectAnswer(answerIndex);
    await this.submitAnswer();
  }

  /**
   * Answer a question by text content
   */
  async answerQuestionByText(answerText: string): Promise<void> {
    await this.selectAnswerByText(answerText);
    await this.submitAnswer();
  }

  /**
   * Provide feedback on the question
   */
  async provideFeedback(feedback: 'like' | 'dislike'): Promise<void> {
    const button = feedback === 'like' ? this.likeButton : this.dislikeButton;
    await button.click();

    // Wait for feedback to be registered
    await this.page.waitForTimeout(1000);
  }

  /**
   * Navigate to next question
   */
  async goToNextQuestion(): Promise<void> {
    await this.nextQuestionButton.click();
    await this.waitForQuestionLoad();
  }

  /**
   * Navigate to previous question
   */
  async goToPreviousQuestion(): Promise<void> {
    await this.previousQuestionButton.click();
    await this.waitForQuestionLoad();
  }

  /**
   * Request a hint for the current question
   */
  async requestHint(): Promise<void> {
    await this.hintButton.click();
    await this.explanationSection.waitFor({ state: 'visible' });
  }

  /**
   * Get the current question text
   */
  async getQuestionText(): Promise<string> {
    return await this.questionContent.textContent() || '';
  }

  /**
   * Get all answer options text
   */
  async getAnswerOptions(): Promise<string[]> {
    const options = await this.answerOptions.all();
    const texts = await Promise.all(options.map(option => option.textContent()));
    return texts.filter((text): text is string => text !== null);
  }

  /**
   * Get the current progress percentage
   */
  async getProgress(): Promise<number> {
    const progressText = await this.progressIndicator.textContent();
    if (!progressText) return 0;

    const match = progressText.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Check if feedback was provided
   */
  async isFeedbackProvided(): Promise<boolean> {
    try {
      await this.feedbackMessage.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the difficulty level of current question
   */
  async getDifficulty(): Promise<string> {
    return await this.difficultyIndicator.textContent() || 'Unknown';
  }

  /**
   * Wait for answer feedback to appear
   */
  async waitForAnswerFeedback(): Promise<void> {
    await this.feedbackMessage.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Check if the answer was correct
   */
  async isAnswerCorrect(): Promise<boolean> {
    await this.waitForAnswerFeedback();
    const feedbackText = await this.feedbackMessage.textContent();
    return feedbackText?.toLowerCase().includes('correct') === true;
  }

  /**
   * Navigate to a question page (uses first available question)
   */
  async navigateToQuestion(): Promise<void> {
    // Navigate to questions page first
    await this.page.goto('/questions');
    await this.page.waitForLoadState('networkidle');

    // Click on first available question
    const firstQuestionLink = this.page.locator('a[href*="/questions/"]').first();
    await firstQuestionLink.waitFor({ state: 'visible' });
    await firstQuestionLink.click();

    // Wait for question page to load
    await this.waitForQuestionLoad();
  }

  /**
   * Check if user is authenticated
   */
  async isUserAuthenticated(): Promise<boolean> {
    // Look for elements that are only visible to authenticated users
    try {
      await this.likeButton.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      // Check if there's a login prompt instead
      const loginPrompt = this.page.locator('text=login', 'text=sign in').first();
      return !(await loginPrompt.isVisible());
    }
  }

  /**
   * Complete a question flow (answer, provide feedback, move to next)
   */
  async completeQuestionFlow(answerIndex: number, provideLike = true): Promise<void> {
    await this.answerQuestion(answerIndex);
    await this.waitForAnswerFeedback();

    if (provideLike) {
      await this.provideFeedback('like');
    }

    if (await this.nextQuestionButton.isVisible()) {
      await this.goToNextQuestion();
    }
  }
}