---
id: "001"
title: Add kenmark-server-defense skill for server & project vulnerability audit, incident detection, and hardening
tier: full-feature
type: agent-workflow
status: done
source: kenmark-plan
created: 2026-09-15
approved: 2026-09-15
completed: 2026-09-15
files:
  - skills/user-skills/kenmark-server-defense/SKILL.md
  - skills/README.md
  - README.md
  - package.json
  - brain/kb/features/002-skills-catalog.md
  - brain/kb/00-project-overview.md
  - brain/CHANGELOG.md
  - brain/plans/INDEX.md
related_issues: []
related_plans: []
---

## Summary

Add the `kenmark-server-defense` skill to `skills/user-skills/` to provide automated and interactive audits for server compromise, runtime threat hunting (IOCs, miners, unlinked running binaries, cron backdoors), deployed framework vulnerability scanning (specifically Next.js RCEs and middleware bypasses), secret blast radius analysis, and incident containment/hardening playbooks.

## Goal

Provide agents with a comprehensive, safe, and prescriptive defensive skill based on real-world production incident analysis (September 14, 2026 Next.js monorepo compromise, XMRig deployment, and multi-wave credential exfiltration).

## Plan

1. Create `skills/user-skills/kenmark-server-defense/SKILL.md` with full frontmatter adhering to Kenmark standards.
2. Structure the skill with 4 core modules:
   - Module A: Project & Monorepo Framework Vulnerability Audit (Next.js CVEs, dev vs prod, middleware regex matchers, webshell scans).
   - Module B: Host & Runtime Threat Hunter (Cryptominers, executables in `/tmp`/`/dev/shm`, deleted running binaries, crontabs, systemd persistence, network egress).
   - Module C: Secret Blast Radius & Permission Hardening (`.env` permissions, cloud credentials, database localhost binding).
   - Module D: Incident Containment & Hardening Playbook (emergency triage, evidence preservation, credential revocation checklist, permanent OS hardening with `noexec` mounts).
3. Update `skills/README.md`, `README.md`, `package.json`, and `brain/kb/` documentation to reflect the new skill.
4. Validate with `validate-repo.js` and smoke tests.

## Acceptance criteria

- `skills/user-skills/kenmark-server-defense/SKILL.md` exists and passes frontmatter schema validation.
- All attack vectors from the 2026-09-14 incident are covered.
- `package.json`, `skills/README.md`, and `README.md` have consistent skill counts.
- `brain/` docs and changelog are updated.
- Validation and smoke tests pass.
