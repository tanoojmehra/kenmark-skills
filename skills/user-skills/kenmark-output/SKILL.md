---
name: kenmark-output
version: 1.0.0
category: workflow
scope: universal
phase: verify
description: "Full-output enforcement skill that checks whether the assistant's response is complete, actionable, non-lazy, and matches the user's requested deliverable. Use when asked for complete output, final answer, no omissions, exhaustive response, or quality-check the response before sending."
triggers:
  - kenmark-output
  - full output
  - full-output enforcement
  - complete answer
  - no omissions
  - don't skip anything
  - give me everything
  - final response check
  - exhaustive output
  - make sure nothing is missing
  - verify the output
  - output contract
allowed-tools:
  - Read
  - Grep
  - Glob
  - TodoWrite
  - AskUserQuestion
risk: read-only
disable-model-invocation: false
---

# Kenmark Output

## Purpose

Use this skill to enforce complete, high-quality output.

This skill is for:

- final answer quality checks
- long implementation deliverables
- multi-file code output
- markdown/source-of-truth documents
- plans
- audits
- reports
- checklists
- generated prompts
- migration guides
- repo recommendations

It prevents:

- vague summaries when the user asked for detail
- missing files
- missing commands
- unverified assumptions
- half-finished answers
- “you can do X” instead of actually providing X
- pretending work was done when it was not
- incomplete final deliverables

---

## Core principle

```text
User asked for X → Output must fully satisfy X → Missing parts must be explicit
```

If something cannot be done, say so clearly and provide the best partial result.

---

## Operating modes

| Mode             | Use when                              | Behavior                                                 |
| ---------------- | ------------------------------------- | -------------------------------------------------------- |
| `light-check`    | Normal answer                         | Ensure answer directly satisfies request                 |
| `strict-check`   | User asked for full/exhaustive output | Enforce all sections and no missing deliverables         |
| `artifact-check` | User asked for code/docs/files        | Ensure filenames, contents, and usage instructions exist |
| `audit-check`    | User asked for audit/review           | Ensure findings, severity, evidence, fixes, and priority |
| `handoff-check`  | User will use this as source of truth | Ensure structure, assumptions, risks, and next steps     |

Use `strict-check` when user says:

* full
* complete
* exhaustive
* source of truth
* don't miss anything
* no shortcuts
* give me all files
* production-ready

---

## Output contract checklist

Before final response, verify:

```text
[ ] Did I answer the actual user request?
[ ] Did I include all requested parts?
[ ] Did I avoid adding unnecessary unrelated content?
[ ] Did I clearly state assumptions?
[ ] Did I clearly state uncertainty?
[ ] Did I include exact filenames/paths if files are involved?
[ ] Did I include commands if implementation requires commands?
[ ] Did I include verification/testing steps?
[ ] Did I include risks or caveats where relevant?
[ ] Did I avoid saying work was done when it was not?
[ ] Did I avoid placeholders unless explicitly acceptable?
[ ] Did I provide a usable next step?
```

---

## Required formats by deliverable type

### Plan output

Must include:

```text
Goal
Context
Recommended approach
Phases
Risks
Acceptance criteria
Verification
Next step
```

### Audit output

Must include:

```text
Verdict
What is good
Issues found
Severity / priority
Evidence
Recommended fixes
Action order
```

### Code output

Must include:

```text
Files to create/change
Complete code or exact patch guidance
Install/setup commands if needed
Run/test commands
Known assumptions
```

### Skill output

Must include:

```text
Skill name
File path
Frontmatter
Purpose
Triggers
Safety rules
Workflow steps
Output format
Anti-patterns
Repo integration notes
```

### Repo recommendation output

Must include:

```text
Current state
Problem
Recommended change
Why
Risk
Migration path
Validation/testing
```

---

## Completeness rules

* If the user asks for a file, provide the file path and content.
* If the user asks for multiple files, list every file.
* If the answer is too large, provide the highest-value complete chunk and explicitly say what remains.
* Do not use “etc.” for required deliverables.
* Do not say “and so on” where exact steps are needed.
* Do not omit verification.
* Do not omit rollback for risky changes.
* Do not omit migration notes for breaking changes.
* Do not hide failed tool actions.

---

## Evidence and honesty

If the response depends on inspected files, include evidence references or file paths.

If a tool failed, say:

```text
I attempted X, but Y failed. Here is the best manual patch/plan.
```

Never claim:

```text
I updated the repo
```

unless the write actually succeeded.

---

## Final response self-check

Before sending the final response, run this internal check:

```markdown
## Output self-check

- User wanted:
- Delivered:
- Missing:
- Assumptions:
- Verification included:
- Next step:
```

Do not include this section unless useful. Use it to improve the final answer.

---

## When to ask a question

Ask a question only if:

* the answer would be materially wrong without it
* the user requested a choice and no default is safe
* destructive action is involved

Otherwise, make a reasonable assumption and clearly state it.

---

## Anti-patterns

* “Here is a high-level overview” when the user asked for full detail.
* Saying “you can create a file” without giving the file.
* Saying “run tests” without specifying which tests.
* Saying “update docs” without specifying where.
* Claiming certainty without evidence.
* Claiming repo changes succeeded when a tool failed.
* Ending with vague offers instead of a concrete next step.
