const { test, expect } = require('@playwright/test');

test.describe('Contact Manager app', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with title, subtitle and default contacts', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Contact Manager' })).toBeVisible();
    await expect(
      page.getByText('Manage your contacts with search and local storage.')
    ).toBeVisible();

    // Default contacts
    await expect(page.getByText('Alice Johnson')).toBeVisible();
    await expect(page.getByText('Bob Smith')).toBeVisible();
    await expect(page.getByText('Charlie Brown')).toBeVisible();
  });

  test('search filters contacts by name, phone and email', async ({ page }) => {
    const search = page.getByPlaceholder('Search by name, phone, or email...');

    // By name
    await search.fill('alice');
    await expect(page.getByText('Alice Johnson')).toBeVisible();
    await expect(page.getByText('Bob Smith')).not.toBeVisible();

    // By phone
    await search.fill('222-3333'); // part of Charlie phone
    await expect(page.getByText('Charlie Brown')).toBeVisible();
    await expect(page.getByText('Alice Johnson')).not.toBeVisible();

    // By email
    await search.fill('bob@example.com');
    await expect(page.getByText('Bob Smith')).toBeVisible();
    await expect(page.getByText('Charlie Brown')).not.toBeVisible();

    // Clear
    await search.fill('');
    await expect(page.getByText('Alice Johnson')).toBeVisible();
    await expect(page.getByText('Bob Smith')).toBeVisible();
    await expect(page.getByText('Charlie Brown')).toBeVisible();
  });

  test('can create a new contact', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Contact' }).click();

    await page.getByLabel('Name').fill('Dana White');
    await page.getByLabel('Phone').fill('+1 555-444-5555');
    await page.getByLabel('Email').fill('dana@example.com');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Dana White')).toBeVisible();
    await expect(page.getByText('+1 555-444-5555')).toBeVisible();
    await expect(page.getByText('dana@example.com')).toBeVisible();
  });

  test('validates that name and phone are required', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Contact' }).click();

    // Leave empty and try to save
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Name and phone are required');
      await dialog.dismiss();
    });

    await page.getByRole('button', { name: 'Save' }).click();
  });

  test('can edit an existing contact', async ({ page }) => {
    await page.getByText('Alice Johnson').click();

    const nameInput = page.getByLabel('Name');
    await expect(nameInput).toHaveValue('Alice Johnson');

    await nameInput.fill('Alice Johnson Jr.');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Alice Johnson Jr.')).toBeVisible();
  });

  test('can delete a contact', async ({ page }) => {
    const contactItem = page.getByText('Bob Smith').locator('..').locator('..');

    // Intercept confirm dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Delete contact');
      await dialog.accept();
    });

    await contactItem.getByRole('button', { name: '✕' }).click();

    await expect(page.getByText('Bob Smith')).not.toBeVisible();
  });

  test('persists new contacts in localStorage across reloads', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Contact' }).click();

    await page.getByLabel('Name').fill('Eve Adams');
    await page.getByLabel('Phone').fill('+1 555-000-1111');
    await page.getByLabel('Email').fill('eve@example.com');

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Eve Adams')).toBeVisible();

    // Reload the page; app should load from localStorage
    await page.reload();

    await expect(page.getByText('Eve Adams')).toBeVisible();
    await expect(page.getByText('+1 555-000-1111')).toBeVisible();
  });
});

