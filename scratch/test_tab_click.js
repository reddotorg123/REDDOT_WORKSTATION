const fs = require('fs');
const path = require('path');
const js = fs.readFileSync(path.join(__dirname, '..', 'wallpaper-ui', 'wallpaper.js'), 'utf8');

const pos = js.indexOf("document.getElementById('tabBtnTimesheets')");
console.log('Position:', pos);

// Search backwards for the function declaration
const sub = js.slice(0, pos);
const fnIdx = sub.lastIndexOf('function ');
console.log('Enclosing function:', js.slice(fnIdx, fnIdx + 100));

// Check if that function was called on startup!
const fnName = js.slice(fnIdx, fnIdx + 40).match(/function\s+([a-zA-Z0-9_$]+)/)?.[1];
console.log('Function name:', fnName);

let callPos = 0;
let calls = 0;
while ((callPos = js.indexOf(fnName + '(', callPos)) !== -1) {
  calls++;
  console.log(`Call #${calls} at ${callPos}:`, js.slice(callPos - 30, callPos + 50));
  callPos += fnName.length + 1;
}
