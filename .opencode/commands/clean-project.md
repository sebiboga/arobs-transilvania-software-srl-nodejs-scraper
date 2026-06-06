---
description: Clean project by removing temporary files and updating documentation
agent: build
---

Clean the project by removing unnecessary files and updating documentation.

## Step 1: Remove Temporary Files

Delete the following temporary files that are not needed:

### Temporary PowerShell Scripts (delete):
- `push_levi9.ps1`
- `process_ddroidd.ps1`
- `scripts/scrape-genpact-page1.ps1`
- If `scripts/` folder is empty after deletion, delete the folder too

### Temporary JSON Files (delete):
- `levi9_jobs.json`
- `artsoft_jobs.json`
- `yardi_jobs.json`

### Test Results & Node Modules (delete):
- `tests/test-results.last-run.json`
- `tests/node_modules/` (can be recreated with `cd tests && npm install`)
- `tests/package-lock.json` (can be recreated)

### OpenCode Node Modules (delete):
- `.opencode/node_modules/` (can be recreated when needed)
- `.opencode/bun.lock` (lock file)

### Files to KEEP:
- `start-chrome.ps1` - needed to start Chrome with remote debugging
- `webscraper/` - company scraping prompts
- Company data now in Solr company core (no longer in websites.md)
- `docs/` - HTML documentation
- `tests/*.test.ts` - test files
- `tests/package.json` - test dependencies
- `tests/playwright.config.ts` - test config
- `.opencode/commands/*.md` - command definitions
- `.opencode/package.json` - opencode commands dependencies
- `opencode.json` - opencode config
- `SCHEMAS.md` - data schemas
- `AGENTS.md` - agent instructions
- `INSTRUCTIONS.md` - workflow instructions

## Step 2: Update HTML Documentation

Read all files in the project and update the HTML documentation in `docs/` folder:

1. Read `SCHEMAS.md` and update `docs/schemas.html`
2. Query Solr company core and update relevant docs
3. Read `.opencode/commands/*.md` files and update `docs/commands.html`
4. Read `AGENTS.md` and update `docs/setup.html`
5. Read `INSTRUCTIONS.md` and update `docs/index.html` or create new section
6. Review `tests/` directory and update `docs/tests.html`
7. Review project structure and update `docs/structure.html`

For each HTML file:
- Read the current content
- Compare with source files
- Update any outdated information
- Ensure all links work
- Add any new commands or features

## Step 3: Additional Cleanup Suggestions

Review the project and propose additional cleanup:

1. **Check for duplicate files** - Are there any files that serve the same purpose?
2. **Check for outdated documentation** - Are there any docs that reference old commands or workflows?
3. **Check for empty folders** - Remove any folders that are empty after cleanup
4. **Check for large files** - Are there any large files that could be压缩ed or removed?
5. **Check for backup files** - Remove any `.bak`, `.old`, `.backup` files
6. **Check for log files** - Remove any `.log` files

## Step 4: Report Results

Report what was cleaned up:
- List of files deleted
- List of documentation files updated
- List of suggested additional cleanup (if any)
- Final project structure summary

Example output:
```
=== CLEANUP COMPLETE ===

Files Deleted:
- push_levi9.ps1
- process_ddroidd.ps1
- scripts/scrape-genpact-page1.ps1
- levi9_jobs.json
- artsoft_jobs.json
- yardi_jobs.json
- tests/test-results.last-run.json
- tests/node_modules/
- tests/package-lock.json
- .opencode/node_modules/
- .opencode/bun.lock

Documentation Updated:
- docs/schemas.html
- docs/commands.html
- docs/setup.html

Suggested Additional Cleanup:
- [any additional suggestions]

Final Project Structure:
[summary of remaining files/folders]
```

## Important Notes

- Always verify before deleting - make sure file is truly temporary
- Do NOT delete test source files (*.test.ts) - only node_modules and results
- Do NOT delete configuration files (package.json, playwright.config.ts, opencode.json)
- After deleting node_modules, the project can be restored with:
  - Tests: `cd tests && npm install`
  - OpenCode: Dependencies are installed automatically
