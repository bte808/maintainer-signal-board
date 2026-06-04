# Changelog

## 0.3.0 - 2026-06-04

- Added scoring preset profiles for balanced, release, review, dependency, and community triage.
- Added a local-first share URL action that serializes the current queue, capacity, sample, profile, and weights into the URL hash.
- Improved GitHub export normalization for GraphQL-shaped labels, assignees, comment counts, repository metadata, pull request URLs, and string draft fields.
- Added `examples/sanitized-maintainer-queue.json` as a reusable synthetic fixture.
- Added a maintenance log that records the five verified maintenance rounds for this release.
- Expanded tests, static checks, and browser verification for profiles, share URLs, and normalized GitHub-shaped data.

## 0.2.0 - 2026-06-04

- Added adjustable scoring weights with local persistence and a reset-to-defaults control.
- Added dependency-risk signals, a dependency-risk lane, a summary metric, maintainer brief output, and a synthetic dependency-risk queue.
- Added a sanitized GitHub CLI export recipe for shaping issue and pull request JSON.
- Expanded core, static, and browser verification for dependency-risk routing, scoring weights, reset behavior, and mobile overflow.
- Updated release and triage templates so maintainers can report dependency-risk and scoring-weight behavior precisely.

## 0.1.1 - 2026-06-04

- Fixed browser verification on Linux CI by auto-detecting Chrome or Chromium executables.
- Kept local macOS browser verification behavior unchanged.

## 0.1.0 - 2026-06-04

- Shipped the initial local-first Maintainer Signal Board static app.
- Added synthetic queue samples for release week, security patch, and community backlog workflows.
- Added queue parsing, priority scoring, maintainer lanes, capacity estimates, Markdown brief, CSV export, JSON export, and evidence log.
- Added core tests, static wiring checks, and desktop/mobile browser verification.
- Added maintainer-facing docs, issue templates, PR template, CI workflow, security policy, contribution guide, and code of conduct.
