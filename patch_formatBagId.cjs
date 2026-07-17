const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
content = content.replace(
  /const formatBagId = \(id: string\) => {([\s\S]*?)};/,
  `const formatBagId = (id: string) => {\n  if (!id) return '';\n  // Convert "BOLSA-001" to "Cesto-001"\n  return id.replace(/^(bolsa|cesto)/i, () => "Cesto");\n};`
);
fs.writeFileSync('src/pages/Dashboard.tsx', content);
