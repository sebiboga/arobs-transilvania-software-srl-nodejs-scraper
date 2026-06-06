---
description: Follow INSTRUCTIONS.md workflow for adding/changing commands
agent: build
---

Execute the workflow defined in INSTRUCTIONS.md when the user asks to add or change a command.

**IMPORTANT**: Always reference SCHEMAS.md for data model definitions when working with Job or Company data. Ensure all fields follow the schema rules (diacritics, required fields, valid values, etc.).

Steps:
1. **Write a test first** - Create test files in `tests/` directory following existing test patterns
2. **Run the test** to learn how things work and verify it fails initially
3. **Update the command/scraper** based on what you learn from the test
4. **Update documentation** in `docs/` folder if it exists, otherwise create appropriate docs
5. **Review entire code** and suggest optimizations

Important Notes:
- Always use the correct Solr delete-by-query format: `{"delete":{"query":"url:\"https://example.com/job\""}}`
- Do NOT use `_delete_:true` format - it doesn't work properly
- Test with Playwright before finalizing any command
- Keep the user informed about what you're doing
- Follow conventions in `AGENTS.md` for code style and project structure

Project Context:
- Tests are in `tests/` directory
- Documentation in `docs/` directory
- Commands in `.opencode/commands/` directory
- Company data is stored in Solr company core (query https://solr.peviitor.ro/solr/company/select)
