# Headroom usage with built-in models

Last updated: 2026-06-15
Status: reviewed

Canonical copy for agents: `skills/user-skills/kenmark-packs/references/headroom-usage.md`.

## Summary

After `npx kenmark-skills init`:

- **Kenmark skills** work in Cursor, Claude, Codex, and Gemini without Headroom.
- **Headroom** is optional compression. With **built-in / subscription** models:
  - **Cursor:** rtk via `.cursorrules` (`headroom wrap cursor --prepare-only` per project); API proxy only with BYOK.
  - **Claude / Codex:** launch with `headroom wrap claude` / `headroom wrap codex`.
  - **Gemini:** Kenmark skills only; no `headroom wrap gemini` yet.

Interactive init prints hints via `scripts/headroom-init.js` → `printHeadroomUsageHints`.
