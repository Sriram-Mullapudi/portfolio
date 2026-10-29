const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {check} = require('../scripts/check_javascript.cjs');
function site(html, files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-js-'));
  try {
    fs.writeFileSync(path.join(root, 'index.html'), html);
    for (const [name, code] of Object.entries(files)) fs.writeFileSync(path.join(root, name), code);
    return check(root);
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
}
test('checks inline syntax without executing browser globals', () => {
  assert.deepEqual(site('<script>document.querySelector("main");</script>'), []);
  assert.equal(site('<script>const broken = ;</script>').length, 1);
});
test('checks local scripts with cache query and deduplicates failures', () => {
  const errors = site('<script src="app.js?v=2"></script><script src="app.js?v=3"></script>', {'app.js': 'function ('});
  assert.equal(errors.length, 1);
  assert.match(errors[0], /app.js/);
});
test('reports missing files and continues to later scripts', () => {
  assert.equal(site('<script src="missing.js"></script><script>const = ;</script>').length, 2);
});
test('skips data blocks and remote scripts', () => {
  assert.deepEqual(site('<script type="application/ld+json">{"name":"Sriram"}</script><script src="https://example.com/a.js"></script>'), []);
});
test('rejects paths outside the site', () => {
  assert.match(site('<script src="../outside.js"></script>')[0], /escapes portfolio/);
});
