const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Remove AnimatePresence wrap
code = code.replace(/<AnimatePresence mode="wait">/g, "");
code = code.replace(/<\/AnimatePresence>/g, "");

// Replace <motion.div with <div
code = code.replace(/<motion\.div/g, "<div");
// Replace </motion.div> with </div>
code = code.replace(/<\/motion\.div>/g, "</div>");

// Remove initial, animate, exit, transition props
code = code.replace(/\s*initial=\{\{[^}]+\}\}/g, "");
code = code.replace(/\s*animate=\{\{[^}]+\}\}/g, "");
code = code.replace(/\s*exit=\{\{[^}]+\}\}/g, "");
code = code.replace(/\s*transition=\{\{[^}]+\}\}/g, "");

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log('Removed transitions.');
