import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import { fileURLToPath } from "url";
import { validateAndGetCompany } from "./company.js";
import { querySOLR, deleteJobByUrl, upsertJobs, upsertCompany } from "./solr.js";

const COMPANY_CIF = "11291045";
const TIMEOUT = 10000;
const JOB_BASE = "https://careers-arobs.icims.com";
const JOB_SEARCH_URL = `${JOB_BASE}/jobs/search?ss=1&hashed=-435624355`;

let COMPANY_NAME = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "job_seeker_ro_spider",
      "Accept": "text/html"
    }
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status} for ${url}`);
  return await res.text();
}

function parseJobsPage(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  $("li.iCIMS_JobCardItem").each((_, el) => {
    const $el = $(el);

    const title = $el.find(".title h3").text().trim();
    const relativeUrl = $el.find(".title a.iCIMS_Anchor").attr("href") || "";
    const url = relativeUrl.startsWith("http") ? relativeUrl : `${JOB_BASE}${relativeUrl}`;

    const locationRaw = $el.find(".header.left span").last().text().trim();
    const location = parseLocation(locationRaw);

    const dateStr = $el.find(".header.right span").attr("title") || "";

    const category = $el.find(".iCIMS_JobHeaderTag").filter((_, t) => {
      return $(t).find("dt.iCIMS_JobHeaderField").text().trim() === "Category";
    }).find("dd span").text().trim();

    const seniority = $el.find(".iCIMS_JobHeaderTag").filter((_, t) => {
      return $(t).find("dt.iCIMS_JobHeaderField").text().trim() === "Seniority";
    }).find("dd span").text().trim();

    const jobId = $el.find(".iCIMS_JobHeaderTag").filter((_, t) => {
      return $(t).find("dt.iCIMS_JobHeaderField").text().trim() === "Job ID";
    }).find("dd span").text().trim();

    const description = $el.find(".description").text().trim();

    if (title && url) {
      jobs.push({
        url: url.replace(/\?in_iframe=1/, ""),
        title,
        location,
        dateStr,
        category,
        seniority,
        jobId,
        description
      });
    }
  });

  const totalText = $("h2.iCIMS_SubHeader_Jobs").text();
  const totalMatch = totalText.match(/Page\s+(\d+)\s+of\s+(\d+)/);
  const currentPage = totalMatch ? parseInt(totalMatch[1]) : 1;
  const totalPages = totalMatch ? parseInt(totalMatch[2]) : 1;

  return { jobs, currentPage, totalPages };
}

function parseLocation(raw) {
  if (!raw || raw === "RO") return ["România"];
  const parts = raw.split("|").map(s => s.trim());
  const locations = [];
  for (const part of parts) {
    const cleaned = part.replace(/^RO[- ]*/, "").trim();
    const mapped = mapCity(cleaned);
    if (mapped) locations.push(mapped);
  }
  return locations.length > 0 ? locations : ["România"];
}

function mapCity(city) {
  const cityMap = {
    "Cluj Napoca": "Cluj-Napoca",
    "Bucharest": "București",
    "Bucuresti": "București",
    "Timisoara": "Timișoara",
    "Iasi": "Iași",
    "Brasov": "Brașov",
    "Targu Mures": "Târgu Mureș",
    "Baia Mare": "Baia Mare",
    "Suceava": "Suceava",
    "Arad": "Arad",
    "Oradea": "Oradea"
  };
  return cityMap[city] || city;
}

function determineWorkmode(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("remote")) return "remote";
  if (text.includes("hybrid")) return "hybrid";
  return "on-site";
}

function getSeniorityTag(seniority) {
  const s = seniority.toLowerCase();
  if (s.includes("senior") || s.includes("architect") || s.includes("lead") || s.includes("manager")) return "senior";
  if (s.includes("mid") || s.includes("intermediate")) return "mid";
  if (s.includes("junior")) return "junior";
  if (s.includes("entry")) return "entry-level";
  if (s.includes("intern") || s.includes("trainee")) return "intern";
  return "mid";
}

function getCategoryTags(category) {
  const catMap = {
    "Development": ["it"],
    "Testing": ["qa"],
    "IT Special Roles": ["it"],
    "Administrative": ["administrative"],
    "Customer Service/Support": ["support"],
    "Human Resources": ["hr"],
    "Internship": ["intern"],
    "Management": ["management"],
    "Purchasing and Logistic": ["logistics"],
    "Sales": ["sales"],
    "Support": ["support"],
    "University Practice": ["intern", "student"]
  };
  return catMap[category] || [];
}

function extractSkillTags(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const tags = [];
  const patterns = {
    "it": /\b(java|kotlin|python|\.net|node\.?js|javascript|react|angular|frontend|ui|programming|developer|software)\b/,
    "embedded": /\b(embedded|c\+\+|rtos|firmware)\b/,
    "data-science": /\b(data|analytics|big data|etl)\b/,
    "ai": /\b(machine learning|ml|ai|mlops)\b/,
    "devops": /\b(devops|ci\/cd|kubernetes|docker)\b/,
    "cloud": /\b(cloud|azure|aws|gcp)\b/,
    "automotive": /\b(automotive|autosar|can)\b/,
    "iot": /\b(iot|internet of things)\b/,
    "business": /\b(business analysis|ba)\b/,
    "finance": /\b(finance|banking)\b/,
    "project-management": /\b(project management|pm)\b/,
    "qa": /\b(qa|testing|automation)\b/,
    "security": /\b(security|cybersecurity)\b/,
    "sap": /\b(sap|abap)\b/,
    "sales": /\b(salesforce|crm)\b/,
    "aerospace": /\b(aerospace|avionics|do-178)\b/
  };
  for (const [tag, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) tags.push(tag);
  }
  return tags;
}

async function scrapeAllListings() {
  const allJobs = [];
  const seenUrls = new Set();
  let page = 0;

  while (true) {
    const url = page === 0
      ? JOB_SEARCH_URL
      : `${JOB_SEARCH_URL}&pr=${page}`;

    console.log(`Fetching page: ${url}`);
    const html = await fetchPage(url);
    const result = parseJobsPage(html);

    if (!result.jobs.length) {
      console.log(`No jobs on page ${page + 1}, stopping.`);
      break;
    }

    let newJobs = 0;
    for (const job of result.jobs) {
      if (!seenUrls.has(job.url)) {
        seenUrls.add(job.url);
        allJobs.push(job);
        newJobs++;
      }
    }
    console.log(`Page ${page + 1}: ${result.jobs.length} jobs, ${newJobs} new (total: ${allJobs.length})`);

    if (page + 1 >= result.totalPages) break;
    page++;
    await sleep(1500);
  }

  console.log(`Total unique jobs collected: ${allJobs.length}`);
  return allJobs;
}

function mapToJobModel(rawJob, cif, companyName = COMPANY_NAME) {
  const now = new Date().toISOString();
  const tags = [];

  const seniorityTag = getSeniorityTag(rawJob.seniority);
  tags.push(seniorityTag);

  const categoryTags = getCategoryTags(rawJob.category);
  tags.push(...categoryTags);

  const skillTags = extractSkillTags(rawJob.title, rawJob.description);
  tags.push(...skillTags);

  const uniqueTags = [...new Set(tags)].slice(0, 20);
  const workmode = determineWorkmode(rawJob.title, rawJob.description);

  const job = {
    url: rawJob.url,
    title: rawJob.title,
    company: companyName,
    cif: cif,
    location: rawJob.location?.length ? rawJob.location : undefined,
    tags: uniqueTags.length ? uniqueTags : undefined,
    workmode,
    date: now,
    status: "scraped"
  };

  Object.keys(job).forEach((k) => job[k] === undefined && delete job[k]);
  return job;
}

async function main() {
  const testOnlyOnePage = process.argv.includes("--test");

  try {
    fs.mkdirSync("tmp", { recursive: true });

    console.log("=== Step 1: Get existing jobs count ===");
    const existingResult = await querySOLR(COMPANY_CIF);
    const existingCount = existingResult.numFound;
    console.log(`Found ${existingCount} existing jobs in SOLR`);

    console.log("=== Step 2: Validate company via ANAF ===");
    const { company, cif, address } = await validateAndGetCompany();
    COMPANY_NAME = company;
    const localCif = cif;

    try {
      await upsertCompany({
        id: cif,
        company,
        brand: "AROBS",
        status: "activ",
        location: address ? [address] : ["Cluj-Napoca"],
        website: ["https://www.arobs.com"],
        career: ["https://www.arobs.com/careers-at-arobs/"],
        lastScraped: new Date().toISOString().split('T')[0],
        scraperFile: "https://raw.githubusercontent.com/sebiboga/arobs-transilvania-software-srl-nodejs-scraper/master/.github/workflows/scrape.yml"
      });
    } catch (err) {
      console.log(`Note: Could not upsert company to SOLR core: ${err.message}`);
    }

    const rawJobs = await scrapeAllListings();
    console.log(`Jobs found on AROBS website: ${rawJobs.length}`);

    const jobs = rawJobs.map(job => mapToJobModel(job, localCif));

    const payload = {
      source: "arobs.com",
      scrapedAt: new Date().toISOString(),
      company: COMPANY_NAME,
      cif: localCif,
      jobs
    };

    fs.writeFileSync("tmp/jobs.json", JSON.stringify(payload, null, 2), "utf-8");
    console.log("Saved tmp/jobs.json");

    console.log("\n=== Step 4: Upsert jobs to SOLR ===");
    await upsertJobs(payload.jobs);

    const finalResult = await querySOLR(COMPANY_CIF);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Jobs existing in SOLR before scrape: ${existingCount}`);
    console.log(`Jobs scraped from AROBS website: ${rawJobs.length}`);
    console.log(`Jobs in SOLR after scrape: ${finalResult.numFound}`);
    console.log(`====================`);

    console.log("\n=== DONE ===");
    console.log("Scraper completed successfully!");

  } catch (err) {
    console.error("Scraper failed:", err);
    process.exit(1);
  }
}

export { parseJobsPage, mapToJobModel, parseLocation, getSeniorityTag, getCategoryTags, extractSkillTags };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
