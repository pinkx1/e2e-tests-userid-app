# 🧪 UserID UI Tests

This is a portfolio UI testing project for a web-based UserID platform. It uses [Playwright](https://playwright.dev/) for automated end-to-end testing and demonstrates clean architecture, dynamic data generation, and cleanup automation.

> Originally developed during a freelance collaboration. Published as part of my personal portfolio.

## 📦 Tech Stack

- **Test Framework**: Playwright
- **Language**: TypeScript
- **Test Types**: UI tests (E2E)
- **Extras**: Data generators, teardown utils, entity tracking
- **Tools**: Faker, dotenv

## 🗂️ Project Structure

- `tests/` — Test specs (login, domains, users, profile params)
- `pages/` — Page Object Models
- `utils/` — Helpers: test data generation, entity tracker, validators
- `.cache/` — Temporary entity store (used for cleanup)

## ▶️ How to Run

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Run all tests
npx playwright test
