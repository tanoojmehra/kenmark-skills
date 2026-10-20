# Portable Brain format — v2.0

## Authority and compatibility

Markdown and Git remain canonical. Indexes and any Studio database (including MongoDB), embedding or retrieval service are derived and optional. Every skill must work with filesystem/Read/Grep/Glob/Bash/Git alone and no internet. Installing skills never automatically writes or normalizes project KB.

## Canonical layout

`brain/rules/` contains modular instructions (typically `standards.md`, `workflow.md`, `stack.md`, `testing.md`, `deployment.md`). `brain/kb/` contains durable verified project facts. Numbered pages `00-project-overview.md` through `11-known-risks-and-decisions.md` are conventions, not mandatory placeholders. `brain/kb/features/` and `brain/kb/decisions/` hold optional canonical records. `brain/issues/` and `brain/plans/` contain working investigations and execution plans, with `completed/` and optional `archive/` preserving history. `brain/specs/` and `brain/CHANGELOG.md` are optional specifications and substantive knowledge-change history.

Legacy `00-overview.md` and `00-project-overview.md` are recognized as equivalent without forced renaming. Missing frontmatter, partial structures, custom rules and mixed filenames remain valid inputs.

## Numeric IDs

Issue/plan filename: `<numeric-id>-<hyphen-slug>.md`. Numeric IDs are positive integers with minimum display width three: `001`, `009`, `099`, `100`, `999`, `1000`, `3752`, `10000`. Parse the entire prefix, never slice three characters or lexically sort numbers. Reject malformed new artifact names, report legacy noncanonical formats without destructive migration.

`INDEX.md` contains structured `Last Assigned ID`, `Next ID` and ID-column table rows. Parse only these, not numbers in titles/dates/prose. Collect active, completed and optional archived IDs. Never reuse an allocated/reserved number, including missing-file historical rows. Duplicate numeric IDs across different files are conflicts to report and preserve, never an automatic deletion/merge. INDEX is a ledger/navigation projection; filesystem/Git documents are authoritative.

Concurrent writers must acquire exclusive ownership, rescan inside the lock, reserve high-water before exclusive file creation, and never reuse an ID even if creation fails. Local locks alone cannot synchronize distinct clones; Git coordination is also necessary. Missing/corrupt ledger blocks automatic allocation until explicitly approved non-destructive repair.

## Knowledge lifecycle

Canonical KB values: `draft`, `verified`, `needs-review`, `superseded`, `archived`. Read aliases `reviewed` as previously reviewed (validate evidence before calling it verified), `needs-update` as needs-review and `implemented` as historical implemented status, not automatically verified. Normalize logically in memory only; never force source rewrites. Missing metadata is unknown, not stale.

Issues use `open`, optionally `in-progress`, and `completed`, preserving historical statuses. Plans use `proposed`, `approved`, `in-progress`, `done`, `superseded`, `cancelled`. Do not conflate KB and tracker lifecycles.

Optional evidence-backed frontmatter:

```yaml
status: verified
related_issues:
  - 3752
related_plans:
  - 141
source_paths:
  - src/lib/dsh/run-executor.ts
verified_at_commit: b116f73
```

Do not invent relationships or claim verification without source evidence.

## Maintenance and freshness

Issues and plans retain investigations, tests, hypotheses, decisions-in-progress and execution history. After successful verification, compare established KB claims with source/contracts/tests. If consistent return `KB already consistent`, with no KB/changelog writes. If a verified durable fact genuinely changed, make a small canonical update; deduplicate feature IDs and decisions first. Changelog only when warranted.

Freshness labels: `current` (verified claim), `potentially-stale` (relevant source changed; claim not checked), `needs-review` (specific conflicting evidence), `unknown` (insufficient evidence). Timestamp age alone never proves staleness.

## Agent instruction precedence and portability

User/platform safety and explicit authorization take priority. Respect repository-authored instructions and protected Git workflow policies, followed by selected managed AGENTS/CLAUDE/GEMINI/Cursor pointer sections and task-relevant modular Brain rules. Preserve customized content outside `init-brain` markers. Keep always-on instructions short and context capsules reference-only. No mandatory `brain_search`, Studio daemon, MongoDB or embedding dependency.

## Import and repair

Existing/partial/legacy Brain imports are report-only by default. Preserve user files, ledgers, and statuses; create only explicitly requested missing structure. A recovered index must not redefine canonical file identity or delete duplicate history.
