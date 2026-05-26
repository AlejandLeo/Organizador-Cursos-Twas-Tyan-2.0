const fs = require('fs');
const lines = fs.readFileSync('src/views/eventos/GestionEventoMaster.vue', 'utf8').split('\n');
let d = 0;
// Track depth at each line, show specific ranges
const ranges = [[778, 790], [1395, 1415], [1530, 1600], [1680, 1700], [1785, 1800], [1880, 1942]];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const o = (l.match(/<div[\s>]/g) || []).length;
  const c = (l.match(/<\/div>/g) || []).length;
  d += o - c;
  const n = i + 1;
  const show = ranges.some(([a, b]) => n >= a && n <= b);
  if (show) console.log(`L${n} d=${d} +${o}-${c} | ${l.trim().substring(0, 70)}`);
}
console.log(`\nFINAL DEPTH: ${d} (must be 0)`);
