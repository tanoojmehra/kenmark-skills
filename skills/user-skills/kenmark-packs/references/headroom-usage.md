# Headroom after kenmark-skills install

Headroom is a **CLI tool** (not a SKILL.md pack). Kenmark installs it via the optional `headroom` catalog pack or offers `headroom wrap --prepare-only` at the end of interactive `init`.

Kenmark **skills** (router, init, issues, …) work in every agent as soon as `npx kenmark-skills init` finishes. Headroom is **optional context compression** on top — different per agent when you use **built-in / subscription models** (not BYOK).

## Quick matrix (built-in models)

| Agent | Kenmark skills | Headroom with built-in model |
| --- | --- | --- |
| **Cursor** (Auto / built-in) | Open agent chat; try `kenmark-router` or `kenmark-init` | **rtk only** — shell output compression via `.cursorrules` (no API proxy) |
| **Claude Code** (subscription) | Same — skills in `~/.claude/skills` | **`headroom wrap claude`** — launch through Headroom (do not use plain `claude`) |
| **Codex** (subscription) | Skills in `~/.agents/skills` | **`headroom wrap codex`** — launch through Headroom (do not use plain `codex`) |
| **Gemini CLI** (subscription) | Skills in `~/.gemini/skills` and/or `~/.agents/skills` | **Kenmark skills only today** — no `headroom wrap gemini`; MCP install targets Claude/Codex only |

For **BYOK** (your own OpenAI/Anthropic key), Cursor can also route API traffic through Headroom — see [Cursor BYOK](#cursor-byok-optional) below.

---

## 1. Kenmark skills (all agents)

No Headroom required.

1. Restart the IDE or CLI if skills do not appear.
2. Open a **new** agent chat in a project.
3. Ask for workflows by name, e.g. `kenmark-init`, `kenmark-router`, `kenmark-plan`.

Verify:

```bash
# Cursor / Claude — skills on disk
ls ~/.cursor/skills/kenmark-init/SKILL.md
ls ~/.claude/skills/kenmark-init/SKILL.md

# Gemini — may also read ~/.agents/skills when Codex path is linked
gemini skills list | grep kenmark-init
```

---

## 2. Cursor (built-in / Auto models)

Headroom gives Cursor **two layers**. With built-in models you only get layer 1 unless you BYOK.

### Layer 1 — rtk (works with built-in models)

Run once **per project** (from the project root):

```bash
headroom wrap cursor --prepare-only
```

This injects rtk instructions into that project’s `.cursorrules`. The agent should prefix shell commands with `rtk`:

```bash
rtk git status
rtk ls src/
```

That shrinks **terminal output** in context (often 60–90% on noisy commands). It does **not** change how Cursor routes to its built-in models.

Re-run from another repo to set up that project.

### Layer 2 — API proxy (BYOK only)

`headroom wrap cursor` starts a proxy and prints base URLs for **Settings → Models → Override base URL** with **your** API key. This does **not** apply to Cursor Auto or normal subscription routing.

### Cursor BYOK (optional)

```bash
headroom wrap cursor
```

Copy the printed base URL into Cursor model settings, keep the terminal running (proxy on port 8787).

---

## 3. Claude Code (built-in subscription)

Use Headroom as the **launcher**. Subscription auth stays the same; traffic routes through the local proxy.

```bash
headroom wrap claude
```

Examples:

```bash
headroom wrap claude --resume <session-id>
headroom wrap claude --memory          # persistent cross-session memory
headroom wrap claude --code-graph      # optional code graph
```

**Do not** start plain `claude` if you want compression — always use `headroom wrap claude`.

Optional MCP (retrieve compressed content):

```bash
headroom mcp install --agent claude
headroom proxy    # if not already running from wrap
```

Check savings: `headroom perf`

---

## 4. Codex (built-in subscription)

Same pattern as Claude:

```bash
headroom wrap codex
headroom wrap codex -- "fix the failing test"
```

**Do not** start plain `codex` if you want compression.

Optional:

```bash
headroom mcp install --agent codex
```

---

## 5. Gemini CLI (built-in subscription)

### Kenmark skills

Works out of the box after `init`. Verify:

```bash
gemini skills list
```

Kenmark may link skills to `~/.gemini/skills` and/or `~/.agents/skills` depending on which IDEs you selected.

### Headroom

There is **no** `headroom wrap gemini`. `headroom mcp install` currently registers **Claude Code and Codex** only.

Practical options today:

- Use **Kenmark skills** and normal Gemini CLI for agent workflows.
- Use Headroom on **Claude** or **Codex** when you want compression on those tools.
- Watch Headroom releases for Gemini MCP/wrap support: [chopratejas/headroom](https://github.com/chopratejas/headroom).

---

## Install Headroom (if you skipped it in init)

```bash
npx kenmark-skills install-recommended --ids headroom -y
# or
uv tool install 'headroom-ai[all]'
```

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `headroom: command not found` | `uv tool install 'headroom-ai[all]'` and ensure `~/.local/bin` on PATH |
| Cursor agent ignores `rtk` | Run `headroom wrap cursor --prepare-only` from **project root**; check `.cursorrules` |
| Claude/Codex not compressing | Launch with `headroom wrap …`, not bare CLI |
| Gemini missing Kenmark skills | `npx kenmark-skills setup --ide gemini -y`; run `gemini skills list` from `$HOME` |
| Want savings report | `headroom perf` |

Docs: [headroom-docs.vercel.app](https://headroom-docs.vercel.app/docs/quickstart)
