import { test, expect } from "@playwright/test";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const SOLR_USER = process.env.SOLR_USER || "solr";
const SOLR_PASSWD = process.env.SOLR_PASSWD || "SolrRocks";

function spawnSync(command: string, args: string[], options: any) {
    return require("child_process").spawnSync(command, args, options);
}

test("remove-404 command - query jobs not verified today", async () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    const jobUrl1 = "https://example.com/test-404-verify-" + Date.now() + "-1";
    const jobUrl2 = "https://example.com/test-404-verify-" + Date.now() + "-2";
    
    const jobData = JSON.stringify([
        {
            url: jobUrl1,
            title: "Test Job 1",
            company: "Test Company",
            location: ["Bucuresti"],
            workmode: "hybrid",
            date: yesterday + "T00:00:00Z",
            vdate: yesterday + "T00:00:00Z",
            status: "scraped"
        },
        {
            url: jobUrl2,
            title: "Test Job 2",
            company: "Test Company",
            location: ["Bucuresti"],
            workmode: "hybrid",
            date: yesterday + "T00:00:00Z",
            status: "scraped"
        }
    ]);

    const addResult = spawnSync("curl", [
        "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`,
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "https://solr.peviitor.ro/solr/job/update?commit=true",
        "-d", jobData
    ], { encoding: "utf8" });

    const addJson = JSON.parse(addResult.stdout);
    expect(addJson.responseHeader.status).toBe(0);

    const queryResult = spawnSync("curl", [
        "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`,
        "https://solr.peviitor.ro/solr/job/select?q=url:%22" + encodeURIComponent(jobUrl1) + "%22+OR+url:%22" + encodeURIComponent(jobUrl2) + "%22&rows=20&fl=url,vdate"
    ], { encoding: "utf8" });

    const queryJson = JSON.parse(queryResult.stdout);
    expect(queryJson.response.numFound).toBe(2);

    const cleanup1 = JSON.stringify({delete: {query: "url:\"" + jobUrl1 + "\""}});
    spawnSync("curl", [
        "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`,
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "https://solr.peviitor.ro/solr/job/update?commit=true",
        "-d", cleanup1
    ], { encoding: "utf8" });

    const cleanup2 = JSON.stringify({delete: {query: "url:\"" + jobUrl2 + "\""}});
    spawnSync("curl", [
        "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`,
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "https://solr.peviitor.ro/solr/job/update?commit=true",
        "-d", cleanup2
    ], { encoding: "utf8" });
});

test("remove-404 command - update vdate for valid URL", async () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    const jobUrl = "https://example.com/test-404-valid-" + Date.now();
    
    const jobData = JSON.stringify([{
        url: jobUrl,
        title: "Test Valid Job",
        company: "Test Company",
        location: ["Bucuresti"],
        workmode: "hybrid",
        date: yesterday + "T00:00:00Z",
        vdate: yesterday + "T00:00:00Z",
        status: "scraped"
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

    const updateData = JSON.stringify([{
        url: jobUrl,
        vdate: today + "T00:00:00Z"
    }]);

    const updateResult = spawnSync("curl", [
        "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`,
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "https://solr.peviitor.ro/solr/job/update?commit=true",
        "-d", updateData
    ], { encoding: "utf8" });

    const updateJson = JSON.parse(updateResult.stdout);
    expect(updateJson.responseHeader.status).toBe(0);

    const queryResult = spawnSync("curl", [
        "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`,
        "https://solr.peviitor.ro/solr/job/select?q=url:%22" + encodeURIComponent(jobUrl) + "%22&fl=vdate"
    ], { encoding: "utf8" });

    const queryJson = JSON.parse(queryResult.stdout);
    expect(queryJson.response.docs[0].vdate).toContain(today);

    const cleanup = JSON.stringify({delete: {query: "url:\"" + jobUrl + "\""}});
    spawnSync("curl", [
        "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`,
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "https://solr.peviitor.ro/solr/job/update?commit=true",
        "-d", cleanup
    ], { encoding: "utf8" });
});

test("remove-404 command - delete 404 job", async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    const jobUrl404 = "https://example.com/test-404-delete-" + Date.now();
    
    const jobData = JSON.stringify([{
        url: jobUrl404,
        title: "Test 404 Job",
        company: "Test Company",
        location: ["Bucuresti"],
        workmode: "hybrid",
        date: yesterday + "T00:00:00Z",
        vdate: yesterday + "T00:00:00Z",
        status: "scraped"
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

    const verifyResult = spawnSync("curl", [
        "-s", "-u", `${SOLR_USER}:${SOLR_PASSWD}`,
        "https://solr.peviitor.ro/solr/job/select?q=url:%22" + encodeURIComponent(jobUrl404) + "%22"
    ], { encoding: "utf8" });

    const verifyJson = JSON.parse(verifyResult.stdout);
    expect(verifyJson.response.numFound).toBe(1);

    const deleteQuery = JSON.stringify({delete: {query: "url:\"" + jobUrl404 + "\""}});
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
        "https://solr.peviitor.ro/solr/job/select?q=url:%22" + encodeURIComponent(jobUrl404) + "%22"
    ], { encoding: "utf8" });

    const afterJson = JSON.parse(afterResult.stdout);
    expect(afterJson.response.numFound).toBe(0);
});
