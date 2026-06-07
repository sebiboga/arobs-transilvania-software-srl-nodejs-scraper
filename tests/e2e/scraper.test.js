import { parseJobsPage } from "../../index.js";

describe("AROBS E2E Scraper", () => {
  it("should connect to AROBS career page", async () => {
    const url = "https://careers-arobs.icims.com/jobs/search?ss=1&hashed=-435624355&in_iframe=1";
    const res = await fetch(url, {
      headers: { "User-Agent": "job_seeker_ro_spider" }
    });
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(html).toContain("iCIMS_JobsTable");
  });

  it("should parse real job listings", async () => {
    const url = "https://careers-arobs.icims.com/jobs/search?ss=1&hashed=-435624355&in_iframe=1";
    const res = await fetch(url, {
      headers: { "User-Agent": "job_seeker_ro_spider" }
    });
    const html = await res.text();
    const result = parseJobsPage(html);
    expect(result.jobs.length).toBeGreaterThan(0);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });
});
