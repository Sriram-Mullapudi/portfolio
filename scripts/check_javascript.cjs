// Parse classic scripts without executing browser code or fetching remote files.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function check(root) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const errors = [];
  let inline = 0;
  const seen = new Set();
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = {};
    // HTML permits both quoted and unquoted values; match whole attribute names.
    for (const attribute of match[1].matchAll(/(?:^|\s)([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      const name = attribute[1].toLowerCase();
      // Browsers retain the first value when an attribute is repeated.
      if (!Object.hasOwn(attrs, name)) attrs[name] = attribute[2] ?? attribute[3] ?? attribute[4] ?? '';
    }
    const type = (attrs.type || '').trim().toLowerCase();
    // JSON-LD and other data blocks are not executable classic scripts.
    if (type && !['text/javascript', 'application/javascript'].includes(type)) continue;
    let label = `inline script ${++inline}`;
    try {
      let code = match[2];
      if (attrs.src) {
        if (/^(?:[a-z][\w+.-]*:|\/\/)/i.test(attrs.src)) continue;
        label = decodeURIComponent(attrs.src.split(/[?#]/)[0]);
        const file = path.resolve(root, label);
        const relative = path.relative(path.resolve(root), file);
        if (relative.startsWith('..') || path.isAbsolute(relative)) throw Error('Script path escapes portfolio');
        if (seen.has(file)) continue;
        seen.add(file);
        code = fs.readFileSync(file, 'utf8');
      }
      new vm.Script(code, {filename: label});
    } catch (error) { errors.push(`${label}: ${error.message}`); }
  }
  return errors;
}
module.exports = {check};
if (require.main === module) {
  const errors = check(path.resolve(__dirname, '..'));
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('OK: local classic JavaScript parses successfully.');
}
