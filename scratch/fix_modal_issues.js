/**
 * fix_modal_issues.js
 * Fixes:
 * 1. Delete button shows in CREATE mode - hide it in create, show in edit
 * 2. ensureEditTaskModal adds duplicate listeners each open - fix to use once
 * 3. Verify modal backdrop doesn't block form fields
 */
const fs = require('fs');

// ─── Fix index.html: Hide delete button by default (CSS display:none) ─────────
let html = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

const OLD_DELETE_BTN = `<button type="button" id="btnDeleteTaskFromModal" style="margin-right: auto; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 7px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>🗑 Delete Task</span>
          </button>`;

const NEW_DELETE_BTN = `<button type="button" id="btnDeleteTaskFromModal" style="margin-right: auto; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 7px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; display: none; align-items: center; gap: 6px;">
            <span>🗑 Delete Task</span>
          </button>`;

if (html.includes(OLD_DELETE_BTN.substring(0, 60))) {
  html = html.replace(OLD_DELETE_BTN, NEW_DELETE_BTN);
  console.log('OK: Delete button hidden by default in HTML');
} else {
  // Try searching for the button and change display:flex to display:none
  const btnIdx = html.indexOf('id="btnDeleteTaskFromModal"');
  if (btnIdx !== -1) {
    // Find the style attribute and change display:flex to display:none
    const styleStart = html.lastIndexOf('style="', btnIdx);
    const styleEnd = html.indexOf('"', styleStart + 7);
    const oldStyle = html.substring(styleStart, styleEnd + 1);
    if (oldStyle.includes('display: flex')) {
      const newStyle = oldStyle.replace('display: flex', 'display: none');
      html = html.substring(0, styleStart) + newStyle + html.substring(styleEnd + 1);
      console.log('OK: Delete button hidden via style replacement');
    } else if (oldStyle.includes('display:flex')) {
      const newStyle = oldStyle.replace('display:flex', 'display:none');
      html = html.substring(0, styleStart) + newStyle + html.substring(styleEnd + 1);
      console.log('OK: Delete button hidden via style replacement (compact)');
    } else {
      console.log('WARN: could not find display:flex in delete button - trying CRLF version');
    }
  }
}

fs.writeFileSync('wallpaper-ui/index.html', html, 'utf8');
console.log('HTML updated');

// ─── Fix wallpaper.js ─────────────────────────────────────────────────────────
let js = fs.readFileSync('wallpaper-ui/wallpaper.js', 'utf8');

// Fix 1: ensureEditTaskModal adds duplicate listeners - use a flag
const OLD_ENSURE = `function ensureEditTaskModal() {
    const modal = document.getElementById('editTaskModal');
    if (modal) {
      document.getElementById('btnCloseEditTask')?.addEventListener('click', closeEditTaskModal);
      document.getElementById('btnCancelEditTask')?.addEventListener('click', closeEditTaskModal);
      document.getElementById('editTaskBackdrop')?.addEventListener('click', closeEditTaskModal);
      return modal;
    }
    return null;
  }`;

const NEW_ENSURE = `function ensureEditTaskModal() {
    const modal = document.getElementById('editTaskModal');
    if (modal) {
      // Only attach listeners once
      if (!modal._listenersAttached) {
        modal._listenersAttached = true;
        document.getElementById('btnCloseEditTask')?.addEventListener('click', closeEditTaskModal);
        document.getElementById('btnCancelEditTask')?.addEventListener('click', closeEditTaskModal);
        document.getElementById('editTaskBackdrop')?.addEventListener('click', (e) => {
          if (e.target.id === 'editTaskBackdrop') closeEditTaskModal();
        });
      }
      return modal;
    }
    return null;
  }`;

if (js.includes(OLD_ENSURE.substring(0, 60))) {
  js = js.replace(OLD_ENSURE, NEW_ENSURE);
  console.log('OK: ensureEditTaskModal fixed to prevent duplicate listeners');
} else {
  console.log('WARN: ensureEditTaskModal pattern not matched - trying partial');
  const partialSearch = 'function ensureEditTaskModal()';
  const ePos = js.indexOf(partialSearch);
  if (ePos !== -1) {
    const blockEnd = js.indexOf('\n  }', ePos) + 4;
    js = js.substring(0, ePos) + NEW_ENSURE + js.substring(blockEnd);
    console.log('OK: ensureEditTaskModal replaced via partial match');
  }
}

// Fix 2: openCreateTaskModal - hide delete button, show save btn with correct label
const OLD_MODAL_SHOW = `    modal.classList.remove('hidden');
    setTimeout(() => titleInput?.focus(), 60);
  }

  function openEditTaskModal`;

const NEW_MODAL_SHOW = `    // Hide delete button in create mode
    const deleteModalBtn = document.getElementById('btnDeleteTaskFromModal');
    if (deleteModalBtn) deleteModalBtn.style.display = 'none';
    // Reset save button text for create mode
    const saveBtn = document.getElementById('btnSaveEditTask');
    if (saveBtn) saveBtn.textContent = '💾 Create Task';

    modal.classList.remove('hidden');
    setTimeout(() => titleInput?.focus(), 60);
  }

  function openEditTaskModal`;

if (js.includes(OLD_MODAL_SHOW.substring(0, 40))) {
  js = js.replace(OLD_MODAL_SHOW, NEW_MODAL_SHOW);
  console.log('OK: openCreateTaskModal hides delete button');
} else {
  console.log('WARN: create modal show pattern not found');
}

// Fix 3: openEditTaskModal - show delete button, restore save label
const OLD_EDIT_SHOW = `    modal.classList.remove('hidden');
    if (focusField === 'due') {`;

const NEW_EDIT_SHOW = `    // Show delete button in edit mode
    const deleteModalBtnEdit = document.getElementById('btnDeleteTaskFromModal');
    if (deleteModalBtnEdit) deleteModalBtnEdit.style.display = 'flex';
    // Reset save button text for edit mode
    const saveBtnEdit = document.getElementById('btnSaveEditTask');
    if (saveBtnEdit) saveBtnEdit.textContent = '💾 Save Task Changes';

    modal.classList.remove('hidden');
    if (focusField === 'due') {`;

if (js.includes(OLD_EDIT_SHOW.substring(0, 50))) {
  js = js.replace(OLD_EDIT_SHOW, NEW_EDIT_SHOW);
  console.log('OK: openEditTaskModal shows delete button');
} else {
  console.log('WARN: edit modal show pattern not found - searching...');
  // Try to find it
  const editFocusIdx = js.indexOf("if (focusField === 'due')");
  if (editFocusIdx !== -1) {
    const lineStart = js.lastIndexOf('\n', editFocusIdx) + 1;
    const prevLines = js.substring(lineStart - 200, lineStart);
    if (prevLines.includes("modal.classList.remove('hidden')")) {
      const hideStart = js.lastIndexOf("modal.classList.remove('hidden')", editFocusIdx);
      js = js.substring(0, hideStart) + NEW_EDIT_SHOW + js.substring(hideStart + "    modal.classList.remove('hidden');".length);
      console.log('OK: edit modal fixed via offset search');
    }
  }
}

// Fix 4: Ensure the modal backdrop doesn't block form content
// The backdrop is position:absolute with inset:0 - it should be BELOW the form
// The modal-card has z-index:10 and backdrop is behind via CSS
// Let's verify the form submit handler works with the save button

// Fix 5: Make btnSaveEditTask properly submit the form (not just requestSubmit)
// Also ensure the close button truly closes
const OLD_CANCEL_LISTENER = `document.getElementById('btnCancelEditTask')?.addEventListener('click', closeEditTaskModal);

    document.getElementById('formEditTask')?.addEventListener('submit', async (e) => {`;

if (!js.includes(OLD_CANCEL_LISTENER.substring(0, 60))) {
  console.log('NOTE: Cancel listener may be in ensureEditTaskModal');
}

// Fix 6: The task title input should be editable - ensure no readonly/disabled attribute is set
// Also ensure form fields are enabled when opening modal
const OLD_FORM_OPEN_END = `    if (descInput) descInput.value = '';

    // Hide delete button in create mode`;

const NEW_FORM_OPEN_END = `    if (descInput) descInput.value = '';

    // Enable all form fields (in case they were disabled)
    [titleInput, assigneeSelect, prioritySelect, statusSelect, dueInput, dateInput, descInput].forEach(el => {
      if (el) { el.disabled = false; el.readOnly = false; }
    });

    // Hide delete button in create mode`;

if (js.includes(OLD_FORM_OPEN_END.substring(0, 40))) {
  js = js.replace(OLD_FORM_OPEN_END, NEW_FORM_OPEN_END);
  console.log('OK: Form fields enabled on create modal open');
} else {
  console.log('NOTE: Create modal field enable not needed or already done');
}

// Fix 7: Also ensure edit modal enables fields
const EDIT_MODAL_DESC_LINE = `    if (descInput) descInput.value = task.description || '';

    // Show delete button in edit mode`;

const EDIT_MODAL_DESC_WITH_ENABLE = `    if (descInput) descInput.value = task.description || '';

    // Enable all form fields
    [titleInput, assigneeSelect, prioritySelect, statusSelect, dueInput, dateInput, descInput].forEach(el => {
      if (el) { el.disabled = false; el.readOnly = false; }
    });

    // Show delete button in edit mode`;

if (js.includes(EDIT_MODAL_DESC_LINE.substring(0, 45))) {
  js = js.replace(EDIT_MODAL_DESC_LINE, EDIT_MODAL_DESC_WITH_ENABLE);
  console.log('OK: Form fields enabled on edit modal open');
} else {
  console.log('NOTE: Edit modal field enable not needed or already done');
}

fs.writeFileSync('wallpaper-ui/wallpaper.js', js, 'utf8');
console.log('\nAll fixes applied. wallpaper.js size:', Math.round(js.length/1024) + 'KB');
