const fs = require('fs');
const html = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

console.log('header pos:', html.indexOf('<header class="command-header'));
console.log('main pos:', html.indexOf('<main class="command-body">'));
console.log('tabChatView pos:', html.indexOf('id="tabChatView"'));
console.log('tabTelemetryView pos:', html.indexOf('id="tabTelemetryView"'));
