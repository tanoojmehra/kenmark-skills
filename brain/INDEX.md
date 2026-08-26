# Brain Index

Project knowledge base for humans and AI agents working on **kenmark-skills**.

| Path | Purpose |
| --- | --- |
| [rules/standards.md](rules/standards.md) | Lean universal rules (read every session) |
| [rules/stack.md](rules/stack.md) | Node.js CLI, scripts, package layout |
| [rules/workflow.md](rules/workflow.md) | Git branch policy, scope, KB maintenance |
| [rules/testing.md](rules/testing.md) | validate, npm test, publish gates |
| [rules/ui.md](rules/ui.md) | N/A for this package (skills docs only) |
| [rules/deployment.md](rules/deployment.md) | npm publish, version bumps |
| [specs/INDEX.md](specs/INDEX.md) | Living specs for durable desired behavior |
| [kb/00-project-overview.md](kb/00-project-overview.md) | CLI package summary, 41 skills, users |
| [kb/01-architecture.md](kb/01-architecture.md) | cli.js routing, hub store, setup flow |
| [kb/02-stack-and-dependencies.md](kb/02-stack-and-dependencies.md) | Node 18+, zero runtime deps |
| [kb/05-api-and-integrations.md](kb/05-api-and-integrations.md) | CLI commands, flags, MCP, IDE targets |
| [kb/07-features.md](kb/07-features.md) | Feature index → `kb/features/` |
| [kb/08-flows-and-workflows.md](kb/08-flows-and-workflows.md) | init, update, adopt, cleanup, uninstall |
| [kb/09-infra-and-deployment.md](kb/09-infra-and-deployment.md) | npm pack, prepublishOnly, files list |
| [kb/10-testing-and-quality.md](kb/10-testing-and-quality.md) | validate-repo, smoke tests, doctor |
| [kb/11-known-risks-and-decisions.md](kb/11-known-risks-and-decisions.md) | Tradeoffs, TTY/EOF, Windows symlinks |
| [CHANGELOG.md](CHANGELOG.md) | Versioned log of brain and standards changes |
| [issues/INDEX.md](issues/INDEX.md) | Active/completed issue tracker |
| [plans/INDEX.md](plans/INDEX.md) | Active/completed plan tracker |

## Maintenance

- Update matching `brain/kb/` files after CLI, catalog, MCP, or skill changes.
- Keep `README.md` as a quick start; put detail here.
- Re-run **kenmark-init** in consumer repos — not this package's install flow.
