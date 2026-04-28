const fs = require('fs');
const glob = require('glob');

const newStyleStr = `backgroundColor: 'rgba(217, 255, 0, 0.14)', color: '#000', border: '1px solid rgba(217, 255, 0, 1)'`;

const files = glob.sync('src/pages/**/*.tsx');

let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We are looking for something like:
  // backgroundColor: '#000', color: '#FFF', border: 'none'
  // Or variations
  
  // Let's do a more generic regex for button objects that have backgroundColor: '#000'
  // It's tricky to use Regex for everything because sometimes they span multiple lines.
  
  // A safer Regex:
  content = content.replace(/backgroundColor:\s*['"]#000['"]/g, "backgroundColor: 'rgba(217, 255, 0, 0.14)'");
  content = content.replace(/color:\s*['"]#FFF['"]/g, "color: '#000'");
  content = content.replace(/color:\s*['"]white['"]/g, "color: '#000'");
  content = content.replace(/color:\s*['"]#D9FF00['"]/g, "color: '#000'");
  content = content.replace(/color:\s*palette\.lime/g, "color: '#000'");
  
  // We should also handle the border: 'none' -> border: '1px solid rgba(217, 255, 0, 1)'
  // But ONLY if it's near our replaced background color.
  // Actually, wait. It's safer if I just write a specific replace function or do it manually?
}
