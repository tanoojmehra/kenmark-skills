# Stack conventions

## Runtime

- **Node.js** 18+ (`package.json` `engines`).
- **CommonJS** — `"type": "commonjs"`; use `require` / `module.exports` in `scripts/`.
- **Zero runtime dependencies** — only Node stdlib + bundled repo files ship on npm.

## Layout

| Path | Role |
| --- | --- |
| `scripts/cli.js` | Binary entry; command routing |
| `scripts/setup-skills.js` | Install/uninstall/MCP merge (legacy `setup` bin) |
| `scripts/kenmark-setup.js` | `init` wizard orchestration |
| `scripts/kenmark-hub.js` | Store, symlinks, MCP, IDE targets, adopt |
| `scripts/kenmark-update.js` | Refresh Kenmark + recommended packs |
| `scripts/kenmark-packs.js` | `install-recommended` (packs section in kenmark-setup) |
| `scripts/skills-adopt.js` | Standalone adopt |
| `scripts/kenmark-cleanup.js` | `cleanup` categories (broken links, legacy, kenmark-*, packs) |
| `scripts/doctor.js` | `doctor` local install diagnostics |
| `scripts/skills-inventory.js` / `scripts/subagents-inventory.js` | `inventory` / `subagents-inventory` reports |
| `scripts/validate-repo.js` | Repo invariants (skills, catalog, package.json) |
| `scripts/brain-contract.js` / `scripts/brain-tracker.js` | Portable Brain issue/plan ID audit + reserve |
| `skills/user-skills/` | 44 bundled skills (flat dirs) |

## Skill frontmatter

Every bundled skill uses: `name`, `version`, `category`, `scope`, `phase`, `description`, `triggers`, `allowed-tools`, `risk`, `disable-model-invocation`.

Categories: `onboarding`, `workflow`, `git`, `issues`, `plans`, `admin`, `testing` (`VALID_CATEGORIES` in `validate-repo.js`). All bundled skills use `scope: universal`.

See `skills/README.md` for the logical category map.

## Published npm `files`

Only paths listed in `package.json` `files` are published. `brain/` is **not** in the npm tarball (see `.npmignore`).
