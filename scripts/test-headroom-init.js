#!/usr/bin/env node

const { getWrapAgentsForIdes, HEADROOM_WRAP_BY_IDE } = require("./headroom-init");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  assert(
    getWrapAgentsForIdes(["cursor", "claude", "codex"]).join(",") === "cursor,claude,codex",
    "expected cursor,claude,codex"
  );
  assert(
    getWrapAgentsForIdes(["cursor", "gemini", "antigravity-cli"]).join(",") === "cursor",
    "only cursor maps to headroom wrap"
  );
  assert(getWrapAgentsForIdes([]).length === 0, "empty input");
  assert(
    Object.keys(HEADROOM_WRAP_BY_IDE).length >= 3,
    "HEADROOM_WRAP_BY_IDE should list supported agents"
  );
  console.log("OK — headroom-init unit tests passed.");
}

main();
