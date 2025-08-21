import { test as base, Page, BrowserContext } from '@playwright/test';
import { TestDataManager, TestUser } from '../utils/test-data';
import { LuminaApiClient } from '../utils/api-client';
import { LoginPage } from '../pages/LoginPage';
import { OnboardingPage } from '../pages/OnboardingPage';

export interface AuthFixtures {
  testDataManager: TestDataManager;
  apiClient: LuminaApiClient;
  authenticatedUser: TestUser & { token: string };
  authenticatedPage: Page;
  onboardedUser: TestUser & { token: string };
  onboardedPage: Page;
}

/**
 * Extended test fixture with authentication utilities
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Test data manager for generating test data
   */
  testDataManager: async ({}, use) => {
    const manager = new TestDataManager();
    await use(manager);
    
    // Cleanup after test
    manager.clearTrackedData();
  },

  /**
   * API client for backend interactions
   */
  apiClient: async ({ request }, use) => {
    const client = new LuminaApiClient(request);
    await use(client);
  },

  /**
   * Creates and authenticates a user, returns user data with token
   */
  authenticatedUser: async ({ testDataManager, apiClient }, use) => {
    const userData = testDataManager.generateUser();
    
    // Create user via API
    const createResult = await apiClient.createUser(userData);
    if (!createResult.success) {
      throw new Error(`Failed to create test user: ${createResult.error}`);
    }

    // Authenticate user
    const authResult = await apiClient.authenticateUser(userData.email, userData.password);
    if (!authResult.success) {
      throw new Error(`Failed to authenticate test user: ${authResult.error}`);
    }

    const authenticatedUser = {
      ...userData,
      id: createResult.data!.id,
      token: authResult.data!.token,
    };

    testDataManager.trackCreatedData('user', authenticatedUser.id!);
    
    await use(authenticatedUser);

    // Cleanup
    if (authenticatedUser.id && authenticatedUser.token) {
      await apiClient.cleanupUser(authenticatedUser.id, authenticatedUser.token);
    }
  },

  /**
   * Creates an authenticated page with user session
   */
  authenticatedPage: async ({ context, authenticatedUser, baseURL }, use) => {
    const page = await context.newPage();
    
    // Set authentication token in storage
    await page.goto(baseURL || 'http://localhost:4174');
    await page.evaluate((token) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify({
        id: 'user_id',
        email: 'user_email',
        firstName: 'user_firstName',
        lastName: 'user_lastName',
      }));
    }, authenticatedUser.token);

    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await use(page);
  },

  /**
   * Creates a fully onboarded user (authenticated + completed onboarding)
   */
  onboardedUser: async ({ context, testDataManager, apiClient, baseURL }, use) => {
    const userData = testDataManager.generateUser();
    
    // Create and authenticate user
    const createResult = await apiClient.createUser(userData);
    if (!createResult.success) {
      throw new Error(`Failed to create test user: ${createResult.error}`);
    }

    const authResult = await apiClient.authenticateUser(userData.email, userData.password);
    if (!authResult.success) {
      throw new Error(`Failed to authenticate test user: ${authResult.error}`);
    }

    const authenticatedUser = {
      ...userData,
      id: createResult.data!.id,
      token: authResult.data!.token,
    };

    // Complete onboarding process via UI
    const page = await context.newPage();
    await page.goto(baseURL || 'http://localhost:4174');
    
    const loginPage = new LoginPage(page);
    await loginPage.login(authenticatedUser.email, authenticatedUser.password);
    
    const onboardingPage = new OnboardingPage(page);
    await onboardingPage.selectUniversity('The Open University Of Israel');
    await onboardingPage.selectDegree('Economics');
    await onboardingPage.agreeAndFinish();
    
    // Wait for onboarding completion
    await page.waitForURL('/my-journey');
    await page.close();

    testDataManager.trackCreatedData('user', authenticatedUser.id);
    
    await use(authenticatedUser);

    // Cleanup
    if (authenticatedUser.id && authenticatedUser.token) {
      await apiClient.cleanupUser(authenticatedUser.id, authenticatedUser.token);
    }
  },

  /**
   * Creates a page with fully onboarded user session
   */
  onboardedPage: async ({ context, onboardedUser, baseURL }, use) => {
    const page = await context.newPage();
    
    // Set authentication token and user data
    await page.goto(baseURL || 'http://localhost:4174');
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
        localStorage.setItem('onboarding_completed', 'true');
      },
      { 
        token: onboardedUser.token,
        user: {
          id: onboardedUser.id,
          email: onboardedUser.email,
          firstName: onboardedUser.firstName,
          lastName: onboardedUser.lastName,
        },
      }
    );

    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await use(page);
  },
});

export { expect } from '@playwright/test';