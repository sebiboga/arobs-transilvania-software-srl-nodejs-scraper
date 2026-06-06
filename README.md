# AROBS Scraper - OpenCode AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Automated job scraping for **AROBS Transilvania Software S.A.** using OpenCode AI agents, pushing data to Solr.

## Features

- **Automated Job Scraping** - Scrape jobs from AROBS career page
- **Solr Integration** - Push job data to Solr search engine
- **URL Validation** - Validate job URLs and remove 404/inactive jobs
- **Company Management** - Add and manage company scraping prompts

## Quick Start

### Prerequisites

- PowerShell 5.1+ or PowerShell 7+
- Google Chrome (for automation)
- Docker Desktop (for Solr)
- Node.js 18+ (for Playwright tests)

### Setup

1. **Start Chrome with debugging:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File start-chrome.ps1
   ```

2. **Start Solr:**
   ```powershell
   docker start peviitor-solr
   ```

3. **Install test dependencies:**
   ```powershell
   cd tests && npm install
   ```

## Commands

| Command | Description |
|---------|-------------|
| `/scrape [company]` | Scrape jobs from a company |
| `/add-website` | Add new company to Solr company core |
| `/remove-404` | Validate job URLs and remove inactive |
| `/update-solr` | Update Solr with new data |
| `/delete-solr` | Delete jobs from Solr |
| `/clean-project` | Clean temp files and update docs |

## Project Structure

```
arobs-scraper/
├── docs/                  # HTML documentation
├── .opencode/commands/    # OpenCode commands
├── webscraper/            # Company scraping prompts
├── tests/                 # Playwright tests
├── start-chrome.ps1       # Chrome startup script
├── SCHEMAS.md             # Data schemas
├── AGENTS.md              # Agent instructions
└── INSTRUCTIONS.md        # Workflow instructions
```

## Company Info

- **Company**: AROBS TRANSILVANIA SOFTWARE S.A.
- **CUI**: 11291045
- **Website**: https://www.arobs.com
- **Careers**: https://www.arobs.com/careers-at-arobs/
- **Job Board**: https://careers-arobs.icims.com/jobs/search?ss=1&hashed=-435624355

## Documentation

- [Setup Guide](docs/setup.html)
- [Commands](docs/commands.html)
- [Data Schemas](docs/schemas.html)
- [Tests](docs/tests.html)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

