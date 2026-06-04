# PR Review Playbook

Maintainer Signal Board is a static, local-first project for turning issue and pull request data into maintainer-facing queue signals. Sample data in this repo is synthetic. This project is not affiliated with or endorsed by OpenAI.

## Review Goals

- Keep the board useful for maintainers making small daily decisions.
- Protect local-first behavior: no unnecessary network calls, telemetry, or secret handling.
- Keep scoring changes explainable from labels, age, review state, ownership, and release/security context.
- Prefer small, reviewable patches over broad rewrites.

## Intake

1. Read the PR title, description, and changed paths before opening the diff.
2. Classify the PR as docs, UI, parsing, scoring, export, accessibility, or security hardening.
3. Check whether the change affects maintainer trust: ranking, lane assignment, generated briefs, CSV output, or privacy posture.
4. Ask for a focused reproduction or before/after example when behavior changes are not visible from the diff.

## Review Pass

- For parsing changes, check malformed JSON, empty input, unknown fields, mixed issue/PR data, and closed items.
- For scoring changes, verify that security, release blockers, stale items, merge candidates, drafts, and unassigned work still land in sensible lanes.
- For export changes, confirm generated Markdown and CSV remain readable and avoid leaking unexpected fields.
- For UI changes, check keyboard use, mobile layout, contrast, and empty states.
- For docs-only changes, confirm they do not claim adoption, endorsement, data collection, or guarantees the project does not provide.

## Merge Bar

- The PR has a clear maintainer benefit.
- Behavior changes have a sample, fixture, screenshot, or short manual verification note.
- Security and privacy-sensitive changes have a second maintainer review when possible.
- The branch does not introduce unrelated app, package, script, or test churn.

## Review Comment Style

Use short comments tied to the risk:

- "Blocker" for incorrect scoring, privacy regression, broken exports, or inaccessible primary workflow.
- "Should fix" for confusing maintainer behavior or avoidable edge cases.
- "Nit" for style, wording, or polish that should not block useful work.

End the review with one of: approve, request changes, or leave a specific next action.
