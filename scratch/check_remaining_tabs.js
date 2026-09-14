const fs = require('fs');
const s = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

function checkSection(id) {
  const pos = s.indexOf(`id="${id}"`);
  if (pos === -1) {
    console.log(`Section ${id} not found`);
    return;
  }
  const nextSection = s.indexOf('<section', pos + 10);
  const end = nextSection !== -1 ? nextSection : s.indexOf('</main>', pos);
  const content = s.substring(pos, end);
  const fakeChecks = ['Elena', 'Marcus', 'Alex Rivera', 'Rostova', 'Chen', 'Sharma', 'Vikram', 'Ananya', '24 Nodes', '18 Online'];
  const found = fakeChecks.filter(f => content.includes(f));
  console.log(`Section ${id}: length ${content.length}, fake matches:`, found);
}

['tabDatabaseView', 'tabWallpapersView', 'tabChatView'].forEach(checkSection);
