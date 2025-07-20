import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DomainsPage } from '../pages/DomainsPage';
import { ProfileParamsPage } from '../pages/ProfileParamsPage';
import { UsersPage } from '../pages/UsersPage';
import { generateValidDomainData } from '../utils/dataGenerator';
import { generateValidUserData } from '../utils/generateValidUserData';
import { trackUser, trackDomain, trackParam } from '../utils/entityTracker';


test.describe('Пользователи', () => {
  let loginPage: LoginPage;
  let domainsPage: DomainsPage;
  let profileParamsPage: ProfileParamsPage;
  let usersPage: UsersPage;
  let domainId: string;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    domainsPage = new DomainsPage(page);
    profileParamsPage = new ProfileParamsPage(page);
    usersPage = new UsersPage(page);

    await loginPage.goto();
    await loginPage.login(process.env.LOGIN_EMAIL!, process.env.LOGIN_PASSWORD!);

    await domainsPage.open();
    const domainData = generateValidDomainData();
    await domainsPage.createDomain(
      domainData.domain,
      domainData.otpEmail,
      domainData.otpUrl,
      domainData.teamName,
      domainData.homepage
    );
    trackDomain(domainData.domain);

    const row = page.locator('table tbody tr', { hasText: domainData.domain });
    domainId = await row.locator('td').nth(0).innerText(); 

    await usersPage.open();
  });

  test('Успешное создание пользователя с обязательными полями', async ({ page }) => {
    const user = generateValidUserData(domainId);
    await usersPage.createUser(user);
    trackUser(user.nickname);
  
    await expect(page.locator('text=Пользователь успешно добавлен')).toBeVisible();
  
    const row = usersPage.getRowByNickname(user.nickname);
    await expect(row, 'Строка пользователя должна появиться в таблице').toBeVisible();
  
    const cells = row.locator('td');
  
    const idText = await cells.nth(0).innerText();
    expect(Number(idText)).not.toBeNaN();
  
    const nickname = await cells.nth(1).innerText();
    const email = await cells.nth(2).innerText();
    const domain = await cells.nth(3).innerText();
    const fullName = await cells.nth(4).innerText();
  
    expect(nickname).toBe(user.nickname);
    expect(email).toBe(user.email);
    expect(domain).toBe(domainId);
    expect(fullName).toBe(user.fullName);
  });
  
  

  test('Появление динамических полей после выбора домена', async ({ page }) => {
    await profileParamsPage.open();

    const fields = ['param1-' + Date.now(), 'param2-' + Date.now()];
    for (const name of fields) {
      await profileParamsPage.createProfileParam({
        name,
        type: 'строка',
        isRequired: false,
        domainId
      });
      trackParam(name);
    }

    await usersPage.open();
    await usersPage.domainSelect.selectOption(domainId);
    await usersPage.waitForLoad();

    for (const name of fields) {
      const dynamicField = page.getByRole('textbox', { name });
      await expect(dynamicField).toBeVisible();
    }
  });

  test('Обязательные поля: ошибка, если что-то не заполнено', async ({ page }) => {
    await usersPage.submit();
    await expect(page.locator('text=Ошибка при добавлении пользователя')).toBeVisible();
  });

  test('Ошибка при создании пользователя с существующим email на том же домене', async ({ page }) => {
    const user = generateValidUserData(domainId);
    await usersPage.createUser(user);
    trackUser(user.nickname);
    await expect(page.locator('text=Пользователь успешно добавлен')).toBeVisible();

    await usersPage.createUser(user);
    await expect(page.locator('text=Ошибка при добавлении пользователя')).toBeVisible();
  });

  test('Удаление пользователя', async ({ page }) => {
    const user = generateValidUserData(domainId);
    await usersPage.createUser(user);
    const row = usersPage.getRowByNickname(user.nickname);
    await expect(row).toBeVisible();

    const index = await row.evaluate((row) => Array.from(row.parentElement?.children || []).indexOf(row));
    const deleteButton = usersPage.getDeleteButtonByRowIndex(index);
    await deleteButton.click();

    await expect(page.locator('text=Успешно удалено')).toBeVisible();
    await expect(row).toHaveCount(0);
  });

  test('Валидация: email должен быть корректного формата', async ({ page }) => {
    const user = generateValidUserData(domainId);
    user.email = 'invalid-email';

    await usersPage.createUser(user);

    const row = usersPage.getRowByNickname(user.nickname);
    await expect(row).toHaveCount(0);
  });

  test('Редактирование: автозаполнение и изменение полей', async ({ page }) => {
    const user = generateValidUserData(domainId);
    await usersPage.createUser(user);
    trackUser(user.nickname);

    const row = usersPage.getRowByNickname(user.nickname);
    const index = await row.evaluate((el) => Array.from(el.parentElement?.children || []).indexOf(el));
    await usersPage.getEditButtonByRowIndex(index).click();
    await expect(usersPage.nicknameInput).toHaveValue(user.nickname);
    await expect(usersPage.emailInput).toHaveValue(user.email);
    await expect(usersPage.fullNameInput).toHaveValue(user.fullName);

    const newNickname = user.nickname + '_upd';
    const newFullName = 'Updated Name';

    await usersPage.nicknameInput.fill(newNickname);
    await usersPage.fullNameInput.fill(newFullName);
    await usersPage.getSaveEditedUserButton().click();

    await expect(page.locator('text=Успешно отредактировано')).toBeVisible();
    const updatedRow = usersPage.getRowByNickname(newNickname);
    await expect(updatedRow).toBeVisible();
  });

  test('Обязательный параметр появляется в редактировании пользователя', async ({ page }) => {
    const user = generateValidUserData(domainId);
    await usersPage.createUser(user); 
    trackUser(user.nickname); 
    const newParam = 'new-required-' + Date.now();
    await profileParamsPage.open();
    await profileParamsPage.createProfileParam({
      name: newParam,
      type: 'строка',
      isRequired: true,
      domainId
    });
    trackParam(newParam)
    await page.reload();
    await usersPage.open();
  
    const row = usersPage.getRowByNickname(user.nickname);
    const index = await row.evaluate(el => Array.from(el.parentElement?.children || []).indexOf(el));
    await usersPage.getEditButtonByRowIndex(index).click();  
    const newField = page.getByRole('textbox', { name: newParam });
    await newField.waitFor({ state: 'visible', timeout: 10000 });  
    await usersPage.getSaveEditedUserButton().click();
    await expect(page.locator(`text=Поле "${newParam}" обязательно для заполнения`)).toBeVisible();
    });
  
  test('Пользователь успешно сохраняется с новым обязательным параметром', async ({ page }) => {
    const newParam = 'new-required-' + Date.now();
  
    const user = generateValidUserData(domainId);
    await usersPage.createUser(user);
    trackUser(user.nickname);
    await profileParamsPage.open();
    await profileParamsPage.createProfileParam({
      name: newParam,
      type: 'строка',
      isRequired: true,
      domainId
    });
    trackParam(newParam)
  
    await page.reload();
    await usersPage.open();
  
    const row = usersPage.getRowByNickname(user.nickname);
    const index = await row.evaluate(el => Array.from(el.parentElement?.children || []).indexOf(el));
    await usersPage.getEditButtonByRowIndex(index).click();
  
    const newField = page.getByRole('textbox', { name: newParam });
    await newField.waitFor({ state: 'visible', timeout: 10000 });
    await newField.fill('some value');
    await usersPage.getSaveEditedUserButton().click();
  
    await expect(
      page.locator('text=Успешно отредактировано')
    ).toBeVisible();
  });
  

  test('Валидация поля с типом "число": нельзя ввести текст при создании пользователя', async ({ page }) => {
    const numberParam = 'numeric-' + Date.now();
  
    await profileParamsPage.open();
    await profileParamsPage.createProfileParam({
      name: numberParam,
      type: 'число',
      isRequired: false,
      domainId
    });
    trackParam(numberParam)

    await usersPage.open();
    await usersPage.domainSelect.selectOption(domainId);
  
    const input = page.locator(`input[type="number"][placeholder="${numberParam}"]`);
    await input.waitFor({ state: 'visible', timeout: 10000 });
  
    let errorCaught = false;
    try {
      await input.fill('abcdef');
    } catch (err: any) {
      errorCaught = true;
    }
    expect(errorCaught).toBe(true);
  });
  

  test('Ошибка при создании пользователя без обязательного кастомного параметра', async ({ page }) => {
    const requiredParam = 'required-field-' + Date.now();
  
    await profileParamsPage.open();
    await profileParamsPage.createProfileParam({
      name: requiredParam,
      type: 'строка',
      isRequired: true,
      domainId
    });
    trackParam(requiredParam);

    await usersPage.open();
    const user = generateValidUserData(domainId);
    await usersPage.fillBaseUserForm(user);
    await usersPage.submit();
    await expect(page.locator(`text=Поле "${requiredParam}" обязательно`)).toBeVisible();
  });
  

  test('Удаление параметра, который используется - он пропадёт из профиля пользователя', async ({ page }) => {
    const paramName = 'used-param-' + Date.now();
    await profileParamsPage.open();
    await profileParamsPage.createProfileParam({
      name: paramName,
      type: 'строка',
      isRequired: false,
      domainId
    });

    await usersPage.open();
    const user = generateValidUserData(domainId);
    await usersPage.fillBaseUserForm(user);
    await usersPage.fillCustomField(paramName, 'test-value');
    await usersPage.submit();
    const row = usersPage.getRowByNickname(user.nickname);
    await expect(row).toBeVisible();
    trackUser(user.nickname);
    await profileParamsPage.open();
    const deleteBtn = profileParamsPage.getDeleteButtonForParam(paramName);
    await deleteBtn.click();
    await expect(page.locator('text=Успешно удалено')).toBeVisible();

    await usersPage.open();
    const index = await row.evaluate((el) => Array.from(el.parentElement?.children || []).indexOf(el));
    await usersPage.getEditButtonByRowIndex(index).click();

    const deletedField = page.getByRole('textbox', { name: paramName });
    await expect(deletedField).toHaveCount(0);
  });
});
