import { test } from '@playwright/test';
import { createdUsers, createdParams, createdDomains, untrackDomain, untrackParam, untrackUser } from '../utils/entityTracker';
import { LoginPage } from '../pages/LoginPage';
import { UsersPage } from '../pages/UsersPage';
import { ProfileParamsPage } from '../pages/ProfileParamsPage';
import { DomainsPage } from '../pages/DomainsPage';

test('cleanup: удаление всех созданных сущностей', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  const loginPage = new LoginPage(page);
  const usersPage = new UsersPage(page);
  const profileParamsPage = new ProfileParamsPage(page);
  const domainsPage = new DomainsPage(page);

  await loginPage.goto();
  await loginPage.login(process.env.LOGIN_EMAIL!, process.env.LOGIN_PASSWORD!);

  // === Удаление пользователей ===
  if (createdUsers.length > 0) {
    await usersPage.open();
    await usersPage.waitForLoad();
  
    for (const nickname of createdUsers) {
      const row = usersPage.getRowByNickname(nickname);
      const count = await row.count();
  
      if (count === 0) {
        continue;
      }
  
      const index = await row.evaluate(rowEl => Array.from(rowEl.parentElement?.children || []).indexOf(rowEl));
      const deleteBtn = usersPage.getDeleteButtonByRowIndex(index);
      await deleteBtn.click();
  
      untrackUser(nickname);
    }
  
  
    
  }

  // === Удаление параметров профиля ===
  if (createdParams.length > 0) {
    await profileParamsPage.open();
    await profileParamsPage.waitForLoad();

    for (const name of createdParams) {
      const deleteBtn = profileParamsPage.getDeleteButtonForParam(name);

      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        untrackParam(name);
      } 
    }
  }

  // === Удаление доменов ===
  if (createdDomains.length > 0) {
    await domainsPage.open();
    await domainsPage.waitForLoad();

    for (const domainName of createdDomains) {
      const row = page.locator('table tbody tr', { hasText: domainName });
      const deleteBtn = row.getByRole('button', { name: 'Удаление' });

      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        untrackDomain(domainName);
      }
    }
  } else {
  }

  await context.close();
});
