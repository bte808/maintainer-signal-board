# Issue Triage Playbook

Maintainer Signal Board is a static, local-first maintainer queue tool. Treat every issue as a signal-quality case: does it help a maintainer decide what to do next?

Sample data in this repo is synthetic. Ask reporters to replace real repository, user, token, or organization details with synthetic examples before sharing public reports. This project is not affiliated with or endorsed by OpenAI.

## First Pass

1. Confirm the report is about Maintainer Signal Board, its docs, or its templates.
2. Identify the workflow: sample queue, custom JSON import, scoring, lane assignment, Markdown brief, CSV export, accessibility, or release process.
3. Add a priority and one owner-facing label.
4. Ask one focused follow-up if the report is missing input data, expected output, browser/device context, or a screenshot.

## Priority Guide

- P0: Security/privacy concern, misleading release blocker behavior, or broken local-first boundary.
- P1: Core parsing, scoring, lane assignment, brief generation, or CSV export is wrong for common input.
- P2: Confusing UI, unclear docs, inaccessible control, or issue template gap.
- P3: Enhancement, wording polish, nice-to-have sample, or maintainer workflow idea.

## Label Guide

- `security`: possible vulnerability, secret exposure, unsafe dependency, or privacy regression.
- `bug`: behavior differs from the documented or visible workflow.
- `release`: release checklist, versioning, changelog, or blocker handling.
- `docs`: wording, playbooks, examples, templates, or maintainer guidance.
- `triage`: needs more data before implementation.
- `good first issue`: narrow, low-risk, easy to verify locally.

## Triage Outcomes

- Assign an owner for P0/P1 reports.
- Convert broad requests into one concrete acceptance criterion.
- Close duplicates with a link to the active issue.
- Close unsupported requests politely when they require remote service claims, adoption claims, or integrations outside the static local-first scope.

## Minimal Reproduction

Ask for:

- The JSON input or a reduced synthetic version.
- The expected priority, lane, or export output.
- The actual result.
- Browser/device context for UI reports.
- Whether the issue appears with the built-in synthetic samples.
