---
description: Add a new company to Solr company core with automatic research
agent: build
---

Add a new company to the Solr company core by automatically researching company details online.

Steps:
1. Parse the company name from arguments (e.g., "AROBS")
2. Search for company CUI using WebSearch: "AROBS Romania CUI"
3. Call DemoANAF API: https://demoanaf.ro/api/company/{CUI}
4. Extract company details from JSON response:
   - Full legal company name in Romania
   - CUI/CIF (fiscal code) - REQUIRED
   - Registration number
5. Search for the company's official website:
   - **IMPORTANT**: When multiple websites are found, PRIORITIZE .ro domains
   - First, search for: "COMPANY NAME Romania official website" and look for .ro domains
   - Only use other TLDs (.com, .eu, etc.) if NO .ro domain exists
   - A company may have multiple websites - list ALL of them in the website array
   - Example: If company has both ziramarketing.com and ziramarketing.ro, use only ziramarketing.ro
6. Find the company's careers/jobs page:
   - Search for careers page using .ro domain if available
   - Look for "/careers", "/jobs", "/join-us", "/work-with-us" paths
   - A company may have multiple careers pages - list ALL of them in the career array
7. Verify all data with the user before saving
8. Add the company to Solr company core with all required fields

Usage:
- Add a company: /add-website AROBS

Arguments:
- Company brand name (e.g., "AROBS", "Amazon", "Softlead")

## Company Model Schema (for Solr):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | CIF/CUI (8 digits) |
| company | string | Yes | Legal company name (diacritics REQUIRED) |
| brand | string[] | No | Commercial brand name(s) - Array |
| group | string[] | No | Parent company group(s) - Array |
| status | string | No | "activ", "suspendat", "inactiv", "radiat" |
| location | string[] | No | Romanian cities |
| website | string[] | No | Official website URL(s) |
| career | string[] | No | Career page URL(s) |
| lastScraped | string | No | Date of last scrape (leave empty for new) |
| scraperFile | string | No | Name of scraper file |

Workflow:
1. Search for CUI using WebSearch: "COMPANY NAME Romania CUI"
2. Call DemoANAF API: curl "https://demoanaf.ro/api/company/{CUI}"
3. Extract company details from JSON response
3. Extract company details: full name, CUI (REQUIRED), registration number
4. Search for the company's official careers page
5. Present the found data to the user for verification:
   - Full company name
   - Brand name
   - Website URL
   - Careers page URL
   - CUI/CIF (REQUIRED - will be saved to Solr)
   - Group (if applicable)
6. Ask user: "Is this data correct? Should I save it to Solr?"
7. Only save after user confirmation

## Solr Update Command:
To add company to Solr, use atomic upsert (this will add if not exists, or merge if exists):
```bash
curl -u "$SOLR_USER:$SOLR_PASSWD" -X POST "https://solr.peviitor.ro/solr/company/update/json?commit=true" \
  -H "Content-Type: application/json" \
  -d '[{
    "id": "11291045",
    "company": "AROBS TRANSILVANIA SOFTWARE S.A.",
    "brand": ["AROBS"],
    "group": ["AROBS Group"],
    "status": "activ",
    "website": ["https://www.arobs.com"],
    "career": ["https://www.arobs.com/careers-at-arobs/"],
    "lastScraped": "",
    "scraperFile": "arobs.md"
  }]'
```

**Important - Website Priority Rules:**
- website[] and career[] arrays can contain multiple URLs
- **ALWAYS prioritize .ro domains** over other TLDs
- Put .ro domains FIRST in the array, then other TLDs
- Example: `["https://www.company.ro", "https://www.company.com"]`

**Note**: Solr automatically performs atomic update - if the company id already exists, it will merge the fields (not overwrite). Only include fields you want to update.

Data Collection:
- Use WebSearch to find CUI: "COMPANY NAME Romania CUI"
- Call DemoANAF API to get company details: curl "https://demoanaf.ro/api/company/{CUI}"
- Search Google or company website for careers page
- **IMPORTANT**: When searching for websites, prioritize .ro domains
- **ALWAYS put .ro domains first** in website[] and career[] arrays
- If multiple careers pages exist, include all of them
- Verify URLs are accessible before presenting

How to Extract Data from DemoANAF:
1. First, use WebSearch to find the CUI for the company:
    - Search: "COMPANY NAME Romania CUI" (e.g., "AROBS Romania CUI")
   - Find CUI from results (demoanaf.ro, listafirme.ro, etc.)
2. Once you have the CUI, call DemoANAF API:
   - curl "https://demoanaf.ro/api/company/{CUI}"
   - Example: curl "https://demoanaf.ro/api/company/33159615"
3. Extract from JSON response:
   - name → company (with diacritics)
   - cui → id (8 digits)
   - inactive → status ("activ" if false, "inactiv" if true)
   - headquartersAddress.locality → location

Note:
- ALWAYS save company to Solr company core - this is REQUIRED
- Use "activ" as default status for new companies
- Run start-chrome.ps1 first if Chrome is not running with debug port
- The lastScraped field will be left empty for new entries
- Do NOT overwrite existing entries - only add new ones
- Verify all URLs are working before proposing to save
- Check company status from DemoANAF API (inactive field) - if status is "inactive" (inactive: true), warn the user (according to Company Model Schema, non-active companies should have their jobs removed)
- **IMPORTANT**: When websites are found, ALWAYS prioritize .ro domains and put them FIRST in arrays

Example Flow:
1. User runs: /add-website AROBS
2. AI searches: "AROBS Romania CUI"
3. AI finds: AROBS TRANSILVANIA SOFTWARE S.A., CUI: 11291045
4. AI calls DemoANAF: curl "https://demoanaf.ro/api/company/11291045"
5. AI extracts details and searches for careers page
6. AI presents to user:
   - Full Name: AROBS TRANSILVANIA SOFTWARE S.A.
   - Brand: ["AROBS"]
   - Website: https://www.arobs.com
   - Careers: https://www.arobs.com/careers-at-arobs/
   - CUI: 11291045
   - Group: ["AROBS Group"]
7. User confirms: "Yes, save it"
8. AI adds the company to Solr company core:
   [{
     "id": "11291045",
     "company": "AROBS TRANSILVANIA SOFTWARE S.A.",
     "brand": ["AROBS"],
     "group": ["AROBS Group"],
     "status": "activ",
     "website": ["https://www.arobs.com"],
     "career": ["https://www.arobs.com/careers-at-arobs/"]
   }]
