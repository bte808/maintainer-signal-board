import assert from "node:assert/strict";
import {
  DEFAULT_WEIGHTS,
  SAMPLE_QUEUES,
  analyzeQueue,
  makeMaintainerBrief,
  parseQueueInput,
  sampleToText,
  toCsv
} from "../src/maintainer-core.js";

assert.equal(SAMPLE_QUEUES.length, 4, "four starter queues are available");
assert.equal(new Set(SAMPLE_QUEUES.map((queue) => queue.id)).size, SAMPLE_QUEUES.length);
assert.equal(DEFAULT_WEIGHTS.dependencyRisk, 24);

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

assert.throws(() => parseQueueInput("{"), /Expected|JSON/);

console.log("core ok");
