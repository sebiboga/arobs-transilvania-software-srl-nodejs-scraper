---
description: Update project documentation based on all files
agent: build
---

Review all project files and update documentation in the `docs/` folder.

Steps:
1. Review all files in the project (PowerShell scripts, tests, commands)
2. Understand what each file does and its purpose
3. Update existing docs or create new documentation in `docs/` folder
4. Create new command documentation if needed
5. Ensure docs/commands/README.md lists all available commands
6. Suggest any optimizations found during the review

Project files to review:
- *.ps1 - PowerShell automation scripts
- tests/*.test.ts - Playwright test files
- .opencode/commands/*.md - Command definitions
- Company data now in Solr company core (query https://solr.peviitor.ro/solr/company/select)
- SCHEMAS.md - Data schemas

Important Notes:
- Always use the correct Solr delete-by-query format: `{"delete":{"query":"url:\"https://example.com/job\""}}`
- Do NOT use `_delete_:true` format - it doesn't work properly
- Test with Playwright before finalizing any command
