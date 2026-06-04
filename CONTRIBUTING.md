# Contributing

Thanks for helping improve Maintainer Signal Board. This is a static, local-first project for maintainer queue analysis. Sample data is synthetic, and the project is not affiliated with or endorsed by OpenAI.

## Good Contributions

- Clear docs for maintainers reviewing PRs, triaging issues, or preparing releases.
- Small fixes to parsing, scoring, lane assignment, generated briefs, or CSV output.
- Accessibility and mobile usability improvements.
- Security hardening that preserves local-first behavior.
- Synthetic examples that make edge cases easier to review.

## Before Opening a PR

1. Keep the change narrow and describe the maintainer problem it solves.
2. Avoid unrelated app, package, script, test, or README churn.
3. Use synthetic data in examples, screenshots, and fixtures.
4. Do not add telemetry, remote data collection, or endorsement claims.
5. Run the repo's documented local checks when available.

## PR Description

Include:

- What changed.
- Why it helps maintainers.
- How you checked it.
- Any known limitation or follow-up.

## Issue Reports

Use the issue templates when possible. For behavior reports, include synthetic JSON input, expected output, actual output, and browser/device context when relevant.

## Security

Do not post secrets, tokens, private repository names, or exploit details in public issues. Follow `SECURITY.md` for security and privacy-sensitive reports.
