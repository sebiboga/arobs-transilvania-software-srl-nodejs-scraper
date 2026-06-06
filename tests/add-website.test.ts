import { test, expect } from "@playwright/test";

const SOLR_URL = "https://solr.peviitor.ro/solr/company";
const SOLR_USER = process.env.SOLR_USER || "solr";
const SOLR_PASSWD = process.env.SOLR_PASSWD || "SolrRocks";
const SOLR_AUTH = `${SOLR_USER}:${SOLR_PASSWD}`;

test("add-website command works - adds company to Solr", async () => {
    const testCompany = {
        id: "99999998",
        company: "TEST COMPANY ADD WEBSITE SRL",
        brand: "TESTBRAND",
        group: "Test Group",
        status: "activ",
        website: ["https://testbrand.com"],
        career: ["https://careers.testbrand.com"]
    };

    const response = await fetch(`${SOLR_URL}/update/json?commit=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([testCompany])
    });

    expect(response.ok).toBe(true);

    const queryResponse = await fetch(
        `${SOLR_URL}/select?q=id:${testCompany.id}`,
        { headers: { Authorization: "Basic " + btoa(SOLR_AUTH) } }
    );
    
    const queryData = await queryResponse.json();
    expect(queryData.response.numFound).toBe(1);
    expect(queryData.response.docs[0].company).toBe(testCompany.company);

    await fetch(`${SOLR_URL}/update/json?commit=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delete: { id: testCompany.id } })
    });
});
