const fs = require('fs');

// 1. Update wallpaper.js
const jsFile = 'wallpaper-ui/wallpaper.js';
let js = fs.readFileSync(jsFile, 'utf8');
const targetJs = '              <img src="${safePhoto}" alt="" referrerpolicy="no-referrer" class="worker-avatar-img" onerror="this.style.display=\'none\'; if(this.nextElementSibling) this.nextElementSibling.style.display=\'flex\';">';
const replaceJs = '              <div class="worker-avatar-img-wrap">\n                <img src="${safePhoto}" alt="" referrerpolicy="no-referrer" class="worker-avatar-img" style="width: 52px; height: 52px; max-width: 52px; max-height: 52px; object-fit: cover; border-radius: 11px; display: block;" onerror="this.parentElement.style.display=\'none\'; if(this.parentElement.nextElementSibling) this.parentElement.nextElementSibling.style.display=\'flex\';">\n              </div>';

if (js.includes(targetJs)) {
  js = js.replace(targetJs, replaceJs);
  fs.writeFileSync(jsFile, js, 'utf8');
  console.log('Updated wallpaper.js successfully');
} else {
  console.log('Target not found in wallpaper.js');
}

// 2. Sync to portable build resources
const srcDir = 'wallpaper-ui';
const destDir = 'app/v2.5.1/REDDOT-Workstation-OS-Portable/resources/app/wallpaper-ui';
['style.css', 'wallpaper.js', 'index.html', 'firebase-service.js', 'firebase-config.js'].forEach(file => {
  fs.copyFileSync(`${srcDir}/${file}`, `${destDir}/${file}`);
  console.log(`Synced ${file} to portable resources`);
});
