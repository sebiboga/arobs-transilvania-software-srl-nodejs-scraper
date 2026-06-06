# Tests

This folder contains Playwright tests for validating project commands.

## Prerequisites

1. Start Chrome with debugging:
   ```powershell
   cd ../
   powershell -ExecutionPolicy Bypass -File start-chrome.ps1
   ```

2. Start Solr (if testing Solr commands):
   ```powershell
   docker start peviitor-solr
   ```

## Running Tests

Install dependencies and run tests:

```powershell
cd tests
npm install
npx playwright test
```

Or run a specific test:

```powershell
npx playwright test login-solr.test.ts
```

## Test Files

- `add-website.test.ts` - Tests the add-website.md command (file system test)
- `login-solr.test.ts` - Tests the login-solr.md command (browser automation)
- `update-solr.test.ts` - Tests the update-solr.md command (API test)
- `delete-solr.test.ts` - Tests the delete-solr.md command (API test)
