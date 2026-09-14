const fs = require('fs');
const path = require('path');

const uiDir = path.resolve(__dirname, '../wallpaper-ui');
const indexPath = path.join(uiDir, 'index.html');
const jsPath = path.join(uiDir, 'wallpaper.js');
const cssPath = path.join(uiDir, 'style.css');

console.log('=== Executing Clean Theme Overhaul ===');

// 1. UPDATE index.html
let html = fs.readFileSync(indexPath, 'utf8');

// Ensure body has theme-obsidian theme-dark
html = html.replace(
  /<body class="[^"]*">/,
  '<body class="theme-obsidian theme-dark mode-wallpaper">'
);

// Replace top bar: Remove portfolio nav links, restore clean window controls
const topBarRegex = /<!-- Top Minimalist Bar: Hexagon Portfolio Logo & Nav Links -->[\s\S]*?<\/header>/;
const cleanTopBar = `<!-- Top Minimalist Bar: Clean Branding & Window Controls -->
    <header class="top-bar">
      <div class="brand-block" id="btnBrandHome" title="Open Command Center (Key: Space)">
        <div class="brand-icon-box">
          <span class="brand-hex">&#x2B22;</span>
        </div>
        <div class="brand-meta">
          <span class="brand-name" id="topBrandName">REDDOT WORKSTATION</span>
          <span class="brand-sub">WORKSPACE</span>
        </div>
      </div>

      <!-- Top Window Actions & Mode Controls -->
      <div class="top-window-controls">
        <button type="button" id="topOtaPill" class="ota-header-pill hidden" title="New update available! Click to update now">
          <span class="ota-pill-dot"></span>
          <span id="topOtaPillText">⚡ UPDATE v2.5.5</span>
        </button>
        <button id="btnTopPinToggle" class="win-ctrl-btn" title="Toggle Desktop Background Pin Mode">
          <span class="ctrl-icon" id="topPinIcon">📌</span>
          <span class="ctrl-text" id="topPinText">Pin Mode</span>
        </button>
        <button id="btnTopMinimize" class="win-ctrl-btn" title="Minimize Window">
          <span class="ctrl-icon">&minus;</span>
        </button>
        <button id="btnTopMaximize" class="win-ctrl-btn" title="Maximize / Restore Window">
          <span class="ctrl-icon">&#x25A2;</span>
        </button>
        <button id="btnTopClose" class="win-ctrl-btn win-ctrl-close" title="Close REDDOT Workstation">
          <span class="ctrl-icon">&times;</span>
        </button>
      </div>
    </header>`;

if (topBarRegex.test(html)) {
  html = html.replace(topBarRegex, cleanTopBar);
  console.log('✓ Replaced top bar with clean branding & window controls');
} else {
  console.warn('! Top bar regex did not match, checking fallback');
}

// Replace bottom bar: Remove 01 and down arrow, restore COMMAND CENTER [SPACE] dock button
const bottomBarRegex = /<!-- Bottom Bar: 01, Down Arrow, Watermark -->[\s\S]*?<\/footer>/;
const cleanBottomBar = `<!-- Bottom Bar: Watermark & Reveal Dock -->
    <footer class="bottom-bar">
      <div class="bottom-left">
        <button id="btnOpenCommandCenter" class="stealth-dock-btn" title="Open Enterprise Command Center (Key: Space)">
          <span class="btn-icon">&#x29E2;</span>
          <span class="btn-text">COMMAND CENTER</span>
          <span class="hotkey-pill">SPACE</span>
        </button>
      </div>

      <div class="bottom-right">
        <div class="watermark-tag">
          <span class="watermark-sub" id="bottomUserEmail">TECHNICAL HEAD &amp; FOUNDER</span>
          <span class="watermark-bold" id="bottomBrandTag">JAGADISH.K &bull; 2026</span>
        </div>
      </div>
    </footer>`;

if (bottomBarRegex.test(html)) {
  html = html.replace(bottomBarRegex, cleanBottomBar);
  console.log('✓ Replaced bottom bar with clean COMMAND CENTER [SPACE] dock button');
} else {
  console.warn('! Bottom bar regex did not match, checking fallback');
}

// Replace theme toggle icon to Moon by default
html = html.replace(
  /<span id="themeToggleIcon">[^<]*<\/span>/,
  '<span id="themeToggleIcon">&#x1F319;</span>'
);
console.log('✓ Set default theme toggle icon to Moon (🌙)');

// Remove portfolio modals before </body>
const modalsRegex = /<!-- =========================================================================\s*PORTFOLIO MODALS[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(?=\s*<\/body>)/;
if (modalsRegex.test(html)) {
  html = html.replace(modalsRegex, '');
  console.log('✓ Removed portfolio modals from DOM');
} else {
  // Try alternate regex
  const altModalsRegex = /<!-- PORTFOLIO ABOUT MODAL -->[\s\S]*?<!-- PORTFOLIO MOMENTS MODAL -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(?=\s*<\/body>)/;
  if (altModalsRegex.test(html)) {
    html = html.replace(altModalsRegex, '');
    console.log('✓ Removed portfolio modals (alt regex) from DOM');
  }
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html saved successfully');


// 2. UPDATE wallpaper.js
let js = fs.readFileSync(jsPath, 'utf8');

// Update initThemeEngine & applyTheme
const themeEngineTarget = `  // --- DUAL THEME ENGINE ---
  function initThemeEngine() {
    const saved = localStorage.getItem('reddot_theme') || 'dark';
    applyTheme(saved);

    document.getElementById('btnThemeToggle')?.addEventListener('click', () => {
      const isDark = document.body.classList.contains('theme-dark');
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      playNotificationChirp(true);
      showQuickToast(\`Switched to \${next === 'light' ? 'Light Enterprise' : 'Obsidian Crimson Dark'} theme.\`, 'info');
    });

    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        document.getElementById('btnThemeToggle')?.click();
      }
    });
  }

  function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-obsidian');
    const icon = document.getElementById('themeToggleIcon');
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
      if (icon) icon.textContent = '🌙';
      localStorage.setItem('reddot_theme', 'dark');
    } else {
      document.body.classList.add('theme-light');
      if (icon) icon.textContent = '☀️';
      localStorage.setItem('reddot_theme', 'light');
    }
  }`;

const themeEngineReplacement = `  // --- DUAL THEME ENGINE (OBSIDIAN DARK FIRST-CLASS) ---
  function initThemeEngine() {
    let saved = localStorage.getItem('reddot_theme');
    // Enforce dark theme by default, clear any stale 'light' preference
    if (!saved || saved === 'light') {
      saved = 'dark';
      localStorage.setItem('reddot_theme', 'dark');
    }
    applyTheme(saved);

    document.getElementById('btnThemeToggle')?.addEventListener('click', () => {
      const isDark = document.body.classList.contains('theme-dark') || document.body.classList.contains('theme-obsidian');
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      playNotificationChirp(true);
      showQuickToast(\`Switched to \${next === 'light' ? 'Light Enterprise' : 'Obsidian Crimson Dark'} theme.\`, 'info');
    });

    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        document.getElementById('btnThemeToggle')?.click();
      }
    });
  }

  function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-obsidian');
    const icon = document.getElementById('themeToggleIcon');
    if (theme === 'dark') {
      document.body.classList.add('theme-dark', 'theme-obsidian');
      if (icon) icon.textContent = '🌙';
      localStorage.setItem('reddot_theme', 'dark');
    } else {
      document.body.classList.add('theme-light');
      if (icon) icon.textContent = '☀️';
      localStorage.setItem('reddot_theme', 'light');
    }
  }`;

if (js.includes(themeEngineTarget)) {
  js = js.replace(themeEngineTarget, themeEngineReplacement);
  console.log('✓ Updated initThemeEngine & applyTheme to enforce Obsidian Dark theme');
} else {
  console.warn('! themeEngineTarget exact match not found, searching with regex');
  const teRegex = /\/\/\s*---\s*DUAL THEME ENGINE[\s\S]*?localStorage\.setItem\('reddot_theme',\s*'light'\);\s*\}\s*\}/;
  if (teRegex.test(js)) {
    js = js.replace(teRegex, themeEngineReplacement.trim());
    console.log('✓ Updated initThemeEngine & applyTheme via regex');
  }
}

// Update initPortfolioFirstScreen
const portfolioScreenRegex = /\/\/\s*==+\s*\n\s*\/\/\s*PORTFOLIO FIRST SCREEN WIREUP & MODALS[\s\S]*?function initPortfolioFirstScreen\(\)\s*\{[\s\S]*?\n  \}/;
const cleanPortfolioScreen = `// =========================================================================
  // WALLPAPER FIRST SCREEN WIREUP (CLEAN CONTROLS & COMMAND DOCK)
  // =========================================================================
  function initPortfolioFirstScreen() {
    // Dock Button & Lanyard Badge Click -> Open Command Center
    document.getElementById('btnOpenCommandCenter')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openCommandCenter();
    });

    document.getElementById('cardBadgeTrigger')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openCommandCenter();
    });

    document.getElementById('btnBrandHome')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCommandCenter();
    });

    document.getElementById('btnBrandPortfolio')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCommandCenter();
    });
  }`;

if (portfolioScreenRegex.test(js)) {
  js = js.replace(portfolioScreenRegex, cleanPortfolioScreen);
  console.log('✓ Streamlined initPortfolioFirstScreen (removed unused modal/nav handlers)');
} else {
  console.warn('! portfolioScreenRegex did not match');
}

fs.writeFileSync(jsPath, js, 'utf8');
console.log('✓ wallpaper.js saved successfully');


// 3. UPDATE style.css
let css = fs.readFileSync(cssPath, 'utf8');

// Remove .top-nav-links, .top-nav-link, .btn-top-contact, .subtle-win-ctrls
const topNavCssRegex = /\/\* Top Portfolio Nav Links \*\/[\s\S]*?\.subtle-win-ctrls[\s\S]*?padding:\s*0\s*!important;\s*\}/;
if (topNavCssRegex.test(css)) {
  css = css.replace(topNavCssRegex, '/* Top Window Controls Reverted to Clean Native Standard */');
  console.log('✓ Removed top-nav-links styles from style.css');
}

// Remove bottom 01 / arrow styles
const bottomArrowCssRegex = /\/\* Bottom Bar: 01, Arrow, Watermark \*\/[\s\S]*?\.bottom-arrow-btn:hover[\s\S]*?\}\s*\}/;
if (bottomArrowCssRegex.test(css)) {
  css = css.replace(bottomArrowCssRegex, '/* Bottom Bar Reverted to Clean Stealth Dock */');
  console.log('✓ Removed bottom-page-circle and bottom-arrow-btn styles from style.css');
}

// Remove portfolio modals styles
const portfolioModalsCssRegex = /\/\* Portfolio Modals Styling \*\/[\s\S]*?\.btn-modal-action-pri:hover[\s\S]*?\}\s*\}/;
if (portfolioModalsCssRegex.test(css)) {
  css = css.replace(portfolioModalsCssRegex, '/* Portfolio Modals Cleaned */');
  console.log('✓ Removed portfolio modals styles from style.css');
}

// Ensure .bottom-bar is flex space-between
const bottomBarEnsure = `
.wp-root .bottom-bar {
  position: relative !important;
  width: 100% !important;
  display: flex !important;
  align-items: flex-end !important;
  justify-content: space-between !important;
  z-index: 25 !important;
}

.wp-root .stealth-dock-btn {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  padding: 8px 18px !important;
  border-radius: 8px !important;
  color: #94a3b8 !important;
  font-family: var(--font-sans, 'Inter', sans-serif) !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.08em !important;
  cursor: pointer !important;
  transition: all 0.18s ease !important;
  opacity: 0.85 !important;
}

.wp-root .stealth-dock-btn:hover {
  opacity: 1 !important;
  background: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
  border-color: rgba(56, 189, 248, 0.4) !important;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5), 0 0 12px rgba(56, 189, 248, 0.2) !important;
}
`;
css = css + '\n' + bottomBarEnsure;

fs.writeFileSync(cssPath, css, 'utf8');
console.log('✓ style.css saved successfully');
console.log('=== All modifications complete! ===');
