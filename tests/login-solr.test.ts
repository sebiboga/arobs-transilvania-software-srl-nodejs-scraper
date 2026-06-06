import { test, expect } from "@playwright/test";

test("login-solr command works", async ({ page }) => {
    await page.goto("https://solr.peviitor.ro/solr/");
    
    const loginHeading = page.locator("h1:has-text('Basic Authentication')");
    await expect(loginHeading).toBeVisible();
    
    await page.fill('input[type="text"]', "solr");
    await page.fill('input[type="password"]', "SolrRocks");
    await page.click("button:has-text('Login')");
    
    await page.waitForURL("https://solr.peviitor.ro/solr/#/");
    
    const username = page.locator("text=Current Username");
    await expect(username).toBeVisible();
    
    const logoutLink = page.locator("text=Logout solr");
    await expect(logoutLink).toBeVisible();
});
