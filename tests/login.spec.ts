import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const email = process.env.LOGIN_EMAIL!;
const password = process.env.LOGIN_PASSWORD!;

test.describe('Тесты авторизации', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('Успешный вход с валидной парой логин + пароль', async ({ page }) => {
    await loginPage.login(email, password);
    await expect(page).toHaveURL(/\/dashboard(\/domains)?$/);
  });

  test('Ошибка при вводе неверного пароля', async ({ page }) => {
    await loginPage.login(email, 'wrongpassword');

    const errorMessage = page.locator('text=Попробуйте снова');
    await expect(errorMessage).toBeVisible();

    await expect(page).toHaveURL('/');
  });

  test('Ошибка при попытке входа без пароля', async ({ page }) => {
    await loginPage.emailInput.fill(email);
    await loginPage.loginButton.click();

    expect(await loginPage.passwordInput.evaluate((el) => document.activeElement === el)).toBe(true);

    await expect(page).toHaveURL('/');
  });

  test('Редирект на логин при попытке открыть внутреннюю страницу без авторизации', async ({ page }) => {
    await page.goto('/dashboard/domains');

    await expect(page).toHaveURL('/');
    const errorMessage = page.locator('text=Пожалуйста, сначала войдите в систему');
    await expect(errorMessage).toBeVisible();
    const emailField = page.getByRole('textbox', { name: 'Введите ваш email' });
    const passwordField = page.getByRole('textbox', { name: 'Введите ваш пароль' });
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });

  test('Успешный выход из аккаунта', async ({ page }) => {
	await loginPage.login(email, password);
    await expect(page).toHaveURL(/\/dashboard(\/domains)?$/);

    const logoutButton = page.getByRole('link', { name: 'Выход' });
    await logoutButton.click();

    await expect(page).toHaveURL('/');
	const errorMessage = page.locator('text=Вы успешно вышли');
    await expect(errorMessage).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
  });
});


