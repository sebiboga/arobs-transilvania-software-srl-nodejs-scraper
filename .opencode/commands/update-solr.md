---
description: Update Solr with new data
agent: build
---

# SOLR AUTHENTICATION REMINDER
**ALWAYS use credentials when pushing to Solr:**
- Use environment variables: `$SOLR_USER` and `$SOLR_PASSWD`
- Example: `curl -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/job/update/json?commit=true"`
- In GitHub Actions, use secrets: `${{ secrets.SOLR_USER }}` and `${{ secrets.SOLR_PASSWD }}`

---

Update the Solr index with new job or company data.

## Workflow

### Step 1: Verify Solr is Running
1. Check Solr status: `curl -s "https://solr.peviitor.ro/solr/admin/ping"`
2. If not running, start it: `docker start peviitor-solr`
3. Wait for Solr to be ready (port 8983 accessible)

### Step 2: Prepare Data
1. Format data according to Job or Company schema (see SCHEMAS.md)
2. Ensure all required fields are present
3. Use proper diacritics for Romanian text
4. Remember: DO NOT include "description" field - it doesn't exist in schema

### Step 3: Push to Solr
1. Use the correct core:
   - Job data: `/solr/job/update/json?commit=true`
   - Company data: `/solr/company/update/json?commit=true`
2. Use curl with credentials: `-u "$SOLR_USER:$SOLR_PASSWD"`
3. Set Content-Type: `-H "Content-Type: application/json"`
4. Add `commit=true` to immediately commit changes
5. Use atomic upsert for company data - Solr will merge if id already exists

### Step 4: Verify Update
1. Query Solr to confirm documents were added
2. Check document count matches expected

## Examples

### Add job documents:
```bash
curl -u "$SOLR_USER:$SOLR_PASSWD" -X POST -H "Content-Type: application/json" \
  "https://solr.peviitor.ro/solr/job/update/json?commit=true" \
  -d '[{"url":"https://example.com/job","title":"Software Engineer","company":"Example SRL","status":"scraped","date":"2026-02-19T00:00:00Z"}]'
```

### Add company documents (with all fields):
```bash
curl -u "$SOLR_USER:$SOLR_PASSWD" -X POST -H "Content-Type: application/json" \
  "https://solr.peviitor.ro/solr/company/update/json?commit=true" \
  -d '[{
    "id": "12345678",
    "company": "Example SRL",
    "brand": "EXAMPLE",
    "group": "Example Group",
    "status": "activ",
    "website": ["https://example.com"],
    "career": ["https://example.com/careers"],
    "lastScraped": "2026-03-05",
    "scraperFile": "example.md"
  }]'
```

### Update existing company (atomic upsert):
```bash
# Just update lastScraped - other fields remain unchanged
curl -u "$SOLR_USER:$SOLR_PASSWD" -X POST -H "Content-Type: application/json" \
  "https://solr.peviitor.ro/solr/company/update/json?commit=true" \
  -d '[{
    "id": "12345678",
    "lastScraped": "2026-03-05",
    "scraperFile": "example.md"
  }]'
```

### Query to verify:
```bash
curl -s -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/job/select?q=company:Example%20SRL"
curl -s -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/company/select?q=id:12345678"
```

## Important Notes

- Always use credentials: `-u "$SOLR_USER:$SOLR_PASSWD"`
- Use `commit=true` or commit after batch
- DO NOT include "description" field in Job documents
- Follow Job/Company schema from SCHEMAS.md
- Use Romanian diacritics where required (ăâîșț)
- Tags should be lowercase, no diacritics
- For company data, use atomic upsert - Solr will merge fields if id already exists
- Always use company's CUI as the `id` field
