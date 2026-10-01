---
name: kenmark-linear-check
version: 1.0.0
category: issues
scope: universal
phase: verify
description: "Reconstruct the complete state of a Linear ticket by checking requirements, activity, related work, pull requests, reviews, CI, blockers, and remaining actions."
triggers:
  - kenmark-linear-check
  - check a Linear ticket
  - investigate a Linear ticket
  - analyze this Linear issue
  - what remains on this ticket
  - reconstruct ticket context
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Web
  - AskUserQuestion
risk: read-only
disable-model-invocation: false
---

# Kenmark Linear Check

Investigate a Linear ticket deeply enough to explain what it requires, what has
already been done, what remains, and what the user should do next. Produce an
evidence-backed report rather than a restatement of the ticket description.

## Inputs

Accept any of the following:

- A Linear issue URL
- A Linear issue identifier
- A request to inspect the user's assigned ticket when Linear context makes the
  ticket identifiable

If no ticket can be identified, ask for the URL or identifier. Do not guess.

## Investigation workflow

### 1. Read the complete Linear issue

Record the issue identifier, title, description, status, priority, assignee,
creator, team, project, initiative, cycle, labels, dates, due date,
attachments, external links, and linked documents.

Read the full description and separate:

- Explicit requirements
- Acceptance criteria
- Constraints and edge cases
- Requirements inferred from surrounding context
- Points that need clarification

Consider frontend, backend, API, database, migration, permissions,
authentication, security, testing, compatibility, notifications, jobs,
integrations, analytics, audit logs, and documentation only when the ticket or
linked evidence supports them. Mark unsupported possibilities as potential
considerations, not requirements.

### 2. Read activity and comments

Inspect comments and history when available. Capture decisions, scope changes,
assignment or priority changes, status changes, added or removed links, and
newly created sub-issues. Attribute important decisions to the person and date
when available.

### 3. Follow Linear relationships

Inspect the parent issue, child and sub-issues, related issues, blockers,
blocking issues, and duplicates. Explain why each relationship matters and
whether the related work is complete, active, or unresolved. If a duplicate
exists, inspect the canonical issue.

### 4. Find all relevant pull requests

Search both links from Linear and GitHub references to the issue identifier.
Include open, merged, closed, superseded, prerequisite, and follow-up PRs.
For each relevant PR, record:

- Repository, number, title, URL, author, dates, source branch, and target branch
- Draft/ready state and open/closed/merged state
- Review decision, requested reviewers, approvals, requested changes, and
  unresolved comments
- Mergeability and check/CI state
- Changed files and the application layers affected

Do not treat a linked PR as proof that the ticket is complete. Classify its
relationship as full implementation, partial implementation, prerequisite,
follow-up, abandoned attempt, superseded attempt, tests-only, backend-only,
frontend-only, database/migration, infrastructure, or regression fix.

### 5. Compare requirements with implementation

Inspect the implementation of relevant PRs when accessible. Map each explicit
ticket requirement to the files, feature, or PR that addresses it. Identify
missing, partial, or unverified requirements. Review tests, migrations, API
changes, UI changes, business rules, and compatibility implications.

### 6. Reconcile the current state

Determine the factual state using both Linear and GitHub. Use precise states
such as no implementation found, started, partially implemented, complete but
under review, merged with follow-up work, blocked, waiting for review, changes
requested, or waiting for CI. Call out inconsistencies such as a completed
Linear status with an open PR or an in-progress Linear status with merged code.

### 7. Inspect PR reviews

Review all meaningful PR review activity. Check approvals, requested changes,
pending reviews, general comments, inline comments, review threads, resolved
threads, and unresolved threads.

For each unresolved or important comment, record:

- Reviewer
- Requested change
- Date and time when available
- Whether the request was addressed
- Whether the thread is resolved

Do not call a PR complete merely because its implementation exists. A PR with
unresolved requested changes must be clearly identified.

### 8. Inspect CI and checks

Check all available GitHub checks and classify them as passing, failing,
pending, cancelled, or skipped. Determine whether failures are related to the
implementation or appear to be unrelated infrastructure failures.

Never call a PR ready to merge when required checks are failing or significant
review requests remain unresolved.

### 9. Look for multiple or historical PRs

Search for closed PRs, superseded attempts, merged prerequisites, follow-up
fixes, backend PRs, frontend PRs, monorepo PRs, and migration PRs. Build a
timeline when multiple PRs contribute to the ticket and explain how they fit
together.

### 10. Identify missing work

Explicitly identify what appears to remain, including missing frontend or
backend work, tests, migrations, unresolved review comments, failing CI,
required product decisions, unresolved blockers, absent PRs, unreviewed PRs,
and edge cases mentioned in comments but not implemented.

Separate confirmed missing work from possible missing work.

### 11. Check scope beyond the obvious implementation

Do not assume a ticket mentioning one area only requires changes there. Check
whether the evidence supports impact to frontend, backend, APIs, database,
authentication, authorization, email, background jobs, webhooks,
integrations, analytics, notifications, audit logs, tests, or documentation.

Only state an area as required when supported by evidence. Otherwise classify it
as a **Potential implementation consideration**.

## Evidence and uncertainty

Prefer direct links and concrete facts. Distinguish:

- **Confirmed:** directly stated or observable
- **Likely:** supported by implementation or surrounding evidence
- **Needs clarification:** ambiguous or unsupported

Never invent issue identifiers, PRs, reviewers, CI results, requirements, or
next actions. If access is unavailable, state exactly what could not be
verified.

## Report format

Use this structure unless the user requests another format:

```markdown
## Ticket

**[ISSUE-ID] — Title**

Status:
Priority:
Assignee:
Project:
Cycle:

### What this ticket is asking for

Concise explanation of the actual requirement.

## Requirements

### Backend
- ...

### Frontend
- ...

### Database
- ...

### Tests
- ...

### Other
- ...

## Related Linear Work

For each meaningful parent, child, related, blocking, blocked-by, or duplicate
issue, explain the relationship and its current state.

## Pull Requests

For each relevant PR, summarize metadata, relation to the ticket,
implementation, reviews, unresolved comments, CI, and merge state.

## Requirement → Implementation Mapping

| Ticket requirement | Implementation | PR | State |
| --- | --- | --- | --- |
| ... | ... | ... | Done / Partial / Missing / Unverified |

## Blockers

List actual blockers, or state **No active blockers found.**

## Outstanding Items

Separate confirmed remaining work from possible or clarification-dependent work.

## Activity Timeline

Include only meaningful dated events.

## Current State

Give a concise factual conclusion.

## Next Actions

List concrete actions supported by the evidence. Do not add filler actions.
```

The report must answer, when the available data allows it:

1. What is being built and why?
2. What related work and blockers exist?
3. What implementation and PRs exist?
4. What is the status of reviews and CI?
5. Which requirements are complete, partial, missing, or unverified?
6. What should happen next?

## Detailed reporting requirements

### Ticket summary

Include the ticket identifier, title, status, priority, assignee, project, and
cycle. Explain what the ticket is actually asking for instead of rewriting its
description.

### Requirements

Break requirements into applicable categories:

- Backend
- Frontend
- Database
- Tests
- Other

For each item, distinguish confirmed requirements from inferences and
clarification-dependent items.

### Related Linear work

For every meaningful parent, child, related, blocking, blocked-by, or duplicate
issue, include its identifier and title, relationship type, why it matters,
and current state. Do not merely list related issues.

### Pull requests

For every discovered PR, include:

```markdown
### PR #XXXX — Title

Repository:
Status:
Author:
Branch:
Review status:
CI:
Merge status:

**Relation to ticket**

Explain exactly what portion of the ticket this PR implements.

**Implementation**

Summarize relevant added, modified, and removed files, application layers,
tests, migrations, APIs, UI components, and business rules.

**Reviews**

Summarize approvals, requested changes, pending reviews, and unresolved
comments.
```

### Requirement-to-implementation mapping

Use this table whenever sufficient implementation information is available:

| Ticket requirement | Implementation | PR | State |
| --- | --- | --- | --- |
| Requirement | File or feature implementing it | PR # | Done / Partial / Missing / Unverified |

Identify requirements with no corresponding implementation.

### Blockers and outstanding items

List actual blockers. If none are found, state **No active blockers found.**
List remaining work separately, including unresolved review comments, failing
CI, pending approvals, missing implementation, or product clarification.

### Activity timeline

Include meaningful events chronologically when useful:

`Date / Time — Event — Person`

Relevant events include ticket creation, requirement changes, PR opening,
reviews, requested changes, pushed changes, approvals, and merges.

### Current state

End with a concise factual conclusion that reconciles Linear and GitHub. For
example:

> The backend implementation exists in a PR and is under review with one
> unresolved comment. The ticket also describes frontend behaviour, but no
> corresponding frontend PR was found. The ticket therefore has remaining
> implementation work.

### Next actions

Provide concrete engineering actions supported by the evidence. Do not invent
work merely to populate this section.

## Investigation rules

### Be exhaustive

Do not stop after finding the first PR or related issue. Follow relevant
connections until the state of the ticket is understandable.

### Use the right source for each fact

Use Linear for requirements, relationships, activity, and project context. Use
GitHub for implementation, branches, commits, review state, and CI. Reconcile
both sources rather than treating either as complete by itself.

### Do not equate links with completion

A linked PR may cover only part of a ticket. Inspect its implementation and
compare it with the ticket requirements.

### Distinguish facts from inference

Use language such as:

- **Confirmed:** The ticket explicitly requires...
- **Likely:** Based on the linked implementation...
- **Needs clarification:** The description mentions the behaviour but does not
  specify...

### Prefer evidence

Provide direct links to Linear issues, pull requests, and relevant review
threads whenever possible. If a source cannot be accessed, state what could
not be verified.

### Do not hide inconsistencies

Explicitly flag inconsistencies such as a completed Linear status with an open
PR, an in-progress status with merged code, backend-and-frontend requirements
with only a backend PR, an unresolved blocker with implementation started, or
a closed PR with no replacement implementation.

## Completion criteria

The investigation is complete when the report answers, whenever the available
Linear and GitHub data allows it:

1. What exactly is the ticket asking the user to build?
2. Why does the ticket exist?
3. What other tickets are connected to it?
4. Is anything blocking it?
5. Has implementation started?
6. What PRs belong to it?
7. What does each PR actually implement?
8. What is the status of each PR?
9. Are there unresolved review comments?
10. Is CI passing?
11. Which parts are complete?
12. What is still missing?
13. What should the user work on next?
