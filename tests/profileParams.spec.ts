import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DomainsPage } from '../pages/DomainsPage';
import { ProfileParamsPage } from '../pages/ProfileParamsPage';
import { generateValidDomainData } from '../utils/dataGenerator';
import { expectProfileParamRowToMatch } from '../utils/verifyProfileParamRow';
import { UsersPage } from '../pages/UsersPage';
import { trackUser, trackDomain, trackParam } from '../utils/entityTracker';


test.describe('Параметры профилей', () => {
  let loginPage: LoginPage;
  let domainsPage: DomainsPage;
  let profileParamsPage: ProfileParamsPage;
  let createdDomainId: string;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    domainsPage = new DomainsPage(page);
    profileParamsPage = new ProfileParamsPage(page);

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
    createdDomainId = await row.locator('td').nth(0).innerText();

    await profileParamsPage.open();
  });

  test('Успешное создание параметра с корректными данными', async ({ page }) => {
    const paramData = {
      name: 'custom-field-' + Date.now(),
      type: 'дата' as const,
      isRequired: true,
      domainId: createdDomainId
    };

    await profileParamsPage.createProfileParam(paramData);
    trackParam(paramData.name);

    await expect(page.locator('text=Вы успешно добавили')).toBeVisible();
    await expectProfileParamRowToMatch(page, paramData);
  });

  test('Валидация: поле "Название" обязательно для создания параметра', async ({ page }) => {
    const data = {
      name: '',
      type: 'число' as const,
      isRequired: true,
      domainId: createdDomainId
    };

    await profileParamsPage.fillForm(data);
    await profileParamsPage.submit();

    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Введите название поля!')).toBeVisible();
  });

  test('Валидация: поле "Тип" обязательно для создания параметра', async ({ page }) => {
    const name = 'field-no-type-' + Date.now();

    await profileParamsPage.nameInput.waitFor({ state: 'visible' });
    await profileParamsPage.nameInput.fill(name);

    const isChecked = await profileParamsPage.requiredCheckbox.isChecked();
    if (!isChecked) {
      await profileParamsPage.requiredCheckbox.check();
    }

    await profileParamsPage.domainSelect.waitFor({ state: 'visible' });
    await profileParamsPage.domainSelect.selectOption(createdDomainId);

    await profileParamsPage.submit();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Выберите тип поля!')).toBeVisible();
  });

  test('Валидация: поле "Домен" обязательно для создания параметра', async ({ page }) => {
    const name = 'field-no-domain-' + Date.now();
    const type = 'дата' as const;

    await profileParamsPage.nameInput.waitFor({ state: 'visible' });
    await profileParamsPage.nameInput.fill(name);

    await profileParamsPage.typeDropdown.waitFor({ state: 'visible' });
    await profileParamsPage.typeDropdown.click();
    await profileParamsPage.typeOptions[type].waitFor({ state: 'visible' });
    await profileParamsPage.typeOptions[type].click();

    await profileParamsPage.submit();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Выберите домен!')).toBeVisible();
  });

  test('Создание нескольких параметров для одного домена', async ({ page }) => {
    const names = ['param-a-' + Date.now(), 'param-b-' + Date.now()];

    for (const name of names) {
      const data = {
        name,
        type: 'строка' as const,
        isRequired: false,
        domainId: createdDomainId
      };

      await profileParamsPage.createProfileParam(data);
      trackParam(data.name);
      await page.waitForLoadState('networkidle');
      await expectProfileParamRowToMatch(page, data);
    }
  });

  test('Удаление параметра, который нигде не используется', async ({ page }) => {
    const name = 'to-delete-' + Date.now();

    await profileParamsPage.createProfileParam({
      name,
      type: 'bool',
      isRequired: false,
      domainId: createdDomainId
    });

    const row = profileParamsPage.getRowByName(name);
    const deleteButton = profileParamsPage.getDeleteButtonForParam(name);

    await deleteButton.click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Успешно удалено')).toBeVisible();
    await expect(row, `Параметр "${name}" должен исчезнуть из таблицы после удаления`).toHaveCount(0);
  });

  test('Удаление параметра, который используется — удаляет его и у пользователя', async ({ page }) => {
    const paramName = 'used-param-' + Date.now();
      await profileParamsPage.createProfileParam({
      name: paramName,
      type: 'строка',
      isRequired: false,
      domainId: createdDomainId
    });
  
    const domainId = createdDomainId;
    const usersPage = new UsersPage(page);
    await usersPage.open();
  
    const userData = {
      nickname: 'user-' + Date.now(),
      email: `test${Date.now()}@test.com`,
      domainId,
      fullName: 'Test User',
      password: 'Test12345!',
      dynamicFields: {
        [paramName]: 'some value'
      }
    };
  
    await usersPage.createUser(userData);
    await profileParamsPage.open();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const deleteBtn = profileParamsPage.getDeleteButtonForParam(paramName);
    await deleteBtn.click();
    await expect(page.locator('text=Успешно удалено')).toBeVisible();
    await usersPage.open();
    const editBtn = usersPage.getEditButtonByNickname(userData.nickname);
    await editBtn.click();
    const dynamicFieldInput = page.getByRole('textbox', { name: paramName });
    const count = await dynamicFieldInput.count();
    await expect(dynamicFieldInput, `Поле "${paramName}" должно исчезнуть после удаления параметра`).toHaveCount(0);
  });
});

