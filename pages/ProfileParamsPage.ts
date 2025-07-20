import { Page, Locator } from '@playwright/test';

export class ProfileParamsPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly typeDropdown: Locator;
  readonly typeOptions: Record<string, Locator>;
  readonly requiredCheckbox: Locator;
  readonly domainSelect: Locator;
  readonly submitButton: Locator;
  readonly paramRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByRole('textbox', { name: 'Введите название поля' });

    this.typeDropdown = page.locator('.css-13cymwt-control');
    this.typeOptions = {
      строка: page.getByRole('option', { name: 'строка' }),
      число: page.getByRole('option', { name: 'число' }),
      bool: page.getByRole('option', { name: 'bool' }),
      дата: page.getByRole('option', { name: 'дата' })
    };

    this.requiredCheckbox = page.locator('label').filter({ hasText: 'Обязательное' });
    this.domainSelect = page.locator('select[name="domain_id"]');
    this.submitButton = page.getByRole('button', { name: 'Добавить' });
    this.paramRows = page.locator('table tbody tr');
  }

  async open() {
    await this.page.waitForTimeout(1000);
    await this.page.getByRole('link', { name: 'Параметры профилей' }).click();
  }

  async fillForm({
    name,
    type,
    isRequired,
    domainId
  }: {
    name: string;
    type: 'строка' | 'число' | 'bool' | 'дата';
    isRequired: boolean;
    domainId: string;
  }) {
    await this.nameInput.waitFor({ state: 'visible' });
    await this.nameInput.fill(name);

    // Клик по кастомному dropdown и выбор опции
    await this.typeDropdown.waitFor({ state: 'visible' });
    await this.typeDropdown.click();
    await this.typeOptions[type].waitFor({ state: 'visible' });
    await this.typeOptions[type].click();

    const checked = await this.requiredCheckbox.isChecked();
    if (isRequired && !checked) {
      await this.requiredCheckbox.check();
    } else if (!isRequired && checked) {
      await this.requiredCheckbox.uncheck();
    }

    await this.domainSelect.waitFor({ state: 'visible' });
    await this.domainSelect.selectOption(domainId);
  }

  async submit() {
    await this.submitButton.click();
  }

  async createProfileParam(data: {
    name: string;
    type: 'строка' | 'число' | 'bool' | 'дата';
    isRequired: boolean;
    domainId: string;
  }) {
    await this.fillForm(data);
    await this.submit();
  }

  getRowByName(name: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(name, 'i') });
  }

  getDeleteButtonForParam(name: string): Locator {
    return this.getRowByName(name).getByRole('button', { name: 'Удаление' });
  }
  async waitForLoad(){
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000);
  }
}
