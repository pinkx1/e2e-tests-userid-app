# 🧪 UserID UI Tests

Автоматические UI-тесты для проекта **UserID**, написанные с использованием [Playwright](https://playwright.dev/).

## 📁 Структура проекта

- `tests/` — UI-тесты
- `pages/` — Page Object модели для взаимодействия с UI.
- `utils/` — вспомогательные функции, генераторы данных и трекер созданных сущностей.
- `.cache/` — временное хранилище созданных сущностей (для их последующего удаления).

## 🚀 Запуск тестов

1. `npm install` 
2. `npx playwright install` 
3. `npx playwright test` 
