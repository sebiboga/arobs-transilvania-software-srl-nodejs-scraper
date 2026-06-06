import { test, expect } from "@playwright/test";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const SOLR_USER = process.env.SOLR_USER || "solr";
const SOLR_PASSWD = process.env.SOLR_PASSWD || "SolrRocks";

function spawnSync(command: string, args: string[], options: any) {
    return require("child_process").spawnSync(command, args, options);
}

test.describe("remove-404 with Chrome DevTools validation", () => {
    test("should query jobs without vdate from Solr", async () => {
        const { stdout } = await execAsync(
            `curl -s -u ${SOLR_USER}:${SOLR_PASSWD} "https://solr.peviitor.ro/solr/job/select?q=NOT+vdate:*&rows=10&fl=url"`
        );
        const response = JSON.parse(stdout);
        expect(response.response.numFound).toBeGreaterThan(0);
        expect(response.response.docs).toBeDefined();
    });

    test("should delete job using correct delete-by-query format", async () => {
        const jobUrl = "https://example.com/test-chrome-validation-" + Date.now();
        
        const today = new Date().toISOString().split("T")[0];
        const jobData = JSON.stringify([{
            url: jobUrl,
            title: "Test Chrome Validation Job",
            company: "Test Company",
            location: ["Bucuresti"],
            workmode: "hybrid",
            date: today + "T00:00:00Z",
            status: "scraped",
            salary: "5000-8000 RON"
        }]);

        const addResult = spawnSync("curl", [
            "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`, 
            "-X", "POST", 
            "-H", "Content-Type: application/json", 
            "https://solr.peviitor.ro/solr/job/update?commit=true", 
            "-d", jobData
        ], { encoding: "utf8" });
        
        const addJson = JSON.parse(addResult.stdout);
        expect(addJson.responseHeader.status).toBe(0);
        
        const queryUrl = encodeURIComponent(jobUrl);
        const verifyResult = spawnSync("curl", [
            "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`, 
            "https://solr.peviitor.ro/solr/job/select?q=url:%22" + queryUrl + "%22"
        ], { encoding: "utf8" });
        const verifyJson = JSON.parse(verifyResult.stdout);
        expect(verifyJson.response.numFound).toBe(1);

        const deleteQuery = JSON.stringify({delete: {query: "url:\"" + jobUrl + "\""}});
        const deleteResult = spawnSync("curl", [
            "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`, 
            "-X", "POST", 
            "-H", "Content-Type: application/json", 
            "https://solr.peviitor.ro/solr/job/update?commit=true", 
            "-d", deleteQuery
        ], { encoding: "utf8" });
        const deleteJson = JSON.parse(deleteResult.stdout);
        expect(deleteJson.responseHeader.status).toBe(0);
        
        const afterResult = spawnSync("curl", [
            "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`, 
            "https://solr.peviitor.ro/solr/job/select?q=url:%22" + queryUrl + "%22"
        ], { encoding: "utf8" });
        const afterJson = JSON.parse(afterResult.stdout);
        expect(afterJson.response.numFound).toBe(0);
    });

    test("should update vdate for valid job", async () => {
        const jobUrl = "https://example.com/test-vdate-update-" + Date.now();
        
        const today = new Date().toISOString().split("T")[0];
        const jobData = JSON.stringify([{
            url: jobUrl,
            title: "Test VDate Update Job",
            company: "Test Company",
            location: ["Bucuresti"],
            workmode: "hybrid",
            date: today + "T00:00:00Z",
            status: "scraped",
            salary: "5000-8000 RON"
        }]);

        const addResult = spawnSync("curl", [
            "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`, 
            "-X", "POST", 
            "-H", "Content-Type: application/json", 
            "https://solr.peviitor.ro/solr/job/update?commit=true", 
            "-d", jobData
        ], { encoding: "utf8" });
        
        const addJson = JSON.parse(addResult.stdout);
        expect(addJson.responseHeader.status).toBe(0);

        const vdate = today + "T00:00:00Z";
        const updateResult = spawnSync("curl", [
            "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`, 
            "-X", "POST", 
            "-H", "Content-Type: application/json", 
            "https://solr.peviitor.ro/solr/job/update?commit=true", 
            "-d", JSON.stringify([{url: jobUrl, vdate: vdate}])
        ], { encoding: "utf8" });
        
        const updateJson = JSON.parse(updateResult.stdout);
        expect(updateJson.responseHeader.status).toBe(0);

        const queryUrl = encodeURIComponent(jobUrl);
        const verifyResult = spawnSync("curl", [
            "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`, 
            "https://solr.peviitor.ro/solr/job/select?q=url:%22" + queryUrl + "%22&fl=url,vdate"
        ], { encoding: "utf8" });
        const verifyJson = JSON.parse(verifyResult.stdout);
        expect(verifyJson.response.docs[0].vdate).toBe(vdate);

        const deleteQuery = JSON.stringify({delete: {query: "url:\"" + jobUrl + "\""}});
        spawnSync("curl", [
            "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`, 
            "-X", "POST", 
            "-H", "Content-Type: application/json", 
            "https://solr.peviitor.ro/solr/job/update?commit=true", 
            "-d", deleteQuery
        ], { encoding: "utf8" });
    });
});
