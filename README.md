# job_seeker_ro_spider — AROBS Careers Romania Scraper

[![WebScraper AROBS to Peviitor](https://github.com/sebiboga/arobs-transilvania-software-srl-nodejs-scraper/actions/workflows/scrape.yml/badge.svg)](https://github.com/sebiboga/arobs-transilvania-software-srl-nodejs-scraper/actions/workflows/scrape.yml)
[![Automation Tests](https://github.com/sebiboga/arobs-transilvania-software-srl-nodejs-scraper/actions/workflows/test.yml/badge.svg)](https://github.com/sebiboga/arobs-transilvania-software-srl-nodejs-scraper/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/javascript-ESM-F7DF1E?logo=javascript&logoColor=black)](https://ecma-international.org/)
[![Node.js](https://img.shields.io/badge/node-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**job_seeker_ro_spider** — un scraper pentru job-urile AROBS Transilvania Software din România. Extrage anunțurile de pe [AROBS iCIMS Careers](https://careers-arobs.icims.com/jobs/search?ss=1&hashed=-435624355) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

## Overview

Proiectul automatizează colectarea săptămânală a job-urilor AROBS din România, menținând board-ul peviitor.ro la zi cu cele mai recente oportunități de carieră.

## Features

- Extrage job-uri din pagina HTML AROBS iCIMS Careers (cheerio)
- Validează compania via ANAF (CUI 11291045, status activ/inactiv, adresă completă)
- Cross-validează cu Peviitor API
- Stochează în SOLR (job core + company core)
- GitHub Actions: scrape săptămânal + testare automată (unit, integration, e2e)
- Teste SOLR condiționale — auto-skip când `SOLR_AUTH` nu e setat
- Se identifică prin User-Agent: `job_seeker_ro_spider`

## Project Structure

```
├── index.js           # Main scraper entry point
├── company.js         # Company validation via ANAF + Peviitor + SOLR
├── demoanaf.js        # CLI wrapper for src/anaf.js
├── src/anaf.js        # ANAF API core module (search + company details)
├── solr.js            # SOLR operations (query, upsert, delete, company)
├── validate-jobs.js   # Job URL validator
├── ROBOTS.md          # robots.txt analysis and scraping policy
├── tests/             # Test suite
│   ├── unit/          # Unit tests (mocked APIs)
│   ├── integration/   # Integration tests (ANAF + SOLR live)
│   └── e2e/           # E2E tests (full pipeline, real iCIMS)
├── .github/workflows/
│   ├── scrape.yml     # Weekly scraping at 6 AM UTC Monday
│   └── test.yml       # Automation Tests on push/PR
└── package.json
```

## Setup

### Prerequisites

- Node.js 24+
- npm

### Installation

```bash
npm install
```

### Configuration

Set the `SOLR_AUTH` environment variable with your Solr credentials:

```bash
export SOLR_AUTH="username:password"
```

## Usage

### Run the Scraper

```bash
npm run scrape
```

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Workflows

### Weekly Scraping

The `scrape.yml` workflow runs every Monday at 6 AM UTC via GitHub Actions. It:
1. Validates company data via ANAF
2. Scrapes current job listings from AROBS iCIMS Careers
3. Updates Solr with new/removed jobs
4. Uploads job data as artifacts

### Test Automation

The `test.yml` workflow runs on every push and pull request. It:
1. Ensures AROBS exists in the company core
2. Runs unit, integration, and E2E tests
3. Validates data integrity in Solr

## Company Info

- **Company**: AROBS TRANSILVANIA SOFTWARE S.A.
- **CIF**: 11291045
- **Status**: Active (ANAF verified)
- **Careers**: https://careers-arobs.icims.com/jobs/search?ss=1&hashed=-435624355

## Robots.txt Policy

Acest scraper respectă regulile din [robots.txt](https://careers-arobs.icims.com/robots.txt) al AROBS iCIMS Careers. Pentru analiza completă, vezi [ROBOTS.md](ROBOTS.md).

**Puncte cheie:**
- robots.txt nu are nicio restricție — toate path-urile sunt `Allow`
- Scraperul face o singură cerere per pagină cu User-Agent `job_seeker_ro_spider` — comportament rezonabil
- Se scrapează doar HTML-ul paginilor de listare, fără a supraîncărca serverul

## Disclaimer

This scraper is designed for educational purposes and legitimate job data aggregation for the Romanian job market. Please respect AROBS' Terms of Service and robots.txt when using this scraper.

## License

Copyright (c) 2024-2026 BOGA SEBASTIAN-NICOLAE

Licensed under the [MIT License](LICENSE).

## Managed By

This project is managed by [ASOCIATIA OPORTUNITATI SI CARIERE](https://oportunitatisicariere.ro) and used as a web scraper for the [peviitor.ro](https://peviitor.ro) job board project.
