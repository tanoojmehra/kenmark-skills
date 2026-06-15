---
name: kenmark-plan-lite
version: 1.0.0
category: workflow
scope: universal
phase: plan
description: "Lightweight planning skill for turning vague or complex requests into a clear chat-level plan. Does not create brain/plans files. Use for quick plans, approach selection, roadmap sketches, and implementation outlines."
triggers:
  - quick plan
  - approach this
  - break this down
  - implementation outline
  - roadmap sketch
  - plan this
  - make a plan
  - before coding
  - how should we approach this
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
risk: read-only
disable-model-invocation: false
---

# Kenmark Plan Lite

## Purpose

Chat-level planning before implementation. Produces a clear plan in the conversation — **no** `brain/plans/` files.

For durable, indexed plans use **`kenmark-plan-durable`** (explicit request only). For implementation after approval use **`kenmark-plans-execute`**.

---

## Core principle

```text
Frame → Inspect → Options → Risks → Plan → Proceed
```

Do not jump straight to implementation unless the user explicitly asks.

---

## Step 1 — Frame the request

Capture goal, current state, scope, constraints, and unknowns. Light inspection:

```bash
git status --short
```

Read README, `brain/kb/`, and relevant source when scope is non-trivial.

---

## Step 2 — Generate options (when useful)

For small scope, state one recommended approach. For larger work, compare 2+ options with pros, cons, and risk.

---

## Step 3 — Produce the chat plan

Include at minimum:

- **Summary** and **Goal**
- **Phased checklist** (3–7 steps for quick work; more for complex)
- **Acceptance criteria**
- **Verification commands** when applicable
- **Risks** when scope is non-trivial

Answer: what first, what not to touch, how to verify, rollback if high-risk.

---

## Step 4 — Present and next step

Summarize recommended approach and ask whether to implement, escalate to **`kenmark-plan-durable`**, or adjust scope.

---

## Safety rules

- Read-only inspection; do not write plan files or modify the repo.
- Do not implement while planning unless asked.
- Do not over-plan trivial requests.

## Related skills

- **`kenmark-plan-durable`** — save plan to `brain/plans/` (explicit request)
- **`kenmark-plans-execute`** — implement an approved durable plan
