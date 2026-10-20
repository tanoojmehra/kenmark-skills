# Persist plan file safely

## Step 1 — Collect all known IDs and reserve safely

**Never reuse an ID** (or previously reserved IDs), and never compute only from active files. Read `brain/plans/INDEX.md` **Last Assigned ID**, **Next ID**, actual ID-column table rows, every `[0-9]*-*.md` in active and `completed/` (optional `archive/`). Parse entire numeric prefixes, validate >=3-digit canonical formatting, sort numerically, detect duplicates, and report missing/corrupt ledgers rather than assuming `001`.

The next candidate is `max(lastAssigned+1, nextId, maxIndexedId+1, maxFileId+1)`, displayed using `String(id).padStart(3, "0")` (e.g. 998, 999, 1000, 3752, 10000). Do **not** `grep -Eo` arbitrary three-digit numbers in INDEX; titles/dates are not IDs.

Parallel agents must serialize writes. With exclusive tracker ownership re-read all sources, reserve high-water in INDEX atomically before exclusive file creation, and never reuse a reservation after a crash. Separate Git clones must coordinate merges. For conflicts stop and use `kenmark-tracker-maintain` first; do not delete duplicates.

An optional helper in this source checkout is `node scripts/brain-tracker.js reserve plans [repoRoot]`; independent agents can use normal filesystem and Git tools instead.


## Plan artifact

Create `brain/plans/{id}-{slug}.md` exclusively, never overwrite an existing file. Keep existing plan metadata fields, tier/type/status and full plan body. Update INDEX high-water and Proposed table while preserving all historical rows; if file creation fails, the reserved ID remains consumed. **Never reuse IDs**. Confirm active and completed history before allocation.
