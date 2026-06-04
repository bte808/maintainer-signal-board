# Release Playbook

Use this playbook for small, honest releases of Maintainer Signal Board. The project is a static, local-first maintainer signal board; sample data is synthetic, and the project is not affiliated with or endorsed by OpenAI.

## Release Preflight

- Review recent PRs and issues for unresolved P0/P1 items.
- Confirm docs, templates, and release notes avoid adoption claims, endorsement claims, and real-user data claims.
- Confirm built-in sample data remains synthetic.
- Confirm no secrets, tokens, private repository names, or private organization names are committed.
- Run the repo's documented local checks when available.

## Manual QA

Check the primary workflow in a local browser or equivalent static preview:

- Built-in sample queue loads.
- Empty input is handled without crashing.
- A synthetic custom JSON queue can be analyzed.
- Security, dependency-risk, release, stale, draft, and merge-candidate examples land in expected lanes.
- Scoring weights can be changed and reset to defaults.
- Scoring preset profiles can be applied.
- Share URL updates the URL hash without sending data to a server.
- Generated maintainer brief is readable.
- CSV output, when exposed by the UI, keeps stable column names.
- Mobile layout remains usable.

## Release Notes

Keep notes short and factual:

- What changed for maintainers.
- Any scoring or lane behavior that changed.
- Any docs or template additions.
- Known limitations.

Do not claim production adoption, external validation, or OpenAI endorsement.

## Publish Checklist

1. Make sure the working tree contains only intended release files.
2. Tag or publish using the repo's established process.
3. Verify the public artifact or static preview after publishing when one exists.
4. Open one follow-up issue for any deferred P2/P3 work.

## Rollback

Rollback is appropriate when a release breaks parsing, scoring, exports, static loading, or privacy expectations. Prefer reverting the smallest release change, then write a short issue with the failed input, observed output, and expected maintainer behavior.
