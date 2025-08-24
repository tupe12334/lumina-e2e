import { faker } from "@faker-js/faker";
import test, { expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { Sidebar } from './pages/Sidebar';

test.describe('Authentication Flow', () => {
  test('Create and login user', async ({ page }) => {
    await page.goto('/');

    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('en');
    await sidebar.clickAuth();
    expect(page.url()).toContain('/login');
    const loginPage = new LoginPage(page);
    const email = faker.internet.email();
    const password = faker.internet.password();
    await loginPage.login(email, password);

    // Take screenshot after login before onboarding
    await expect(page).toHaveScreenshot('login-complete-before-onboarding.png');
    const onboarding = new OnboardingPage(page);
    await onboarding.selectInstitution('The Open University Of Israel');
    await onboarding.selectDegree('Economics');

    // Take screenshot of onboarding form filled
    await expect(page).toHaveScreenshot('onboarding-form-filled.png');
    await onboarding.toggleAdvancedSection();
    await onboarding.setAddAllDegreeCourses(false);
    await onboarding.setAddAllDegreeCourses(true);
    await onboarding.agreeAndFinish();
    await expect(page).toHaveURL('/my-journey');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');

    // Take screenshot of completed auth flow
    await expect(page).toHaveScreenshot('auth-flow-completion.png');
  });
  test('Should redirect me to login in those pages', () => {});
  test.skip('Sign up and stop in the middle, make sure when try to access protected page it will redirect the user to onboarding', () => {});
  test.skip("User can't access the onboarding page without beginning the signup", () => {});
  test.skip("Existing user can't access the onboarding page", () => {});
});
