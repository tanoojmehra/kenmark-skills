#!/usr/bin/env node

const assert = require("assert");
const { parseSemver, semverLt } = require("./cli-package");

assert.deepStrictEqual(parseSemver("2.3.13"), [2, 3, 13]);
assert.deepStrictEqual(parseSemver("v2.1.0"), [2, 1, 0]);
assert.strictEqual(parseSemver("bad"), null);

assert.strictEqual(semverLt("2.1.0", "2.3.13"), true);
assert.strictEqual(semverLt("2.3.13", "2.3.13"), false);
assert.strictEqual(semverLt("2.4.0", "2.3.13"), false);
assert.strictEqual(semverLt("2.3.12", "2.3.13"), true);

console.log("OK — cli-package semver tests passed.");
