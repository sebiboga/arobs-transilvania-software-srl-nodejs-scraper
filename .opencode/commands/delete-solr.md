---
description: Delete job documents from Solr by key
agent: build
---

Delete job or company documents from Solr based on a specific key.

Steps:
1. Verify Solr is running: curl -s "https://solr.peviitor.ro/solr/admin/ping"
2. Parse the key and value from the arguments
3. Default to "url" if no key is specified for jobs, or "id" for companies
4. Delete the document(s) matching the key
5. Verify the deletion was successful

Usage:
- Delete job by URL: /delete-solr url:https://example.com/job
- Delete job by company: /delete-solr company:Test Company
- Delete job by title: /delete-solr title:Software Engineer
- Delete company by CUI: /delete-solr id:12345678
- Delete company by brand: /delete-solr brand:AROBS

The key can be any field from the Job or Company schema.
The value should be URL-encoded if it contains special characters.

Example API call (using delete by query):
```bash
# Delete job by URL
curl -u "$SOLR_USER:$SOLR_PASSWD" -X POST -H "Content-Type: application/json" \
  'https://solr.peviitor.ro/solr/job/update/json?commit=true' \
  -d '{"delete":{"query":"url:\"https://example.com/job\""}}'

# Delete company by CUI
curl -u "$SOLR_USER:$SOLR_PASSWD" -X POST -H "Content-Type: application/json" \
  'https://solr.peviitor.ro/solr/company/update/json?commit=true' \
  -d '{"delete":{"query":"id:12345678"}}'
```

Note: Always use the delete-by-query format shown above. Do NOT use "_delete_:true" as it does not work properly.

Always delete what is asked. If you don't find the one the user told you to delete, DO NOT DELETE other instead. Exact match is really important!