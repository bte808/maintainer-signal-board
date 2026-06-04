const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_WEIGHTS = Object.freeze({
  security: 55,
  releaseBlocker: 35,
  dependencyRisk: 24,
  needsReview: 20,
  mergeCandidate: 14,
  needsOwner: 8,
  discussionHeavy: 12,
  stale: 16,
  old: 8,
  draftPenalty: -18
});

export const WEIGHT_PROFILES = Object.freeze({
  balanced: {
    name: "Balanced maintainer",
    weights: { ...DEFAULT_WEIGHTS }
  },
  release: {
    name: "Release cutdown",
    weights: {
      ...DEFAULT_WEIGHTS,
      releaseBlocker: 62,
      dependencyRisk: 30,
      needsReview: 16,
      stale: 10,
      draftPenalty: -30
    }
  },
  review: {
    name: "Review queue",
    weights: {
      ...DEFAULT_WEIGHTS,
      needsReview: 46,
      mergeCandidate: 32,
      discussionHeavy: 18,
      needsOwner: 14
    }
  },
  dependency: {
    name: "Dependency risk",
    weights: {
      ...DEFAULT_WEIGHTS,
      dependencyRisk: 70,
      security: 45,
      releaseBlocker: 28,
      stale: 20
    }
  },
  community: {
    name: "Community follow-up",
    weights: {
      ...DEFAULT_WEIGHTS,
      needsOwner: 28,
      discussionHeavy: 24,
      stale: 42,
      old: 16,
      releaseBlocker: 18
    }
  }
});

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
    id: "dependency-risk",
    name: "Dependency risk queue",
    capacityHours: 5,
    items: [
      {
        number: 203,
        type: "issue",
        title: "Dependency impact check for transitive markdown parser update",
        labels: ["dependencies", "supply-chain", "release"],
        createdAt: "2026-05-31T09:00:00Z",
        updatedAt: "2026-06-04T06:10:00Z",
        comments: 12,
        author: "release-user",
        assignees: [],
        milestone: "v2.5"
      },
      {
        number: 207,
        type: "pull_request",
        title: "Renovate: bump parser from 4.1.0 to 4.2.3",
        labels: ["dependencies", "renovate"],
        createdAt: "2026-06-02T13:30:00Z",
        updatedAt: "2026-06-04T04:20:00Z",
        comments: 3,
        author: "renovate",
        assignees: ["maintainer"],
        reviewDecision: "REVIEW_REQUIRED",
        mergeable: true,
        milestone: "v2.5"
      },
      {
        number: 211,
        type: "pull_request",
        title: "Update package-lock fixture after npm audit",
        labels: ["lockfile", "test"],
        createdAt: "2026-06-03T10:00:00Z",
        updatedAt: "2026-06-03T21:20:00Z",
        comments: 2,
        author: "contrib-sol",
        assignees: [],
        reviewDecision: "APPROVED",
        mergeable: true
      },
      {
        number: 199,
        type: "issue",
        title: "Document SBOM review checklist for releases",
        labels: ["docs", "sbom"],
        createdAt: "2026-05-18T07:00:00Z",
        updatedAt: "2026-05-19T07:10:00Z",
        comments: 1,
        author: "maintainer",
        assignees: ["docs-owner"]
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
  const source = extractQueueItems(parsed);
  if (!Array.isArray(source)) {
    throw new Error("Expected a JSON array or an object with an items array.");
  }
  return source;
}

function extractQueueItems(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.items)) return parsed.items;
  if (Array.isArray(parsed?.nodes)) return parsed.nodes;
  if (Array.isArray(parsed?.data?.nodes)) return parsed.data.nodes;
  if (Array.isArray(parsed?.data)) return parsed.data;

  const issues = Array.isArray(parsed?.issues) ? parsed.issues : [];
  const pullRequests = Array.isArray(parsed?.pullRequests)
    ? parsed.pullRequests
    : Array.isArray(parsed?.prs)
      ? parsed.prs
      : [];
  if (issues.length || pullRequests.length) {
    return [...issues, ...pullRequests];
  }

  return [];
}

export function analyzeQueue(input = {}) {
  const now = input.now ? new Date(input.now) : new Date();
  const capacityHours = clampNumber(input.capacityHours, 6, 1, 80);
  const weights = normalizeWeights(input.weights);
  const items = (input.items || []).map((item, index) => normalizeItem(item, index, now));
  const openItems = items.filter((item) => item.state !== "closed");
  const enriched = openItems.map((item) => scoreItem(item, weights)).sort((a, b) => b.score - a.score || a.number - b.number);
  const lanes = buildLanes(enriched);
  const maintainerMinutes = enriched.reduce((total, item) => total + item.maintainerMinutes, 0);
  const topItems = enriched.slice(0, 5);
  const releaseBlockers = enriched.filter((item) => item.lane === "Release blockers");
  const securityItems = enriched.filter((item) => item.signals.includes("security"));
  const dependencyItems = enriched.filter((item) => item.signals.includes("dependency risk"));
  const staleItems = enriched.filter((item) => item.signals.includes("stale"));
  const readyToMerge = enriched.filter((item) => item.lane === "Ready to merge");
  const capacityMinutes = capacityHours * 60;

  return {
    generatedAt: now.toISOString(),
    capacityHours,
    weights,
    items: enriched,
    lanes,
    topItems,
    metrics: {
      totalOpen: enriched.length,
      p0: enriched.filter((item) => item.priority === "P0").length,
      p1: enriched.filter((item) => item.priority === "P1").length,
      releaseBlockers: releaseBlockers.length,
      security: securityItems.length,
      dependencyRisk: dependencyItems.length,
      stale: staleItems.length,
      readyToMerge: readyToMerge.length,
      maintainerHours: roundMetric(maintainerMinutes / 60),
      capacityFit: maintainerMinutes <= capacityMinutes ? "fits" : "over capacity"
    },
    nextActions: buildNextActions(topItems, {
      releaseBlockers,
      securityItems,
      dependencyItems,
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
    `Dependency risk items: ${analysis.metrics.dependencyRisk}`,
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
  const labels = normalizeLabels(item.labels ?? item.labelNames ?? item.tags ?? []);
  const type = normalizeType(item);
  const createdAt = parseDate(item.createdAt || item.created_at || item.created || item.createdDate, now);
  const updatedAt = parseDate(item.updatedAt || item.updated_at || item.updated || item.updatedDate, createdAt);
  const assignees = normalizePeople(item.assignees ?? item.assignee ?? []);
  const number = Number(item.number ?? item.issueNumber ?? item.pullRequestNumber ?? item.id ?? index + 1);
  const state = String(item.state || "open").toLowerCase();
  const repository = normalizeRepository(item.repository || item.repositoryName || item.repo || "");
  const prefix = type === "pr" ? "PR" : "ISSUE";

  return {
    number,
    ref: repository ? `${prefix} ${repository}#${number}` : `${prefix} #${number}`,
    type,
    state,
    title: String(item.title || item.name || `Untitled item ${index + 1}`).trim(),
    labels,
    labelText: labels.join(" "),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    ageDays: daysBetween(createdAt, now),
    staleDays: daysBetween(updatedAt, now),
    comments: clampNumber(countValue(item.comments ?? item.commentCount ?? item.commentsCount), 0, 0, 10000),
    author: normalizePerson(item.author || item.user || item.createdBy || ""),
    assignees,
    reviewDecision: String(item.reviewDecision || item.review_decision || "").toUpperCase(),
    mergeable: item.mergeable ?? null,
    draft: normalizeBoolean(item.draft ?? item.isDraft),
    repository,
    milestone: normalizeMilestone(item.milestone)
  };
}

function scoreItem(item, weights) {
  const signals = [];
  let score = 10;

  if (hasAny(item, ["security", "vulnerability", "cve", "critical"])) {
    score += weights.security;
    signals.push("security");
  }
  if (hasAny(item, ["release-blocker", "blocker", "regression", "release"])) {
    score += weights.releaseBlocker;
    signals.push("release blocker");
  }
  if (hasDependencyRisk(item)) {
    score += weights.dependencyRisk;
    signals.push("dependency risk");
  }
  if (item.type === "pr" && !item.draft && item.reviewDecision !== "APPROVED") {
    score += weights.needsReview;
    signals.push("needs review");
  }
  if (item.type === "pr" && !item.draft && (item.reviewDecision === "APPROVED" || item.mergeable === true)) {
    score += weights.mergeCandidate;
    signals.push("merge candidate");
  }
  if (!item.assignees.length) {
    score += weights.needsOwner;
    signals.push("needs owner");
  }
  if (item.comments >= 10) {
    score += weights.discussionHeavy;
    signals.push("discussion heavy");
  }
  if (item.staleDays >= 21) {
    score += weights.stale;
    signals.push("stale");
  }
  if (item.ageDays >= 45) {
    score += weights.old;
    signals.push("old");
  }
  if (item.draft) {
    score += weights.draftPenalty;
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
  if (signals.includes("dependency risk")) return "Dependency risk";
  if (signals.includes("release blocker") || item.milestone) return "Release blockers";
  if (item.type === "pr" && signals.includes("merge candidate")) return "Ready to merge";
  if (item.type === "pr" && signals.includes("needs review")) return "Needs review";
  if (signals.includes("stale") || signals.includes("discussion heavy")) return "Community follow-up";
  return "Backlog shaping";
}

function buildLanes(items) {
  const names = [
    "Security and quality",
    "Dependency risk",
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
  if (context.dependencyItems.length) {
    actions.push(`Review ${context.dependencyItems[0].ref} for lockfile, transitive, and release impact before treating it as routine backlog.`);
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
  const dependencyCost = signals.includes("dependency risk") ? 10 : 0;
  const ownerDiscount = item.assignees.length ? -5 : 0;
  return Math.max(8, Math.round(priorityBase + typeCost + discussionCost + securityCost + dependencyCost + ownerDiscount));
}

function hasAny(item, terms) {
  const haystack = `${item.title} ${item.labelText}`.toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

function hasDependencyRisk(item) {
  return hasAny(item, [
    "dependency",
    "dependencies",
    "dependabot",
    "renovate",
    "supply-chain",
    "supply chain",
    "lockfile",
    "package-lock",
    "pnpm-lock",
    "yarn.lock",
    "npm audit",
    "transitive",
    "sbom"
  ]);
}

function normalizeWeights(input = {}) {
  const weights = { ...DEFAULT_WEIGHTS };
  if (!input || typeof input !== "object") return weights;
  for (const key of Object.keys(DEFAULT_WEIGHTS)) {
    const value = Number(input[key]);
    if (Number.isFinite(value)) {
      const min = key === "draftPenalty" ? -100 : 0;
      const max = key === "draftPenalty" ? 0 : 120;
      weights[key] = clampNumber(value, DEFAULT_WEIGHTS[key], min, max);
    }
  }
  return weights;
}

function normalizeLabels(labels) {
  if (labels?.nodes) return normalizeLabels(labels.nodes);
  if (labels?.edges) return normalizeLabels(labels.edges.map((edge) => edge.node || edge));
  if (typeof labels === "string" && labels.includes(",")) return normalizeLabels(labels.split(","));
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
  const url = String(item.url || item.htmlUrl || item.html_url || "").toLowerCase();
  if (url.includes("/pull/")) return "pr";
  if (item.pull_request || item.pullRequest || item.reviewDecision || item.isDraft || item.draft) return "pr";
  return "issue";
}

function normalizePeople(value) {
  if (value?.nodes) return normalizePeople(value.nodes);
  if (value?.edges) return normalizePeople(value.edges.map((edge) => edge.node || edge));
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

function normalizeRepository(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.nameWithOwner || value.fullName || value.full_name || value.name || "";
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

function countValue(value) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") return value.totalCount ?? value.count ?? value.length;
  return value;
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
