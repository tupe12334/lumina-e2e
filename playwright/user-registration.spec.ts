import { faker } from '@faker-js/faker';
import { test, expect } from '@playwright/test';
import { Sidebar } from './pages/Sidebar';

test.describe('User Registration', () => {
  test('User can successfully register with valid information', async ({ page }) => {
    // Generate test user data
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const password = faker.internet.password({ length: 12, memorable: true });

    // 1. Navigate to home page
    await page.goto('/');

    // 2. Wait for sidebar and select language
    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('en');

    // 3. Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveURL('/register');

    // 4. Fill out registration form
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);

    // 5. Accept terms and conditions
    await page.getByRole('checkbox', { name: /terms/i }).check();

    // 6. Submit registration form
    await page.getByRole('button', { name: /create account|sign up/i }).click();

    // 7. Verify successful registration - should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });

    // 8. Verify onboarding page loads properly
    await expect(page.locator('#university-select')).toBeVisible({ timeout: 10000 });
  });

  test('Registration form shows validation errors for invalid data', async ({ page }) => {
    // 1. Navigate to registration page
    await page.goto('/');
    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('en');

    await page.goto('/register');
    await expect(page).toHaveURL('/register');

    // 2. Try to submit empty form
    await page.getByRole('button', { name: /create account|sign up/i }).click();

    // 3. Verify validation errors appear
    await expect(page.getByText(/first name is required/i)).toBeVisible();
    await expect(page.getByText(/last name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('Registration form shows error for invalid email format', async ({ page }) => {
    // 1. Navigate to registration page
    await page.goto('/register');

    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('en');

    // 2. Fill form with invalid email
    await page.getByLabel('First Name').fill('John');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('checkbox', { name: /terms/i }).check();

    // 3. Submit form
    await page.getByRole('button', { name: /create account|sign up/i }).click();

    // 4. Verify email validation error
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('Registration form shows error for duplicate email', async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const password = faker.internet.password({ length: 12, memorable: true });

    // 1. First registration
    await page.goto('/register');
    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('en');

    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('checkbox', { name: /terms/i }).check();
    await page.getByRole('button', { name: /create account|sign up/i }).click();

    // Wait for successful registration
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });

    // 2. Try to register again with same email
    await page.goto('/register');
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('checkbox', { name: /terms/i }).check();
    await page.getByRole('button', { name: /create account|sign up/i }).click();

    // 3. Verify duplicate email error
    await expect(page.getByText(/email already exists|user already exists/i)).toBeVisible({ timeout: 10000 });
  });

  test('User can navigate from registration to login page', async ({ page }) => {
    // 1. Navigate to registration page
    await page.goto('/register');

    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('en');

    // 2. Click on sign in link
    await page.getByRole('link', { name: /sign in/i }).click();

    // 3. Verify navigation to login page
    await expect(page).toHaveURL('/login');
  });

  test('Registration form requires terms acceptance', async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const password = faker.internet.password({ length: 12, memorable: true });

    // 1. Navigate to registration page
    await page.goto('/register');

    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('en');

    // 2. Fill form without accepting terms
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    // Intentionally don't check the terms checkbox

    // 3. Try to submit
    await page.getByRole('button', { name: /create account|sign up/i }).click();

    // 4. Verify terms validation error
    await expect(page.getByText(/terms.*required/i)).toBeVisible();
  });
});