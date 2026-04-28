const fs = require('fs');
const content = fs.readFileSync('src/pages/ZaptroCrm.tsx', 'utf-8');
const { parse } = require('@babel/parser');

try {
  parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log('No parse errors!');
} catch (e) {
  console.error('Parse error:', e.message);
}
