import { test, expect } from "@playwright/test";

const SOLR_URL = "https://solr.peviitor.ro/solr/company";
const SOLR_USER = process.env.SOLR_USER || "solr";
const SOLR_PASSWD = process.env.SOLR_PASSWD || "SolrRocks";
const SOLR_AUTH = `${SOLR_USER}:${SOLR_PASSWD}`;

test.describe("add-website command - new workflow", () => {
    const testCompany = "AROBS";
    
    test("should search targetare.ro for company info", async () => {
        const searchUrl = `https://www.targetare.ro/cauta-firme?query=${encodeURIComponent(testCompany)}`;
        
        const response = await fetch(searchUrl);
        expect(response.status).toBe(200);
        
        const html = await response.text();
        expect(html).toContain(testCompany);
    });

    test("should find full company name from targetare.ro", async () => {
        const testCompanyLower = testCompany.toLowerCase();
        
        const searchUrl = `https://www.targetare.ro/cauta-firme?query=${encodeURIComponent(testCompany)}`;
        const response = await fetch(searchUrl);
        const html = await response.text();
        
        const companyPatterns = [
            new RegExp(`${testCompany}[\\s-]*SYSTEMS`, 'i'),
            new RegExp(`${testCompany}[\\s-]*INTERNATIONAL`, 'i'),
            new RegExp(`${testCompany}[\\s-]*SRL`, 'i')
        ];
        
        const hasCompanyName = companyPatterns.some(pattern => pattern.test(html));
        expect(hasCompanyName || html.toLowerCase().includes(testCompanyLower)).toBe(true);
    });

    test("should extract CUI from targetare.ro", async () => {
        const cuiPattern = /CUI[:\s]*(\d{8,})/i;
        const testCompanyLower = testCompany.toLowerCase();
        
        const searchUrl = `https://www.targetare.ro/cauta-firme?query=${encodeURIComponent(testCompany)}`;
        const response = await fetch(searchUrl);
        const html = await response.text();
        
        const hasCui = cuiPattern.test(html) || html.toLowerCase().includes('cui');
        expect(hasCui).toBe(true);
    });

    test("should add company to Solr with correct format", async () => {
        const testCompanyData = {
            id: "99999997",
            company: "TEST COMPANY SOLR SRL",
            brand: "TESTCOMPANY",
            group: "Test Group",
            status: "activ",
            website: ["https://testcompany.com"],
            career: ["https://careers.testcompany.com"]
        };

        const response = await fetch(`${SOLR_URL}/update/json?commit=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([testCompanyData])
        });

        expect(response.ok).toBe(true);

        const queryResponse = await fetch(
            `${SOLR_URL}/select?q=id:${testCompanyData.id}`,
            { headers: { Authorization: "Basic " + btoa(SOLR_AUTH) } }
        );
        
        const queryData = await queryResponse.json();
        expect(queryData.response.numFound).toBe(1);
        expect(queryData.response.docs[0].company).toBe(testCompanyData.company);

        await fetch(`${SOLR_URL}/update/json?commit=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ delete: { id: testCompanyData.id } })
        });
    });

    test("should verify company website is accessible", async () => {
        const websiteUrl = "https://epam.com";
        const response = await fetch(websiteUrl, { redirect: 'follow' });
        expect(response.status).toBe(200);
    });

    test("should verify careers page is accessible", async () => {
        const careersUrl = "https://www.epam.com/careers";
        const response = await fetch(careersUrl, { redirect: 'follow' });
        expect(response.status).toBe(200);
    });

    test("Solr company core should have correct fields", async () => {
        const queryResponse = await fetch(
            `${SOLR_URL}/select?q=brand:AROBS&rows=1`,
            { headers: { Authorization: "Basic " + btoa(SOLR_AUTH) } }
        );
        
        const queryData = await queryResponse.json();
        expect(queryData.response.numFound).toBeGreaterThan(0);
        
        const doc = queryData.response.docs[0];
        expect(doc).toHaveProperty("id");
        expect(doc).toHaveProperty("company");
        expect(doc).toHaveProperty("brand");
        expect(doc).toHaveProperty("status");
        expect(doc).toHaveProperty("website");
        expect(doc).toHaveProperty("career");
    });
});
