const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', 'wallpaper-ui', 'wallpaper.js');
const js = fs.readFileSync(jsPath, 'utf8');

function findBlock(name, startPattern, endPattern) {
  const startIdx = js.indexOf(startPattern);
  if (startIdx === -1) {
    console.log(`[${name}] START NOT FOUND: "${startPattern}"`);
    return null;
  }
  const endIdx = js.indexOf(endPattern, startIdx);
  if (endIdx === -1) {
    console.log(`[${name}] END NOT FOUND: "${endPattern}"`);
    return null;
  }
  const block = js.slice(startIdx, endIdx);
  console.log(`[${name}] Found block from index ${startIdx} to ${endIdx} (length: ${block.length})`);
  return { startIdx, endIdx, block };
}

findBlock('tasks_management', '  // --- TASKS MANAGEMENT ---', '  function ensureEditTaskModal() {');
findBlock('edit_task_modal', '  function ensureEditTaskModal() {', '  function openTaskActivityModal(task) {');
findBlock('open_task_drawer', '  function openTaskDrawer(task) {', '  // --- DUAL THEME ENGINE ---');
findBlock('bind_v3_listeners', '  function bindV3EventListeners() {', '  // --- ENTERPRISE BOOTLOADER ANIMATION ---');
findBlock('form_edit_task', "document.getElementById('formEditTask')?.addEventListener('submit'", "    // --- TEAMS CHANNEL HUB TABS ---");
