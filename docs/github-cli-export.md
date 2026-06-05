# GitHub CLI Export Recipe

This recipe helps maintainers create sanitized JSON for Maintainer Signal Board. The board runs locally in the browser, but exported examples can still expose private project details if they are copied into public issues, demos, or screenshots.

Do not export secrets, tokens, private repository names, customer names, private organization names, private URLs, unreleased vulnerability details, or any data that should not become public.

## Requirements

- GitHub CLI authenticated with access to the repository.
- `jq` for shaping and sanitizing JSON.
- A repository name in `OWNER/REPO` form.

```bash
gh auth status
jq --version
```

## Supported Paste Shapes

The board accepts these JSON shapes:

- An issues-only array from `gh issue list --json ...`.
- A pull-requests-only array from `gh pr list --json ...`.
- A normalized object with an `items` array.
- A mixed preset object with `issues` and `pullRequests` arrays.
- GraphQL-style objects with `data.nodes`.
- Search-result arrays from `gh search prs --json ...`.

Synthetic examples are available in:

- `tests/fixtures/github-cli-issues.json`
- `tests/fixtures/github-cli-pull-requests.json`
- `tests/fixtures/github-cli-mixed-queue.json`
- `tests/fixtures/github-search-prs.json`

## Issues

Export open issues with only the fields used by the board:

```bash
REPO="OWNER/REPO"

gh issue list \
  --repo "$REPO" \
  --state open \
  --limit 100 \
  --json number,title,labels,createdAt,updatedAt,comments,author,assignees,milestone,state \
  | jq '[.[] | {
      number,
      type: "issue",
      title,
      labels: [.labels[].name],
      createdAt,
      updatedAt,
      comments,
      author: .author.login,
      assignees: [.assignees[].login],
      milestone: (.milestone.title // ""),
      state
    }]'
```

## Pull Requests

Export open pull requests with review and merge signals:

```bash
REPO="OWNER/REPO"

gh pr list \
  --repo "$REPO" \
  --state open \
  --limit 100 \
  --json number,title,labels,createdAt,updatedAt,comments,author,assignees,reviewDecision,mergeable,isDraft,milestone,state \
  | jq '[.[] | {
      number,
      type: "pull_request",
      title,
      labels: [.labels[].name],
      createdAt,
      updatedAt,
      comments,
      author: .author.login,
      assignees: [.assignees[].login],
      reviewDecision,
      mergeable,
      draft: isDraft,
      milestone: (.milestone.title // ""),
      state
    }]'
```

## Combined Queue

Write both exports to files, then merge them:

```bash
jq -s '{ items: (.[0] + .[1]) }' issues.json prs.json > maintainer-queue.json
```

You can also keep the two queues separate in a mixed preset object:

```bash
jq -n \
  --slurpfile issues issues.json \
  --slurpfile pullRequests prs.json \
  '{ issues: $issues[0], pullRequests: $pullRequests[0] }' \
  > maintainer-queue.mixed.json
```

Open the board, paste `maintainer-queue.json`, and run the analysis.

To test the shape before exporting a real repository queue, paste `examples/sanitized-maintainer-queue.json` into the board. It uses neutral `example-org/example-repo` data and exercises GraphQL-shaped labels, assignees, comment counts, and repository metadata.

Use the `tests/fixtures/github-cli-*.json` files when you want smaller examples for the three common CLI preset shapes.

## Search Results

For cross-repository review sweeps, export open search results with only public fields:

```bash
gh search prs \
  --author "@me" \
  --state open \
  --limit 100 \
  --json number,title,url,repository,updatedAt,state,isDraft \
  > search-prs.json
```

Merged rows from broader searches are treated as closed queue work, so they will not inflate the open maintainer load.

## Field Notes

The board reads these fields when they are present:

- Required: `number` or `id`, plus `title` or `name`.
- Helpful for routing: `url`, `type`, `labels`, `repository`, `reviewDecision`, `review_decision`, `mergeable`, `isDraft`, `draft`, `state`, and `milestone`.
- Helpful for load estimates: `comments`, `createdAt`, `created_at`, `updatedAt`, `updated_at`, `assignees`, and `author`.
- Ignored safely: color, label descriptions, avatar URLs, node IDs, and other GitHub metadata that the board does not score.

## Sanitizing Public Examples

Before sharing a queue publicly, replace project-specific words with neutral names:

```bash
jq 'walk(
  if type == "string" then
    gsub("real-customer-name"; "example-customer")
    | gsub("private-org"; "example-org")
    | gsub("private-repo"; "example-repo")
  else
    .
  end
)' maintainer-queue.json > maintainer-queue.sanitized.json
```

Review the sanitized file manually before publishing it. The board uses title and label heuristics for scoring, so keep generic words such as `security`, `release-blocker`, `dependencies`, `renovate`, `lockfile`, `stale`, and `review` when they are part of the synthetic scenario.

## Dependency-Risk Notes

The dependency-risk lane is a maintainer triage heuristic. It looks for visible title or label words such as `dependencies`, `dependabot`, `renovate`, `lockfile`, `npm audit`, `transitive`, and `sbom`. It is not a vulnerability scanner, package auditor, SBOM generator, or security validation tool.
