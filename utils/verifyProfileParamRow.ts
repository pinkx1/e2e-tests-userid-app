import { Page, expect } from '@playwright/test';

type ProfileParamData = {
  name: string;
  type: 'строка' | 'число' | 'bool' | 'дата';
  isRequired: boolean;
  domainId: string;
};

export async function expectProfileParamRowToMatch(page: Page, data: ProfileParamData) {
  await page.reload();

  const row = page.getByRole('row', { name: new RegExp(data.name, 'i') });
  await expect(row, `Строка параметра "${data.name}" должна быть видна`).toBeVisible();

  const cells = row.locator('td');
  const name = await cells.nth(0).innerText();
  const required = await cells.nth(1).innerText();
  const type = await cells.nth(2).innerText();
  const domainId = await cells.nth(3).innerText();
  const clientId = await cells.nth(4).innerText();

  expect(name).toBe(data.name);
  expect(required).toBe(data.isRequired ? 'Да' : 'Нет');
  expect(type).toBe(data.type);
  expect(domainId).toBe(data.domainId);
  expect(clientId).toBe(process.env.CLIENT_ID);
}
