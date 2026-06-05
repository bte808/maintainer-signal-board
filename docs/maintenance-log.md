# Maintenance Log

This log records verified maintainer rounds for small public releases. It is intentionally factual: no adoption claims, no external endorsement claims, and no private queue data.

## 2026-06-05 - GitHub search issue import maintenance

1. Issue search import
   - Added a synthetic `gh search issues --json ...` fixture for cross-repository issue triage sweeps.
   - Documented a public-field-only issue search export command for maintainers who triage issues across repos.

2. Closed-state filtering
   - Added a regression assertion so closed search-result issues do not inflate open maintainer load.
   - Confirmed stale and discussion-heavy open issue rows still route to community follow-up.

3. Verification
   - Expanded static checks to require the new issue-search fixture and export recipe note.
   - Kept the fixture scoped to neutral `example-org/example-repo` data.

Verification for this round:

```bash
npm test
node --check src/maintainer-core.js
node --check tests/core.test.mjs
node --check scripts/check.mjs
git diff --check
```

## 2026-06-05 - GitHub search PR import maintenance

1. Search-result import
   - Added a synthetic `gh search prs --json ...` fixture for cross-repository review sweeps.
   - Documented a public-field-only search export command for maintainers who review PRs across repos.

2. Merged-state filtering
   - Normalized `MERGED` search rows to closed queue work.
   - Added a regression assertion so merged PRs do not inflate open maintainer load.

3. Verification
   - Expanded static checks to require the new fixture and export recipe note.
   - Kept the fixture scoped to neutral `example-org/example-repo` data.

Verification for this round:

```bash
npm test
node --check src/maintainer-core.js
node --check tests/core.test.mjs
node --check scripts/check.mjs
git diff --check
```

## 2026-06-05 - saved view preset maintenance

1. View presets
   - Added local save, load, and delete controls for recurring maintainer review setups.
   - Presets store capacity, scoring profile, scoring weights, lane filter, and compact-view state.
   - Presets do not store pasted queue text, evidence-log entries, exports, tokens, account data, or the full preset list in Share URLs.

2. Local-first storage
   - Documented `maintainer-signal-board-v1`, `maintainer-signal-board-log-v1`, and `maintainer-signal-board-presets-v1`.
   - Kept runtime dependencies at zero and did not add a backend, analytics script, account system, or API key flow.

3. Browser verification
   - Expanded desktop and mobile browser checks to save, load, and delete one view preset.
   - Kept the mobile overflow check at `390 x 844`.

Verification for this round:

```bash
npm run validate
git diff --check
```

## 2026-06-05 - keyboard shortcut maintenance

1. Lane review shortcuts
   - Added shortcuts to move focus between visible maintainer lanes.
   - Added a compact-view shortcut for repeated review sessions.
   - Added a maintainer brief copy shortcut.
   - Added a bounded clipboard fallback so copy shortcuts recover when clipboard writes hang or are blocked.

2. Input safety
   - Kept shortcuts inactive while inputs, textareas, selects, buttons, or editable regions have focus.
   - Added visible focus treatment for programmatically focused lanes without adding visible in-app shortcut help text.

3. Browser verification
   - Expanded desktop and mobile browser checks to cover lane navigation shortcuts, compact-view shortcuts, brief-copy shortcuts, and input-focus shortcut guards.
   - Kept the mobile overflow check at `390 x 844`.

Verification for this round:

```bash
npm run validate
git diff --check
```

## 2026-06-05 - drill queue maintenance

1. Synthetic drill queues
   - Added release candidate, security hardening, and dependency review drill queues.
   - Kept all drill queue data synthetic and scoped to `example-org/example-repo`.

2. Lane coverage
   - Added a release candidate drill that exercises every maintainer lane: security and quality, dependency risk, release blockers, needs review, ready to merge, community follow-up, and backlog shaping.
   - Added regression assertions for drill queue privacy, lane coverage, security hardening signals, dependency review signals, stale discussions, and draft dependency work.

3. Browser verification
   - Expanded browser checks to load each drill queue at desktop and `390 x 844` mobile sizes.
   - Verified the drill samples do not introduce horizontal overflow.

Verification for this round:

```bash
npm run validate
git diff --check
```

## 2026-06-05 - compact lane filter maintenance

1. Lane view controls
   - Added a lane filter so maintainers can focus on one lane while preserving the default all-lanes board.
   - Added a compact view toggle for denser review sessions on larger synthetic queues.

2. Local-first state
   - Persisted lane filter and compact view state locally.
   - Included the view settings in share URLs without sending queue data to a server.

3. Browser verification
   - Updated browser checks to exercise lane filtering, compact view, desktop rendering, and `390 x 844` mobile overflow protection.

Verification for this round:

```bash
npm test
npm run validate
git diff --check
```

## 2026-06-05 - regression fixture maintenance

1. Edge-case queue fixture
   - Added `tests/fixtures/edge-case-queue.json` with synthetic queue items for empty labels, missing `updated_at`, mixed review states, stale discussions, dependency-risk wording, and draft pull requests.
   - Kept all fixture data synthetic and avoided real repository URLs.

2. Regression assertions
   - Added core assertions for security detection without labels, dependency detection from titles, stale fallback behavior, release-blocker lane behavior, community follow-up routing, and draft dependency handling.
   - Added static checks so the fixture stays present and non-empty.

Verification for this round:

```bash
npm test
npm run validate
git diff --check
```

## 2026-06-05 - GitHub CLI import preset maintenance

1. CLI preset fixtures
   - Added synthetic fixtures for issues-only, pull-requests-only, and mixed `issues` plus `pullRequests` queue shapes.
   - Kept all fixture data on `example-org/example-repo` and avoided private repository names, customer data, and token-like strings.

2. Parser support
   - Added support for mixed preset objects that keep `issues` and `pullRequests` arrays separate.
   - Added regression assertions for GitHub CLI labels, assignees, review state, mergeability, draft state, and mixed queue routing.

3. Export recipe
   - Updated `docs/github-cli-export.md` with supported paste shapes, field notes, and fixture links for smaller preset examples.

Verification for this round:

```bash
npm test
npm run validate
git diff --check
```

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
