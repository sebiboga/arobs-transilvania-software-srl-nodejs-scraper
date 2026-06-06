# AROBS Scraper Prompt

## IMPORTANT - SCRAPE ALL JOBS
**This instruction applies to ALL companies**: When scraping jobs, you MUST extract and push ALL available jobs to Solr - not just a sample. The total number of jobs is shown on the page. Do not stop until you have scraped all jobs.

## Company Info
- **Name**: AROBS
- **Legal Name**: AROBS TRANSILVANIA SOFTWARE S.A.
- **CUI**: 11291045
- **Website**: https://www.arobs.com
- **Careers Page**: https://www.arobs.com/careers-at-arobs/
- **Job Board URL**: https://careers-arobs.icims.com/jobs/search?ss=1&hashed=-435624355

## Romania Jobs URL
```
https://careers-arobs.icims.com/jobs/search?ss=1&hashed=-435624355
```
This URL shows all open positions at AROBS. Use this as the base URL.

## Pagination
- The iCIMS platform shows job listings in a table format
- Check for "Page X of Y" navigation at the bottom
- Click "Next" or page numbers to navigate
- **ALWAYS check the total job count** from the search results page
- Continue scraping until there are no more pages

## How to Detect Total Jobs
From the page status element, look for:
- "Search Results" header
- Check the total number of job entries or Page X of Y indicator
- Continue until all jobs on all pages are scraped

## Work Mode Detection
From the job listing text:
- Look for remote/hybrid/on-site indicators in the job description or title
- If job is remote-capable → workmode: "remote"
- If job mentions hybrid → workmode: "hybrid"
- Default for office-based roles → workmode: "on-site"
- If unclear, default to "on-site"

## Location Detection
From the job listing location:
- "RO-Cluj Napoca" → location: ["Cluj-Napoca"]
- "RO-Bucharest" → location: ["București"]
- "RO" (without city) → location: ["Romania"]
- "RO" locations with city → map to Romanian city names
- Multiple locations like "RO-Cluj Napoca | RO-Bucharest" → location: ["Cluj-Napoca", "București"]

AROBS offices in Romania:
- Cluj-Napoca (HQ)
- Târgu Mureș
- București
- Oradea
- Arad
- Timișoara
- Baia Mare
- Suceava
- Iași

## Job URL Format
```
https://careers-arobs.icims.com/jobs/{JOB_ID}/job
```

Example: `https://careers-arobs.icims.com/jobs/2026-3444/job`

## Scraping Steps

1. **Navigate to AROBS career page**:
   `https://careers-arobs.icims.com/jobs/search?ss=1&hashed=-435624355`

2. **Check total results**: Look for job count and pagination info

3. **For each page**:
   a. Extract all job entries from the search results table
   b. Each job has: job title, location, category, seniority, posted date, job ID
   c. Click on each job title to navigate to the job detail page
   d. Extract full job description, requirements, and tags from the detail page

4. **For page navigation**: Click page number or "Next" button

5. **Repeat** until no more pages exist

6. **Update Solr company core**: Use atomic upsert to update company with today's date:

```bash
# First, query to check if company exists and get all fields
curl -s -u $SOLR_USER:$SOLR_PASSWD "https://solr.peviitor.ro/solr/company/select?q=id:11291045&fl=id,company,brand,group,status,location,website,career,lastScraped,scraperFile"

# If NOT found, add new company with ALL fields:
curl -u $SOLR_USER:$SOLR_PASSWD -X POST "https://solr.peviitor.ro/solr/company/update/json?commit=true" \
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

# If found, check if fields are missing/empty:
# - If brand[], group[], website[], career[] are missing or empty → search internet and update ALL fields
# - If all fields are complete → only update lastScraped and scraperFile

# Update with ALL fields (if missing data found):
curl -u $SOLR_USER:$SOLR_PASSWD -X POST "https://solr.peviitor.ro/solr/company/update/json?commit=true" \
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

# OR just update lastScraped (if all fields are complete):
curl -u $SOLR_USER:$SOLR_PASSWD -X POST "https://solr.peviitor.ro/solr/company/update/json?commit=true" \
  -H "Content-Type: application/json" \
  -d '[{
    "id": "11291045",
    "lastScraped": "2026-06-06",
    "scraperFile": "arobs.md"
  }]'
```

**IMPORTANT**: Always use the company's CUI as the `id` field. When updating, only include the fields that need to change - Solr will merge with existing data (atomic update).

## Job Data Fields

| Field | Source | Example |
|-------|--------|---------|
| url | Job detail page URL | `https://careers-arobs.icims.com/jobs/2026-3444/job` |
| title | Job title text | "Supplier Audit" |
| company | Fixed value | "AROBS TRANSILVANIA SOFTWARE S.A." |
| cif | Fixed value | "11291045" |
| location | Parse from location field | ["București"] or ["Cluj-Napoca"] |
| workmode | Parse from description | "on-site", "hybrid", "remote" |
| date | Current date | "2026-06-06T10:00:00Z" |
| status | Fixed value | "scraped" |
| tags | Extract from job detail | See below |
| salary | Parse from job description if found | "5000-8000 RON" |

## TAG EXTRACTION (IMPORTANT)

The `tags` field is an array of lowercase strings (NO DIACRITICS). Extract these from the job detail page:

### 1. Seniority Level (experience)
Extract from job TITLE and job DESCRIPTION:

| Keyword in Title | Description | Tag Value |
|-----------------|-------------|------------|
| "Junior" | Entry level position | "junior" |
| "Intern" | Student/Intern | "intern" |
| "Trainee" | Trainee program | "trainee" |
| "Entry" | Entry level | "entry-level" |
| "Graduate" | Graduate program | "graduate" |
| "Senior" | Senior level | "senior" |
| "Lead" | Team lead | "senior" |
| "Manager" | Management | "senior" |
| "Chief" | Chief/Director | "consultant" |
| "Principal" | Principal engineer | "consultant" |
| "Director" | Director level | "consultant" |
| "Architect" | Solution/Software Architect | "senior" |
| Default (no prefix) | Mid level | "mid" |

### 2. Seniority Field from iCIMS
iCIMS has a "Seniority" column in the job listing:
- "Senior" → add "senior"
- "Mid" or "Intermediate" → add "mid"
- "Junior" → add "junior"
- "Entry" → add "entry-level"

### 3. Category-Based Tags
Extract from the job CATEGORY field:

| Category Found | Tags |
|---------------|------|
| Development | "it" |
| Testing | "qa" |
| IT Special Roles | "it" |
| Administrative | "administrative" |
| Customer Service/Support | "support" |
| Human Resources | "hr" |
| Internship | "intern" |
| Management | "management" |
| Purchasing and Logistic | "logistics" |
| Sales | "sales" |
| Support | "support" |
| University Practice | "intern", "student" |

### 4. Skill-Based Tags
Extract from job TITLE and DESCRIPTION:

| Skill/Technology Found | Tag | Notes |
|----------------------|-----|-------|
| Java, Kotlin, Python, .NET, Go, Node.js | "it" | Programming |
| JavaScript, React, Angular, Frontend, UI | "it" | IT/Frontend |
| Embedded, C, C++, RTOS, Firmware | "embedded" | Embedded systems |
| Data, Analytics, Big Data, ETL | "data-science" | Data field |
| Machine Learning, ML, AI, MLOps | "ai" | AI/ML |
| DevOps, CI/CD, Kubernetes, Docker | "devops" | DevOps |
| Cloud, Azure, AWS, GCP | "cloud" | Cloud computing |
| Automotive, AUTOSAR, CAN | "automotive" | Automotive |
| IoT, Internet of Things | "iot" | IoT |
| Business Analysis, BA | "business" | Business |
| Finance, Banking | "finance" | Finance |
| Project Management, PM | "project-management" | PM |
| QA, Testing, Automation | "qa" | Quality Assurance |
| Security, Cybersecurity | "security" | Security |
| SAP, ABAP | "sap" | SAP ecosystem |
| Salesforce, CRM | "sales" | Sales/CRM |
| Aerospace, Avionics, DO-178 | "aerospace" | Aerospace |

### Example Tags Extraction

**Job**: "Senior Java Developer"
- From title: "Senior" → "senior"
- Category: "Development" → "it"
- Skills: Java → "it"

**Final tags**: `["senior", "it"]`

**Job**: "Embedded SW Security Architect"
- From title: "Architect" → "senior"
- Skills: "Embedded" → "embedded"
- Skills: "Security" → "security"

**Final tags**: `["senior", "embedded", "security"]`

### Tags Field Rules (per SCHEMAS.md)
- **lowercase only** - NO UPPERCASE
- **no diacritics** - use "it" not "IT"
- **max 20 entries** - don't exceed
- **array format** - ["tag1", "tag2"]
- **standardized values only** - use consistent naming

## Solr Format

Push to Solr using curl:
```bash
curl -u $SOLR_USER:$SOLR_PASSWD -X POST -H "Content-Type: application/json" \
  "https://solr.peviitor.ro/solr/job/update?commit=true" \
  -d '[{"url":"{JOB_URL}","title":"{TITLE}","company":"AROBS TRANSILVANIA SOFTWARE S.A.","cif":"11291045","location":["{LOCATION}"],"workmode":"{workmode}","tags":["{tag1}","{tag2}"],"date":"{ISO8601_DATE}","status":"scraped"}]'
```

Example with tags:
```bash
curl -u $SOLR_USER:$SOLR_PASSWD -X POST -H "Content-Type: application/json" \
  "https://solr.peviitor.ro/solr/job/update?commit=true" \
  -d '[{"url":"https://careers-arobs.icims.com/jobs/2026-3444/job","title":"Senior Java Developer","company":"AROBS TRANSILVANIA SOFTWARE S.A.","cif":"11291045","location":["Cluj-Napoca"],"workmode":"on-site","tags":["senior","it"],"date":"2026-06-06T10:00:00Z","status":"scraped"}]'
```

## Important Notes

- All jobs on AROBS iCIMS page are Romanian positions - no need to filter further
- AROBS uses iCIMS platform for job listings (not a custom career portal)
- The iCIMS page loads inside an iframe on the AROBS website
- Navigate to the iCIMS URL directly for easier scraping
- Some jobs may show multiple locations separated by "|" symbol
- **Push ALL jobs found** to Solr
- workmode values must be exactly: "remote", "on-site", or "hybrid"
- tags must be lowercase, no diacritics, max 20 entries
- Commit to Solr after each batch (10 jobs) or at the end
- Verify with: `curl -s -u $SOLR_USER:$SOLR_PASSWD "https://solr.peviitor.ro/solr/job/select?q=company:%22AROBS%20TRANSILVANIA%20SOFTWARE%20S.A.%22&rows=1"`

## Company Update Logic

When updating the company in Solr:
1. Query: `curl -s -u $SOLR_USER:$SOLR_PASSWD "https://solr.peviitor.ro/solr/company/select?q=id:11291045&fl=id,company,brand,group,status,location,website,career,lastScraped,scraperFile"`
2. Check if ANY of these fields are missing or empty: brand[], group[], website[], career[], location[]
3. If ANY field is missing → search internet for missing data and update ALL fields:
   - Use DemoANAF API to get company details: curl "https://demoanaf.ro/api/company/{CUI}"
   - Use WebSearch to find official website(s) - prioritize .ro domains
   - Use WebSearch to find careers page(s) - prioritize .ro domains
   - Use WebSearch to find parent company group
4. If ALL fields are complete → only update lastScraped and scraperFile
