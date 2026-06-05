import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const port = Number(process.env.MAINTAINER_BOARD_PORT || 5184);
const targetUrl = process.env.MAINTAINER_BOARD_URL || `http://127.0.0.1:${port}/`;
const chromePath = await findChromePath();

const userDataDir = await mkdtemp(join(tmpdir(), "maintainer-board-chrome-"));
let chrome;
let server;

try {
  if (!process.env.MAINTAINER_BOARD_URL) {
    server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
      stdio: ["ignore", "ignore", "pipe"]
    });
    await waitForServer(targetUrl);
  }

  const browserWs = await launchChrome();
  const cdp = await connectCdp(browserWs);
  const desktop = await runViewportCheck(cdp, {
    name: "desktop",
    width: 1360,
    height: 920,
    mobile: false
  });
  const mobile = await runViewportCheck(cdp, {
    name: "mobile",
    width: 390,
    height: 844,
    mobile: true
  });
  await cdp.close();

  if (!desktop.ok || !mobile.ok) {
    throw new Error(JSON.stringify({ desktop, mobile }, null, 2));
  }

  console.log(
    `browser ok: desktop lanes=${desktop.lanes}, mobile overflow=${mobile.overflow}, screenshots=${desktop.screenshot},${mobile.screenshot}`
  );
} finally {
  if (chrome && !chrome.killed) chrome.kill("SIGTERM");
  if (server && !server.killed) server.kill("SIGTERM");
  await rm(userDataDir, { recursive: true, force: true });
}

async function waitForServer(url) {
  const deadline = Date.now() + 10000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

async function launchChrome() {
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ];

  chrome = spawn(chromePath, args, { stdio: ["ignore", "ignore", "pipe"] });
  chrome.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Chrome exited with code ${code}`);
    }
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for Chrome DevTools")), 10000);
    chrome.stderr.on("data", (chunk) => {
      const match = String(chunk).match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    chrome.on("error", reject);
  });
}

async function findChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome",
    "google-chrome-stable",
    "chromium-browser",
    "chromium"
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await canRun(candidate)) return candidate;
  }

  throw new Error(`No Chrome or Chromium executable found. Tried: ${candidates.join(", ")}`);
}

function canRun(command) {
  return new Promise((resolve) => {
    const child = spawn(command, ["--version"], { stdio: ["ignore", "ignore", "ignore"] });
    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
  });
}

function connectCdp(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const waiters = [];

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result || {});
      }
      return;
    }

    for (const waiter of [...waiters]) {
      const sameMethod = waiter.method === message.method;
      const sameSession = !waiter.sessionId || waiter.sessionId === message.sessionId;
      if (sameMethod && sameSession) {
        clearTimeout(waiter.timeout);
        waiters.splice(waiters.indexOf(waiter), 1);
        waiter.resolve(message.params || {});
      }
    }
  });

  const open = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  return open.then(() => ({
    send(method, params = {}, sessionId) {
      const id = nextId++;
      const payload = sessionId ? { id, method, params, sessionId } : { id, method, params };
      socket.send(JSON.stringify(payload));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    waitFor(method, sessionId, timeoutMs = 10000) {
      return new Promise((resolve, reject) => {
        const waiter = {
          method,
          sessionId,
          resolve,
          timeout: setTimeout(() => {
            waiters.splice(waiters.indexOf(waiter), 1);
            reject(new Error(`Timed out waiting for ${method}`));
          }, timeoutMs)
        };
        waiters.push(waiter);
      });
    },
    close() {
      socket.close();
    }
  }));
}

async function runViewportCheck(cdp, viewport) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.mobile ? 2 : 1,
      mobile: viewport.mobile
    },
    sessionId
  );

  const loaded = cdp.waitFor("Page.loadEventFired", sessionId);
  await cdp.send("Page.navigate", { url: targetUrl }, sessionId);
  await loaded;

  const details = await evaluate(
    cdp,
    sessionId,
    `(async () => {
      const byTest = (id) => document.querySelector('[data-testid="' + id + '"]');
      const shortcut = (key, target = document.activeElement || document.body) => {
        target.dispatchEvent(new KeyboardEvent('keydown', {
          key,
          altKey: true,
          bubbles: true,
          cancelable: true
        }));
      };
      byTest('sample-select').value = 'dependency-risk';
      byTest('sample-select').dispatchEvent(new Event('change', { bubbles: true }));
      byTest('load-sample').click();
      byTest('capacity-hours').value = '3';
      byTest('capacity-hours').dispatchEvent(new Event('input', { bubbles: true }));
      byTest('weight-profile').value = 'dependency';
      byTest('weight-profile').dispatchEvent(new Event('change', { bubbles: true }));
      byTest('apply-profile').click();
      const dependencyProfileApplied = byTest('weight-dependency-risk').value === '70';
      byTest('weight-dependency-risk').value = '72';
      byTest('weight-dependency-risk').dispatchEvent(new Event('input', { bubbles: true }));
      byTest('reset-weights').click();
      byTest('analyze').click();
      byTest('lane-filter').value = 'all';
      byTest('lane-filter').dispatchEvent(new Event('change', { bubbles: true }));
      byTest('compact-view').checked = false;
      byTest('compact-view').dispatchEvent(new Event('change', { bubbles: true }));
      const lanesBeforeFilter = document.querySelectorAll('.lane').length;
      const pageTextBeforeFilter = document.body.innerText;
      const initialCopyRect = byTest('copy-brief').getBoundingClientRect();
      const initialCopyVisible = initialCopyRect.top >= 0 && initialCopyRect.bottom <= window.innerHeight;
      shortcut('ArrowRight');
      const shortcutFirstLane = document.activeElement?.dataset?.lane || '';
      shortcut('ArrowRight');
      const shortcutSecondLane = document.activeElement?.dataset?.lane || '';
      byTest('queue-input').focus();
      const compactBeforeInputShortcut = byTest('compact-view').checked;
      shortcut('c');
      const compactAfterInputShortcut = byTest('compact-view').checked;
      byTest('queue-input').blur();
      shortcut('c');
      const compactAfterShortcut = byTest('compact-view').checked;
      shortcut('b', document.body);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const statusAfterCopyShortcut = byTest('status').textContent;
      byTest('lane-filter').value = 'Dependency risk';
      byTest('lane-filter').dispatchEvent(new Event('change', { bubbles: true }));
      const filteredLanes = document.querySelectorAll('.lane').length;
      const filteredItems = document.querySelectorAll('.queue-item').length;
      byTest('compact-view').checked = true;
      byTest('compact-view').dispatchEvent(new Event('change', { bubbles: true }));
      byTest('add-log').click();
      byTest('share-url').click();
      const brief = byTest('brief-output').value;
      const pageText = document.body.innerText;
      const compactEnabled = byTest('lanes').classList.contains('is-compact');
      const laneFilterValue = byTest('lane-filter').value;
      const queueItems = document.querySelectorAll('.queue-item').length;
      const sampleChecks = ['release-candidate-drill', 'security-hardening-drill', 'dependency-review-drill'].map((sampleId) => {
        byTest('sample-select').value = sampleId;
        byTest('sample-select').dispatchEvent(new Event('change', { bubbles: true }));
        byTest('load-sample').click();
        byTest('capacity-hours').value = '5';
        byTest('capacity-hours').dispatchEvent(new Event('input', { bubbles: true }));
        byTest('lane-filter').value = 'all';
        byTest('lane-filter').dispatchEvent(new Event('change', { bubbles: true }));
        byTest('compact-view').checked = false;
        byTest('compact-view').dispatchEvent(new Event('change', { bubbles: true }));
        return {
          sampleId,
          metrics: document.querySelectorAll('.metric').length,
          queueItems: document.querySelectorAll('.queue-item').length,
          laneCount: document.querySelectorAll('.lane').length,
          laneCountWithItems: [...document.querySelectorAll('.lane')].filter((lane) => lane.querySelectorAll('.queue-item').length > 0).length,
          overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
        };
      });
      return {
        title: document.title,
        metrics: document.querySelectorAll('.metric').length,
        lanes: lanesBeforeFilter,
        filteredLanes,
        filteredItems,
        compactEnabled,
        laneFilterValue,
        weightInputs: byTest('scoring-weights').querySelectorAll('input').length,
        profileOptions: byTest('weight-profile').querySelectorAll('option').length,
        dependencyProfileApplied,
        dependencyWeightReset: byTest('weight-dependency-risk').value === '24',
        shareHashReady: window.location.hash.startsWith('#board='),
        shortcutFirstLane,
        shortcutSecondLane,
        inputShortcutIgnored: compactAfterInputShortcut === compactBeforeInputShortcut,
        compactShortcutWorked: compactAfterShortcut !== compactBeforeInputShortcut,
        statusAfterCopyShortcut,
        copyShortcutWorked: statusAfterCopyShortcut === 'Brief copied' || statusAfterCopyShortcut === 'Brief selected',
        queueItems,
        logItems: byTest('evidence-log').querySelectorAll('li').length,
        briefHasDependencyRisk: brief.includes('Dependency risk items'),
        briefHasNextActions: brief.includes('## Next actions'),
        pageHasP0: pageTextBeforeFilter.includes('P0'),
        pageHasDependencyRisk: pageText.includes('Dependency risk'),
        pageHasCapacity: pageText.includes('over capacity') || pageText.includes('fits'),
        sampleChecks,
        overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        copyVisible: initialCopyVisible
      };
    })()`
  );

  const screenshotResult = await cdp.send(
    "Page.captureScreenshot",
    { format: "png", captureBeyondViewport: false },
    sessionId
  );
  const requestedScreenshot =
    viewport.name === "desktop" ? process.env.SAVE_SCREENSHOT : process.env.SAVE_MOBILE_SCREENSHOT;
  const screenshot = requestedScreenshot || join(tmpdir(), `maintainer-board-${viewport.name}.png`);
  const screenshotBuffer = Buffer.from(screenshotResult.data, "base64");
  if (requestedScreenshot) {
    await mkdir(dirname(requestedScreenshot), { recursive: true });
  }
  await writeFile(screenshot, screenshotBuffer);

  const ok =
    details.title.includes("Maintainer Signal Board") &&
    details.metrics === 7 &&
    details.lanes === 7 &&
    details.filteredLanes === 1 &&
    details.filteredItems >= 3 &&
    details.compactEnabled &&
    details.laneFilterValue === "Dependency risk" &&
    details.weightInputs === 9 &&
    details.profileOptions >= 6 &&
    details.dependencyProfileApplied &&
    details.dependencyWeightReset &&
    details.shareHashReady &&
    details.shortcutFirstLane === "Security and quality" &&
    details.shortcutSecondLane === "Dependency risk" &&
    details.inputShortcutIgnored &&
    details.compactShortcutWorked &&
    details.copyShortcutWorked &&
    details.queueItems >= 3 &&
    details.logItems >= 1 &&
    details.briefHasDependencyRisk &&
    details.briefHasNextActions &&
    details.pageHasP0 &&
    details.pageHasDependencyRisk &&
    details.pageHasCapacity &&
    details.sampleChecks.length === 3 &&
    details.sampleChecks.every((sample) => sample.metrics === 7 && sample.queueItems >= 4 && sample.laneCount === 7 && sample.overflow <= 1) &&
    details.sampleChecks.some((sample) => sample.sampleId === "release-candidate-drill" && sample.laneCountWithItems === 7) &&
    details.overflow <= 1 &&
    (viewport.mobile || details.copyVisible);

  await cdp.send("Target.closeTarget", { targetId });
  return { ...details, ok, screenshot };
}

async function evaluate(cdp, sessionId, expression) {
  const response = await cdp.send(
    "Runtime.evaluate",
    {
      expression,
      awaitPromise: true,
      returnByValue: true
    },
    sessionId
  );
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text || "Runtime evaluation failed");
  }
  return response.result.value;
}
