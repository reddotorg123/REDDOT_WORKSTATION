const fs = require('fs');
let js = fs.readFileSync('wallpaper-ui/wallpaper.js', 'utf8');

// Fix openEditTaskModal: show delete btn before modal.classList.remove('hidden')
// Find the exact position in openEditTaskModal
const editFuncIdx = js.indexOf('function openEditTaskModal(task, focusField');
if (editFuncIdx === -1) { console.error('FAIL: openEditTaskModal not found'); process.exit(1); }

// Find 'modal.classList.remove' inside openEditTaskModal (not openCreateTaskModal)
// Search forward from editFuncIdx
const modalRemoveIdx = js.indexOf("modal.classList.remove('hidden');\n    setTimeout", editFuncIdx);
if (modalRemoveIdx === -1) { console.error('FAIL: modal.classList.remove not found in openEditTaskModal'); process.exit(1); }

// Make sure we haven't already added the delete btn code
const beforeRemove = js.substring(modalRemoveIdx - 300, modalRemoveIdx);
if (beforeRemove.includes('deleteModalBtnEdit')) {
  console.log('SKIP: Edit modal already has delete button show code');
} else {
  const INSERT_CODE = [
    '    // Show delete button in edit mode',
    '    const deleteModalBtnEdit = document.getElementById("btnDeleteTaskFromModal");',
    '    if (deleteModalBtnEdit) deleteModalBtnEdit.style.display = "flex";',
    '    const saveBtnEdit = document.getElementById("btnSaveEditTask");',
    '    if (saveBtnEdit) saveBtnEdit.textContent = "\uD83D\uDCBE Save Task Changes";',
    '',
    '    ',
  ].join('\n');
  js = js.substring(0, modalRemoveIdx) + INSERT_CODE + js.substring(modalRemoveIdx);
  console.log('OK: openEditTaskModal now shows delete button on open');
}

// Also check openCreateTaskModal for save button text fix
const createFuncIdx = js.indexOf('function openCreateTaskModal()');
if (createFuncIdx !== -1) {
  const createRemoveIdx = js.indexOf("modal.classList.remove('hidden')", createFuncIdx);
  const beforeCreate = js.substring(createRemoveIdx - 400, createRemoveIdx);
  if (!beforeCreate.includes('deleteModalBtn')) {
    console.log('WARN: Create modal delete hide not found - adding...');
  } else {
    console.log('OK: Create modal delete hide already in place');
  }
}

fs.writeFileSync('wallpaper-ui/wallpaper.js', js, 'utf8');
console.log('Done! Size:', Math.round(js.length/1024) + 'KB');

// Verify syntax
const { execSync } = require('child_process');
try {
  execSync('node --check wallpaper-ui/wallpaper.js', { cwd: process.cwd() });
  console.log('OK: Syntax check passed');
} catch (e) {
  console.error('ERROR: Syntax error in wallpaper.js:', e.message);
}
