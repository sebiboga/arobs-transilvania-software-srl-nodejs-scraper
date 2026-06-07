# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-07

### Added
- Initial release
- Job scraping from AROBS iCIMS Careers (HTML parsing with cheerio)
- Company validation via ANAF
- Solr integration for job storage
- GitHub Actions workflows for weekly scraping and testing
- Comprehensive test suite (unit, integration, E2E)
- ANAF API fallback with cached data support

### Features
- Automated weekly job scraping
- Company core validation and management
- Job URL validation
- Data integrity checks
- Romanian location filtering
- Work mode detection (remote/hybrid/on-site)
- Skill tag extraction from job titles

## License

Copyright (c) 2024-2026 BOGA SEBASTIAN-NICOLAE
Licensed under MIT License
