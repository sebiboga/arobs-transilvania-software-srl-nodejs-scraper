# Documentation

This folder contains documentation for the peviitor_opencode_AI_scrapers project.

## Overview

This project automates job data scraping from peviitor.ro platform. It uses:
- **Apache Solr** - For storing and indexing job/company data
- **Chrome DevTools MCP** - For browser automation
- **PowerShell** - For local automation scripts
- **Playwright** - For testing

## Contents

- [Commands](commands/README.md) - Available OpenCode commands
- [Schemas](../SCHEMAS.md) - Job and Company data models
- Company data - Now stored in Solr company core (query: https://solr.peviitor.ro/solr/company/select)

## Quick Start

1. Start Chrome with remote debugging: `powershell -ExecutionPolicy Bypass -File start-chrome.ps1`
2. Start Solr container: `docker start peviitor-solr`
3. Use OpenCode commands to scrape and manage job data

## Important: Solr Delete Format

When deleting documents from Solr, **always use the delete-by-query format**:

```bash
curl -u "$SOLR_USER:$SOLR_PASSWD" -X POST -H "Content-Type: application/json" \
  'https://solr.peviitor.ro/solr/job/update?commit=true' \
  -d '{"delete":{"query":"url:\"https://example.com/job\""}}'
```

**Do NOT use** the `_delete_:true` format - it does not work properly.

### Correct Format
```json
{"delete":{"query":"url:\"https://example.com/job\""}}
```

### Incorrect Format (Do NOT use)
```json
[{"url":"https://example.com/job","_delete_:true}]
```
