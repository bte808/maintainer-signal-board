import {
  DEFAULT_WEIGHTS,
  SAMPLE_QUEUES,
  WEIGHT_PROFILES,
  analyzeQueue,
  makeMaintainerBrief,
  parseQueueInput,
  sampleToText,
  toCsv
} from "./maintainer-core.js";

const STORAGE_KEY = "maintainer-signal-board-v1";
const LOG_KEY = "maintainer-signal-board-log-v1";
const DEFAULT_PROFILE_ID = "balanced";
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
  profile: document.querySelector("[data-testid='weight-profile']"),
  applyProfile: document.querySelector("[data-testid='apply-profile']"),
  weights: document.querySelector("[data-testid='scoring-weights']"),
  resetWeights: document.querySelector("[data-testid='reset-weights']"),
  input: document.querySelector("[data-testid='queue-input']"),
  analyze: document.querySelector("[data-testid='analyze']"),
  copyBrief: document.querySelector("[data-testid='copy-brief']"),
  shareUrl: document.querySelector("[data-testid='share-url']"),
  downloadCsv: document.querySelector("[data-testid='download-csv']"),
  downloadJson: document.querySelector("[data-testid='download-json']"),
  summary: document.querySelector("[data-testid='summary']"),
  actions: document.querySelector("[data-testid='next-actions']"),
  laneFilter: document.querySelector("[data-testid='lane-filter']"),
  compactView: document.querySelector("[data-testid='compact-view']"),
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

  elements.profile.addEventListener("change", () => {
    state.profileId = elements.profile.value;
    saveState();
  });

  elements.applyProfile.addEventListener("click", () => {
    const profile = WEIGHT_PROFILES[elements.profile.value];
    if (!profile) return;
    state.profileId = elements.profile.value;
    state.weights = { ...profile.weights };
    renderWeightControls();
    saveState();
    runAnalysis("Profile applied");
  });

  elements.weights.addEventListener("input", (event) => {
    const key = event.target.dataset.weightKey;
    if (!key) return;
    state.weights[key] = Number(event.target.value);
    state.profileId = "custom";
    elements.profile.value = "custom";
    saveState();
    runAnalysis("Weights updated");
  });

  elements.resetWeights.addEventListener("click", () => {
    state.weights = { ...DEFAULT_WEIGHTS };
    state.profileId = DEFAULT_PROFILE_ID;
    elements.profile.value = DEFAULT_PROFILE_ID;
    renderWeightControls();
    saveState();
    runAnalysis("Weights reset");
  });

  elements.input.addEventListener("input", () => {
    state.queueText = elements.input.value;
    saveState();
  });

  elements.analyze.addEventListener("click", () => runAnalysis("Queue analyzed"));
  elements.laneFilter.addEventListener("change", () => {
    state.laneFilter = elements.laneFilter.value;
    saveState();
    if (latestAnalysis) renderAnalysis(latestAnalysis);
    setStatus("Lane filter updated");
  });
  elements.compactView.addEventListener("change", () => {
    state.compactView = elements.compactView.checked;
    saveState();
    if (latestAnalysis) renderAnalysis(latestAnalysis);
    setStatus(state.compactView ? "Compact view on" : "Compact view off");
  });
  elements.copyBrief.addEventListener("click", copyBrief);
  elements.shareUrl.addEventListener("click", shareUrl);
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
  document.addEventListener("keydown", handleKeyboardShortcut);
}

function renderInitial() {
  elements.sample.innerHTML = SAMPLE_QUEUES.map((sample) => option(sample.id, sample.name, state.sampleId)).join("");
  elements.profile.innerHTML = [
    ...Object.entries(WEIGHT_PROFILES).map(([id, profile]) => option(id, profile.name, state.profileId)),
    option("custom", "Custom weights", state.profileId)
  ].join("");
  elements.capacity.value = state.capacityHours;
  elements.compactView.checked = Boolean(state.compactView);
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
  renderLaneControls(analysis);
  const visibleLanes = state.laneFilter === "all"
    ? analysis.lanes
    : analysis.lanes.filter((lane) => lane.name === state.laneFilter);
  elements.lanes.classList.toggle("is-compact", Boolean(state.compactView));
  elements.lanes.innerHTML = visibleLanes.map(renderLane).join("");
  elements.brief.value = makeMaintainerBrief(analysis);
}

function renderLaneControls(analysis) {
  const laneNames = analysis.lanes.map((lane) => lane.name);
  if (!laneNames.includes(state.laneFilter)) {
    state.laneFilter = "all";
  }
  elements.laneFilter.innerHTML = [
    option("all", "All lanes", state.laneFilter),
    ...analysis.lanes.map((lane) => option(lane.name, `${lane.name} (${lane.items.length})`, state.laneFilter))
  ].join("");
  elements.compactView.checked = Boolean(state.compactView);
}

function renderLane(lane) {
  const items = lane.items.length
    ? lane.items.map((item) => `<li>${renderItem(item)}</li>`).join("")
    : "<li class=\"empty\">Empty</li>";
  return `
    <section class="lane" data-lane="${escapeHtml(lane.name)}" tabindex="-1" aria-label="${escapeHtml(lane.name)} lane">
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
    await writeClipboardWithTimeout(elements.brief.value);
    setStatus("Brief copied");
  } catch {
    elements.brief.focus();
    elements.brief.select();
    document.execCommand("copy");
    setStatus("Brief selected");
  }
}

function writeClipboardWithTimeout(text) {
  if (!navigator.clipboard?.writeText) return Promise.reject(new Error("Clipboard unavailable"));
  return Promise.race([
    navigator.clipboard.writeText(text),
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error("Clipboard timeout")), 400);
    })
  ]);
}

function handleKeyboardShortcut(event) {
  if (isShortcutDisabled(event.target)) return;
  if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

  const key = event.key.toLowerCase();
  if (event.key === "ArrowRight") {
    event.preventDefault();
    focusAdjacentLane(1);
    return;
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    focusAdjacentLane(-1);
    return;
  }
  if (key === "c") {
    event.preventDefault();
    toggleCompactViewShortcut();
    return;
  }
  if (key === "b") {
    event.preventDefault();
    copyBrief();
  }
}

function isShortcutDisabled(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("input, textarea, select, button, [contenteditable='true']"));
}

function focusAdjacentLane(direction) {
  const lanes = [...elements.lanes.querySelectorAll(".lane")];
  if (!lanes.length) return;
  const activeLane = document.activeElement?.closest?.(".lane");
  const activeIndex = lanes.indexOf(activeLane);
  const nextIndex = activeIndex === -1
    ? direction > 0 ? 0 : lanes.length - 1
    : (activeIndex + direction + lanes.length) % lanes.length;
  const lane = lanes[nextIndex];
  lane.focus();
  setStatus(`Focused ${lane.dataset.lane}`);
}

function toggleCompactViewShortcut() {
  state.compactView = !elements.compactView.checked;
  elements.compactView.checked = state.compactView;
  saveState();
  if (latestAnalysis) renderAnalysis(latestAnalysis);
  setStatus(state.compactView ? "Compact view on" : "Compact view off");
}

function loadState() {
  const shared = readSharedState();
  if (shared) return shared;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.queueText === "string") {
      return {
        ...saved,
        profileId: saved.profileId || "custom",
        weights: normalizeWeightState(saved.weights),
        laneFilter: saved.laneFilter || "all",
        compactView: Boolean(saved.compactView)
      };
    }
  } catch {
    // Ignore invalid local drafts.
  }
  return {
    sampleId: SAMPLE_QUEUES[0].id,
    capacityHours: SAMPLE_QUEUES[0].capacityHours,
    queueText: sampleToText(SAMPLE_QUEUES[0].id),
    profileId: DEFAULT_PROFILE_ID,
    weights: { ...DEFAULT_WEIGHTS },
    laneFilter: "all",
    compactView: false
  };
}

function readSharedState() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  if (!hash) return null;
  const encoded = new URLSearchParams(hash).get("board");
  if (!encoded) return null;
  try {
    const json = decodeBase64Url(encoded);
    const parsed = JSON.parse(json);
    if (!parsed || parsed.v !== 1 || typeof parsed.queueText !== "string") return null;
    return {
      sampleId: parsed.sampleId || SAMPLE_QUEUES[0].id,
      capacityHours: parsed.capacityHours || SAMPLE_QUEUES[0].capacityHours,
      queueText: parsed.queueText,
      profileId: parsed.profileId || "custom",
      weights: normalizeWeightState(parsed.weights),
      laneFilter: parsed.laneFilter || "all",
      compactView: Boolean(parsed.compactView)
    };
  } catch {
    return null;
  }
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

async function shareUrl() {
  if (state.queueText.length > 9000) {
    setStatus("Queue too large for URL");
    return;
  }
  const payload = {
    v: 1,
    sampleId: state.sampleId,
    capacityHours: state.capacityHours,
    profileId: state.profileId,
    weights: normalizeWeightState(state.weights),
    laneFilter: state.laneFilter,
    compactView: Boolean(state.compactView),
    queueText: state.queueText
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const url = new URL(window.location.href);
  url.hash = `board=${encoded}`;
  window.history.replaceState(null, "", url);
  try {
    await navigator.clipboard.writeText(url.href);
    setStatus("Share URL copied");
  } catch {
    setStatus("Share URL ready");
  }
}

function encodeBase64Url(value) {
  return btoa(unescape(encodeURIComponent(value))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeBase64Url(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return decodeURIComponent(escape(atob(base64)));
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
