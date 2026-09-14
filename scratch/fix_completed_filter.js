const fs = require('fs');
let js = fs.readFileSync('wallpaper-ui/wallpaper.js', 'utf8');

// Find where 'Render Completed Tasks Section' starts
const sectionIdx = js.indexOf('// Render Completed Tasks Section');
if (sectionIdx === -1) { console.error('section not found'); process.exit(1); }

// Find the start of 'if (completedContainer) {' just after the comment
const containerStart = js.indexOf('    if (completedContainer) {', sectionIdx);
if (containerStart === -1) { console.error('container block not found'); process.exit(1); }

const STATUS_CODE = `    // Status Filter - show/hide sections
    var statusFilter = 'ALL';
    var sfEl = document.getElementById('taskFilterStatusSelect');
    if (sfEl) statusFilter = sfEl.value || 'ALL';
    var inProgressSection = document.getElementById('inProgressTasksSection');
    var completedSection = document.getElementById('completedTasksSection');
    if (statusFilter === 'ACTIVE') {
      if (inProgressSection) inProgressSection.style.display = '';
      if (completedSection) completedSection.style.display = 'none';
    } else if (statusFilter === 'COMPLETED') {
      if (inProgressSection) inProgressSection.style.display = 'none';
      if (completedSection) completedSection.style.display = '';
    } else {
      if (inProgressSection) inProgressSection.style.display = '';
      if (completedSection) completedSection.style.display = '';
    }

    // Apply search/category/assignee filters to completed tasks too
    var filteredCompleted = completedTasks.slice();
    if (searchQuery) {
      filteredCompleted = filteredCompleted.filter(function(t) {
        return (t.title && t.title.toLowerCase().indexOf(searchQuery) !== -1) ||
          (t.assigneeName && t.assigneeName.toLowerCase().indexOf(searchQuery) !== -1);
      });
    }
    if (catFilter !== 'ALL') {
      filteredCompleted = filteredCompleted.filter(function(t) {
        return (t.category || '').toUpperCase().indexOf(catFilter.toUpperCase()) !== -1;
      });
    }
    if (assigneeFilter !== 'ALL') {
      filteredCompleted = filteredCompleted.filter(function(t) {
        return t.assigneeId === assigneeFilter ||
          (t.assigneeName && t.assigneeName.toLowerCase().indexOf(assigneeFilter.toLowerCase()) !== -1);
      });
    }
    if (completedCount) completedCount.textContent = filteredCompleted.length + ' Total';

    // Render Completed Tasks Section
`;

// Replace from sectionIdx up to containerStart with the new code
js = js.substring(0, sectionIdx) + STATUS_CODE + js.substring(containerStart);
console.log('Inserted status filter code');

// Now update the completedTasks references in that render block
// Find it again
const newSectionIdx = js.lastIndexOf('// Render Completed Tasks Section');
let chunk = js.substring(newSectionIdx, newSectionIdx + 600);
chunk = chunk.replace(
  'if (completedTasks.length === 0)',
  'if (filteredCompleted.length === 0)'
);
chunk = chunk.replace(
  "'No completed tasks yet. Completed tasks will appear here.'",
  "completedTasks.length === 0 ? 'No completed tasks yet.' : 'No completed tasks match your filters.'"
);
chunk = chunk.replace(
  'completedTasks.forEach(ct =>',
  'filteredCompleted.forEach(ct =>'
);
js = js.substring(0, newSectionIdx) + chunk + js.substring(newSectionIdx + 600);
console.log('Updated section to use filteredCompleted');

fs.writeFileSync('wallpaper-ui/wallpaper.js', js, 'utf8');
console.log('Done! Size:', Math.round(js.length/1024) + 'KB');
