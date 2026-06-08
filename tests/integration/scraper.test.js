import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const HAS_SOLR = !!process.env.SOLR_AUTH;

function itIfSolr(name, fn, timeout) {
  if (HAS_SOLR) {
    return it(name, fn, timeout);
  }
  return it.skip(`${name} (skipped: SOLR_AUTH not set)`, fn, timeout);
}

const AROBS_BRAND = 'AROBS';
const AROBS_COMPANY = 'AROBS TRANSILVANIA SOFTWARE S.A.';
const AROBS_CIF = '11291045';

beforeAll(() => {
  try { fs.unlinkSync('tmp/company.json'); } catch {}
  try { fs.unlinkSync('tmp/scraper-result.json'); } catch {}
  if (HAS_SOLR) {
    process.env.SOLR_AUTH = process.env.SOLR_AUTH;
  }
});

describe('Integration: Scraper', () => {

  describe('Company Validation', () => {
    let company;

    beforeAll(async () => {
      company = await import('../../company.js');
    });

    it('should validate company data from ANAF', async () => {
      const companyData = await company.getCompanyData();

      expect(companyData).toHaveProperty('company', AROBS_COMPANY);
      expect(companyData).toHaveProperty('cif', AROBS_CIF);
      expect(companyData).toHaveProperty('active', true);
    }, 30000);

    itIfSolr('should save company data to tmp/company.json via validateAndGetCompany', async () => {
      await company.validateAndGetCompany();

      expect(fs.existsSync('tmp/company.json')).toBe(true);
      const saved = JSON.parse(fs.readFileSync('tmp/company.json', 'utf-8'));
      expect(saved.summary).toHaveProperty('company', AROBS_COMPANY);
      expect(saved.summary).toHaveProperty('cif', AROBS_CIF);
    }, 30000);

    it('should load company from cache if tmp/company.json exists', async () => {
      const testData = { summary: { company: AROBS_COMPANY, cif: AROBS_CIF, active: true }, anaf: { name: AROBS_COMPANY, cui: parseInt(AROBS_CIF) } };
      fs.mkdirSync('tmp', { recursive: true });
      fs.writeFileSync('tmp/company.json', JSON.stringify(testData));

      const companyData = await company.getCompanyData();

      expect(companyData.company).toBe(AROBS_COMPANY);
      expect(companyData.cif).toBe(AROBS_CIF);
    }, 15000);

    it('should detect inactive company', async () => {
      const anaf = await import('../../src/anaf.js');

      const inactiveRecord = {
        cui: 99999999,
        name: 'INACTIVE COMPANY S.R.L.',
        address: 'Test address',
        caenCode: '6201',
        inactive: true,
        vatRegistered: false,
        eFacturaRegistered: false
      };

      const anafData = await anaf.getCompanyFromANAFWithFallback('99999999', inactiveRecord);
      expect(anafData.inactive).toBe(true);
    }, 15000);
  });

  describe('Index Module Exports', () => {
    let index;

    beforeAll(async () => {
      index = await import('../../index.js');
    });

    it('should export parseJobsPage', () => {
      expect(typeof index.parseJobsPage).toBe('function');
    });

    it('should export parseLocation', () => {
      expect(typeof index.parseLocation).toBe('function');
    });

    it('should export getSeniorityTag', () => {
      expect(typeof index.getSeniorityTag).toBe('function');
    });

    it('should export mapToJobModel', () => {
      expect(typeof index.mapToJobModel).toBe('function');
    });
  });

  describe('SOLR Indexing', () => {
    let solr;

    beforeAll(async () => {
      solr = await import('../../solr.js');
    });

    itIfSolr('should add jobs to Solr and return success status', async () => {
      const jobs = [{
        url: 'https://careers-arobs.icims.com/jobs/9999/job',
        title: 'Test Job - Integration Test',
        company: AROBS_COMPANY,
        city: 'Cluj-Napoca',
        county: 'Cluj',
        country: 'Romania',
        remote: [],
        published: new Date().toISOString().split('T')[0]
      }];

      const result = await solr.upsertJobs(jobs);
      expect(result).toBeDefined();
      expect(result.status).toBe(0);
    }, 15000);

    itIfSolr('should be able to remove test jobs after adding', async () => {
      const url = 'https://careers-arobs.icims.com/jobs/9999/job';
      const result = await solr.deleteJobByUrl(url);
      expect(result).toBeDefined();
      expect(result.status).toBe(0);
    }, 15000);
  });

  describe('Full Verification', () => {
    itIfSolr('should verify company exists in SOLR after scrape', async () => {
      const solr = await import('../../solr.js');
      const solrResult = await solr.queryCompanySOLR(`id:${AROBS_CIF}`);
      expect(solrResult.numFound).toBe(1);
      expect(solrResult.docs[0].company).toBe(AROBS_COMPANY);
      expect(solrResult.docs[0].status).toBe('activ');
    }, 15000);

    itIfSolr('should have correct company model in company core', async () => {
      const solr = await import('../../solr.js');
      const solrResult = await solr.queryCompanySOLR(`id:${AROBS_CIF}`);
      const arobs = solrResult.docs[0];

      expect(arobs).toHaveProperty('id', AROBS_CIF);
      expect(arobs).toHaveProperty('company', AROBS_COMPANY);
      expect(arobs).toHaveProperty('brand', AROBS_BRAND);
      expect(arobs).toHaveProperty('location');
      expect(Array.isArray(arobs.location)).toBe(true);
      expect(arobs.location.length).toBeGreaterThan(0);

      expect(arobs).toHaveProperty('website');
      expect(Array.isArray(arobs.website)).toBe(true);
      expect(arobs.website[0]).toMatch(/^https?:\/\//);

      expect(arobs).toHaveProperty('career');
      expect(Array.isArray(arobs.career)).toBe(true);
      expect(arobs.career[0]).toMatch(/^https?:\/\//);

      expect(arobs).toHaveProperty('lastScraped');
      expect(arobs.lastScraped).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      expect(arobs).toHaveProperty('scraperFile');
      expect(arobs.scraperFile).toMatch(/nodejs-scraper\/scraper\.py$/);
    }, 15000);
  });
});
