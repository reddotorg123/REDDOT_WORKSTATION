const fs = require('fs');

// Fix the delete button in index.html to start as display:none
let html = fs.readFileSync('wallpaper-ui/index.html', 'utf8');

const btnIdx = html.indexOf('id="btnDeleteTaskFromModal"');
if (btnIdx === -1) { console.error('FAIL: btnDeleteTaskFromModal not found in HTML'); process.exit(1); }

// Find the style attribute value
const styleAttrStart = html.indexOf('style="', btnIdx);
const styleAttrEnd = html.indexOf('"', styleAttrStart + 7);
const oldStyle = html.substring(styleAttrStart + 7, styleAttrEnd);
console.log('Current style:', oldStyle.substring(0, 80) + '...');

// Replace display: flex with display: none
let newStyle = oldStyle;
if (oldStyle.includes('display: flex')) {
  newStyle = oldStyle.replace('display: flex', 'display: none');
} else if (oldStyle.includes('display:flex')) {
  newStyle = oldStyle.replace('display:flex', 'display:none');
} else {
  // If display is already none, skip
  if (oldStyle.includes('display: none') || oldStyle.includes('display:none')) {
    console.log('SKIP: Already display:none');
    process.exit(0);
  }
  console.log('WARN: no display found in style, appending none');
  newStyle = oldStyle + '; display: none';
}

html = html.substring(0, styleAttrStart + 7) + newStyle + html.substring(styleAttrEnd);
fs.writeFileSync('wallpaper-ui/index.html', html, 'utf8');

// Verify
const html2 = fs.readFileSync('wallpaper-ui/index.html', 'utf8');
const btnIdx2 = html2.indexOf('id="btnDeleteTaskFromModal"');
const sa2 = html2.indexOf('style="', btnIdx2);
const se2 = html2.indexOf('"', sa2 + 7);
const finalStyle = html2.substring(sa2 + 7, se2);
console.log('New style:', finalStyle.substring(0, 100) + '...');
console.log(finalStyle.includes('display: none') || finalStyle.includes('display:none') ? 'OK: display:none confirmed' : 'WARN: still not none');
