import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const skip = join(root, 'src', 'constants', 'Colors.js');
const patterns = [/#[0-9a-fA-F]{3,8}\b/g, /indigo/gi, /glowIndigo/g];
const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js') && p !== skip) {
      readFileSync(p, 'utf8').split(/\r?\n/).forEach((line, i) => {
        for (const re of patterns) {
          for (const m of line.matchAll(re)) hits.push(`${relative(root, p)}:${i + 1}: ${m[0]}`);
        }
      });
    }
  }
}
walk(join(root, 'src'));

const strings = readFileSync(join(root, 'src', 'i18n', 'strings.js'), 'utf8');
for (const k of ['mode_ai_title', 'mode_ai_subtitle', 'mode_movie_title', 'mode_movie_subtitle', 'mode_tv_title', 'mode_tv_subtitle']) {
  const n = strings.split(k).length - 1;
  if (n !== 7) hits.push(`src/i18n/strings.js: ${k} occurs ${n} times (expected 7)`);
}

if (hits.length) {
  console.error(hits.join('\n'));
  process.exit(1);
}
console.log('theme check passed');
