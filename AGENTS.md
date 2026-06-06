# AGENTS.md - AROBS Scraper

## Project Overview

Automation project for scraping job data from AROBS Transilvania Software S.A. career page. It contains:
- PowerShell scripts for browser automation (Chrome DevTools)
- Playwright tests for validating commands
- Markdown documentation files
- HTML documentation in docs/
- Configuration for opencode and MCP servers

## Project Structure

```
arobs-scraper/
├── *.ps1                   # Root PowerShell scripts (start-chrome.ps1)
├── *.md                    # Root Markdown documentation
├── opencode.json           # OpenCode configuration
├── SCHEMAS.md             # Data schemas (Job, Company models)
├── AGENTS.md              # Agent instructions and guidelines
├── INSTRUCTIONS.md        # Project instructions
├── LICENSE                # MIT License
├── CONTRIBUTING.md       # Contribution guidelines
├── CODE_OF_CONDUCT.md    # Community code of conduct
├── SECURITY.md           # Security policy
├── README.md             # Project README
├── .github/              # GitHub templates
├── webscraper/            # Company scraping prompts
│   ├── arobs.md            # AROBS scraping prompt
├── docs/                  # HTML documentation
│   ├── index.html
│   ├── setup.html
│   ├── schemas.html
│   ├── commands.html
│   ├── structure.html
│   ├── tests.html
│   └── README.md
├── tests/                 # Playwright tests
│   ├── *.test.ts
│   ├── README.md
│   ├── playwright.config.ts
│   └── package.json
└── .opencode/             # OpenCode commands
    ├── package.json
    └── commands/
        ├── scrape.md
        ├── add-website.md
        ├── update-solr.md
        ├── delete-solr.md
        ├── login-solr.md
        ├── docs-update.md
        ├── instructions.md
        └── remove-404.md
```

## Commands

### Running PowerShell Scripts

```powershell
# Run a single script
powershell -ExecutionPolicy Bypass -File script.ps1

# Run inline command
powershell -Command "your-command-here"
```

### Chrome DevTools Automation

Before using Chrome DevTools MCP, you must start Chrome with remote debugging:

```powershell
# Run the start script
powershell -ExecutionPolicy Bypass -File start-chrome.ps1

# Or manually
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--remote-debugging-port=9222"
```

### Docker Commands

```powershell
# Start a container
docker start peviitor-solr

# Check container status
docker ps --filter "name=peviitor-solr"
```

### Solr Operations

```powershell
# Access Solr API (requires credentials)
curl -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/job/select?q=*:*&rows=1"

# Ping Solr to verify it's running
curl -s https://solr.peviitor.ro/solr/admin/ping
```

### Running Playwright Tests

```powershell
cd tests
npx playwright test
```

## Code Style Guidelines

### PowerShell Scripts

#### Naming Conventions
- Use PascalCase for function names: `Get-CompanyData`
- Use camelCase for variable names: `$companyList`
- Use singular nouns for function names: `Get-Company` not `Get-Companies`
- Prefix functions with approved verbs: `Get`, `Set`, `New`, `Remove`, `Start`, `Stop`

#### File Organization
- One function per script when possible, or group related functions
- Place functions at the top of scripts
- Place main execution at the bottom with `if ($MyInvocation.InvocationName -ne '.') { ... }`
- Use `.ps1` extension for all PowerShell scripts

#### Formatting
- Indent with 4 spaces
- Maximum line length: 120 characters
- Use splatting for cmdlets with many parameters
- Use explicit parameter declarations with types

```powershell
function Get-CompanyData {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$CompanyName,
        
        [Parameter(Mandatory = $false)]
        [int]$MaxResults = 10
    )
    
    # Function body
}
```

#### Error Handling
- Use `try/catch/finally` blocks for error handling
- Use `-ErrorAction Stop` for critical operations
- Write errors to stream: `Write-Error "Message"`
- Use descriptive error messages

```powershell
try {
    $result = Invoke-RestMethod -Uri $url -ErrorAction Stop
}
catch {
    Write-Error "Failed to fetch data from $url : $_"
    throw
}
```

#### Comments
- Use comment-based help for functions
- Comment complex logic, not obvious code
- Include parameter descriptions in help

```powershell
<#
.SYNOPSIS
    Gets company data from Solr.
.PARAMETER CompanyName
    The name of the company to search for.
#>
```

### Markdown Files

#### Formatting
- Use ATX-style headers (# ## ###)
- Use fenced code blocks with language identifiers
- Use tables for structured data
- Maximum line length: 120 characters

```markdown
# Header

## Subheader

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

```powershell
code here
```
```

#### File Names
- Use kebab-case: `company-data.md` not `companyData.md`
- Use descriptive names: `setup-guide.md` not `readme.md`

## Environment Variables

No special environment variables are required for this project.

## Dependencies

- PowerShell 5.1+ or PowerShell 7+
- Google Chrome (for automation)
- Docker Desktop (for Solr container)
- Node.js 18+ (for Playwright tests)
- curl (optional, for API calls)

### Node.js Dependencies (for tests)
- playwright (installed via tests/package.json)

## Common Tasks

### Automating Browser Tasks

1. Start Chrome with debug port: `powershell -ExecutionPolicy Bypass -File start-chrome.ps1`
2. Get CDP endpoint: `Invoke-RestMethod -Uri 'http://127.0.0.1:9222/json'`
3. Connect via WebSocket for automation

### Working with Solr

1. Ensure Docker is running
2. Start Solr container: `docker start peviitor-solr`
3. Wait for Solr to be ready (port 8983)
4. Use credentials: `$SOLR_USER:$SOLR_PASSWD`

### Adding a New Company

1. Use the `/add-website` command to add a new company
2. The command will search for CUI using WebSearch, then get details from DemoANAF API
3. Verify the data with the user before saving

### Scraping Jobs

1. Start Chrome: `powershell -ExecutionPolicy Bypass -File start-chrome.ps1`
2. Use the `/scrape` command with the company name
3. Check for company-specific scraping instructions in `webscraper/{company}.md`

### Creating New Scripts

1. Use the approved naming conventions
2. Add comment-based help
3. Include error handling
4. Test with `-WhatIf` flag if using destructive commands

## Custom Commands

Custom commands are defined in `.opencode/commands/` directory.

### Available Commands

| Command | Description |
|---------|-------------|
| `/scrape` | Scrape jobs from a company career page and push to Solr |
| `/add-website` | Add a new company to Solr company core with automatic research |
| `/update-solr` | Update Solr with new data |
| `/delete-solr` | Delete job documents from Solr by key |
| `/login-solr` | Login to Solr admin panel |
| `/docs-update` | Update project documentation based on all files |
| `/instructions` | Show project instructions |
| `/remove-404` | Remove jobs from Solr that return 404 errors |
| `/clean-project` | Clean temporary files and update documentation |

### Usage

```
/scrape AROBS
```

```
/add-website Softech
```

```
/update-solr
```

```
/delete-solr url:https://example.com/job
```

```
/login-solr
```

```
/docs-update
```

## Notes for Agents

- This project is primarily for local automation and documentation
- No CI/CD pipeline exists
- Scripts are run manually as needed
- PowerShell scripts are Windows-specific (using cmdlets like Start-Process, Invoke-RestMethod)
- **IMPORTANT**: For all OpenCode commands, ALWAYS use curl for Solr operations and URL checks - DO NOT use PowerShell in command instructions
- **IMPORTANT**: Before using Chrome DevTools MCP, always run `start-chrome.ps1` first to ensure Chrome is started with remote debugging enabled
- **IMPORTANT**: Always use the correct Solr delete-by-query format: `{"delete":{"query":"url:\"https://example.com/job\""}}` - do NOT use `_delete_:true` format
- Company-specific scraping instructions are stored in `webscraper/{company}.md` files
- Company data is stored in Solr company core - query using brand, company name, or CUI
- DON'T USE jobs CORE, USE job CORE in SOLR !!!
