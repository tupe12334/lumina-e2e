import test, { expect } from '@playwright/test';
import { CoursePage } from './pages/CoursePage';
import { MyJourneyPage } from './pages/MyJourneyPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { Sidebar } from './pages/Sidebar';

test.describe('Course Status changes', () => {
  test("When not logged in the user can't see mark as complete button", async ({
    page,
  }) => {
    // Mock the course API endpoint
    await page.route('http://localhost:4200/courses/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          name: {
            en_text: 'Introduction to Physics',
            he_text: 'מבוא לפיזיקה',
          },
          universityId: 'university-1',
          disciplineId: 'discipline-1',
          university: {
            id: 'university-1',
            name: {
              en_text: 'The Open University Of Israel',
              he_text: 'האוניברסיטה הפתוחה',
            },
          },
          modules: [],
          publishedAt: '2024-01-01T00:00:00.000Z',
          Block: null,
        }),
      });
    });

    // Mock the my-courses endpoint (though it shouldn't be called when not logged in)
    await page.route('/my-courses', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      });
    });

    // Navigate to a course page without being logged in
    const coursePage = new CoursePage(page);
    await coursePage.goto('1'); // Using a sample course ID
    await coursePage.waitForCourseToLoad();

    // Verify that the action box (which contains the buttons) is not visible
    // because the user is not logged in
    expect(await coursePage.isActionBoxVisible()).toBe(false);

    // Verify that the mark as complete button is not visible
    expect(await coursePage.isMarkAsCompleteButtonVisible()).toBe(false);

    // Verify that the enroll button is also not visible (since user is not logged in)
    expect(await coursePage.isEnrollButtonVisible()).toBe(false);
  });

  test('When a user enroll to a course and they will see the course in the my journey page, after marking it as complete they will this the course in green and in the course page will see the button as completed', async ({
    page,
  }) => {
    const courseId = '1';

    // Mock the course API endpoint
    await page.route(
      `http://localhost:4200/courses/${courseId}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: courseId,
            name: {
              en_text: 'Introduction to Physics',
              he_text: 'מבוא לפיזיקה',
            },
            universityId: 'university-1',
            disciplineId: 'discipline-1',
            university: {
              id: 'university-1',
              name: {
                en_text: 'The Open University Of Israel',
                he_text: 'האוניברסיטה הפתוחה',
              },
            },
            modules: [],
            publishedAt: '2024-01-01T00:00:00.000Z',
            Block: {
              id: 'block-1',
              prerequisites: [],
              postrequisites: [],
              modules: [],
            },
          }),
        });
      }
    );

    // Mock the my-courses endpoint for initial state (no courses)
    await page.route('http://localhost:4200/my-courses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Mock the enrollment endpoint
    await page.route(
      'http://localhost:4200/enrollment/enroll',
      async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      }
    );

    // Mock the complete course endpoint
    await page.route(
      `http://localhost:4200/my-courses/${courseId}/complete`,
      async (route) => {
        await route.fulfill({
          status: 204,
          contentType: 'application/json',
          body: '',
        });
      }
    );

    // Start the authentication flow
    await page.goto('/');
    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.gotoDashboard();

    const loginPage = new LoginPage(page);
    const { email, password } = await loginPage.autoLogin();

    const onboarding = new OnboardingPage(page);
    await onboarding.selectUniversity('The Open University Of Israel');
    await onboarding.selectDegree('Economics');
    await onboarding.toggleAdvancedSection();
    await onboarding.setAddAllDegreeCourses(false);
    await onboarding.agreeAndFinish();

    // Verify we're on the My Journey page
    await expect(page).toHaveURL('/my-journey');
    await page.waitForLoadState('networkidle');

    // Navigate to the course page
    const coursePage = new CoursePage(page);
    await coursePage.goto(courseId);
    await coursePage.waitForCourseToLoad();

    // Verify the enroll button is visible and click it
    expect(await coursePage.isEnrollButtonVisible()).toBe(true);
    await coursePage.clickEnroll();

    // Update the my-courses mock to include the enrolled course
    await page.route('http://localhost:4200/my-courses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'user-course-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 'user-1',
            courseId: courseId,
            course: {
              id: courseId,
              name: {
                en_text: 'Introduction to Physics',
                he_text: 'מבוא לפיזיקה',
              },
              universityId: 'university-1',
              disciplineId: 'discipline-1',
              university: {
                id: 'university-1',
                name: {
                  en_text: 'The Open University Of Israel',
                  he_text: 'האוניברסיטה הפתוחה',
                },
              },
              modules: [],
              publishedAt: '2024-01-01T00:00:00.000Z',
              Block: {
                id: 'block-1',
                prerequisites: [],
                postrequisites: [],
                modules: [],
              },
            },
            status: 'inProgress',
          },
        ]),
      });
    });

    // Verify the mark as complete button is now visible
    expect(await coursePage.isMarkAsCompleteButtonVisible()).toBe(true);
    expect(await coursePage.isCompletedButtonVisible()).toBe(false);

    // Click mark as complete
    await coursePage.clickMarkAsComplete();

    // Update the my-courses mock to show the course as completed BEFORE clicking
    await page.route('http://localhost:4200/my-courses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'user-course-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 'user-1',
            courseId: courseId,
            course: {
              id: courseId,
              name: {
                en_text: 'Introduction to Physics',
                he_text: 'מבוא לפיזיקה',
              },
              universityId: 'university-1',
              disciplineId: 'discipline-1',
              university: {
                id: 'university-1',
                name: {
                  en_text: 'The Open University Of Israel',
                  he_text: 'האוניברסיטה הפתוחה',
                },
              },
              modules: [],
              publishedAt: '2024-01-01T00:00:00.000Z',
              Block: {
                id: 'block-1',
                prerequisites: [],
                postrequisites: [],
                modules: [],
              },
            },
            status: 'completed',
          },
        ]),
      });
    });

    await page.waitForLoadState('networkidle');

    // Verify the completed button is now visible instead of mark as complete
    expect(await coursePage.isCompletedButtonVisible()).toBe(true);
    expect(await coursePage.isMarkAsCompleteButtonVisible()).toBe(false);

    // Navigate to My Journey page to verify the course appears in green
    const myJourneyPage = new MyJourneyPage(page);
    await myJourneyPage.goto();
    await myJourneyPage.waitForPageToLoad();

    // Verify the course is marked as completed in My Journey
    expect(
      await myJourneyPage.isCourseCompleted('Introduction to Physics')
    ).toBe(true);
  });
});
