const fs = require('fs');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const code = fs.readFileSync('src/pages/ZaptroCrm.tsx', 'utf-8');

// I will remove the last 3 extra divs just to get a valid AST
const lines = code.split('\n');
lines.splice(4051, 3);
const validCode = lines.join('\n');

const ast = parse(validCode, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

traverse(ast, {
  JSXFragment(path) {
    const children = path.node.children;
    // Find the root div
    const rootDiv = children.find(c => c.type === 'JSXElement' && c.openingElement.name.name === 'div');
    if (rootDiv) {
      console.log('Root div starts at line', rootDiv.loc.start.line);
      console.log('Root div ends at line', rootDiv.loc.end.line);
    }
  }
});
