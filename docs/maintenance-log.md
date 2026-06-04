# Maintenance Log

This log records verified maintainer rounds for small public releases. It is intentionally factual: no adoption claims, no external endorsement claims, and no private queue data.

## 2026-06-04 - v0.3.0 maintenance rounds

1. Scoring preset profiles
   - Added balanced, release, review, dependency, and community profile weights.
   - Added UI controls to apply a profile and reset to documented defaults.

2. Shareable local queue URL
   - Added a local-first share action that stores queue state in the URL hash.
   - The action does not send queue data to a server.

3. GitHub export normalization
   - Added support for GraphQL-shaped `labels.nodes`, `assignees.nodes`, `comments.totalCount`, repository metadata, pull request URLs, and string draft fields.
   - Added tests for repository-qualified pull request references.

4. Sanitized example fixture
   - Added `examples/sanitized-maintainer-queue.json` with synthetic GitHub-shaped data.
   - The fixture uses `example-org/example-repo` and avoids secrets, customers, private repositories, and private organizations.

5. Release evidence hygiene
   - Updated README, changelog, static checks, and browser verification for the maintenance release.
   - Kept dependency risk described as a title/label triage heuristic, not a scanner or security validation tool.

Verification for this round:

```bash
npm run validate
git diff --check
find .github/ISSUE_TEMPLATE -name '*.yml' -exec ruby -e 'require "yaml"; YAML.load_file(ARGV[0]); puts "yaml ok #{ARGV[0]}"' {} \;
```
