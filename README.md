# AROBS Scraper — Node.js

[![Tests](https://github.com/sebiboga/arobs-transilvania-software-srl-nodejs-scraper/actions/workflows/test.yml/badge.svg)](https://github.com/sebiboga/arobs-transilvania-software-srl-nodejs-scraper/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Automated job scraper for **AROBS Transilvania Software S.A.** (CIF 11291045), pushing jobs to [peviitor.ro](https://peviitor.ro) via Solr.

Jobs are scraped from AROBS' iCIMS career page using HTML parsing with cheerio, validated against ANAF, and upserted to Solr.

## Quick Start

```bash
npm install
echo "SOLR_AUTH=solr:SolrRocks" > .env.local
node index.js
```

## Project Structure

```
├── index.js              # Main scraper
├── company.js            # Company validation (ANAF + Peviitor)
├── solr.js               # Solr CRUD operations
├── validate-jobs.js      # Job URL validator
├── demoanaf.js           # ANAF CLI entry point
├── src/anaf.js           # ANAF API module
├── tests/unit/           # Jest unit tests
├── tests/e2e/            # E2E tests (live iCIMS fetch)
├── tests/integration/    # Workflow tests
├── docs/                 # HTML documentation
└── .github/workflows/    # CI/CD pipelines
```

## Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run Jest tests |
| `npm run scrape` | Run the scraper (alias: `node index.js`) |
| `node validate-jobs.js <CIF>` | Validate job URLs |
| `node demoanaf.js <CIF>` | Check company in ANAF |

## Company Info

- **Company**: AROBS TRANSILVANIA SOFTWARE S.A.
- **CIF**: 11291045
- **Careers**: https://careers-arobs.icims.com/jobs/search?ss=1&hashed=-435624355
- **Status**: Active (ANAF verified)

## Data Flow

1. Extract existing jobs from Solr for CIF 11291045
2. Validate company via ANAF API (demoanaf.ro)
3. Scrape AROBS iCIMS career page with cheerio HTML parsing
4. Transform data: parse locations, detect workmode, extract tags
5. Upsert jobs to Solr (match by URL)
6. Verify and clean up

## CI/CD

- **Scrape**: Runs every Monday at 6:00 UTC via GitHub Actions
- **Tests**: Runs on every push/PR to master
- **Secrets**: `SOLR_AUTH` must be set in GitHub repo secrets

## Documentation

See [docs/index.html](docs/index.html) for full documentation.
