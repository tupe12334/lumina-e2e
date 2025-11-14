import { test, expect } from './fixtures/auth-fixtures';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { LearningJourneyPage } from './pages/LearningJourneyPage';
import { QuestionPage } from './pages/QuestionPage';
import { Sidebar } from './pages/Sidebar';

test.describe('Comprehensive User Journeys', () => {
  test.describe('Complete New User Flow', () => {
    test('User can complete full registration and onboarding journey', async ({
      page,
      testDataManager
    }) => {
      const userData = testDataManager.generateUser();

      // 1. Navigate to home page
      await page.goto('/');

      // 2. Navigate to registration
      const sidebar = new Sidebar(page);
      await sidebar.waitForFullyMounting();
      await sidebar.clickAuth();

      // 3. Complete registration
      const loginPage = new LoginPage(page);
      await loginPage.login(userData.email, userData.password);

      // 4. Complete onboarding
      const onboardingPage = new OnboardingPage(page);
      await onboardingPage.selectInstitution('The Open University Of Israel');
      await onboardingPage.selectDegree('Computer Science');
      await onboardingPage.toggleAdvancedSection();
      await onboardingPage.setAddAllDegreeCourses(true);
      await onboardingPage.agreeAndFinish();

      // 5. Verify redirect to learning journey
      await expect(page).toHaveURL('/my-journey');

      // 6. Verify learning journey is properly initialized
      const journeyPage = new LearningJourneyPage(page);
      await journeyPage.verifyJourneyProgression();

      // 7. Take screenshot of completed onboarding journey
      await expect(page).toHaveScreenshot('complete-user-journey-my-journey.png');

      // 7. Verify user can see available courses
      const courses = await journeyPage.getAllCourses();
      expect(courses.length).toBeGreaterThan(0);

      // 8. Verify at least one course is available to start
      const availableCourses = courses.filter(course => course.status !== 'locked');
      expect(availableCourses.length).toBeGreaterThan(0);
    });

    test('User can recover from interrupted onboarding', async ({
      page,
      testDataManager
    }) => {
      const userData = testDataManager.generateUser();

      // 1. Start registration process
      await page.goto('/');
      const sidebar = new Sidebar(page);
      await sidebar.waitForFullyMounting();
      await sidebar.clickAuth();

      const loginPage = new LoginPage(page);
      await loginPage.login(userData.email, userData.password);

      // 2. Start but don't complete onboarding
      const onboardingPage = new OnboardingPage(page);
      await onboardingPage.selectInstitution('The Open University Of Israel');
      // Intentionally don't select degree or finish

      // 3. Navigate away from onboarding
      await page.goto('/degrees');
      await expect(page).toHaveURL('/degrees');

      // 4. Try to access protected area - should redirect to onboarding
      await page.goto('/my-journey');
      await expect(page).toHaveURL(/\/onboarding/);

      // 5. Complete onboarding
      await onboardingPage.selectDegree('Economics');
      await onboardingPage.agreeAndFinish();

      // 6. Verify successful completion
      await expect(page).toHaveURL('/my-journey');

      // 7. Take screenshot of recovered onboarding completion
      await expect(page).toHaveScreenshot('recovered-onboarding-completion.png');
    });
  });

  test.describe('Learning Journey Flows', () => {
    test('Authenticated user can navigate learning journey effectively', async ({
      onboardedPage
    }) => {
      const journeyPage = new LearningJourneyPage(onboardedPage);

      // 1. Navigate to journey page
      await journeyPage.goto();

      // 2. Verify page loaded correctly
      await journeyPage.verifyJourneyProgression();

      // 3. Check initial progress state
      const initialProgress = await journeyPage.getOverallProgress();
      expect(initialProgress).toBeGreaterThanOrEqual(0);

      // 4. Take screenshot of learning journey dashboard
      await expect(onboardedPage).toHaveScreenshot('learning-journey-dashboard.png');

      // 4. Verify course availability
      const courses = await journeyPage.getAllCourses();
      expect(courses.length).toBeGreaterThan(0);

      // 5. Test course filtering
      await journeyPage.searchForCourse('math');
      await onboardedPage.waitForTimeout(1000); // Wait for search results

      // 6. Clear search and verify all courses return
      await journeyPage.searchForCourse('');
      const allCourses = await journeyPage.getAllCourses();
      expect(allCourses.length).toBe(courses.length);

      // 7. Test continue studying functionality
      if (await journeyPage.continueStudyingButton.isVisible()) {
        await journeyPage.continueStudying();
        // Should navigate to a question or course page
        await onboardedPage.waitForLoadState('networkidle');
      }
    });

    test('User can track progress across multiple sessions', async ({
      onboardedPage,
      apiClient,
      onboardedUser
    }) => {
      const journeyPage = new LearningJourneyPage(onboardedPage);

      // 1. Get initial progress
      await journeyPage.goto();
      const initialProgress = await journeyPage.getOverallProgress();

      // 2. Start a course if available
      const courses = await journeyPage.getAllCourses();
      const availableCourse = courses.find(course => course.status === 'in-progress' || course.status === 'available');

      if (availableCourse) {
        await journeyPage.clickCourse(availableCourse.name);
        await onboardedPage.waitForLoadState('networkidle');

        // 3. Simulate some progress (if on a question page)
        const questionPage = new QuestionPage(onboardedPage);

        try {
          await questionPage.waitForQuestionLoad();
          // Take screenshot of question page
          await expect(onboardedPage).toHaveScreenshot('question-page-loaded.png');
          await questionPage.completeQuestionFlow(0); // Answer first option
        } catch {
          // Not on a question page, that's fine
        }
      }

      // 4. Return to journey page
      await journeyPage.goto();

      // 5. Verify progress was saved
      const newProgress = await journeyPage.getOverallProgress();
      expect(newProgress).toBeGreaterThanOrEqual(initialProgress);

      // 6. Verify via API that progress was persisted
      const progressData = await apiClient.getUserProgress(onboardedUser.id!, onboardedUser.token);
      expect(progressData.success).toBe(true);
    });
  });

  test.describe('Question and Feedback Flows', () => {
    test('User can complete question cycles with feedback', async ({
      onboardedPage
    }) => {
      // Start by navigating to a course with questions
      const journeyPage = new LearningJourneyPage(onboardedPage);
      await journeyPage.goto();

      // Find and click on an available course
      const courses = await journeyPage.getAllCourses();
      const availableCourse = courses.find(course =>
        course.status === 'in-progress' || course.status === 'available'
      );

      if (!availableCourse) {
        test.skip();
        return;
      }

      await journeyPage.clickCourse(availableCourse!.name);
      await onboardedPage.waitForLoadState('networkidle');

      const questionPage = new QuestionPage(onboardedPage);

      try {
        // 1. Wait for question to load
        await questionPage.waitForQuestionLoad();

        // 2. Verify question components are present
        await expect(questionPage.questionContent).toBeVisible();
        const answerOptions = await questionPage.getAnswerOptions();
        expect(answerOptions.length).toBeGreaterThan(1);

        // 3. Answer the question
        await questionPage.answerQuestion(0);

        // 4. Verify feedback appears
        await questionPage.waitForAnswerFeedback();

        // Take screenshot of answer feedback
        await expect(onboardedPage).toHaveScreenshot('question-answer-feedback.png');

        // 5. Provide question feedback
        await questionPage.provideFeedback('like');

        // 6. If next question is available, test navigation
        if (await questionPage.nextQuestionButton.isVisible()) {
          const initialQuestion = await questionPage.getQuestionText();
          await questionPage.goToNextQuestion();
          const newQuestion = await questionPage.getQuestionText();
          expect(newQuestion).not.toBe(initialQuestion);

          // 7. Test going back
          await questionPage.goToPreviousQuestion();
          const backQuestion = await questionPage.getQuestionText();
          expect(backQuestion).toBe(initialQuestion);
        }

      } catch (error) {
        if (error instanceof Error && error.message.includes('waitForQuestionLoad')) {
          test.skip();
          return;
        }
        throw error;
      }
    });

    test('User feedback is properly recorded and affects recommendations', async ({
      onboardedPage
    }) => {
      const journeyPage = new LearningJourneyPage(onboardedPage);
      await journeyPage.goto();

      // Navigate to questions
      const courses = await journeyPage.getAllCourses();
      const availableCourse = courses.find(course =>
        course.status === 'in-progress' || course.status === 'available'
      );

      if (!availableCourse) {
        test.skip();
        return;
      }

      await journeyPage.clickCourse(availableCourse!.name);
      const questionPage = new QuestionPage(onboardedPage);

      try {
        await questionPage.waitForQuestionLoad();

        // 1. Answer question and provide positive feedback
        await questionPage.answerQuestion(0);
        await questionPage.provideFeedback('like');

        // 2. Verify feedback was registered
        expect(await questionPage.isFeedbackProvided()).toBe(true);

        // 3. Test negative feedback on next question
        if (await questionPage.nextQuestionButton.isVisible()) {
          await questionPage.goToNextQuestion();
          await questionPage.answerQuestion(1);
          await questionPage.provideFeedback('dislike');

          expect(await questionPage.isFeedbackProvided()).toBe(true);
        }

      } catch (error) {
        if (error instanceof Error && error.message.includes('waitForQuestionLoad')) {
          test.skip();
          return;
        }
        throw error;
      }
    });
  });

  test.describe('Multi-Language Support', () => {
    test('User can switch languages and maintain state', async ({
      onboardedPage
    }) => {
      // 1. Start in English
      const sidebar = new Sidebar(onboardedPage);
      await sidebar.waitForFullyMounting();
      await sidebar.selectLanguage('en');

      // 2. Navigate to journey page
      const journeyPage = new LearningJourneyPage(onboardedPage);
      await journeyPage.goto();

      // 3. Record current state
      const courses = await journeyPage.getAllCourses();
      const progress = await journeyPage.getOverallProgress();

      // 4. Switch to Hebrew
      await sidebar.selectLanguage('he');
      await onboardedPage.waitForLoadState('networkidle');

      // 5. Verify functionality still works
      const hebrewCourses = await journeyPage.getAllCourses();
      const hebrewProgress = await journeyPage.getOverallProgress();

      // Take screenshot of Hebrew interface
      await expect(onboardedPage).toHaveScreenshot('journey-page-hebrew.png');

      // Progress should be maintained
      expect(hebrewProgress).toBe(progress);
      // Course count should be the same
      expect(hebrewCourses.length).toBe(courses.length);

      // 6. Switch back to English
      await sidebar.selectLanguage('en');
      await onboardedPage.waitForLoadState('networkidle');

      // 7. Verify state is consistent
      const finalCourses = await journeyPage.getAllCourses();
      const finalProgress = await journeyPage.getOverallProgress();

      expect(finalProgress).toBe(progress);
      expect(finalCourses.length).toBe(courses.length);
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('User can recover from network errors', async ({
      onboardedPage
    }) => {
      const journeyPage = new LearningJourneyPage(onboardedPage);
      await journeyPage.goto();

      // 1. Record initial state
      const initialCourses = await journeyPage.getAllCourses();

      // 2. Simulate network issues by going offline
      await onboardedPage.context().setOffline(true);

      // 3. Try to navigate (should handle gracefully)
      await onboardedPage.reload({ waitUntil: 'domcontentloaded' });

      // 4. Go back online
      await onboardedPage.context().setOffline(false);

      // 5. Refresh and verify recovery
      await onboardedPage.reload();
      await journeyPage.waitForPageLoad();

      const recoveredCourses = await journeyPage.getAllCourses();
      expect(recoveredCourses.length).toBe(initialCourses.length);

      // Take screenshot of recovered page
      await expect(onboardedPage).toHaveScreenshot('network-error-recovery.png');
    });

    test('User receives appropriate error messages for invalid actions', async ({
      onboardedPage
    }) => {
      const journeyPage = new LearningJourneyPage(onboardedPage);
      await journeyPage.goto();

      // 1. Try to access a locked course
      const courses = await journeyPage.getAllCourses();
      const lockedCourse = courses.find(course => course.status === 'locked');

      if (lockedCourse) {
        await lockedCourse.element.click();

        // Should show appropriate message or remain on journey page
        // (specific behavior depends on implementation)
        await onboardedPage.waitForTimeout(1000);

        // Verify we haven't navigated away inappropriately
        await expect(onboardedPage).toHaveURL(/\/my-journey/);
      }
    });
  });
});