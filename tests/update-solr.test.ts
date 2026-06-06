import { test, expect } from "@playwright/test";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const SOLR_USER = process.env.SOLR_USER || "solr";
const SOLR_PASSWD = process.env.SOLR_PASSWD || "SolrRocks";

const today = new Date().toISOString().split("T")[0];

test("update-solr command works - verify job core is accessible", async () => {
    const { stdout } = await execAsync(
        'curl -s -u ${SOLR_USER}:${SOLR_PASSWD} "https://solr.peviitor.ro/solr/admin/cores"'
    );
    const response = JSON.parse(stdout);
    expect(response.responseHeader.status).toBe(0);
    expect(response.status.job).toBeDefined();
});

test("update-solr command works - query existing jobs", async () => {
    const { stdout } = await execAsync(
        'curl -s -u ${SOLR_USER}:${SOLR_PASSWD} "https://solr.peviitor.ro/solr/job/select?q=*:*&rows=1"'
    );
    const response = JSON.parse(stdout);
    expect(response.response.numFound).toBeGreaterThan(0);
});

test("update-solr command works - add new job document following Job schema", async () => {
    const jobUrl = `https://example.com/careers/test-job-${Date.now()}`;
    const jobData = JSON.stringify([{
        url: jobUrl,
        title: "Test Job",
        company: "Test Company",
        location: ["Cluj-Napoca"],
        workmode: "on-site",
        date: today + "T00:00:00Z",
        status: "scraped",
        expirationdate: today + "T00:00:00Z",
        salary: "5000-8000 RON"
    }]).replace(/"/g, '\\"');

    const addCommand = `curl -s -u ${SOLR_USER}:${SOLR_PASSWD} -X POST -H "Content-Type: application/json" "https://solr.peviitor.ro/solr/job/update?commit=true" -d "${jobData}"`;
    
    const { stdout: addStdout } = await execAsync(addCommand);
    const addResponse = JSON.parse(addStdout);
    expect(addResponse.responseHeader.status).toBe(0);

    const queryUrl = encodeURIComponent(jobUrl);
    const queryCommand = `curl -s -u ${SOLR_USER}:${SOLR_PASSWD} "https://solr.peviitor.ro/solr/job/select?q=url:%22${queryUrl}%22"`;
    const { stdout: queryStdout } = await execAsync(queryCommand);
    const queryResponse = JSON.parse(queryStdout);
    
    expect(queryResponse.response.numFound).toBe(1);
    expect(queryResponse.response.docs[0].title).toBe("Test Job");
    expect(queryResponse.response.docs[0].company).toBe("Test Company");
    expect(queryResponse.response.docs[0].location[0]).toBe("Cluj-Napoca");
    expect(queryResponse.response.docs[0].workmode).toBe("on-site");
    expect(queryResponse.response.docs[0].salary).toBe("5000-8000 RON");

    const deleteCommand = `curl -s -u ${SOLR_USER}:${SOLR_PASSWD} -X POST -H "Content-Type: application/json" "https://solr.peviitor.ro/solr/job/update?commit=true" -d '{\"delete\":{\"query\":\"url:\\\"${jobUrl}\\\"\"}}'`;
    await execAsync(deleteCommand);
});
