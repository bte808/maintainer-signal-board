import assert from "node:assert/strict";
import {
  SAMPLE_QUEUES,
  analyzeQueue,
  makeMaintainerBrief,
  parseQueueInput,
  sampleToText,
  toCsv
} from "../src/maintainer-core.js";

assert.equal(SAMPLE_QUEUES.length, 3, "three starter queues are available");
assert.equal(new Set(SAMPLE_QUEUES.map((queue) => queue.id)).size, SAMPLE_QUEUES.length);

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
assert.equal(objectAnalysis.items[0].lane, "Ready to merge");

assert.throws(() => parseQueueInput("{"), /Expected|JSON/);

console.log("core ok");
