import { Page, Locator, expect } from '@playwright/test';

export class DomainsPage {
  readonly page: Page;
  readonly domainInput: Locator;
  readonly otpEmailInput: Locator;
  readonly otpUrlInput: Locator;
  readonly teamNameInput: Locator;
  readonly homepageInput: Locator;
  readonly submitButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.domainInput = page.getByRole('textbox', { name: 'Домен' });
    this.otpEmailInput = page.getByRole('textbox', { name: 'OTP Email' });
    this.otpUrlInput = page.getByRole('textbox', { name: 'OTP URL' });
    this.teamNameInput = page.getByRole('textbox', { name: 'Название команды' });
    this.homepageInput = page.getByRole('textbox', { name: 'Homepage URL' });
    this.submitButton = page.getByRole('button', { name: 'Добавить домен' });

    this.tableRows = page.locator('table tbody tr');
  }

  async open() {
    await this.page.waitForTimeout(1000);
    await this.page.getByRole('link', { name: 'Домены' }).click();
  }

  async fillForm(domain: string, email: string, otpUrl: string, teamName: string, homepage: string) {
    await this.domainInput.fill(domain);
    await this.otpEmailInput.fill(email);
    await this.otpUrlInput.fill(otpUrl);
    await this.teamNameInput.fill(teamName);
    await this.homepageInput.fill(homepage);
  }

  async submit() {
    await this.submitButton.click();
  }

  async createDomain(domain: string, email: string, otpUrl: string, teamName: string, homepage: string) {
    await this.fillForm(domain, email, otpUrl, teamName, homepage);
    await this.submit();
  }

  async expectDomainInTable(domain: string) {
    const matchingRow = this.tableRows.filter({ hasText: domain });
    await expect(matchingRow).toHaveCount(1);
  }
  async waitForLoad(){
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000);
  }
}
