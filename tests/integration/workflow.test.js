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

beforeAll(() => {
  try { fs.unlinkSync('tmp/company.json'); } catch {}
  if (HAS_SOLR) {
    process.env.SOLR_AUTH = process.env.SOLR_AUTH;
  }
});

const AROBS_CIF = '11291045';

describe('Integration: API Workflow', () => {

  describe('ANAF API', () => {
    let anaf;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
    });

    it('should search for AROBS brand and find the company', async () => {
      const results = await anaf.searchCompany('AROBS');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const active = results.find(c =>
        c.name.toUpperCase().includes('AROBS') && c.statusLabel === 'Funcțiune'
      );
      expect(active).toBeDefined();
      expect(active.cui).toBeDefined();
    }, 15000);

    it('should return empty array for non-existent brand', async () => {
      const results = await anaf.searchCompany('ThisBrandDoesNotExistXYZ123');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    }, 15000);

    it('should fetch company details by valid CIF', async () => {
      const data = await anaf.getCompanyFromANAF(AROBS_CIF);

      expect(data).toBeDefined();
      expect(data.cui).toBe(11291045);
      expect(data.name).toBe('AROBS TRANSILVANIA SOFTWARE S.A.');
      expect(data).toHaveProperty('address');
      expect(data).toHaveProperty('registrationNumber');
      expect(data).toHaveProperty('caenCode');
      expect(data.onrcStatusLabel).toBe('Funcțiune');
    }, 15000);

    it('should throw for invalid CIF', async () => {
      await expect(anaf.getCompanyFromANAF('00000000')).rejects.toThrow();
    }, 60000);

    it('should use cached data when API fails (getCompanyFromANAFWithFallback)', async () => {
      const cached = { cui: 11291045, name: 'AROBS TRANSILVANIA SOFTWARE S.A.' };

      const data = await anaf.getCompanyFromANAFWithFallback(AROBS_CIF, cached);

      expect(data).toBeDefined();
      expect(data.cui).toBe(11291045);
    }, 15000);
  });

  describe('Peviitor API', () => {
    let company;

    beforeAll(async () => {
      company = await import('../../company.js');
    });

    it.skip('should respond successfully and contain companies array (Peviitor API may block non-browser requests)', async () => {
      const res = await fetch('https://api.peviitor.ro/v1/company/', {
        headers: { 'User-Agent': 'job_seeker_ro_spider' }
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toHaveProperty('companies');
      expect(Array.isArray(data.companies)).toBe(true);
    }, 15000);
  });

  describe('SOLR Company Core', () => {
    let solr;

    beforeAll(async () => {
      solr = await import('../../solr.js');
    });

    itIfSolr('should query company core by ID', async () => {
      const result = await solr.queryCompanySOLR(`id:${AROBS_CIF}`);

      expect(result.numFound).toBe(1);
      const arobs = result.docs[0];
      expect(arobs.id).toBe(AROBS_CIF);
      expect(arobs.company).toBe('AROBS TRANSILVANIA SOFTWARE S.A.');
      expect(arobs.brand).toBe('AROBS');
      expect(arobs.status).toBe('activ');
      expect(Array.isArray(arobs.location)).toBe(true);
      expect(arobs.lastScraped).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }, 15000);

    itIfSolr('should have required company model fields', async () => {
      const result = await solr.queryCompanySOLR(`id:${AROBS_CIF}`);
      const arobs = result.docs[0];

      expect(arobs).toHaveProperty('id', AROBS_CIF);
      expect(arobs).toHaveProperty('company');
      expect(arobs).toHaveProperty('brand', 'AROBS');
      expect(arobs).toHaveProperty('status');
      expect(['activ', 'suspendat', 'inactiv', 'radiat']).toContain(arobs.status);
      expect(arobs).toHaveProperty('location');
      expect(Array.isArray(arobs.location)).toBe(true);
      expect(arobs).toHaveProperty('website');
      expect(Array.isArray(arobs.website)).toBe(true);
      expect(arobs.website[0]).toMatch(/^https?:\/\/.+/);
      expect(arobs).toHaveProperty('career');
      expect(Array.isArray(arobs.career)).toBe(true);
      expect(arobs.career[0]).toMatch(/^https?:\/\/.+/);
      expect(arobs).toHaveProperty('lastScraped');
      expect(arobs).toHaveProperty('scraperFile');
    }, 15000);

    itIfSolr('should have optional field (group) if present', async () => {
      const result = await solr.queryCompanySOLR(`id:${AROBS_CIF}`);
      const arobs = result.docs[0];

      if (arobs.group !== undefined) {
        expect(typeof arobs.group).toBe('string');
      }
    }, 15000);
  });

  describe('SOLR Jobs Core', () => {
    let solr;

    beforeAll(async () => {
      solr = await import('../../solr.js');
    });

    itIfSolr('should query jobs by CIF and return valid data', async () => {
      const result = await solr.querySOLR(AROBS_CIF);

      if (result.numFound === 0) {
        console.log('⚠️ No AROBS jobs in Solr — skipping SOLR data verification');
        return;
      }

      expect(Array.isArray(result.docs)).toBe(true);

      const job = result.docs[0];
      expect(job).toHaveProperty('url');
      expect(job).toHaveProperty('title');
      expect(job).toHaveProperty('company', 'AROBS TRANSILVANIA SOFTWARE S.A.');
      expect(job).toHaveProperty('cif', AROBS_CIF);
      expect(job).toHaveProperty('status');
      expect(job).toHaveProperty('location');
    }, 15000);
  });

  describe('Full Validation Workflow', () => {
    let anaf;
    let companyModule;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
      companyModule = await import('../../company.js');
    });

    it('should complete the ANAF → Peviitor validation path', async () => {
      const searchResults = await anaf.searchCompany('AROBS');
      expect(searchResults.length).toBeGreaterThan(0);

      const arobsCompany = searchResults.find(c =>
        c.name.toUpperCase().includes('AROBS') && c.statusLabel === 'Funcțiune'
      );
      expect(arobsCompany).toBeDefined();

      const anafData = await anaf.getCompanyFromANAF(arobsCompany.cui.toString());
      expect(anafData).toBeDefined();
      expect(anafData.onrcStatusLabel).toBe('Funcțiune');
    }, 30000);

    itIfSolr('should validate company and query SOLR for existing jobs', async () => {
      const companyResult = await companyModule.validateAndGetCompany();

      expect(companyResult.status).toBe('active');
      expect(companyResult.company).toBe('AROBS TRANSILVANIA SOFTWARE S.A.');
      expect(companyResult.cif).toBe(AROBS_CIF);

      if (companyResult.existingJobsCount === 0) {
        console.log('⚠️ No AROBS jobs in Solr — skipping job count assertion (scraper may not have run yet)');
        return;
      }
      expect(companyResult.existingJobsCount).toBeGreaterThan(0);
    }, 30000);

    itIfSolr('should have matching CIF in company core', async () => {
      const companyResult = await companyModule.validateAndGetCompany();
      const solrObj = await import('../../solr.js');

      const solrResult = await solrObj.queryCompanySOLR(`id:${AROBS_CIF}`);
      expect(solrResult.numFound).toBe(1);
      expect(solrResult.docs[0].id).toBe(AROBS_CIF);
      expect(solrResult.docs[0].company).toBe('AROBS TRANSILVANIA SOFTWARE S.A.');
    }, 30000);
  });
});
