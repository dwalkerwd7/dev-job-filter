# TODO

- [ ] Remove `employee_count` and add location extraction (from job description or scrape)
- [ ] Move all constants and lists (TARGET_STACK, BATCH_SIZE, delays, selectors, etc.) into a `pipeline.cfg` config file read by `scraper.js` and `filter.js`
- [ ] Fine-tune filter batch delays using conservative token count estimates to eliminate rate limit errors
- [ ] Add pipeline logging to separate log files (one per run)
