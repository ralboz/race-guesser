const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'data', 'races');
const dest = path.join(__dirname, '..', 'dist', 'data', 'races');

fs.mkdirSync(dest, { recursive: true });

fs.readdirSync(src)
  .filter(f => f.endsWith('.json'))
  .forEach(f => fs.copyFileSync(path.join(src, f), path.join(dest, f)));

console.log('Race data copied to dist/data/races/');
