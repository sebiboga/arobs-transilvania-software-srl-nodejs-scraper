# Helper: Handling `olx.ro` URLs Safely

You are running inside OpenCode with access to a real Chrome instance via MCP.  
This document provides **special handling rules for `olx.ro` pages** to reduce the chance of triggering CAPTCHA / human validation while checking if a listing is expired.

---

## Scope

- The caller already:
  - Provides the target URL(s) to check.
  - Knows what to do with the result (“expired” vs “not expired”).
- Your only responsibility here is to:
  - Open the provided `olx.ro` URL **gently**.
  - Avoid aggressive behavior that triggers bot protection.
  - Return the minimal information required by the caller.

---

## General behavior for `olx.ro`

When the URL host ends with `olx.ro`:

1. **Use a single, persistent browser session**
   - Reuse the same Chrome profile / tab for multiple OLX URLs in one run.
   - Do not open many new tabs for OLX at once.
   - Do not clear cookies, localStorage, or sessionStorage between OLX navigations.
   - This makes you look like one normal user session instead of many bots.[web:10][web:34]

2. **Throttle requests**
   - Between two different `olx.ro` navigations, wait a small random delay:
     - Suggested: 3–8 seconds with some jitter.
   - Do not navigate quickly through tens or hundreds of OLX URLs in a tight loop.
   - If you detect repeated rate limiting or human validation, **stop** checking more OLX URLs in this run and report that back.[web:34][web:37]

3. **Mimic a real browser**
   - Use a realistic desktop User-Agent and Accept-Language header.
   - Ensure JavaScript is enabled and run the page normally.
   - Do not disable images, CSS, or major resources specifically for OLX.
   - Do not change the viewport size on every navigation (keep it stable for the session).[web:10][web:34]

4. **Avoid unnecessary extra requests**
   - For `olx.ro` URLs, only:
     - Navigate once to the URL.
     - Wait until the main content is loaded (network idle or main content selector).
     - Read only the HTML / text needed to decide if the page is available or expired.
   - Do **not**:
     - Reload the page repeatedly.
     - Trigger additional in-page navigation (clicking many links).
     - Open extra OLX pages from that page (e.g. related ads, profile links).

5. **Handle CAPTCHA / human validation gracefully**
   - If the loaded page clearly looks like a CAPTCHA / “are you human” screen (e.g. “I’m not a robot”, visible CAPTCHA widget, or OLX message indicating additional verification), **do not try to bypass it**.
   - In that situation:
     - Do not attempt to spam reloads.
     - Do not open other OLX URLs in the same run.
     - Immediately report that you hit human validation / CAPTCHA for this URL and mark the listing state as **unknown** (the caller will decide what to do next).[web:10][web:34]

6. **Short timeout and fail-soft behavior**
   - If the OLX page takes too long to load (e.g. more than ~30 seconds), stop waiting.
   - Mark the result as **unknown** due to timeout or temporary issue.
   - Do not keep retrying the same `olx.ro` URL multiple times in the same run.

---

## Minimal data to read from `olx.ro`

For each `olx.ro` URL:

1. Navigate to the URL using the gentle rules above.
2. After the page is loaded, read:
   - HTTP status and final URL if available.
   - Either:
     - A small part of the DOM that indicates if the ad exists, or
     - A short text snippet around any OLX message saying the ad is expired, removed, or inactive.
3. Return only the minimal fields expected by the caller (for example: `url`, `isExpired`, `statusCode`, `finalUrl`, `note`).

Do **not** collect or store more data from OLX than necessary for the “expired vs not expired” decision.

---

## When not on `olx.ro`

If the URL is not on `olx.ro`, ignore this helper and use the default behavior defined elsewhere.
