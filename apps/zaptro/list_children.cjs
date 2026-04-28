const fs = require('fs');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const code = fs.readFileSync('src/pages/ZaptroCrm.tsx', 'utf-8');
const lines = code.split('\n');
lines.splice(4051, 3);
const validCode = lines.join('\n');

const ast = parse(validCode, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

traverse(ast, {
  JSXFragment(path) {
    if (path.node.loc.start.line === 1767) {
      path.node.children.forEach(c => {
        if (c.type === 'JSXElement') {
          console.log(`Element ${c.openingElement.name.name} from ${c.loc.start.line} to ${c.loc.end.line}`);
        } else if (c.type === 'JSXExpressionContainer') {
           console.log(`Expression from ${c.loc.start.line} to ${c.loc.end.line}`);
        }
      });
    }
  }
});
