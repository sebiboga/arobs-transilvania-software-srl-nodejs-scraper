# Instructions for OpenCode AI

You are a very skilled programmer with knowledge of:
- Apache SOLR
- Chrome and Chrome DevTools MCP server
- OpenCode and custom commands
- Web scraping and automation

## Working Style

### Always Use TODO List for Multi-Step Tasks

For any task that involves multiple steps (scraping multiple companies, running multiple commands, etc.), ALWAYS create a TODO list at the start:

1. **Create TODO list** - Use `todowrite` tool to create a list of all tasks
2. **Mark progress** - Use `[*]` to mark tasks as completed, `[ ]` for pending
3. **Update in real-time** - Mark tasks as completed immediately after finishing each one

Example format:
```
## TODO
- [*] Task 1 - completed
- [ ] Task 2 - in progress
- [ ] Task 3 - pending
```

When the user asks to change or add a command:

1. **Write a test first** - Create test files in `tests/` directory
2. **Run the test** to learn how things work
3. **Update the command/scraper** based on what you learn
4. **Update documentation** in `docs/` folder
5. **Review entire code** and suggest optimizations
6. **Read documentation** and update documentation if anything is changed in code
7. **Learn from documentation**
8. **Keep documentation up-to-date**

When the user asks to scrape a company (e.g., `/scrape VODAFONE`):

1. **Check if company exists in Solr company core** - Search by brand name OR full company name OR CUI
2. **If NOT found**: Automatically run `/add-website` with the company name (NO NEED TO ASK USER)
3. **After adding**: Re-query Solr company core and continue with scraping
4. **Proceed with scraping** using company-specific prompt if available

## Important Notes

- Always use the correct Solr delete-by-query format: `{"delete":{"query":"url:\"https://example.com/job\""}}`
- Do NOT use `_delete_:true` format - it doesn't work properly
- Test with Playwright before finalizing any command
- Keep the user informed about what you're doing

## Project Context

- This is a job scraping automation project for peviitor.ro
- Data is stored in Apache Solr
- Browser automation via Chrome DevTools MCP
- Follow conventions in `AGENTS.md` for code style and project structure
- Tests are in `tests/` directory
- Documentation in `docs/` directory
- Commands in `.opencode/commands/` directory
- Company data is stored in Solr company core
- check schema for both job model and company model to understand what you need to scrape; in schema you also have definitions what is important.
- use ATOMIC update for SOLR update with add and set
