---
description: Scrape jobs from a company career page and push to Solr
agent: build
---

# Scrape Jobs from Company Career Page

## Solr Authentication
```
curl -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/job/update/json?commit=true"
```
- In GitHub Actions: `${{ secrets.SOLR_USER }}` and `${{ secrets.SOLR_PASSWD }}`

---

## Step 1: Check for Company-Specific Prompt
Look for `webscraper/{company}.md` (e.g., `webscraper/arobs.md`). If exists, follow those instructions.

---

## Step 2: Find Company in Solr

Query company core to get company data:
```bash
# By brand
curl -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/company/select?q=brand:COMPANY_NAME"

# By company name
curl -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/company/select?q=company:COMPANY_NAME"

# By CIF
curl -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/company/select?q=id:CIF"
```

**If NOT found**: Run `/add-website` with the company name.

**If found but incomplete**: Research and update missing fields using:
- DemoANAF API (for CIF and company details): https://demoanaf.ro/api/company/{CUI}
- WebSearch (for website, career pages, parent group)
- **Priority**: Always use .ro domains first in website[] and career[] arrays
- **Brand**: Include if commercial name differs from legal name (e.g., "PARAPET" vs "PRODFER CONSTRUCT S.R.L.")

---

## Step 3: Push Company to Solr (ALWAYS do this FIRST)

Use atomic upsert - Solr will merge fields if id exists:
```bash
curl -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/company/update/json?commit=true" \
  -H "Content-Type: application/json" \
  -d '[{
    "id": "11291045",
    "company": "AROBS TRANSILVANIA SOFTWARE S.A.",
    "brand": ["AROBS"],
    "group": ["AROBS Group"],
    "status": "activ",
    "website": ["https://www.arobs.com"],
    "career": ["https://www.arobs.com/careers-at-arobs/"],
    "lastScraped": "2026-06-06",
    "scraperFile": "arobs.md"
  }]'
```

**Important**:
- Use atomic upsert - existing fields are preserved
- Always include BOTH `lastScraped` AND `scraperFile` when updating
- **Priority**: Put .ro domains FIRST in website[] and career[] arrays

---

## Step 4: Scrape Jobs from Career Page

1. Navigate to career URL from Solr (company.career)
2. Filter for **Romania jobs only** (exclude other countries)
3. **CRITICAL - Pagination**: Must scrape ALL pages. After each page, look for pagination controls. Continue until no more pages exist.

### Extract Each Job:
| Field | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Full URL to job detail |
| `title` | Yes | Position title (max 200 chars, diacritics OK) |
| `company` | Yes | **UPPERCASE** legal name from Solr company.company |
| `cif` | Yes | CIF from Solr company.id |
| `brand` | No | Commercial brand name (used for search - see note below) |
| `location[]` | No | Romanian cities only (diacritics OK) |
| `tags[]` | No | Skills/education/experience (lowercase, no diacritics, max 10) |
| `workmode` | No | "remote", "on-site", or "hybrid" |
| `date` | No | ISO8601 scrape date (e.g., "2026-03-09T10:00:00Z") |
| `status` | No | "scraped" (default) |
| `salary` | No | Format: "MIN-MAX CURRENCY" (e.g., "5000-8000 RON") |
| `expirationdate` | No | Try to extract from job page ("apply by", "expires", "valid until") |

> **Note on brand**: Some companies have a different commercial brand than their legal name (e.g., legal name "PRODFER CONSTRUCT S.R.L." but brand "PARAPET"). The brand is copied to `_text_` for full-text search. Include brand if it differs from company name - this helps jobs be found when users search by brand name.

### Push Jobs to Solr:
```bash
curl -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/job/update/json?commit=true" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "url": "https://company.com/job/12345",
      "title": "Senior Java Developer",
      "company": "COMPANY NAME SRL",
      "cif": "12345678",
      "location": ["București", "Cluj-Napoca"],
      "tags": ["java", "spring", "senior"],
      "workmode": "hybrid",
      "date": "2026-03-09T10:00:00Z",
      "status": "scraped",
      "salary": "5000-10000 EUR"
    }
  ]'
```

---

## Step 5: Verify Insertion
```bash
# Verify company
curl -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/company/select?q=id:CIF"

# Verify jobs
curl -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/job/select?q=company:COMPANY_NAME"
```

---

## Verify Existing Jobs (status != verified)

When asked to verify existing jobs:

1. **Find unverified jobs**:
```bash
curl -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/job/select?q=-status:verified&wt=json&rows=25"
```

2. **Open job URL** in Chrome and extract:
   - salary (transform "lei" to "RON")
   - tags (up to 10: skills, experience level: entry/mid/senior, industry)
   - workmode
   - expirationdate (if available)

3. **Use atomic update** to preserve existing fields:
```bash
curl -u "$SOLR_USER:$SOLR_PASSWD" -X POST "https://solr.peviitor.ro/solr/job/update?commit=true" \
  -H "Content-Type: application/json" \
  -d '{"add": {"doc": {"url": "<JOB_URL>", "salary": {"set": "5000-8000 RON"}, "tags": {"set": ["java", "senior"]}, "workmode": {"set": "hybrid"}, "status": {"set": "verified"}, "vdate": {"set": "2026-03-09T10:00:00Z"}}}}'
```

4. **Delete expired jobs**:
```bash
curl -u "$SOLR_USER:$SOLR_PASSWD" -X POST "https://solr.peviitor.ro/solr/job/update?commit=true" \
  -H "Content-Type: application/json" \
  -d '{"delete": ["<JOB_URL>"]}'
```

5. **Verify update**:
```bash
curl -u "$SOLR_USER:$SOLR_PASSWD" "https://solr.peviitor.ro/solr/job/select?q=url:<JOB_URL>&wt=json"
```

---

## Notes

- **ALWAYS use uppercase** for company names
- **ALWAYS push company first**, then jobs
- **Pagination**: Never stop until ALL pages are scraped
- **.ro priority**: Always prioritize Romanian domains in website/career arrays
- Use Chrome DevTools MCP for scraping (OLX: use User-Agent to avoid CAPTCHA)
- Date format: ISO8601 (e.g., "2026-03-09T10:00:00Z")
- use SOLR job core NOT jobs core
- make sure you have meet job model 
