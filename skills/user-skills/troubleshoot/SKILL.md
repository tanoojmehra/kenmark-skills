---
name: troubleshoot
version: 1.0.0
category: workflow
scope: universal
phase: diagnose
description: "Universal troubleshooting skill for understanding a problem deeply, collecting evidence, forming hypotheses, using sub-agents/research when helpful, and producing a ranked action plan. Use when asked to troubleshoot, diagnose, debug, investigate, find root cause, analyze an issue, or decide the best way to tackle a problem."
triggers:
  - troubleshoot
  - diagnose
  - debug this
  - investigate
  - root cause
  - find the problem
  - figure out what is wrong
  - why is this happening
  - best way to tackle this
  - analyze the issue
  - troubleshoot my Cursor slowdown
  - diagnose this production issue
  - find root cause of this deployment failure
  - build a test plan before fixing
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Task
  - TodoWrite
  - WebSearch
  - WebFetch
  - AskUserQuestion
risk: write-files
disable-model-invocation: false
---

# Troubleshoot — Universal Root-Cause & Action Planning Skill

## Purpose

Use this skill when the user has a problem, failure, slowdown, ambiguity, or complex situation and wants to understand:

1. **What exactly is happening**
2. **Why it might be happening**
3. **What evidence supports each hypothesis**
4. **What should be tried first**
5. **What deeper investigation or research is needed**
6. **What tradeoffs, risks, and fallback options exist**

This skill is universal. It must not assume a specific stack, product, company, repository, framework, tool, or domain.

**Trigger examples:** “troubleshoot my Cursor slowdown”, “diagnose this production issue”, “find root cause of this deployment failure”, “build a test plan before fixing”.

It applies to:

- Software bugs
- Build/runtime failures
- Dev-tool slowdowns
- AI-agent / IDE / skill bloat problems
- Infrastructure and networking issues
- Deployment and CI/CD failures
- Performance problems
- Product/workflow problems
- Architecture decisions
- Operational incidents
- Hardware/system issues
- Unknown or poorly described problems

---

## Core principle

Do not jump straight to fixes.

First build a clear problem model:

```text
Symptom → Context → Timeline → Scope → Evidence → Hypotheses → Tests → Options → Plan
```

The goal is not to sound confident. The goal is to reduce uncertainty.

---

## Operating modes

Choose the smallest mode that fits the request.

| Mode                 | Use when                                                                 | Depth                                                   |
| -------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| `quick-triage`       | Simple, obvious, low-risk issue                                          | Fast diagnosis + 3–5 checks                             |
| `standard-diagnosis` | Normal troubleshooting request                                           | Evidence, hypotheses, ranked plan                       |
| `deep-investigation` | Complex, high-impact, unclear, recurring, expensive, or production issue | Sub-agents/research, decision matrix, test plan         |
| `incident-response`  | Active outage, data loss risk, security concern, production failure      | Stabilize first, preserve evidence, avoid risky changes |

If the user asks to “think deeply,” “use sub-agents,” “research,” “audit,” “root cause,” or “best way to tackle it,” use `deep-investigation`.

---

## Safety and boundaries

**Default mode is read-only.** Investigation, commands, and the final report should not modify the repo or environment unless the user approves a specific change.

**File writes** (`brain/troubleshooting/…`, `TodoWrite` task lists, or other artifacts) are allowed only when:

* the user explicitly approves creating or updating files, or
* you are already operating in an explicit repo documentation workflow (e.g. the user asked to record findings in `brain/`, or `init-brain` / issues tracking is active and they want a durable artifact).

* Prefer read-only investigation first.
* Do not delete, reset, reinstall, wipe, rotate secrets, migrate data, or make irreversible changes unless the user explicitly asks and the risk is explained.
* For production systems, first preserve evidence: logs, config snapshots, versions, error output, timestamps, recent changes.
* If the issue may involve security, privacy, money, legal, medical, or safety impact, clearly mark uncertainty and recommend qualified review where appropriate.
* Never hide uncertainty. Use confidence levels.
* If evidence is insufficient, say what is missing and how to collect it.

---

## Step 1 — Frame the problem

Extract or ask for the minimum missing context.

Do not ask a long questionnaire if enough context exists. If the user already gave details, proceed with assumptions and mark them.

Capture:

```markdown
## Problem frame

- Symptom:
- Expected behavior:
- Actual behavior:
- Scope:
- First noticed:
- Recent changes:
- Environment:
- Impact:
- Urgency:
- Known constraints:
```

If context is missing, ask at most **3 high-value questions**. Prefer questions that change the next diagnostic step.

---

## Step 2 — Classify the issue

| Class           | Examples                                          | First lens                                    |
| --------------- | ------------------------------------------------- | --------------------------------------------- |
| `performance`   | slow tools, lag, memory, CPU, network, DB latency | bottlenecks, profiling, recent bloat          |
| `correctness`   | wrong output, failed logic, broken workflow       | reproduction, inputs, invariants              |
| `availability`  | app down, service unreachable, CI failing         | dependency chain, logs, status, rollback path |
| `configuration` | env vars, DNS, paths, permissions, versions       | diff config, defaults, resolution order       |
| `integration`   | API, OAuth, webhook, DB, third-party service      | contracts, auth, rate limits, schema drift    |
| `security`      | exposed secrets, auth bypass, suspicious access   | containment, evidence, access review          |
| `usability`     | confusing flow, UX issue, adoption issue          | user journey, friction, expectations          |
| `unknown`       | vague, multi-factor, intermittent                 | timeline, evidence matrix, hypothesis tree    |

---

## Step 3 — Collect evidence

Use the safest available evidence first.

For software/code repos, inspect:

* Recent changes and diffs
* Error messages and logs
* Relevant config files
* Package versions / lockfiles
* Runtime commands
* Tests and failing test output
* Environment differences
* Entry points and call paths

Useful read-only commands:

```bash
git status --short
git log --oneline -10
git diff --stat
git diff
find . -maxdepth 3 -type f \( -name "package.json" -o -name "pnpm-lock.yaml" -o -name "package-lock.json" -o -name "yarn.lock" -o -name "tsconfig.json" -o -name ".env.example" \) -print
```

For infra/network/system issues, inspect:

* Topology and dependency chain
* DNS, routing, firewall, proxy layers
* CPU, memory, disk, network saturation
* Service status
* Logs around the incident window
* Recent deploys/restarts/config changes

Useful read-only commands:

```bash
uname -a
uptime
df -h
free -h
ps aux --sort=-%cpu | head
ps aux --sort=-%mem | head
```

For AI tooling / skill bloat issues, inspect:

* Number of installed skills/agents/rules/plugins/MCP servers
* Whether multiple tools cover the same domain
* Large global rules or project rules
* Hooks and auto-run tools
* Workspace size and indexing load
* Extension/plugin count
* Recent installs/updates

Do not assume bloat is the cause. Compare against CPU, memory, disk, network, and project size evidence.

### Evidence bundle (compact ledger)

After collecting facts, maintain a **single evidence bundle** instead of repeating long excerpts in every section. Assign stable IDs **`E1`, `E2`, …** as you add rows (append only; do not renumber mid-investigation).

Use for non-trivial and deep-investigation modes. For **`quick-triage`**, a 3–5 row bundle is enough; skip duplicating the same facts in prose.

```markdown
## Evidence bundle

| ID | Evidence | Source | Supports | Confidence |
| --- | --- | --- | --- | --- |
| E1 | <one-line fact> | log / config / file / user report / web source / command / test | H1 | High/Med/Low |
| E2 | ... | ... | H1, H2 | Med |
| E3 | ... | ... | weakens H2 | Low |
```

| Column | Rules |
| --- | --- |
| **ID** | `E1`, `E2`, … — cite these everywhere else |
| **Evidence** | One line per row; quote or path only when needed for action |
| **Source** | Where it came from (file path, command, URL, user quote, timestamp) |
| **Supports** | `H1`, `H2`, `H1, H2`, `weakens H2`, or `—` if not yet mapped |
| **Confidence** | How strongly this fact is established (not hypothesis confidence) |

Update the bundle as new facts appear. Later steps (hypotheses, tests, final report) **reference IDs only** — do not paste full logs twice.

---

## Step 4 — Build a hypothesis tree

```markdown
## Hypotheses

| # | Hypothesis | Why plausible | Evidence for | Evidence against | Confidence | Test |
| --- | --- | --- | --- | --- | --- | --- |
| H1 | ... | ... | E1, E2 | E3 | Low/Med/High | T1 |
```

Rules:

* **Evidence for / against** — use evidence bundle IDs (`E1`, `E2`) only, not long quotes.
* Include at least 3 hypotheses for non-trivial problems.
* Include one “boring/simple” hypothesis.
* Include one “recent change/regression” hypothesis.
* Include one “environment/configuration” hypothesis where relevant.
* Do not overfit to the user’s suspected cause unless evidence supports it.

---

## Step 5 — Use sub-agents for deep investigation

If the harness supports sub-agents or task delegation, split the investigation into independent tracks.

Recommended tracks:

| Sub-agent          | Responsibility                                                                  |
| ------------------ | ------------------------------------------------------------------------------- |
| `evidence-agent`   | Collect logs, configs, versions, diffs, screenshots, reproduction details       |
| `hypothesis-agent` | Generate likely root causes and falsification tests                             |
| `research-agent`   | Look up current docs, known issues, changelogs, advisories, compatibility notes |
| `systems-agent`    | Map dependencies, bottlenecks, resources, network, OS/runtime constraints       |
| `code-agent`       | Inspect relevant code paths, tests, edge cases, error handling                  |
| `risk-agent`       | Identify risky fixes, rollback plan, data/security impact                       |
| `synthesis-agent`  | Merge findings, rank options, produce final plan                                |

Sub-agent prompt template:

```markdown
You are the <track-name> for this troubleshooting investigation.

Problem:
<problem summary>

Your task:
<specific track responsibility>

Constraints:
- Prefer evidence over guesses.
- Mark confidence as Low/Medium/High.
- Separate facts from assumptions.
- Do not propose destructive changes.
- Return concise findings with supporting evidence and next tests.

Output:
1. Key findings
2. New or updated evidence bundle rows (`E#` — one line each)
3. Hypotheses or risks (cite `E#` / `H#`)
4. Recommended next step
5. Confidence
```

If sub-agents are not available, emulate the same tracks sequentially:

```text
Track A — Evidence
Track B — Hypotheses
Track C — Research
Track D — Risk
Track E — Synthesis
```

---

## Step 6 — Research current or niche information

Use research when:

* The issue depends on current versions, APIs, products, libraries, outages, changelogs, vendor behavior
* The user asks to research
* A term/tool/version is unfamiliar or may have changed
* Known issues or compatibility problems are likely

Research targets:

* Official documentation
* Release notes / changelogs
* GitHub issues / discussions
* Status pages
* Vendor docs
* Package registry metadata
* Security advisories

Research output must distinguish:

```text
Confirmed by source
Likely but not confirmed
Speculation / needs local testing
```

Do not let web research override local evidence. Local logs and reproduction results are usually stronger.

---

## Step 7 — Run a test plan before recommending fixes

```markdown
## Test plan

| Test | Purpose | Command / action | Expected result | Risk | Interprets |
| --- | --- | --- | --- | --- | --- |
| T1 | ... | ... | ... | Low/Med/High | Confirms/refutes H1; may add E4 |
```

New test results become new bundle rows (`E4`, `E5`, …) before updating hypothesis confidence.

Prefer tests that are:

* Read-only
* Reversible
* Fast
* Narrow in scope
* Able to falsify a hypothesis

---

## Step 8 — Rank solutions

```markdown
## Options

| Option | Fixes | Effort | Risk | Time-to-try | Confidence | Rollback |
| --- | --- | --- | --- | --- | --- | --- |
| A | ... | Low/Med/High | Low/Med/High | ... | Low/Med/High | ... |
```

Ranking rules:

1. Prefer reversible, low-risk tests first.
2. Prefer fixes that address the highest-confidence root cause.
3. Avoid broad rewrites until narrow fixes are disproven.
4. For production, include rollback and monitoring.
5. If the problem is multi-factor, propose staged mitigation + deeper root-cause work.

---

## Step 9 — Final troubleshooting report

Lead with the **evidence bundle**, then cite IDs in causes and actions — keeps complex cases readable.

```markdown
# Troubleshooting Report

## Evidence bundle

| ID | Evidence | Source | Supports | Confidence |
| --- | --- | --- | --- | --- |
| E1 | ... | ... | H1 | High |
| E2 | ... | ... | H1, H2 | Med |

## Evidence ↔ hypotheses

- E1, E2 support H1
- E3 weakens H2
- E4 inconclusive for H2 (needs T2)

## Current understanding

<Plain-English summary of what is happening.>

## Most likely causes

1. **H1 — <cause>** — confidence: High/Medium/Low
   - Why:
   - Evidence: E1, E2 support H1; E3 weakens H2
   - What would confirm/refute it:

## What I would check first

1. ...
2. ...
3. ...

## Recommended action plan

### Phase 1 — Safe checks

- [ ] ...

### Phase 2 — Targeted fixes

- [ ] ...

### Phase 3 — Hardening / prevention

- [ ] ...

## Risks and rollback

- Risk:
- Rollback:
- Monitoring:

## What information would improve confidence

- ...
```

---

## Step 10 — Create an investigation artifact when useful

For complex or recurring issues, suggest creating:

```text
brain/troubleshooting/YYYY-MM-DD-short-problem.md
```

Artifact template:

```markdown
# Troubleshooting — <problem>

Date: YYYY-MM-DD
Status: investigating|mitigated|resolved|blocked
Owner:

## Problem frame

## Timeline

## Evidence bundle

| ID | Evidence | Source | Supports | Confidence |
| --- | --- | --- | --- | --- |

## Evidence ↔ hypotheses

- E1, E2 support H1
- ...

## Hypotheses

## Tests run

## Findings

## Action plan

## Resolution

## Follow-up prevention
```

Only create the file after user approval, or when already in an explicit repo documentation workflow where durable tracking is expected.

### Future CLI helper (not shipped yet)

Planned Kenmark command (implementation target: `scripts/brain-template.js`, wired later as `troubleshoot-template`):

```bash
npx kenmark-skills troubleshoot-template --title "cursor slowdown"
# → brain/troubleshooting/2026-06-03-cursor-slowdown.md
```

Optional flags (planned): `--date YYYY-MM-DD`, `--cwd <repo>`, `--dry-run`, `--force` (overwrite). Until the CLI exists, create the path manually or ask the agent to write the Step 10 template after approval.

---

## Anti-patterns to avoid

* Jumping straight to “reinstall everything”
* Treating the user’s suspected cause as fact
* Asking too many questions before useful analysis
* Making broad changes before reproducing or isolating
* Ignoring recent changes
* Ignoring environment differences
* Confusing correlation with causation
* Hiding uncertainty
* Using sub-agents as theater
* Researching endlessly without converting findings into tests
* Repeating full log excerpts instead of adding one bundle row and citing `E#`

---

## Quick output for small issues

```markdown
## Quick triage

Most likely: ...

Check first:
1. ...
2. ...
3. ...

If confirmed, fix:
...

If not, next branch:
...
```

---

## Deep output for complex issues

```markdown
## Investigation plan

- Mode: deep-investigation
- Tracks: Evidence, Hypotheses, Research, Risk, Synthesis
- Immediate goal: reduce uncertainty around <main unknown>

## Parallel tracks

| Track | Question | Output |
| --- | --- | --- |
| Evidence | What facts do we already have? | Evidence bundle (`E1`…) |
| Hypotheses | What could explain this? | ... |
| Research | Are there known/current issues? | ... |
| Risk | What should we avoid breaking? | ... |
| Synthesis | What should we do first? | ... |
```

Then run the tracks and synthesize.

---

## Delegation vs domain skills

| Situation | Prefer |
| --- | --- |
| Unclear problem, need evidence + ranked plan | This skill (`troubleshoot`) |
| User wants a specialist to implement fixes in code | Domain sub-agent (e.g. `senior-dev-troubleshooter`, `build-error-resolver`) after diagnosis |
| Vercel bill, caching, slow routes on a deployed app | `vercel-optimize` (metrics-first) |
| Picking which installed skill to use | `skills-router` |
| Dirty repo, scattered docs, dumps | `repo-hygiene` |
| Secrets, keys, tokens | `repo-secrets-audit` |
| Make repo public | `repo-public-readiness` |
| Docs quality | `repo-docs-audit` |
| Release / publish | `repo-release-readiness` |
| Other repo health | `skills-router` → `repo-*` family |

Do not route “troubleshoot this bug” to `skills-router` unless the user is asking which skill to use.
Do not route “sanitize repo” to `troubleshoot` — use **`repo-hygiene`**. Do not route “find secrets” to `troubleshoot` — use **`repo-secrets-audit`**.
