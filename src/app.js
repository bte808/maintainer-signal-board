import {
  DEFAULT_WEIGHTS,
  SAMPLE_QUEUES,
  analyzeQueue,
  makeMaintainerBrief,
  parseQueueInput,
  sampleToText,
  toCsv
} from "./maintainer-core.js";

const STORAGE_KEY = "maintainer-signal-board-v1";
const LOG_KEY = "maintainer-signal-board-log-v1";
const WEIGHT_FIELDS = [
  { key: "security", label: "Security", min: 0, max: 100 },
  { key: "releaseBlocker", label: "Release blocker", min: 0, max: 100 },
  { key: "dependencyRisk", label: "Dependency risk", min: 0, max: 100 },
  { key: "needsReview", label: "Needs review", min: 0, max: 80 },
  { key: "mergeCandidate", label: "Merge candidate", min: 0, max: 60 },
  { key: "needsOwner", label: "Needs owner", min: 0, max: 50 },
  { key: "discussionHeavy", label: "Discussion heavy", min: 0, max: 50 },
  { key: "stale", label: "Stale", min: 0, max: 60 },
  { key: "draftPenalty", label: "Draft penalty", min: -80, max: 0 }
];

const state = loadState();
let latestAnalysis = null;

const elements = {
  sample: document.querySelector("[data-testid='sample-select']"),
  loadSample: document.querySelector("[data-testid='load-sample']"),
  capacity: document.querySelector("[data-testid='capacity-hours']"),
  weights: document.querySelector("[data-testid='scoring-weights']"),
  resetWeights: document.querySelector("[data-testid='reset-weights']"),
  input: document.querySelector("[data-testid='queue-input']"),
  analyze: document.querySelector("[data-testid='analyze']"),
  copyBrief: document.querySelector("[data-testid='copy-brief']"),
  downloadCsv: document.querySelector("[data-testid='download-csv']"),
  downloadJson: document.querySelector("[data-testid='download-json']"),
  summary: document.querySelector("[data-testid='summary']"),
  actions: document.querySelector("[data-testid='next-actions']"),
  lanes: document.querySelector("[data-testid='lanes']"),
  brief: document.querySelector("[data-testid='brief-output']"),
  log: document.querySelector("[data-testid='evidence-log']"),
  addLog: document.querySelector("[data-testid='add-log']"),
  clearLog: document.querySelector("[data-testid='clear-log']"),
  status: document.querySelector("[data-testid='status']")
};

bindControls();
renderInitial();

function bindControls() {
  elements.sample.addEventListener("change", () => {
    state.sampleId = elements.sample.value;
    saveState();
  });

  elements.loadSample.addEventListener("click", () => {
    state.sampleId = elements.sample.value;
    state.queueText = sampleToText(state.sampleId);
    elements.input.value = state.queueText;
    saveState();
    runAnalysis("Sample loaded");
  });

  elements.capacity.addEventListener("input", () => {
    state.capacityHours = elements.capacity.value;
    saveState();
    runAnalysis("Capacity updated");
  });

  elements.weights.addEventListener("input", (event) => {
    const key = event.target.dataset.weightKey;
    if (!key) return;
    state.weights[key] = Number(event.target.value);
    saveState();
    runAnalysis("Weights updated");
  });

  elements.resetWeights.addEventListener("click", () => {
    state.weights = { ...DEFAULT_WEIGHTS };
    renderWeightControls();
    saveState();
    runAnalysis("Weights reset");
  });

  elements.input.addEventListener("input", () => {
    state.queueText = elements.input.value;
    saveState();
  });

  elements.analyze.addEventListener("click", () => runAnalysis("Queue analyzed"));
  elements.copyBrief.addEventListener("click", copyBrief);
  elements.downloadCsv.addEventListener("click", () => {
    if (!latestAnalysis) return;
    downloadFile("maintainer-signal-board.csv", toCsv(latestAnalysis), "text/csv");
    setStatus("CSV saved");
  });
  elements.downloadJson.addEventListener("click", () => {
    if (!latestAnalysis) return;
    downloadFile("maintainer-signal-board.json", JSON.stringify(latestAnalysis, null, 2), "application/json");
    setStatus("JSON saved");
  });
  elements.addLog.addEventListener("click", addEvidenceLog);
  elements.clearLog.addEventListener("click", () => {
    localStorage.removeItem(LOG_KEY);
    renderEvidenceLog();
    setStatus("Log cleared");
  });
}

function renderInitial() {
  elements.sample.innerHTML = SAMPLE_QUEUES.map((sample) => option(sample.id, sample.name, state.sampleId)).join("");
  elements.capacity.value = state.capacityHours;
  renderWeightControls();
  elements.input.value = state.queueText;
  runAnalysis("Ready");
  renderEvidenceLog();
}

function runAnalysis(statusMessage) {
  try {
    const items = parseQueueInput(elements.input.value);
    latestAnalysis = analyzeQueue({
      items,
      capacityHours: elements.capacity.value,
      weights: state.weights,
      now: "2026-06-04T12:00:00.000Z"
    });
    renderAnalysis(latestAnalysis);
    setStatus(statusMessage);
  } catch (error) {
    latestAnalysis = null;
    elements.summary.innerHTML = "";
    elements.actions.innerHTML = `<li>${escapeHtml(error.message)}</li>`;
    elements.lanes.innerHTML = "";
    elements.brief.value = "";
    setStatus("Input error");
  }
}

function renderAnalysis(analysis) {
  elements.summary.innerHTML = [
    metric("Open items", analysis.metrics.totalOpen, "queue"),
    metric("P0/P1", `${analysis.metrics.p0}/${analysis.metrics.p1}`, "priority"),
    metric("Release blockers", analysis.metrics.releaseBlockers, "release"),
    metric("Security", analysis.metrics.security, "security"),
    metric("Dependencies", analysis.metrics.dependencyRisk, "dependency"),
    metric("Maintainer load", `${analysis.metrics.maintainerHours}h`, "load"),
    metric("Capacity", analysis.metrics.capacityFit, "capacity")
  ].join("");

  elements.actions.innerHTML = analysis.nextActions.map((action) => `<li>${escapeHtml(action)}</li>`).join("");
  elements.lanes.innerHTML = analysis.lanes.map(renderLane).join("");
  elements.brief.value = makeMaintainerBrief(analysis);
}

function renderLane(lane) {
  const items = lane.items.length
    ? lane.items.map((item) => `<li>${renderItem(item)}</li>`).join("")
    : "<li class=\"empty\">Empty</li>";
  return `
    <section class="lane" data-lane="${escapeHtml(lane.name)}">
      <header>
        <h3>${escapeHtml(lane.name)}</h3>
        <span>${lane.items.length}</span>
      </header>
      <ul>${items}</ul>
    </section>
  `;
}

function renderItem(item) {
  const signals = item.signals.length ? item.signals.join(", ") : "normal";
  return `
    <article class="queue-item priority-${item.priority.toLowerCase()}">
      <div>
        <strong>${escapeHtml(item.priority)} ${escapeHtml(item.ref)}</strong>
        <span>${escapeHtml(item.lane)} · ${item.maintainerMinutes}m · score ${item.score}</span>
      </div>
      <p>${escapeHtml(item.title)}</p>
      <small>${escapeHtml(signals)}</small>
    </article>
  `;
}

function renderEvidenceLog() {
  const log = getEvidenceLog();
  elements.log.innerHTML = log.length
    ? log.map((entry) => `<li><strong>${escapeHtml(entry.when)}</strong><span>${escapeHtml(entry.text)}</span></li>`).join("")
    : "<li><span>No saved maintainer decisions yet</span></li>";
}

function renderWeightControls() {
  state.weights = normalizeWeightState(state.weights);
  elements.weights.innerHTML = WEIGHT_FIELDS.map((field) => {
    const value = state.weights[field.key];
    return `
      <label>
        <span>${escapeHtml(field.label)}</span>
        <input
          data-testid="${escapeHtml(weightTestId(field.key))}"
          data-weight-key="${escapeHtml(field.key)}"
          type="number"
          min="${field.min}"
          max="${field.max}"
          step="1"
          inputmode="numeric"
          value="${escapeHtml(value)}"
        />
      </label>
    `;
  }).join("");
}

function addEvidenceLog() {
  if (!latestAnalysis) return;
  const first = latestAnalysis.nextActions[0] || "Reviewed maintainer queue.";
  const log = getEvidenceLog();
  log.unshift({
    when: new Date().toISOString().slice(0, 19).replace("T", " "),
    text: first
  });
  localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 8)));
  renderEvidenceLog();
  setStatus("Decision logged");
}

async function copyBrief() {
  if (!elements.brief.value) return;
  try {
    await navigator.clipboard.writeText(elements.brief.value);
    setStatus("Brief copied");
  } catch {
    elements.brief.focus();
    elements.brief.select();
    document.execCommand("copy");
    setStatus("Brief selected");
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.queueText === "string") return saved;
  } catch {
    // Ignore invalid local drafts.
  }
  return {
    sampleId: SAMPLE_QUEUES[0].id,
    capacityHours: SAMPLE_QUEUES[0].capacityHours,
    queueText: sampleToText(SAMPLE_QUEUES[0].id),
    weights: { ...DEFAULT_WEIGHTS }
  };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private windows may block storage.
  }
}

function getEvidenceLog() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOG_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeWeightState(input) {
  const weights = { ...DEFAULT_WEIGHTS };
  if (!input || typeof input !== "object") return weights;
  for (const key of Object.keys(DEFAULT_WEIGHTS)) {
    const value = Number(input[key]);
    if (Number.isFinite(value)) {
      const field = WEIGHT_FIELDS.find((item) => item.key === key);
      weights[key] = clampNumber(value, field?.min ?? -100, field?.max ?? 120);
    }
  }
  return weights;
}

function metric(label, value, tone) {
  return `
    <article class="metric metric-${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function weightTestId(key) {
  return `weight-${key.replaceAll(/([A-Z])/g, "-$1").toLowerCase()}`;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function downloadFile(filename, content, type) {
  const link = document.createElement("a");
  const blob = new Blob([content], { type });
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function setStatus(message) {
  elements.status.textContent = message;
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => {
    elements.status.textContent = "Ready";
  }, 1800);
}

function option(value, label, selected) {
  return `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
