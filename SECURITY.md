# Security Policy

Maintainer Signal Board is intended to run as a static, local-first project. It should not require secrets, tokens, or remote data collection for its sample workflows. Sample data in this repo is synthetic. This project is not affiliated with or endorsed by OpenAI.

## Reporting a Vulnerability

Please avoid posting sensitive details in a public issue. Use the maintainer contact channel for reports involving:

- Secret or token exposure.
- Unsafe handling of imported JSON.
- Cross-site scripting or HTML injection.
- Unexpected network access or telemetry.
- Privacy leaks involving real repository, user, or organization data.

If a private contact channel is not available, open a public issue with a minimal high-level description and ask for a secure handoff path.

## What to Include

- A short description of the risk.
- A synthetic proof of concept when possible.
- Expected impact.
- Affected files or workflow.
- Suggested fix, if known.

Do not include real secrets, private repository names, private organization names, or non-consensual personal data.

## Maintainer Handling

1. Acknowledge the report when practical.
2. Assign an owner before normal backlog work.
3. Reproduce using synthetic data.
4. Patch the smallest affected surface.
5. Document the fix in release notes without exposing exploit details.

## Scope

In scope: project code, static assets, docs, templates, generated maintainer briefs, CSV output, and local-first privacy behavior.

Out of scope: third-party hosting outages, unrelated browser bugs, social engineering, and requests requiring access to private systems.
