const fs = require('fs');
const { parse } = require('@babel/parser');

let code = fs.readFileSync('src/pages/ZaptroCrm.tsx', 'utf-8');
const lines = code.split('\n');

// Try removing lines 4051, 4052, 4053 (which are indices 4051, 4052, 4053)
lines.splice(4051, 3);
code = lines.join('\n');

try {
  parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  console.log('Success! Removed 3 divs and it parsed perfectly.');
} catch (e) {
  console.log('Error still:', e.message);
}
