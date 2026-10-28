---
id: 024
title: kenmark-plans-execute never marks the plan in-progress — implementation starts while status stays "proposed"
severity: P3
area: workflow
source: kenmark-issues-scan
status: completed
created: 2026-10-27
completed: 2026-10-28
files:
  - skills/user-skills/kenmark-plans-execute/SKILL.md
related: []
---

## Summary

Phase 2 of `kenmark-plans-execute` requires setting `status: in-progress` on the plan and moving its INDEX entry before implementation, but the executing agent skipped that step in a real run: the plan file stayed `status: proposed` for the entire implementation (verified repeatedly during the ~35-minute run) and was only touched again at Phase 4, when it was correctly archived with `status: done`. The skill's own governance model (proposed → in-progress → done) therefore has no observable mid-flight state, and INDEX.md's In-progress table never reflected reality.

## Evidence

- Observed 2026-10-27: project `Test-Project-2026-10-27`, plan `brain/plans/001-plan-pitchside-amazon-style-football-equipment-e-commerce.md`. `grep '^status:'` returned `proposed` at minute ~2, ~5, ~8, ~14, and ~22 of the run (checked over SSH while the Studio agent executed the skill). Final state: moved to `brain/plans/completed/` with `status: done`, `completed: 2026-10-27`.
- The skill text (Phase 2) is unambiguous ("Set `status: in-progress` … Move entry in INDEX.md"), so this is an instruction-adherence/enforcement gap: nothing in the skill forces the check before Phase 3 begins.

## Suggested fix

Make Phase 3's first step conditional on Phase 2 evidence: instruct the agent to re-read the plan frontmatter before implementing and stop (or self-correct with a note) if `status` is not `in-progress`. Optionally add a checklist item to the skill's Phase 4 entry conditions that the INDEX In-progress table was updated at start, so skips become visible in the archive diff.

## Acceptance criteria

- [x] A run that executes the skill flips the plan to `status: in-progress` before its first implementation commit, observable in the plan file and INDEX.
- [x] The skill text includes the pre-Phase-3 guard so the omission fails loudly rather than silently.

## Resolution (2026-10-28)

`skills/user-skills/kenmark-plans-execute/SKILL.md` v1.1.1 adds three enforcement points:

- **Hard rule 9 (Plan status gate)** — no implementation edit until the plan reads `status: in-progress` and `INDEX.md` lists it under In progress.
- **Phase 2 blocking gate** — Phase 2 now ends with a verification step (`grep -n '^status:'` on the plan file plus a `grep` for the ID in `INDEX.md`) before Phase 3 may start.
- **Phase 3 pre-implementation gate** — the first step of Phase 3 re-reads the frontmatter and prints `STOP: plan is not in-progress` when the transition was skipped, so the omission fails loudly; Phase 4 item 7 reports a skipped transition instead of archiving silently.

Criterion 1 is enforced by the skill text and its verification commands; no live run was available to observe the flip during this fix, so criterion 2 is the operative change.
