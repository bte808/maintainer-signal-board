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
  "docs/demo.png",
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

const html = await readFile("index.html", "utf8");
assert.ok(html.includes('type="module" src="src/app.js"'), "HTML loads app module");
assert.ok(html.includes("data-testid=\"sample-select\""), "sample selector is wired");
assert.ok(html.includes("data-testid=\"brief-output\""), "brief output is wired");

const css = await readFile("styles.css", "utf8");
assert.ok(css.includes("@media (max-width: 760px)"), "mobile breakpoint exists");
assert.ok(!css.includes("letter-spacing: -"), "no negative letter spacing");

const readme = await readFile("README.md", "utf8");
assert.ok(readme.includes("Maintainer Signal Board"), "README names the project");
assert.ok(readme.includes("GitHub Pages"), "README links live demo section");
assert.ok(readme.includes("local-first"), "README explains local-first behavior");
assert.ok(readme.includes("not affiliated with OpenAI"), "README avoids endorsement claims");
assert.ok(readme.includes("npm run verify:browser"), "README documents browser verification");

console.log("static check ok");
