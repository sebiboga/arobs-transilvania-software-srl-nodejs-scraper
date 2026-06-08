# AROBS — Verification Checklist

> Use this file to track what has been verified (manually or automated) for AROBS.

## Pașul 1: Teste Locale (locale)

- [ ] `npm test` — toate testele trec
- [ ] `node company.js` — validare ANAF + Peviitor funcționează
- [ ] `node solr.js` — query SOLR funcționează (dacă `SOLR_AUTH` e setat)
- [ ] `node scraper.js` — scrape-ul se execută fără erori
- [ ] Fișierul `tmp/company.json` e generat corect
- [ ] Fișierul `tmp/scraper-result.json` e generat corect (după scrape)

## Pașul 2: GitHub Actions (remote)

- [ ] `Automation-Tests` — toate testele trec în CI
- [ ] `validate-jobs` — AROBS apare în company core
- [ ] `Scheduled Scrape` — rulează zilnic și publică job-uri

## Pașul 3: Verificare Peviitor (production)

- [ ] Job-urile AROBS apar pe [Peviitor.ro](https://peviitor.ro)
- [ ] Logo, descriere, locații corecte
- [ ] Link-urile către cariere funcționează

## Note

- CIF: 11291045
- Brand: AROBS
- Frecvență scrape: zilnic (00:06 UTC)
- Solr query default: `company:AROBS*`
