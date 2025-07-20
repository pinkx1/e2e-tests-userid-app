import { Page, Locator } from '@playwright/test';

export class UsersPage {
  readonly page: Page;
  readonly nicknameInput: Locator;
  readonly emailInput: Locator;
  readonly domainSelect: Locator;
  readonly fullNameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly userTableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nicknameInput = page.getByRole('textbox', { name: 'Никнейм' });
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.domainSelect = page.getByRole('combobox');
    this.fullNameInput = page.getByRole('textbox', { name: 'Полное имя' });
    this.passwordInput = page.getByRole('textbox', { name: 'Пароль' });
    this.submitButton = page.getByRole('button', { name: 'Добавить пользователя' });
    this.userTableRows = page.locator('table tbody tr');
  }

  async open() {
    await this.page.waitForTimeout(1000);
    await this.page.getByRole('link', { name: 'Пользователи' }).click();
  }

  async fillBaseUserForm({
    nickname,
    email,
    domainId,
    fullName,
    password
  }: {
    nickname: string;
    email: string;
    domainId: string;
    fullName: string;
    password: string;
  }) {
    await this.nicknameInput.fill(nickname);
    await this.emailInput.fill(email);
    await this.domainSelect.selectOption(domainId);
    await this.fullNameInput.fill(fullName);
    await this.passwordInput.fill(password);
  }

  async fillCustomField(label: string, value: string) {
    const field = this.page.getByRole('textbox', { name: label });
    await field.fill(value);
  }

  async submit() {
    await this.submitButton.click();
  }

  async createUser(userData: {
    nickname: string;
    email: string;
    domainId: string;
    fullName: string;
    password: string;
    dynamicFields?: { [label: string]: string };
  }) {
    await this.fillBaseUserForm(userData);
    if (userData.dynamicFields) {
      for (const [label, value] of Object.entries(userData.dynamicFields)) {
        await this.page.waitForTimeout(3000);
                await this.fillCustomField(label, value);
      }
    }
  
    await this.submit();
  }
  
  

  getRowByNickname(nickname: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(nickname, 'i') });
  }

  getEditButtonByRowIndex(index: number): Locator {
    return this.page.getByRole('button', { name: 'Редактировать' }).nth(index);
  }

  getDeleteButtonByRowIndex(index: number): Locator {
    return this.page.getByRole('button', { name: 'Удалить' }).nth(index);
  }

  getSaveEditedUserButton(): Locator {
    return this.page.getByRole('button', { name: 'Изменение пользователя' });
  }

  getEditButtonByNickname(nickname: string): Locator {
    return this.getRowByNickname(nickname).locator('button:has-text("Редактировать")');
  }
  async waitForDynamicField(label: string) {
    const input = this.page.getByRole('textbox', { name: label });
    await input.waitFor({ state: 'visible' });
  }
  
  async waitForLoad(){
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000);
  }
}
