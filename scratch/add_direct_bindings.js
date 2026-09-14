const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const uiJsPath = path.join(root, 'wallpaper-ui', 'wallpaper.js');
let js = fs.readFileSync(uiJsPath, 'utf8');

const target = '    // Omnibox Header Trigger';
const extraBindings = `    // Teams Rail direct button bindings
    document.getElementById('railBtnActivity')?.addEventListener('click', () => switchTeamsRailTab('activity'));
    document.getElementById('railBtnChat')?.addEventListener('click', () => switchTeamsRailTab('chat'));
    document.getElementById('railBtnCalendar')?.addEventListener('click', () => switchTeamsRailTab('calendar'));
    document.getElementById('railBtnCalls')?.addEventListener('click', () => switchTeamsRailTab('calls'));
    document.getElementById('railBtnFiles')?.addEventListener('click', () => switchTeamsRailTab('files'));
    document.getElementById('railBtnSaved')?.addEventListener('click', () => switchTeamsRailTab('saved'));

    // Hub Tab direct button bindings
    document.getElementById('hubTabBtnPosts')?.addEventListener('click', () => switchChatHubTab('posts'));
    document.getElementById('hubTabBtnFiles')?.addEventListener('click', () => switchChatHubTab('files'));
    document.getElementById('hubTabBtnPinned')?.addEventListener('click', () => switchChatHubTab('pinned'));
    document.getElementById('hubTabBtnAbout')?.addEventListener('click', () => switchChatHubTab('about'));

    // Submit button helpers
    document.getElementById('btnSaveEditTask')?.addEventListener('click', () => {
      document.getElementById('formEditTask')?.requestSubmit?.();
    });
    document.getElementById('btnSubmitCreateChannel')?.addEventListener('click', () => {
      document.getElementById('formCreateChannelModal')?.requestSubmit?.();
    });
    document.getElementById('btnSubmitEditChannel')?.addEventListener('click', () => {
      document.getElementById('formEditChannelModal')?.requestSubmit?.();
    });
    document.getElementById('btnSubmitLinkPhoto')?.addEventListener('click', () => {
      document.getElementById('formLinkPhotoModal')?.requestSubmit?.();
    });

`;

if (!js.includes('railBtnActivity')) {
  js = js.replace(target, extraBindings + target);
  fs.writeFileSync(uiJsPath, js, 'utf8');
  console.log('✅ Added extra direct button bindings');
} else {
  console.log('Already includes railBtnActivity');
}
