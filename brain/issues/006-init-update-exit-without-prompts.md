---
id: 006
title: Init/update exit immediately when stdin is TTY but non-interactive
severity: P1
area: dx
source: kenmark-issues-fix-and-ship
status: open
created: 2026-06-07
files:
  - scripts/interactive.js
  - scripts/kenmark-setup.js
  - scripts/kenmark-update.js
related: []
---

## Summary

`npx kenmark-skills init` (and sometimes `update`) can print the banner and exit immediately without showing the install wizard. This happens when `process.stdin.isTTY` is true but stdin delivers immediate EOF — common in IDE agent subprocesses, piped runners, or pseudo-TTY environments.

## Evidence

User report: first `npx kenmark-skills init` and `npx kenmark-skills update` printed the banner then returned to the shell with no prompts. A retry in a real terminal succeeded.

Code path in `scripts/kenmark-setup.js`:

1. `wantsInteractive()` returns true when `stdin.isTTY` and `-y` is not set (`scripts/interactive.js:33-37`).
2. Interactive branch calls `promptYesNo(..., defaultYes=false)` for both Kenmark skills and recommended packs (`kenmark-setup.js:147-154`).
3. `promptYesNo` treats empty/EOF as the default (`interactive.js:44-45`) → both flags become false.
4. `if (!installKenmark && !installRecommended)` prints "Nothing selected to install." and `process.exit(0)` (`kenmark-setup.js:250-252`).

No error is shown; exit code is 0, so users assume success or a silent failure.

## Acceptance criteria

- [ ] When stdin is not readable or EOF arrives before the first answer, init falls back to non-interactive mode with a clear message, or exits non-zero with guidance to re-run with flags + `-y`.
- [ ] `promptYesNo` / `wantsInteractive` detect non-interactive stdin even when `isTTY` is true (or document `KENMARK_SKILLS_NONINTERACTIVE=1` in the early-exit message).
- [ ] `kenmark-update.js` uses the same guard so confirm/plan steps do not hang or silently cancel in agent environments.
- [ ] Regression test covers TTY+EOF and non-TTY without `-y` behavior.

## Suggested fix

- Extend `wantsInteractive()` to require both `stdin.isTTY` and `stdout.isTTY`, or probe readline with a timeout/EOF check before entering the interactive branch.
- On EOF during required prompts, print: `Non-interactive stdin detected. Re-run with explicit flags and -y, e.g. npx kenmark-skills init --ide auto -y`
- Consider defaulting the first init question to `true` when Kenmark home is empty (first-time install).
