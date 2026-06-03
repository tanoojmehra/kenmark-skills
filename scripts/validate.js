#!/usr/bin/env node

/**
 * Thin CLI entry for repo validation — `kenmark-skills validate` only.
 * npm scripts call `scripts/validate-repo.js` directly (`npm run validate`, `npm test`).
 */

require("./validate-repo.js");
