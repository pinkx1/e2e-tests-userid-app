
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DomainsPage } from '../pages/DomainsPage';
import { UsersPage } from '../pages/UsersPage';
import { ProfileParamsPage } from '../pages/ProfileParamsPage';
import { trackUser, trackDomain, trackParam } from '../utils/entityTracker';

import {
  generateValidDomainData,
  generateInvalidEmail,
  generateInvalidUrl
} from '../utils/dataGenerator';

import { generateValidUserData } from '../utils/generateValidUserData';
import { expectDomainRowToMatch } from '../utils/verifyDomainRow';


test.describe('Домены', () => {
  let loginPage: LoginPage;
  let domainsPage: DomainsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    domainsPage = new DomainsPage(page);

    await loginPage.goto();
    await loginPage.login(process.env.LOGIN_EMAIL!, process.env.LOGIN_PASSWORD!);
    await domainsPage.open();
  });

  test('Успешное создание домена со всеми валидными значениями', async ({ page }) => {
    const data = generateValidDomainData();
    await domainsPage.createDomain(data.domain, data.otpEmail, data.otpUrl, data.teamName, data.homepage);
    trackDomain(data.domain);
    await expectDomainRowToMatch(page, data);
  });

  test('Проверка обязательности каждого поля', async ({ page }) => {
    const fieldsWithExpectations = [
      { field: 'domain', expect: 'text' },
      { field: 'otpEmail', expect: 'alert' },
      { field: 'otpUrl', expect: 'alert' },
      { field: 'teamName', expect: 'alert' },
      { field: 'homepage', expect: 'text' }
    ];
  
    for (const { field, expect: expectation } of fieldsWithExpectations) {
      const data = generateValidDomainData();
      (data as any)[field] = '';
  
      await domainsPage.fillForm(
        data.domain,
        data.otpEmail,
        data.otpUrl,
        data.teamName,
        data.homepage
      );
  
      if (expectation === 'alert') {
        let dialogText = '';
        page.once('dialog', async (dialog) => {
          dialogText = dialog.message();
          await dialog.dismiss();
        });
  
        await domainsPage.submit();
  
        expect(dialogText).toContain('Заполните все обязательные поля');
      }
  
      if (expectation === 'text') {
        await domainsPage.submit();
        await expect(page.locator('text=Ошибка при добавлении домена')).toBeVisible();
      }
    }
  });
  
  
  test('Создание домена с указанеим невалидного email', async ({ page }) => {
    const data = generateValidDomainData();
    data.otpEmail = generateInvalidEmail();

    await domainsPage.fillForm(data.domain, data.otpEmail, data.otpUrl, data.teamName, data.homepage);
    await domainsPage.submit();

    const row = page.locator('table tbody tr', { hasText: data.domain });
    await expect(row).toHaveCount(0);
  });

  test('Создание домена с указанием невалидного OTP URL', async ({ page }) => {
    const data = generateValidDomainData();
    data.otpUrl = generateInvalidUrl();

    await domainsPage.fillForm(data.domain, data.otpEmail, data.otpUrl, data.teamName, data.homepage);
    await domainsPage.submit();

    const row = page.locator('table tbody tr', { hasText: data.domain });
    await expect(row).toHaveCount(0);
  });

  test('Создание домена с указанием невалидного Homepage URL', async ({ page }) => {
    const data = generateValidDomainData();
    data.homepage = generateInvalidUrl();

    await domainsPage.fillForm(data.domain, data.otpEmail, data.otpUrl, data.teamName, data.homepage);
    await domainsPage.submit();

    const row = page.locator('table tbody tr', { hasText: data.domain });
    await expect(row).toHaveCount(0);
  });
  test('Попытка создания дубликата домена', async ({ page }) => {
    const data = generateValidDomainData();
  
    await domainsPage.createDomain(data.domain, data.otpEmail, data.otpUrl, data.teamName, data.homepage);
    await expectDomainRowToMatch(page, data);
  
    await domainsPage.createDomain(data.domain.toUpperCase(), data.otpEmail, data.otpUrl, data.teamName, data.homepage);
  
    await page.reload();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const matchingRows = page.locator('table tbody tr', { hasText: data.domain });
    await expect(matchingRows).toHaveCount(1); 
  
    await expect(page.locator('text=Ошибка при добавлении домена')).toBeVisible();
  });
  
  test('Удаление домена без связей', async ({ page }) => {
    const data = generateValidDomainData();

    await domainsPage.createDomain(data.domain, data.otpEmail, data.otpUrl, data.teamName, data.homepage);
    await expectDomainRowToMatch(page, data);

    const row = page.locator('table tbody tr', { hasText: data.domain });
    const deleteBtn = row.getByRole('button', { name: 'Удаление' });
    await deleteBtn.click();

    await expect(page.locator('text=Успешно удалено')).toBeVisible();
    await expect(row).not.toBeVisible();
  });

  test('Попытка удаления домена, связанного с пользователем', async ({ page }) => {
    const domainData = generateValidDomainData();
    await domainsPage.createDomain(domainData.domain, domainData.otpEmail, domainData.otpUrl, domainData.teamName, domainData.homepage);
    trackDomain(domainData.domain);

    const row = page.locator('table tbody tr', { hasText: domainData.domain });
    const domainId = await row.locator('td').nth(0).innerText();
  
    const usersPage = new UsersPage(page);
    await usersPage.open();
    const user = generateValidUserData(domainId);
    await usersPage.createUser(user);
    trackUser(user.nickname);
    await expect(usersPage.getRowByNickname(user.nickname)).toBeVisible();
  
    await domainsPage.open();
    const updatedRow = page.locator('table tbody tr', { hasText: domainData.domain });
    const deleteBtn = updatedRow.getByRole('button', { name: 'Удаление' });
    await deleteBtn.click();
  
    await expect(page.locator('text=Произошла ошибка при удалении')).toBeVisible();
    await expect(updatedRow).toBeVisible();
  });
  

  test('Попытка удаления домена, связанного с параметром профиля', async ({ page }) => {
    const domainData = generateValidDomainData();
    await domainsPage.createDomain(domainData.domain, domainData.otpEmail, domainData.otpUrl, domainData.teamName, domainData.homepage);
    trackDomain(domainData.domain);
  
    const row = page.locator('table tbody tr', { hasText: domainData.domain });
    const domainId = await row.locator('td').nth(0).innerText();
  
    const profileParamsPage = new ProfileParamsPage(page);
    await profileParamsPage.open();
    
    const paramName = 'attached-field-' + Date.now();
    
    await profileParamsPage.createProfileParam({
      name: paramName,
      type: 'строка',
      isRequired: false,
      domainId
    });
    
    trackParam(paramName);
    
  
    await domainsPage.open();
    const updatedRow = page.locator('table tbody tr', { hasText: domainData.domain });
    await page.reload();

    const deleteBtn = updatedRow.getByRole('button', { name: 'Удаление' });
    await deleteBtn.click();
  
    await expect(page.locator('text=Произошла ошибка при удалении')).toBeVisible();
    await expect(updatedRow).toBeVisible();
  });
});
