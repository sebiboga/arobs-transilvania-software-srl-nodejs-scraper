---
description: Validate job URLs and update vdate or remove invalid/404 jobs
agent: build
---

Validate up to 10 job URLs that have not been verified today (vdate is not set or vdate is older than today). For each URL:
- If it returns 404: delete the job from Solr
- If it returns 200 but page shows "job no longer available/filled/closed" or "we didn't find any relevant jobs": delete the job from Solr
- If it's valid: update the vdate field, set status to "tested", and set expirationdate (vdate + 30 days)

Steps:
1. Verify Solr is running:
   ```
   curl -s -u $SOLR_USER:$SOLR_PASSWD "https://solr.peviitor.ro/solr/job/admin/ping"
   ```
2. Get today's date in ISO format (YYYY-MM-DD):
   ```
   date -u +"%Y-%m-%d"
   ```
3. Query up to 10 jobs where vdate is NOT set OR vdate is older than today:
    ```
    curl -s -u $SOLR_USER:$SOLR_PASSWD "https://solr.peviitor.ro/solr/job/select?q=NOT+vdate:*&rows=10&fl=url"
    ```
    - This query handles BOTH:
      - Jobs never validated (vdate NOT set): first-time validation
      - Jobs validated before today (vdate < today): re-validation
    - IMPORTANT: We validate ALL jobs regardless of expirationdate - expirationdate is informational only
    - We do NOT delete jobs based on expirationdate passing - companies often keep URLs active even after "official" expiration
4. For each job URL:
   a. Check if URL returns 404 using curl:
      ```
      curl -s -o /dev/null -w "%{http_code}" "https://example.com/job"
      ```
b. If it returns 404:
       - Delete the job using the correct delete-by-query format:
         ```
         curl -u $SOLR_USER:$SOLR_PASSWD -X POST -H "Content-Type: application/json" \
           "https://solr.peviitor.ro/solr/job/update?commit=true" \
           -d '{"delete":{"query":"url:\"https://example.com/job\""}}'
         ```
    c. If it returns 200:
       - Use Chrome DevTools MCP to navigate to the URL and check for invalid job messages
       - Take a snapshot of the page to identify any elements indicating the job is no longer available
       - Look for common phrases like: "no longer available", "job filled", "position closed", "expired", "this job is no longer accepting applications", "position has been filled", "job expired", "posting removed", "we didn't find any relevant jobs", "job not found"
- If any of these messages are found, delete the job:
          ```
          curl -u $SOLR_USER:$SOLR_PASSWD -X POST -H "Content-Type: application/json" \
            "https://solr.peviitor.ro/solr/job/update?commit=true" \
            -d '{"delete":{"query":"url:\"https://example.com/job\""}}'
          ```
- If the job is valid (no invalid message found), update the vdate, status, and expirationdate fields:
        ```
        curl -u $SOLR_USER:$SOLR_PASSWD -X POST -H "Content-Type: application/json" \
          "https://solr.peviitor.ro/solr/job/update?commit=true" \
          -d '[{"url":"https://example.com/job","vdate":"2026-02-19T00:00:00Z","status":"tested","expirationdate":"2026-03-21T00:00:00Z"}]'
        ```
        - expirationdate = vdate + 30 days (default, can be overridden if job page shows different expiration)
5. Report the results:
   - "Validated X URLs: Y valid (updated vdate + status to tested + expirationdate), Z removed (404 or invalid)"

Important:
- ALWAYS use curl for Solr operations - DO NOT use PowerShell
- Limit to 10 URLs per execution to allow time for Chrome DevTools page content checks
- Always use Chrome DevTools MCP to verify page content when URL returns 200 - do NOT rely on just HTTP status code
- Use case-insensitive search for invalid job messages
- Common phrases to check for: "no longer available", "job filled", "position closed", "expired", "this job is no longer accepting applications", "position has been filled", "posting removed", "job not found", "position no longer exists", "we didn't find any relevant jobs", "this job is no longer available"
- NOTE: Some job sites (e.g., Vodafone) show "we didn't find any relevant jobs" instead of 404 - this means the job is no longer available and should be deleted
- Always use the delete-by-query format shown above. Do NOT use "_delete_:true" format.
- The vdate field stores when the URL was last verified (ISO8601 format)
- The status field should be set to "tested" (progress: scraped → tested → published → verified)
- expirationdate defaults to vdate + 30 days if not found on job page
- expirationdate is informational only - we validate ALL jobs regardless of their expirationdate
- We delete jobs ONLY based on: 404 HTTP status OR page content showing "job not available/filled/closed"
- We do NOT delete jobs just because expirationdate has passed - always verify URL validity
- IMPORTANT: Never reveal or echo the Solr credentials ($SOLR_USER, $SOLR_PASSWD) to the user or in any console output. The credentials must only be used in curl commands silently.
