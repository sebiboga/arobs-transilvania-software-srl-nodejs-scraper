import { test, expect } from "@playwright/test";
import { spawnSync } from "child_process";

const SOLR_USER = process.env.SOLR_USER || "solr";
const SOLR_PASSWD = process.env.SOLR_PASSWD || "SolrRocks";
const SOLR_AUTH = `${SOLR_USER}:${SOLR_PASSWD}`;

function curl(args) {
    const result = spawnSync("curl", args, { encoding: "utf8" });
    return JSON.parse(result.stdout);
}

test("delete-solr command works - delete job by url", () => {
    const jobUrl = "https://example.com/test-solr-delete";
    
    const verifyResp = curl(["-s", "-u", "SOLR_AUTH", "https://solr.peviitor.ro/solr/job/select?q=url:%22" + encodeURIComponent(jobUrl) + "%22"]);
    expect(verifyResp.response.numFound).toBe(1);

    const deleteQuery = JSON.stringify({delete: {query: "url:\"" + jobUrl + "\""}});
    const deleteResp = curl([
        "-s", "-u", "SOLR_AUTH", 
        "-X", "POST", 
        "-H", "Content-Type: application/json", 
        "https://solr.peviitor.ro/solr/job/update?commit=true", 
        "-d", deleteQuery
    ]);
    expect(deleteResp.responseHeader.status).toBe(0);
    
    const afterResp = curl(["-s", "-u", "SOLR_AUTH", "https://solr.peviitor.ro/solr/job/select?q=url:%22" + encodeURIComponent(jobUrl) + "%22"]);
    expect(afterResp.response.numFound).toBe(0);
});
