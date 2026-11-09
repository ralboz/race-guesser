const fs = require('fs');
const path = require('path');

// JSON data directories under src/data that tsc does not emit
for (const dir of ['races', 'drivers']) {
  const src = path.join(__dirname, '..', 'src', 'data', dir);
  const dest = path.join(__dirname, '..', 'dist', 'data', dir);

  fs.mkdirSync(dest, { recursive: true });

  fs.readdirSync(src)
    .filter(f => f.endsWith('.json'))
    .forEach(f => fs.copyFileSync(path.join(src, f), path.join(dest, f)));

  console.log(`${dir} data copied to dist/data/${dir}/`);
}
