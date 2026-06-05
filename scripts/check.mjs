import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const required = [
  "index.html",
  "styles.css",
  "src/app.js",
  "src/maintainer-core.js",
  "README.md",
  "LICENSE",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/triage_case.yml",
  ".github/ISSUE_TEMPLATE/release_checklist.yml",
  ".github/ISSUE_TEMPLATE/security_hardening.yml",
  ".github/workflows/ci.yml",
  "docs/pr-review-playbook.md",
  "docs/issue-triage-playbook.md",
  "docs/release-playbook.md",
  "docs/github-cli-export.md",
  "docs/maintenance-log.md",
  "docs/demo.png",
  "examples/sanitized-maintainer-queue.json",
  "tests/fixtures/edge-case-queue.json",
  "tests/fixtures/github-cli-issues.json",
  "tests/fixtures/github-cli-pull-requests.json",
  "tests/fixtures/github-cli-mixed-queue.json",
  "favicon.svg"
];

for (const file of required) {
  const info = await stat(file);
  assert.ok(info.size > 50, `${file} should not be empty`);
}

const pkg = JSON.parse(await readFile("package.json", "utf8"));
assert.deepEqual(pkg.dependencies || {}, {}, "runtime dependencies stay empty");
assert.equal(pkg.private, false, "package is publishable metadata");
assert.equal(pkg.license, "MIT");
assert.equal(pkg.version, "0.6.0");

const html = await readFile("index.html", "utf8");
assert.ok(html.includes('type="module" src="src/app.js"'), "HTML loads app module");
assert.ok(html.includes("data-testid=\"sample-select\""), "sample selector is wired");
assert.ok(html.includes("data-testid=\"brief-output\""), "brief output is wired");
assert.ok(html.includes("data-testid=\"scoring-weights\""), "scoring weight controls are wired");
assert.ok(html.includes("data-testid=\"reset-weights\""), "weight reset button is wired");
assert.ok(html.includes("data-testid=\"weight-profile\""), "weight profile selector is wired");
assert.ok(html.includes("data-testid=\"share-url\""), "share URL action is wired");
assert.ok(html.includes("data-testid=\"lane-filter\""), "lane filter is wired");
assert.ok(html.includes("data-testid=\"compact-view\""), "compact view toggle is wired");
assert.ok(!html.includes("Alt+"), "shortcut help stays out of the app shell");

const css = await readFile("styles.css", "utf8");
assert.ok(css.includes("@media (max-width: 760px)"), "mobile breakpoint exists");
assert.ok(css.includes(".lanes.is-compact"), "compact lane layout exists");
assert.ok(css.includes(".lane:focus"), "keyboard-focused lanes have visible focus styling");
assert.ok(!css.includes("letter-spacing: -"), "no negative letter spacing");

const app = await readFile("src/app.js", "utf8");
assert.ok(app.includes("handleKeyboardShortcut"), "keyboard shortcut handler is wired");
assert.ok(app.includes("focusAdjacentLane"), "lane navigation shortcut helper exists");
assert.ok(app.includes("toggleCompactViewShortcut"), "compact shortcut helper exists");
assert.ok(app.includes("writeClipboardWithTimeout"), "copy shortcut has clipboard fallback timeout");
assert.ok(app.includes("ArrowRight") && app.includes("ArrowLeft"), "lane navigation shortcuts are defined");

const readme = await readFile("README.md", "utf8");
assert.ok(readme.includes("Maintainer Signal Board"), "README names the project");
assert.ok(readme.includes("GitHub Pages"), "README links live demo section");
assert.ok(readme.includes("local-first"), "README explains local-first behavior");
assert.ok(readme.includes("not affiliated with OpenAI"), "README avoids endorsement claims");
assert.ok(readme.includes("npm run verify:browser"), "README documents browser verification");
assert.ok(readme.includes("GitHub CLI export recipe"), "README links the sanitized export recipe");
assert.ok(readme.includes("Dependency risk"), "README documents dependency-risk triage");
assert.ok(readme.includes("compact view"), "README documents compact view");
assert.ok(readme.includes("issues") && readme.includes("pullRequests"), "README documents mixed GitHub CLI shape");
assert.ok(readme.includes("Maintenance log"), "README links the maintenance log");
assert.ok(readme.includes("sanitized-maintainer-queue.json"), "README links the sanitized example fixture");
assert.ok(readme.includes("Release candidate drill"), "README documents the release candidate drill");
assert.ok(readme.includes("Security hardening drill"), "README documents the security hardening drill");
assert.ok(readme.includes("Dependency review drill"), "README documents the dependency review drill");
assert.ok(readme.includes("Keyboard Shortcuts"), "README documents shortcuts");
assert.ok(readme.includes("Alt+ArrowRight") && readme.includes("Alt+C") && readme.includes("Alt+B"), "README lists shortcut coverage");

const core = await readFile("src/maintainer-core.js", "utf8");
for (const sampleId of ["release-candidate-drill", "security-hardening-drill", "dependency-review-drill"]) {
  assert.ok(core.includes(`id: "${sampleId}"`), `${sampleId} is present`);
}
assert.ok(core.includes("example-org/example-repo"), "drill samples use neutral repository names");
assert.ok(!/(private-org|private-repo|customer|github_pat_|gho_)/i.test(core), "sample data avoids private or token-like data");

const exportDoc = await readFile("docs/github-cli-export.md", "utf8");
assert.ok(exportDoc.includes("gh issue list"), "export doc includes issue export command");
assert.ok(exportDoc.includes("gh pr list"), "export doc includes PR export command");
assert.ok(exportDoc.includes("Do not export secrets"), "export doc includes sanitization warning");
assert.ok(exportDoc.includes("github-cli-issues.json"), "export doc links issues preset fixture");
assert.ok(exportDoc.includes("github-cli-pull-requests.json"), "export doc links pull request preset fixture");
assert.ok(exportDoc.includes("github-cli-mixed-queue.json"), "export doc links mixed preset fixture");
assert.ok(exportDoc.includes("issues") && exportDoc.includes("pullRequests"), "export doc explains mixed queue shape");

const maintenanceLog = await readFile("docs/maintenance-log.md", "utf8");
assert.ok(maintenanceLog.includes("keyboard shortcut maintenance"), "maintenance log records keyboard shortcut work");
assert.ok(maintenanceLog.includes("drill queue maintenance"), "maintenance log records drill queue work");
assert.ok(maintenanceLog.includes("v0.3.0 maintenance rounds"), "maintenance log records this release");
assert.ok(maintenanceLog.includes("Shareable local queue URL"), "maintenance log records share URL work");

const example = JSON.parse(await readFile("examples/sanitized-maintainer-queue.json", "utf8"));
assert.ok(Array.isArray(example.items), "sanitized example has items");
assert.ok(JSON.stringify(example).includes("example-org/example-repo"), "sanitized example uses neutral repo names");

const edgeCaseFixture = JSON.parse(await readFile("tests/fixtures/edge-case-queue.json", "utf8"));
assert.ok(Array.isArray(edgeCaseFixture.items), "edge-case fixture has items");
assert.ok(edgeCaseFixture.items.length >= 5, "edge-case fixture covers multiple queue shapes");
assert.ok(!JSON.stringify(edgeCaseFixture).includes("github.com/"), "edge-case fixture avoids real repository URLs");

const githubCliFixtures = [
  "tests/fixtures/github-cli-issues.json",
  "tests/fixtures/github-cli-pull-requests.json",
  "tests/fixtures/github-cli-mixed-queue.json"
];
for (const file of githubCliFixtures) {
  const fixtureText = await readFile(file, "utf8");
  const fixture = JSON.parse(fixtureText);
  assert.ok(fixtureText.includes("example-org/example-repo"), `${file} uses neutral repository names`);
  assert.ok(!/(private-org|private-repo|customer|github_pat_|gho_)/i.test(fixtureText), `${file} avoids private or token-like data`);
  assert.ok(Array.isArray(fixture) || Array.isArray(fixture.items) || Array.isArray(fixture.issues), `${file} has a queue shape`);
}

console.log("static check ok");
