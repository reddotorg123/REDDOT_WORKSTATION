const fs = require('fs');
let txt = fs.readFileSync('wallpaper-ui/wallpaper.js', 'utf8');

// Directly replace completedTasks.forEach in the render section
// Find the last occurrence (in renderTasks, not elsewhere)
const renderTasksIdx = txt.indexOf('function renderTasks()');
const OLD_FOREACH = 'completedTasks.forEach(ct =>';
const NEW_FOREACH = 'filteredCompleted.forEach(ct =>';

let pos = txt.lastIndexOf(OLD_FOREACH);
if (pos !== -1 && pos > renderTasksIdx) {
  txt = txt.substring(0, pos) + NEW_FOREACH + txt.substring(pos + OLD_FOREACH.length);
  console.log('OK: replaced completedTasks.forEach with filteredCompleted.forEach');
} else {
  console.log('No replacement needed or not in renderTasks scope, pos:', pos, 'renderTasksIdx:', renderTasksIdx);
}

fs.writeFileSync('wallpaper-ui/wallpaper.js', txt, 'utf8');
console.log('Done! Size:', Math.round(txt.length/1024) + 'KB');

// Verify
const txt2 = fs.readFileSync('wallpaper-ui/wallpaper.js', 'utf8');
const sectionIdx = txt2.lastIndexOf('// Render Completed Tasks Section');
const chunk = txt2.substring(sectionIdx, sectionIdx + 600);
console.log('Has filteredCompleted.forEach:', chunk.includes('filteredCompleted.forEach'));
console.log('Has old completedTasks.forEach:', chunk.includes('completedTasks.forEach'));
