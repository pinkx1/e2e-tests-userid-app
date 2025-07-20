import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  retries: 1,
  reporter: [['list'], ['html', { open: 'on-failure' }]],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'tests',
      testMatch: /.*\.spec\.ts$/,
    },
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.ts$/,
    }
  ]
});
