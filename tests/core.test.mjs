import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_WEIGHTS,
  SAMPLE_QUEUES,
  WEIGHT_PROFILES,
  analyzeQueue,
  makeMaintainerBrief,
  parseQueueInput,
  sampleToText,
  toCsv
} from "../src/maintainer-core.js";

const edgeCaseFixture = JSON.parse(await readFile("tests/fixtures/edge-case-queue.json", "utf8"));
const githubCliIssuesFixture = JSON.parse(await readFile("tests/fixtures/github-cli-issues.json", "utf8"));
const githubCliPullRequestsFixture = JSON.parse(await readFile("tests/fixtures/github-cli-pull-requests.json", "utf8"));
const githubCliMixedFixture = JSON.parse(await readFile("tests/fixtures/github-cli-mixed-queue.json", "utf8"));
const githubSearchPrsFixture = JSON.parse(await readFile("tests/fixtures/github-search-prs.json", "utf8"));
const githubSearchIssuesFixture = JSON.parse(await readFile("tests/fixtures/github-search-issues.json", "utf8"));
const githubRestSearchIssuesFixture = JSON.parse(await readFile("tests/fixtures/github-rest-search-issues.json", "utf8"));

assert.equal(SAMPLE_QUEUES.length, 7, "four starter queues plus three drill queues are available");
assert.equal(new Set(SAMPLE_QUEUES.map((queue) => queue.id)).size, SAMPLE_QUEUES.length);
for (const sampleId of ["release-candidate-drill", "security-hardening-drill", "dependency-review-drill"]) {
  assert.ok(SAMPLE_QUEUES.some((queue) => queue.id === sampleId), `${sampleId} is available`);
}
assert.equal(DEFAULT_WEIGHTS.dependencyRisk, 24);
assert.ok(Object.keys(WEIGHT_PROFILES).length >= 5, "maintainer scoring profiles are available");
assert.equal(WEIGHT_PROFILES.dependency.weights.dependencyRisk, 70);

const releaseItems = parseQueueInput(sampleToText("release-week"));
const releaseAnalysis = analyzeQueue({
  items: releaseItems,
  capacityHours: 6,
  now: "2026-06-04T12:00:00Z"
});

assert.equal(releaseAnalysis.metrics.totalOpen, 5);
assert.ok(releaseAnalysis.metrics.releaseBlockers >= 2, "release blockers are detected");
assert.ok(releaseAnalysis.metrics.security >= 1, "security lane is detected");
assert.ok(releaseAnalysis.metrics.maintainerHours > 0, "maintainer load is estimated");
assert.ok(["P0", "P1"].includes(releaseAnalysis.topItems[0].priority), "highest item is urgent");
assert.ok(releaseAnalysis.lanes.some((lane) => lane.name === "Security and quality" && lane.items.length));

const brief = makeMaintainerBrief(releaseAnalysis);
assert.ok(brief.includes("# Maintainer signal brief"));
assert.ok(brief.includes("## Next actions"));
assert.ok(brief.includes("Security and quality"));
assert.ok(brief.includes("PR #128") || brief.includes("ISSUE #129"));

const csv = toCsv(releaseAnalysis);
assert.ok(csv.startsWith("priority,ref,type,lane"));
assert.ok(csv.includes("release blocker"));

const community = analyzeQueue({
  items: parseQueueInput(sampleToText("community-backlog")),
  capacityHours: 2,
  now: "2026-06-04T12:00:00Z"
});
assert.equal(community.metrics.capacityFit, "over capacity");
assert.ok(community.items.some((item) => item.signals.includes("stale")));
assert.ok(community.nextActions.some((action) => action.includes("capacity")));

const securityPatch = analyzeQueue({
  items: parseQueueInput(sampleToText("security-patch")),
  capacityHours: 4,
  now: "2026-06-04T12:00:00Z"
});
assert.ok(securityPatch.items.some((item) => item.priority === "P0"));

const dependencyRisk = analyzeQueue({
  items: parseQueueInput(sampleToText("dependency-risk")),
  capacityHours: 5,
  now: "2026-06-04T12:00:00Z"
});
assert.ok(dependencyRisk.metrics.dependencyRisk >= 3, "dependency-risk signals are counted");
assert.ok(dependencyRisk.lanes.some((lane) => lane.name === "Dependency risk" && lane.items.length >= 3));
assert.ok(dependencyRisk.nextActions.some((action) => action.includes("lockfile")));
assert.ok(makeMaintainerBrief(dependencyRisk).includes("Dependency risk items"));

const drillSampleIds = ["release-candidate-drill", "security-hardening-drill", "dependency-review-drill"];
for (const sampleId of drillSampleIds) {
  const sample = SAMPLE_QUEUES.find((queue) => queue.id === sampleId);
  assert.ok(sample, `${sampleId} exists`);
  assert.ok(sample.items.length >= 4, `${sampleId} has enough synthetic queue items`);
  assert.ok(
    sample.items.every((item) => item.repository === "example-org/example-repo"),
    `${sampleId} uses neutral synthetic repository names`
  );
  assert.ok(!/(private-org|private-repo|customer|github_pat_|gho_)/i.test(JSON.stringify(sample)), `${sampleId} avoids private data`);
}

const releaseCandidateDrill = analyzeQueue({
  items: parseQueueInput(sampleToText("release-candidate-drill")),
  capacityHours: 7,
  now: "2026-06-04T12:00:00Z"
});
const releaseCandidateLanes = new Set(
  releaseCandidateDrill.lanes.filter((lane) => lane.items.length > 0).map((lane) => lane.name)
);
assert.deepEqual(
  [...releaseCandidateLanes].sort(),
  [
    "Backlog shaping",
    "Community follow-up",
    "Dependency risk",
    "Needs review",
    "Ready to merge",
    "Release blockers",
    "Security and quality"
  ].sort(),
  "release candidate drill covers every maintainer lane"
);
assert.equal(releaseCandidateDrill.metrics.totalOpen, 7);
assert.ok(releaseCandidateDrill.metrics.releaseBlockers >= 1);
assert.ok(releaseCandidateDrill.metrics.security >= 1);
assert.ok(releaseCandidateDrill.metrics.dependencyRisk >= 1);
assert.ok(makeMaintainerBrief(releaseCandidateDrill).includes("PR example-org/example-repo#305"));

const securityHardeningDrill = analyzeQueue({
  items: parseQueueInput(sampleToText("security-hardening-drill")),
  capacityHours: 5,
  now: "2026-06-04T12:00:00Z"
});
assert.ok(securityHardeningDrill.metrics.security >= 2, "security drill keeps non-emergency hardening visible");
assert.ok(securityHardeningDrill.items.some((item) => item.title.includes("local-first")));
assert.ok(securityHardeningDrill.items.some((item) => item.lane === "Community follow-up"));

const dependencyReviewDrill = analyzeQueue({
  items: parseQueueInput(sampleToText("dependency-review-drill")),
  capacityHours: 5,
  now: "2026-06-04T12:00:00Z"
});
assert.ok(dependencyReviewDrill.metrics.dependencyRisk >= 4, "dependency drill covers all dependency review shapes");
assert.ok(dependencyReviewDrill.items.some((item) => item.signals.includes("stale")));
assert.ok(dependencyReviewDrill.items.some((item) => item.signals.includes("draft")));

const weightedAnalysis = analyzeQueue({
  items: [
    {
      number: 201,
      type: "issue",
      title: "Renovate dependency update needs release review",
      labels: ["dependencies"],
      createdAt: "2026-06-02T00:00:00Z",
      updatedAt: "2026-06-04T00:00:00Z"
    },
    {
      number: 202,
      type: "issue",
      title: "Release blocker without dependency impact",
      labels: ["release-blocker"],
      createdAt: "2026-06-02T00:00:00Z",
      updatedAt: "2026-06-04T00:00:00Z",
      assignees: ["maintainer"]
    }
  ],
  capacityHours: 1,
  weights: {
    dependencyRisk: 80,
    releaseBlocker: 0
  },
  now: "2026-06-04T12:00:00Z"
});
assert.equal(weightedAnalysis.topItems[0].ref, "ISSUE #201", "custom weights can change queue priority");

const clampedWeights = analyzeQueue({
  items: [],
  weights: {
    dependencyRisk: 999,
    stale: "not a number",
    draftPenalty: 22
  }
}).weights;
assert.equal(clampedWeights.dependencyRisk, 120);
assert.equal(clampedWeights.stale, DEFAULT_WEIGHTS.stale);
assert.equal(clampedWeights.draftPenalty, 0);

const draftPenaltyAnalysis = analyzeQueue({
  items: [
    {
      number: 301,
      type: "pull_request",
      title: "Draft dependency experiment",
      labels: ["dependencies"],
      draft: true,
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-04T00:00:00Z"
    }
  ],
  weights: {
    draftPenalty: -60
  },
  now: "2026-06-04T12:00:00Z"
});
assert.ok(draftPenaltyAnalysis.items[0].signals.includes("draft"));
assert.ok(draftPenaltyAnalysis.items[0].score < 30, "negative draft penalty suppresses draft work");

const profileAnalysis = analyzeQueue({
  items: [
    {
      number: 401,
      type: "issue",
      title: "Release blocker missing migration note",
      labels: ["release-blocker"],
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-04T00:00:00Z"
    },
    {
      number: 402,
      type: "issue",
      title: "Renovate lockfile update",
      labels: ["dependencies"],
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-04T00:00:00Z"
    }
  ],
  weights: WEIGHT_PROFILES.dependency.weights,
  now: "2026-06-04T12:00:00Z"
});
assert.equal(profileAnalysis.topItems[0].ref, "ISSUE #402", "dependency profile can favor dependency queues");

const graphQlInput = parseQueueInput(
  JSON.stringify({
    data: {
      nodes: [
        {
          number: 501,
          url: "https://github.com/example-org/example-repo/pull/501",
          title: "Renovate dependency lockfile update",
          labels: { nodes: [{ name: "dependencies" }, { name: "lockfile" }] },
          assignees: { nodes: [{ login: "maintainer-a" }] },
          comments: { totalCount: 12 },
          repository: { nameWithOwner: "example-org/example-repo" },
          createdAt: "2026-06-01T00:00:00Z",
          updatedAt: "2026-06-04T00:00:00Z",
          isDraft: "false",
          reviewDecision: "REVIEW_REQUIRED"
        }
      ]
    }
  })
);
const graphQlAnalysis = analyzeQueue({
  items: graphQlInput,
  now: "2026-06-04T12:00:00Z"
});
assert.equal(graphQlAnalysis.items[0].type, "pr");
assert.equal(graphQlAnalysis.items[0].ref, "PR example-org/example-repo#501");
assert.equal(graphQlAnalysis.items[0].comments, 12);
assert.ok(graphQlAnalysis.items[0].signals.includes("dependency risk"));

const objectInput = parseQueueInput(
  JSON.stringify({
    items: [
      {
        id: 7,
        type: "pull_request",
        title: "Approved dependency patch",
        labels: ["dependencies"],
        created_at: "2026-06-01T00:00:00Z",
        updated_at: "2026-06-03T00:00:00Z",
        review_decision: "APPROVED",
        mergeable: true
      }
    ]
  })
);
const objectAnalysis = analyzeQueue({
  items: objectInput,
  capacityHours: 1,
  now: "2026-06-04T12:00:00Z"
});
assert.equal(objectAnalysis.items[0].lane, "Dependency risk");
assert.ok(objectAnalysis.items[0].signals.includes("dependency risk"));

const edgeCaseItems = parseQueueInput(JSON.stringify(edgeCaseFixture));
const edgeCaseAnalysis = analyzeQueue({
  items: edgeCaseItems,
  capacityHours: 3,
  now: "2026-06-04T12:00:00Z"
});

assert.equal(edgeCaseAnalysis.metrics.totalOpen, 5, "edge-case fixture keeps all synthetic items open");
assert.equal(edgeCaseAnalysis.metrics.security, 1, "empty-label security wording is detected");
assert.equal(edgeCaseAnalysis.metrics.dependencyRisk, 2, "dependency wording works without labels");
assert.equal(edgeCaseAnalysis.metrics.stale, 2, "missing updated_at falls back to created_at for stale checks");
assert.equal(edgeCaseAnalysis.metrics.capacityFit, "over capacity", "edge-case queue exceeds a small capacity budget");

const securityEdge = edgeCaseAnalysis.items.find((item) => item.number === 601);
assert.equal(securityEdge.lane, "Security and quality");
assert.ok(securityEdge.signals.includes("security"));
assert.ok(securityEdge.signals.includes("needs owner"));

const missingUpdatedAt = edgeCaseAnalysis.items.find((item) => item.number === 602);
assert.equal(missingUpdatedAt.lane, "Dependency risk");
assert.ok(missingUpdatedAt.staleDays >= 21, "missing updated_at should not hide stale dependency work");
assert.ok(missingUpdatedAt.signals.includes("needs review"));

const approvedRelease = edgeCaseAnalysis.items.find((item) => item.number === 603);
assert.equal(approvedRelease.lane, "Release blockers");
assert.ok(approvedRelease.signals.includes("merge candidate"));

const staleDiscussion = edgeCaseAnalysis.items.find((item) => item.number === 604);
assert.equal(staleDiscussion.lane, "Community follow-up");
assert.ok(staleDiscussion.signals.includes("discussion heavy"));
assert.ok(staleDiscussion.signals.includes("old"));

const draftDependency = edgeCaseAnalysis.items.find((item) => item.number === 605);
assert.equal(draftDependency.lane, "Dependency risk");
assert.ok(draftDependency.signals.includes("draft"));
assert.ok(!draftDependency.signals.includes("needs review"), "draft dependency spikes should not enter review queue");

assert.ok(makeMaintainerBrief(edgeCaseAnalysis).includes("ISSUE #601"));
assert.ok(toCsv(edgeCaseAnalysis).includes("dependency risk"));

const githubCliIssuesAnalysis = analyzeQueue({
  items: parseQueueInput(JSON.stringify(githubCliIssuesFixture)),
  capacityHours: 3,
  now: "2026-06-04T12:00:00Z"
});
assert.equal(githubCliIssuesAnalysis.metrics.totalOpen, 2);
assert.equal(githubCliIssuesAnalysis.metrics.security, 1, "gh issue list labels are normalized");
assert.equal(githubCliIssuesAnalysis.metrics.releaseBlockers, 1, "gh issue list milestones and labels are normalized");
assert.equal(githubCliIssuesAnalysis.items.find((item) => item.number === 701).ref, "ISSUE #701");

const githubCliPrAnalysis = analyzeQueue({
  items: parseQueueInput(JSON.stringify(githubCliPullRequestsFixture)),
  capacityHours: 3,
  now: "2026-06-04T12:00:00Z"
});
assert.equal(githubCliPrAnalysis.metrics.totalOpen, 2);
assert.equal(githubCliPrAnalysis.metrics.dependencyRisk, 1, "gh pr list dependency labels are normalized");
assert.equal(githubCliPrAnalysis.metrics.readyToMerge, 1, "gh pr list mergeable/review state is normalized");
assert.equal(githubCliPrAnalysis.items.find((item) => item.number === 801).type, "pr");
assert.ok(githubCliPrAnalysis.items.find((item) => item.number === 801).signals.includes("merge candidate"));
assert.equal(githubCliPrAnalysis.items.find((item) => item.number === 802).lane, "Ready to merge");

const githubCliMixedAnalysis = analyzeQueue({
  items: parseQueueInput(JSON.stringify(githubCliMixedFixture)),
  capacityHours: 1,
  now: "2026-06-04T12:00:00Z"
});
assert.equal(githubCliMixedAnalysis.metrics.totalOpen, 2, "issues/pullRequests wrapper is supported");
assert.equal(githubCliMixedAnalysis.items.find((item) => item.number === 901).lane, "Community follow-up");
const mixedDraft = githubCliMixedAnalysis.items.find((item) => item.number === 902);
assert.equal(mixedDraft.type, "pr");
assert.ok(mixedDraft.signals.includes("dependency risk"));
assert.ok(mixedDraft.signals.includes("draft"));

const githubSearchPrsAnalysis = analyzeQueue({
  items: parseQueueInput(JSON.stringify(githubSearchPrsFixture)),
  capacityHours: 1,
  now: "2026-06-04T12:00:00Z"
});
assert.equal(githubSearchPrsAnalysis.metrics.totalOpen, 1, "merged gh search PR rows are not treated as open queue work");
assert.equal(githubSearchPrsAnalysis.items[0].ref, "PR example-org/example-repo#1001");
assert.equal(githubSearchPrsAnalysis.items[0].type, "pr");
assert.ok(githubSearchPrsAnalysis.items[0].signals.includes("needs review"));

const githubSearchIssuesAnalysis = analyzeQueue({
  items: parseQueueInput(JSON.stringify(githubSearchIssuesFixture)),
  capacityHours: 1,
  now: "2026-06-04T12:00:00Z"
});
assert.equal(githubSearchIssuesAnalysis.metrics.totalOpen, 1, "closed gh search issue rows are not treated as open queue work");
assert.equal(githubSearchIssuesAnalysis.items[0].ref, "ISSUE example-org/example-repo#1101");
assert.equal(githubSearchIssuesAnalysis.items[0].type, "issue");
assert.equal(githubSearchIssuesAnalysis.items[0].lane, "Community follow-up");
assert.ok(githubSearchIssuesAnalysis.items[0].signals.includes("discussion heavy"));
assert.ok(githubSearchIssuesAnalysis.items[0].signals.includes("stale"));

const githubRestSearchIssuesAnalysis = analyzeQueue({
  items: parseQueueInput(JSON.stringify(githubRestSearchIssuesFixture)),
  capacityHours: 1,
  now: "2026-06-04T12:00:00Z"
});
assert.equal(githubRestSearchIssuesAnalysis.metrics.totalOpen, 1, "closed REST search rows are not treated as open queue work");
assert.equal(githubRestSearchIssuesAnalysis.items[0].ref, "ISSUE example-org/example-repo#1201");
assert.equal(githubRestSearchIssuesAnalysis.items[0].lane, "Release blockers");
assert.ok(githubRestSearchIssuesAnalysis.items[0].signals.includes("release blocker"));

assert.throws(() => parseQueueInput("{"), /Expected|JSON/);

console.log("core ok");
