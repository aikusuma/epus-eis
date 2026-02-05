import fs from 'node:fs';

const file = 'public/openapi.yaml';
let s = fs.readFileSync(file, 'utf8');

function esc(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripPostBetween(path, nextPath) {
  const re = new RegExp(
    `(^  ${esc(path)}:\n[\\s\\S]*?\n)    post:[\\s\\S]*?(\n  ${esc(nextPath)}:)`,
    'm'
  );
  if (!re.test(s)) {
    throw new Error(`Could not find post block for ${path}`);
  }
  s = s.replace(re, `$1$2`);
}

stripPostBetween('/api/eis/klaster1', '/api/eis/klaster2');
stripPostBetween('/api/eis/klaster2', '/api/eis/klaster3');
stripPostBetween('/api/eis/klaster3', '/api/eis/klaster4');
stripPostBetween('/api/eis/klaster4', '/api/eis/lintas-klaster');
stripPostBetween('/api/eis/lintas-klaster', '/api/eis/monitoring');

fs.writeFileSync(file, s);
console.log('Removed POST blocks from klaster routes in', file);
