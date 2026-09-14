const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'wallpaper-ui');
const indexPath = path.join(uiDir, 'index.html');
const cssPath = path.join(uiDir, 'style.css');
const jsPath = path.join(uiDir, 'wallpaper.js');

console.log('⚡ Aligning Mandatory Screen to 100% Pixel-Perfection...');

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Ensure body starts in mode-wallpaper (NOT mode-command)
html = html.replace(/<body class="theme-obsidian mode-command">/g, '<body class="theme-obsidian mode-wallpaper">');
html = html.replace(/<body class="([^"]*)mode-command([^"]*)">/g, '<body class="theme-obsidian mode-wallpaper">');

// 2. Ensure commandCenterDrawer starts collapsed
html = html.replace(/<div id="commandCenterDrawer" class="command-center-overlay">/g, '<div id="commandCenterDrawer" class="command-center-overlay collapsed">');

// 3. Update #wallpaperRoot with exact mandatory layout
const mandatoryWallpaperHtml = `  <!-- =========================================================================
       MANDATORY SCREEN: JAGADISH.K PORTFOLIO LIVE WALLPAPER (DO NOT CHANGE)
       ========================================================================= -->
  <div id="wallpaperRoot" class="wp-root">

    <!-- Top Minimalist Bar: Hexagon Portfolio Logo & Nav Links -->
    <header class="top-bar">
      <div class="brand-block" id="btnBrandPortfolio" title="Jagadish K Portfolio">
        <div class="brand-icon-box">
          <span class="brand-hex">&#x2B22;</span>
        </div>
        <div class="brand-meta">
          <span class="brand-name" id="topBrandName">JAGADISH.K</span>
          <span class="brand-sub">PORTFOLIO</span>
        </div>
      </div>

      <!-- Top Nav Links (ABOUT, PROJECTS, PRODUCTS, TOOLS, MOMENTS, RESUME, CONTACT) -->
      <nav class="top-nav-links" id="portfolioTopNav">
        <a href="#about" class="top-nav-link" id="navAbout">ABOUT</a>
        <a href="#projects" class="top-nav-link" id="navProjects">PROJECTS</a>
        <a href="#products" class="top-nav-link" id="navProducts">PRODUCTS</a>
        <a href="#tools" class="top-nav-link" id="navTools">TOOLS</a>
        <a href="#moments" class="top-nav-link" id="navMoments">MOMENTS</a>
        <a href="#resume" class="top-nav-link" id="navResume">RESUME</a>
        <button type="button" class="btn-top-contact" id="btnTopContact">CONTACT</button>
      </nav>

      <!-- Desktop Window Actions (Subtle Controls) -->
      <div class="top-window-controls subtle-win-ctrls">
        <button id="btnTopPinToggle" class="win-ctrl-btn" title="Toggle Desktop Background Pin Mode">
          <span class="ctrl-icon" id="topPinIcon">&#x1F4CC;</span>
        </button>
        <button id="btnTopMinimize" class="win-ctrl-btn" title="Minimize Window">
          <span class="ctrl-icon">&minus;</span>
        </button>
        <button id="btnTopMaximize" class="win-ctrl-btn" title="Maximize / Restore Window">
          <span class="ctrl-icon">&#x25A2;</span>
        </button>
        <button id="btnTopClose" class="win-ctrl-btn win-ctrl-close" title="Close Application">
          <span class="ctrl-icon">&times;</span>
        </button>
      </div>
    </header>

    <!-- Center Stage: Symmetrical Alignment of Left Tag, Giant Centerpiece & Right Tag -->
    <main class="center-stage" id="centerStage">
      <!-- Left Side Tag -->
      <div class="side-tag left-tag">
        <span class="tag-bold cyan-accent" id="leftTagRole">(TECHNICAL HEAD)</span>
        <span class="tag-muted white-accent" id="leftTagSub">FOUNDER &amp; ARCHITECT</span>
      </div>

      <!-- Giant Bold Centerpiece Typography: JAGADISH.K -->
      <div class="giant-name-backdrop pointer-events-none">
        <h1 class="giant-name" id="giantNameText">JAGADISH.K</h1>
      </div>

      <!-- 3D Interactive Floating Lanyard Card Overlapping Centerpiece -->
      <div id="lanyardContainer" class="lanyard-wrapper">
        <div id="lanyardCard" class="lanyard-card">
          <!-- Hanging Lanyard Neck Ribbon reaching top of screen -->
          <div class="lanyard-ribbon">
            <div class="ribbon-line"></div>
            <div class="metallic-clip">
              <div class="clip-slot"></div>
            </div>
          </div>

          <!-- Physical Badge Case Holder with Official ID Card Artwork -->
          <div class="card-frame" id="cardBadgeTrigger" title="Click to view Official Employee Badge or Open Workstation (Space)">
            <div class="card-glass-sheen"></div>
            <div class="card-image-box">
              <img id="badgeImg" src="assets/id-card.png" alt="REDDOT Technical Head Jagadish K" class="card-image" loading="eager" data-cache-key="badge_main_id_card" onerror="this.onerror=null; this.src='assets/id-card.png';">
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side Tag -->
      <div class="side-tag right-tag">
        <span class="tag-bold" id="rightTagRole">HARDWARE ARCHITECT &amp;</span>
        <span class="tag-muted white-accent" id="rightTagSub">EMBEDDED SYSTEMS</span>
      </div>
    </main>

    <!-- Bottom Bar: 01, Down Arrow, Watermark -->
    <footer class="bottom-bar">
      <div class="bottom-left">
        <div class="bottom-page-circle" title="Section 01">01</div>
      </div>

      <div class="bottom-center">
        <button id="btnOpenCommandCenter" class="bottom-arrow-btn" title="Open Workstation Command Center (Key: Space)">
          <span class="arrow-icon">&darr;</span>
        </button>
      </div>

      <div class="bottom-right">
        <div class="watermark-tag">
          <span class="watermark-sub" id="bottomUserEmail">TECHNICAL HEAD &amp; FOUNDER</span>
          <span class="watermark-bold" id="bottomBrandTag">JAGADISH.K &bull; 2026</span>
        </div>
      </div>
    </footer>

  </div>`;

const wpStart = '<div id="wallpaperRoot" class="wp-root">';
const wpEnd = '<div id="commandCenterDrawer"';

const sIdx = html.indexOf(wpStart);
const eIdx = html.indexOf(wpEnd);

if (sIdx !== -1 && eIdx !== -1) {
  html = html.slice(0, sIdx) + mandatoryWallpaperHtml + '\n\n  <!-- =========================================================================\n       ENTERPRISE ADMIN & WORKSTATION COMMAND CENTER\n       ========================================================================= -->\n  ' + html.slice(eIdx);
  console.log('✅ #wallpaperRoot replaced with Mandatory Screen layout');
} else {
  console.error('❌ Could not locate #wallpaperRoot boundaries');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ index.html updated successfully');

// =========================================================================
// 2. CSS ENHANCEMENTS FOR MANDATORY SCREEN & OPAQUE COMMAND CENTER
// =========================================================================
let css = fs.readFileSync(cssPath, 'utf8');

const mandatoryStyles = `
/* ==========================================================================
   MANDATORY SCREEN: JAGADISH.K PORTFOLIO LIVE WALLPAPER
   Exact pixel parity with user reference image
   ========================================================================== */
.wp-root {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 10 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  padding: 28px 56px !important;
  box-sizing: border-box !important;
  background: #050608 !important;
  overflow: hidden !important;
}

/* Architectural Grid Backdrop */
.grid-backdrop {
  position: fixed !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px) !important;
  background-size: 80px 80px !important;
  background-position: center center !important;
  z-index: 1 !important;
  pointer-events: none !important;
}

.vignette-overlay {
  position: fixed !important;
  inset: 0 !important;
  background: radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.95) 100%) !important;
  pointer-events: none !important;
  z-index: 2 !important;
}

/* Top Nav Links */
.top-nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
}

.top-nav-link {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: #8e8e9f;
  text-decoration: none;
  transition: color 0.15s ease;
}

.top-nav-link:hover {
  color: #ffffff;
}

.btn-top-contact {
  background: #ffffff !important;
  color: #000000 !important;
  font-family: var(--font-sans) !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  letter-spacing: 0.12em !important;
  padding: 7px 22px !important;
  border-radius: 20px !important;
  border: none !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  box-shadow: 0 2px 10px rgba(255, 255, 255, 0.25) !important;
}

.btn-top-contact:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.5) !important;
}

.subtle-win-ctrls {
  margin-left: 20px;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

/* Center Stage Side Tags */
.cyan-accent {
  color: #38bdf8 !important;
  font-family: var(--font-sans) !important;
  font-weight: 700 !important;
  font-size: 12.5px !important;
  letter-spacing: 0.08em !important;
}

.white-accent {
  color: #ffffff !important;
  font-family: var(--font-sans) !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  letter-spacing: 0.08em !important;
  margin-top: 4px !important;
}

.right-tag .tag-bold {
  font-family: var(--font-sans) !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  letter-spacing: 0.08em !important;
  color: #ffffff !important;
}

/* Giant Name Typography */
.giant-name-backdrop {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  text-align: center;
  z-index: 5;
  pointer-events: none;
}

.giant-name {
  font-family: var(--font-display, 'Space Grotesk', sans-serif) !important;
  font-size: clamp(6.5rem, 17.5vw, 20rem) !important;
  font-weight: 900 !important;
  letter-spacing: -0.04em !important;
  color: #ffffff !important;
  line-height: 0.85 !important;
  text-transform: uppercase !important;
  user-select: none !important;
  text-shadow: 0 20px 80px rgba(0, 0, 0, 0.95) !important;
}

/* 3D Lanyard Frame */
.lanyard-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
  perspective: 1200px;
}

.lanyard-card {
  position: relative;
  width: 295px;
  height: 472px;
  transform-style: preserve-3d;
  transition: transform 0.15s ease-out;
  cursor: pointer;
}

.lanyard-ribbon {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: -6px;
  z-index: 10;
}

.ribbon-line {
  width: 20px;
  height: 100vh;
  background: #111217;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.8);
}

.metallic-clip {
  width: 38px;
  height: 22px;
  background: #1f2129;
  border: 1px solid #333642;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.9);
  margin-top: -2px;
}

.clip-slot {
  width: 18px;
  height: 4px;
  background: #090a0d;
  border-radius: 2px;
}

.card-frame {
  position: relative;
  width: 100%;
  height: 100%;
  background: #111217;
  border: 8px solid #14151a;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 
    0 40px 100px rgba(0, 0, 0, 0.98),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 12px 35px rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image-box {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Bottom Bar: 01, Arrow, Watermark */
.bottom-page-circle {
  width: 26px;
  height: 26px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans);
  font-size: 10.5px;
  font-weight: 700;
  color: #ffffff;
}

.bottom-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 24px;
}

.bottom-arrow-btn {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  background: transparent;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bottom-arrow-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.7);
  transform: translateY(2px);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
}

.bottom-bar .watermark-tag {
  text-align: right;
}

.bottom-bar .watermark-sub {
  font-family: var(--font-sans);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #8a8d9b;
}

.bottom-bar .watermark-bold {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #ffffff;
  margin-top: 2px;
}

/* ==========================================================================
   COMMAND CENTER DRAWER: CLEAN OPAQUE WORKSTATION OVERLAY
   ========================================================================== */
.command-center-overlay.collapsed {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

.command-center-overlay:not(.collapsed) {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: #090a0f !important;
  z-index: 100000 !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 0 !important;
  margin: 0 !important;
  border-radius: 0 !important;
  border: none !important;
}

.command-center-overlay:not(.collapsed) .command-center-shell {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  border-radius: 0 !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  background: #090a0f !important;
  box-shadow: none !important;
}
`;

css += '\n\n' + mandatoryStyles;
fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ style.css updated with Mandatory Screen & Opaque Drawer styles');

// =========================================================================
// 3. WALLPAPER.JS: CONTACT & ARROW BUTTON WIREUP
// =========================================================================
let js = fs.readFileSync(jsPath, 'utf8');

const additionalWireup = `
// Wire up portfolio nav links & bottom arrow
document.addEventListener('DOMContentLoaded', () => {
  const arrowBtn = document.getElementById('btnOpenCommandCenter');
  if (arrowBtn) {
    arrowBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCommandCenter();
    });
  }

  const contactBtn = document.getElementById('btnTopContact');
  if (contactBtn) {
    contactBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCommandCenter();
      switchTab('chat');
    });
  }

  const navTools = document.getElementById('navTools');
  if (navTools) {
    navTools.addEventListener('click', (e) => {
      e.preventDefault();
      openCommandCenter();
      switchTab('dashboard');
    });
  }

  const navProjects = document.getElementById('navProjects');
  if (navProjects) {
    navProjects.addEventListener('click', (e) => {
      e.preventDefault();
      openCommandCenter();
      switchTab('tasks');
    });
  }
});
`;

if (!js.includes('btnTopContact')) {
  js += '\n\n' + additionalWireup;
  fs.writeFileSync(jsPath, js, 'utf8');
  console.log('✅ wallpaper.js updated with Portfolio Nav wireup');
}
