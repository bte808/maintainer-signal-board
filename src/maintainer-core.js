const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const SAMPLE_QUEUES = [
  {
    id: "release-week",
    name: "Release week queue",
    capacityHours: 6,
    items: [
      {
        number: 128,
        type: "pull_request",
        title: "Fix migration rollback on empty config",
        labels: ["regression", "release-blocker"],
        createdAt: "2026-05-26T09:15:00Z",
        updatedAt: "2026-06-03T11:20:00Z",
        comments: 8,
        author: "contrib-alma",
        assignees: ["maintainer"],
        reviewDecision: "CHANGES_REQUESTED",
        mergeable: false,
        milestone: "v2.4"
      },
      {
        number: 129,
        type: "issue",
        title: "Security: token redaction misses multiline secrets",
        labels: ["security", "bug"],
        createdAt: "2026-06-01T16:00:00Z",
        updatedAt: "2026-06-04T02:40:00Z",
        comments: 5,
        author: "ops-kai",
        assignees: [],
        milestone: "v2.4"
      },
      {
        number: 130,
        type: "pull_request",
        title: "Document retry policy examples",
        labels: ["docs"],
        createdAt: "2026-05-30T12:30:00Z",
        updatedAt: "2026-06-03T07:30:00Z",
        comments: 2,
        author: "newcomer-lee",
        assignees: ["docs-owner"],
        reviewDecision: "REVIEW_REQUIRED",
        mergeable: true,
        milestone: "v2.4"
      },
      {
        number: 117,
        type: "issue",
        title: "Confusing empty-state message in import screen",
        labels: ["good first issue", "ux"],
        createdAt: "2026-05-12T10:00:00Z",
        updatedAt: "2026-05-13T09:00:00Z",
        comments: 1,
        author: "reader-juno",
        assignees: []
      },
      {
        number: 131,
        type: "pull_request",
        title: "Add fixture for Windows path normalization",
        labels: ["test"],
        createdAt: "2026-06-02T14:20:00Z",
        updatedAt: "2026-06-04T01:30:00Z",
        comments: 3,
        author: "contrib-min",
        assignees: ["maintainer"],
        reviewDecision: "APPROVED",
        mergeable: true,
        milestone: "v2.4"
      }
    ]
  },
  {
    id: "security-patch",
    name: "Security patch queue",
    capacityHours: 4,
    items: [
      {
        number: 41,
        type: "issue",
        title: "CVE-style report: unsafe archive path traversal",
        labels: ["security", "critical"],
        createdAt: "2026-06-03T18:00:00Z",
        updatedAt: "2026-06-04T05:20:00Z",
        comments: 6,
        author: "reporter",
        assignees: ["security-owner"],
        milestone: "patch"
      },
      {
        number: 44,
        type: "pull_request",
        title: "Harden archive extraction fixture",
        labels: ["security", "test"],
        createdAt: "2026-06-04T01:45:00Z",
        updatedAt: "2026-06-04T05:45:00Z",
        comments: 4,
        author: "maintainer",
        assignees: ["security-owner"],
        reviewDecision: "REVIEW_REQUIRED",
        mergeable: true,
        milestone: "patch"
      },
      {
        number: 39,
        type: "issue",
        title: "Release notes need upgrade guidance",
        labels: ["docs", "release"],
        createdAt: "2026-06-01T11:10:00Z",
        updatedAt: "2026-06-03T20:00:00Z",
        comments: 2,
        author: "maintainer",
        assignees: []
      }
    ]
  },
  {
    id: "community-backlog",
    name: "Community backlog",
    capacityHours: 8,
    items: [
      {
        number: 88,
        type: "issue",
        title: "Add example for pnpm workspaces",
        labels: ["enhancement", "good first issue"],
        createdAt: "2026-04-22T08:00:00Z",
        updatedAt: "2026-05-01T09:00:00Z",
        comments: 3,
        author: "contrib-nova",
        assignees: []
      },
      {
        number: 91,
        type: "pull_request",
        title: "Refactor import parser for quoted fields",
        labels: ["enhancement"],
        createdAt: "2026-05-06T13:00:00Z",
        updatedAt: "2026-05-18T14:15:00Z",
        comments: 14,
        author: "contrib-zed",
        assignees: [],
        reviewDecision: "REVIEW_REQUIRED",
        mergeable: null
      },
      {
        number: 98,
        type: "issue",
        title: "Feature request: release checklist export",
        labels: ["feature", "release"],
        createdAt: "2026-05-23T15:00:00Z",
        updatedAt: "2026-05-25T12:00:00Z",
        comments: 7,
        author: "release-user",
        assignees: ["maintainer"]
      },
      {
        number: 102,
        type: "pull_request",
        title: "Draft: replace color tokens",
        labels: ["design"],
        createdAt: "2026-05-28T10:00:00Z",
        updatedAt: "2026-05-28T11:30:00Z",
        comments: 1,
        author: "contrib-ivy",
        assignees: [],
        draft: true,
        reviewDecision: "REVIEW_REQUIRED",
        mergeable: false
      }
    ]
  }
];

export function parseQueueInput(raw) {
  const text = String(raw || "").trim();
  if (!text) return [];
  const parsed = JSON.parse(text);
  const source = Array.isArray(parsed) ? parsed : parsed.items || parsed.nodes || parsed.data || [];
  if (!Array.isArray(source)) {
    throw new Error("Expected a JSON array or an object with an items array.");
  }
  return source;
}

export function analyzeQueue(input = {}) {
  const now = input.now ? new Date(input.now) : new Date();
  const capacityHours = clampNumber(input.capacityHours, 6, 1, 80);
  const items = (input.items || []).map((item, index) => normalizeItem(item, index, now));
  const openItems = items.filter((item) => item.state !== "closed");
  const enriched = openItems.map(scoreItem).sort((a, b) => b.score - a.score || a.number - b.number);
  const lanes = buildLanes(enriched);
  const maintainerMinutes = enriched.reduce((total, item) => total + item.maintainerMinutes, 0);
  const topItems = enriched.slice(0, 5);
  const releaseBlockers = enriched.filter((item) => item.lane === "Release blockers");
  const securityItems = enriched.filter((item) => item.signals.includes("security"));
  const staleItems = enriched.filter((item) => item.signals.includes("stale"));
  const readyToMerge = enriched.filter((item) => item.lane === "Ready to merge");
  const capacityMinutes = capacityHours * 60;

  return {
    generatedAt: now.toISOString(),
    capacityHours,
    items: enriched,
    lanes,
    topItems,
    metrics: {
      totalOpen: enriched.length,
      p0: enriched.filter((item) => item.priority === "P0").length,
      p1: enriched.filter((item) => item.priority === "P1").length,
      releaseBlockers: releaseBlockers.length,
      security: securityItems.length,
      stale: staleItems.length,
      readyToMerge: readyToMerge.length,
      maintainerHours: roundMetric(maintainerMinutes / 60),
      capacityFit: maintainerMinutes <= capacityMinutes ? "fits" : "over capacity"
    },
    nextActions: buildNextActions(topItems, {
      releaseBlockers,
      securityItems,
      staleItems,
      readyToMerge,
      capacityMinutes,
      maintainerMinutes
    })
  };
}

export function makeMaintainerBrief(analysis) {
  const lines = [
    "# Maintainer signal brief",
    "",
    `Generated: ${analysis.generatedAt}`,
    `Open items: ${analysis.metrics.totalOpen}`,
    `Estimated maintainer load: ${analysis.metrics.maintainerHours}h (${analysis.metrics.capacityFit})`,
    `P0/P1: ${analysis.metrics.p0}/${analysis.metrics.p1}`,
    `Release blockers: ${analysis.metrics.releaseBlockers}`,
    `Security and quality items: ${analysis.metrics.security}`,
    "",
    "## Next actions"
  ];

  for (const action of analysis.nextActions) {
    lines.push(`- ${action}`);
  }

  lines.push("");
  lines.push("## Top queue");
  lines.push("");
  lines.push("| Priority | Item | Lane | Score | Why |");
  lines.push("| --- | --- | --- | ---: | --- |");

  for (const item of analysis.topItems) {
    lines.push(
      `| ${item.priority} | ${escapePipes(item.ref)} ${escapePipes(item.title)} | ${escapePipes(item.lane)} | ${
        item.score
      } | ${escapePipes(item.signals.join(", ") || "normal")} |`
    );
  }

  lines.push("");
  lines.push("## Lanes");

  for (const lane of analysis.lanes) {
    lines.push("");
    lines.push(`### ${lane.name}`);
    if (!lane.items.length) {
      lines.push("- Empty");
      continue;
    }
    for (const item of lane.items) {
      lines.push(`- ${item.priority} ${item.ref} ${item.title} (${item.maintainerMinutes}m)`);
    }
  }

  return lines.join("\n");
}

export function toCsv(analysis) {
  const rows = [
    ["priority", "ref", "type", "lane", "score", "maintainer_minutes", "age_days", "stale_days", "signals", "title"],
    ...analysis.items.map((item) => [
      item.priority,
      item.ref,
      item.type,
      item.lane,
      item.score,
      item.maintainerMinutes,
      item.ageDays,
      item.staleDays,
      item.signals.join("; "),
      item.title
    ])
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function sampleToText(sampleId) {
  const sample = SAMPLE_QUEUES.find((queue) => queue.id === sampleId) || SAMPLE_QUEUES[0];
  return JSON.stringify(sample.items, null, 2);
}

function normalizeItem(item, index, now) {
  const labels = normalizeLabels(item.labels || item.labelNames || item.tags || []);
  const type = normalizeType(item);
  const createdAt = parseDate(item.createdAt || item.created_at || item.created || item.createdDate, now);
  const updatedAt = parseDate(item.updatedAt || item.updated_at || item.updated || item.updatedDate, createdAt);
  const assignees = normalizePeople(item.assignees || item.assignee || []);
  const number = Number(item.number || item.id || index + 1);
  const state = String(item.state || "open").toLowerCase();

  return {
    number,
    ref: `${type === "pr" ? "PR" : "ISSUE"} #${number}`,
    type,
    state,
    title: String(item.title || item.name || `Untitled item ${index + 1}`).trim(),
    labels,
    labelText: labels.join(" "),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    ageDays: daysBetween(createdAt, now),
    staleDays: daysBetween(updatedAt, now),
    comments: clampNumber(item.comments ?? item.commentCount ?? item.commentsCount, 0, 0, 10000),
    author: normalizePerson(item.author || item.user || item.createdBy || ""),
    assignees,
    reviewDecision: String(item.reviewDecision || item.review_decision || "").toUpperCase(),
    mergeable: item.mergeable ?? null,
    draft: Boolean(item.draft || item.isDraft),
    milestone: normalizeMilestone(item.milestone)
  };
}

function scoreItem(item) {
  const signals = [];
  let score = 10;

  if (hasAny(item, ["security", "vulnerability", "cve", "critical"])) {
    score += 55;
    signals.push("security");
  }
  if (hasAny(item, ["release-blocker", "blocker", "regression", "release"])) {
    score += 35;
    signals.push("release blocker");
  }
  if (item.type === "pr" && !item.draft && item.reviewDecision !== "APPROVED") {
    score += 20;
    signals.push("needs review");
  }
  if (item.type === "pr" && !item.draft && (item.reviewDecision === "APPROVED" || item.mergeable === true)) {
    score += 14;
    signals.push("merge candidate");
  }
  if (!item.assignees.length) {
    score += 8;
    signals.push("needs owner");
  }
  if (item.comments >= 10) {
    score += 12;
    signals.push("discussion heavy");
  }
  if (item.staleDays >= 21) {
    score += 16;
    signals.push("stale");
  }
  if (item.ageDays >= 45) {
    score += 8;
    signals.push("old");
  }
  if (item.draft) {
    score -= 18;
    signals.push("draft");
  }

  const lane = chooseLane(item, signals);
  const priority = score >= 82 ? "P0" : score >= 56 ? "P1" : score >= 32 ? "P2" : "P3";
  const maintainerMinutes = estimateMinutes(item, priority, signals);

  return {
    ...item,
    signals,
    lane,
    priority,
    score: Math.max(0, Math.round(score)),
    maintainerMinutes
  };
}

function chooseLane(item, signals) {
  if (signals.includes("security")) return "Security and quality";
  if (signals.includes("release blocker") || item.milestone) return "Release blockers";
  if (item.type === "pr" && signals.includes("merge candidate")) return "Ready to merge";
  if (item.type === "pr" && signals.includes("needs review")) return "Needs review";
  if (signals.includes("stale") || signals.includes("discussion heavy")) return "Community follow-up";
  return "Backlog shaping";
}

function buildLanes(items) {
  const names = [
    "Security and quality",
    "Release blockers",
    "Needs review",
    "Ready to merge",
    "Community follow-up",
    "Backlog shaping"
  ];
  return names.map((name) => ({
    name,
    items: items.filter((item) => item.lane === name)
  }));
}

function buildNextActions(topItems, context) {
  const actions = [];
  if (context.securityItems.length) {
    actions.push(`Start with ${context.securityItems[0].ref}: security items should get a maintainer owner before normal backlog work.`);
  }
  if (context.releaseBlockers.length) {
    actions.push(`Cut the release lane down first: ${context.releaseBlockers.length} item(s) can block a clean release.`);
  }
  if (context.readyToMerge.length) {
    actions.push(`Merge or explicitly defer ${context.readyToMerge[0].ref}; approved work should not sit behind ambiguous backlog items.`);
  }
  if (context.maintainerMinutes > context.capacityMinutes) {
    actions.push("Declare a smaller review budget for today; the queue is over the stated maintainer capacity.");
  }
  if (context.staleItems.length) {
    actions.push(`Leave a short owner/status comment on ${context.staleItems[0].ref} to reduce stale community uncertainty.`);
  }
  if (!actions.length && topItems.length) {
    actions.push(`Review ${topItems[0].ref} first, then re-run the board after one maintainer decision.`);
  }
  return actions.slice(0, 5);
}

function estimateMinutes(item, priority, signals) {
  const priorityBase = { P0: 45, P1: 30, P2: 18, P3: 10 }[priority] || 10;
  const typeCost = item.type === "pr" ? 12 : 4;
  const discussionCost = Math.min(24, item.comments * 2);
  const securityCost = signals.includes("security") ? 15 : 0;
  const ownerDiscount = item.assignees.length ? -5 : 0;
  return Math.max(8, Math.round(priorityBase + typeCost + discussionCost + securityCost + ownerDiscount));
}

function hasAny(item, terms) {
  const haystack = `${item.title} ${item.labelText}`.toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

function normalizeLabels(labels) {
  if (!Array.isArray(labels)) return normalizeLabels([labels]);
  return labels
    .map((label) => {
      if (typeof label === "string") return label;
      return label?.name || label?.title || "";
    })
    .map((label) => String(label).trim().toLowerCase())
    .filter(Boolean);
}

function normalizeType(item) {
  const raw = String(item.type || item.kind || "").toLowerCase();
  if (raw.includes("pull") || raw === "pr") return "pr";
  if (item.pull_request || item.reviewDecision || item.isDraft || item.draft) return "pr";
  return "issue";
}

function normalizePeople(value) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.map(normalizePerson).filter(Boolean);
}

function normalizePerson(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.login || value.name || value.username || "";
}

function normalizeMilestone(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.title || value.name || "";
}

function parseDate(value, fallback) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
}

function daysBetween(start, end) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY));
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function roundMetric(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function escapePipes(value) {
  return String(value || "").replaceAll("|", "\\|");
}

function csvCell(value) {
  const text = String(value ?? "");
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}
