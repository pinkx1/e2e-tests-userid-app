import { Page, Locator, expect } from '@playwright/test';

type DomainData = {
  domain: string;
  otpEmail: string;
  otpUrl: string;
  teamName: string;
  homepage: string;
};

export async function expectDomainRowToMatch(page: Page, data: DomainData) {
	await page.reload();
  
	const row = page.locator('table tbody tr', { hasText: data.domain });
	await expect(row).toBeVisible();
  
	const cells = row.locator('td');
	const idCell = await cells.nth(0).innerText();
	const clientIdCell = await cells.nth(1).innerText();
	const domainCell = await cells.nth(2).innerText();
	const teamNameCell = await cells.nth(3).innerText();
	const emailCell = await cells.nth(4).innerText();
	const otpUrlCell = await cells.nth(5).innerText();
	const homepageCell = await cells.nth(6).innerText();
  
	expect(Number(idCell)).not.toBeNaN();
	expect(clientIdCell).toBe(process.env.CLIENT_ID);
	expect(domainCell).toBe(data.domain);
	expect(teamNameCell).toBe(data.teamName);
	expect(emailCell).toBe(data.otpEmail);
	expect(otpUrlCell).toBe(data.otpUrl);
	expect(homepageCell).toBe(data.homepage);
  }
  