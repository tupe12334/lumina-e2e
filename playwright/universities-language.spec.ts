import { test, expect } from '@playwright/test';

test.skip('shows university names according to selected language', async ({
  page,
}) => {
  await page.route('**/universities', async (route) => {
    await route.fulfill({
      json: [
        {
          id: 'open-university-id',
          enName: 'Open University',
          heName: 'האוניברסיטה הפתוחה',
          courses: [],
        },
      ],
    });
  });

  await page.goto('/universities');
  await expect(
    page.getByRole('link', { name: 'Open University' })
  ).toBeVisible();

  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'HE' }).click();
  await expect(
    page.getByRole('link', { name: 'האוניברסיטה הפתוחה' })
  ).toBeVisible();
});
