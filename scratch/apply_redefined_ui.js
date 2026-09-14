const fs = require('fs');
const path = require('path');

const uiDir = path.resolve(__dirname, '../wallpaper-ui');
const indexPath = path.join(uiDir, 'index.html');
const cssPath = path.join(uiDir, 'style.css');

console.log('=== Applying Redefined UI & Frameless Controls ===');

// 1. UPDATE index.html
let html = fs.readFileSync(indexPath, 'utf8');

// Ensure the first screen (#wallpaperRoot) is left intact!
// We only refine the Command Center header in index.html to remove the noisy subtitle
if (html.includes('<p class="cmd-subtitle" id="cmdSubtitle">Cluster: primary-us-east &bull; Org: reddot</p>')) {
  html = html.replace(
    '<p class="cmd-subtitle" id="cmdSubtitle">Cluster: primary-us-east &bull; Org: reddot</p>',
    '<p class="cmd-subtitle hidden" id="cmdSubtitle">Cluster: primary-us-east &bull; Org: reddot</p>'
  );
  console.log('✓ Hidden noisy cluster/org subtitle in Command Center header');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully');

// 2. APPEND REDEFINED STYLES TO style.css
let css = fs.readFileSync(cssPath, 'utf8');

const redefinedStyles = `
/* ==========================================================================
   FRAMELESS WINDOW DRAG & INTERACTION REGIONS (NATIVE TITLE BAR REMOVED)
   ========================================================================== */
.top-bar,
.workstation-top-header,
.command-header {
  -webkit-app-region: drag !important;
}

.top-bar button,
.top-bar a,
.top-bar .brand-block,
.top-bar .top-window-controls,
.top-bar .win-ctrl-btn,
.workstation-top-header button,
.workstation-top-header input,
.workstation-top-header a,
.workstation-top-header .header-left,
.workstation-top-header .header-right,
.workstation-top-header .omnibox-search-bar,
.workstation-top-header .header-user-profile,
.workstation-top-header .btn-header-tool,
.command-header button,
.command-header input,
.command-header a {
  -webkit-app-region: no-drag !important;
}

/* ==========================================================================
   REDEFINED WORKSTATION EXECUTIVE TOP HEADER
   ========================================================================== */
.workstation-top-header {
  height: 56px !important;
  min-height: 56px !important;
  padding: 0 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  background: #0d0f17 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
}

.cmd-brand-icon {
  width: 32px !important;
  height: 32px !important;
  background: #0062ff !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 2px 10px rgba(0, 98, 255, 0.3) !important;
}

.cmd-brand-letter {
  font-family: var(--font-display, 'Space Grotesk', sans-serif) !important;
  font-weight: 900 !important;
  font-size: 13px !important;
  color: #ffffff !important;
  letter-spacing: 0.05em !important;
}

.cmd-title {
  font-size: 14px !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  letter-spacing: 0.03em !important;
}

.connected-badge {
  font-size: 10px !important;
  padding: 2px 8px !important;
  border-radius: 12px !important;
  background: rgba(0, 230, 118, 0.12) !important;
  border: 1px solid rgba(0, 230, 118, 0.25) !important;
  color: #00e676 !important;
  font-weight: 600 !important;
}

.omnibox-search-bar {
  max-width: 440px !important;
  height: 34px !important;
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.09) !important;
  border-radius: 8px !important;
  padding: 0 12px !important;
  transition: all 0.2s ease !important;
}

.omnibox-search-bar:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.header-user-profile {
  padding: 4px 10px 4px 5px !important;
  border-radius: 20px !important;
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  transition: all 0.18s ease !important;
}

.header-user-profile:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
}

/* ==========================================================================
   REDEFINED MODERN WORKSPACE SIDEBAR
   ========================================================================== */
.workstation-sidebar {
  width: 220px !important;
  min-width: 220px !important;
  background: #090a0f !important;
  border-right: 1px solid rgba(255, 255, 255, 0.07) !important;
  padding: 20px 10px !important;
}

.sidebar-section-label {
  font-size: 10px !important;
  font-weight: 800 !important;
  letter-spacing: 0.14em !important;
  color: #64748b !important;
  padding: 0 10px 10px !important;
}

.sidebar-nav-item {
  padding: 10px 14px !important;
  border-radius: 8px !important;
  font-size: 12.5px !important;
  font-weight: 600 !important;
  color: #94a3b8 !important;
  margin-bottom: 2px !important;
  transition: all 0.16s ease !important;
}

.sidebar-nav-item:hover {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.04) !important;
}

.sidebar-nav-item.active {
  color: #38bdf8 !important;
  background: rgba(56, 189, 248, 0.12) !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important;
  font-weight: 700 !important;
}

/* ==========================================================================
   REDEFINED TEAM CHAT: 2-COLUMN UNCLUTTERED ARCHITECTURE
   ========================================================================== */
#teamsLeftRail {
  display: none !important; /* Eliminate redundant third vertical icon rail */
}

.teams-app-shell {
  display: flex !important;
  width: 100% !important;
  height: 100% !important;
}

.teams-deck-area {
  flex: 1 !important;
  width: 100% !important;
  height: 100% !important;
}

.chat-layout {
  display: flex !important;
  width: 100% !important;
  height: 100% !important;
}

.chat-sidebar {
  width: 260px !important;
  min-width: 260px !important;
  background: #0b0d14 !important;
  border-right: 1px solid rgba(255, 255, 255, 0.07) !important;
  padding: 16px 12px !important;
}

.chat-conversation-pane {
  flex: 1 !important;
  background: #090a0f !important;
  display: flex !important;
  flex-direction: column !important;
}

.chat-conv-header {
  height: 54px !important;
  padding: 0 20px !important;
  background: #0d0f17 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07) !important;
}

/* ==========================================================================
   REDEFINED EXECUTIVE DASHBOARD & TASKS CARDS
   ========================================================================== */
.command-body {
  padding: 24px 28px !important;
  background: #090a0f !important;
  overflow-y: auto !important;
}

.dash-kpi-card {
  background: #11131c !important;
  border: 1px solid rgba(255, 255, 255, 0.07) !important;
  border-radius: 12px !important;
  padding: 18px 20px !important;
  transition: all 0.2s ease !important;
}

.dash-kpi-card:hover {
  border-color: rgba(255, 255, 255, 0.15) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
}

.dash-panel {
  background: #11131c !important;
  border: 1px solid rgba(255, 255, 255, 0.07) !important;
  border-radius: 12px !important;
  padding: 22px !important;
}

.task-card-v3 {
  background: #11131c !important;
  border: 1px solid rgba(255, 255, 255, 0.07) !important;
  border-radius: 10px !important;
  padding: 16px 20px !important;
  margin-bottom: 12px !important;
  transition: all 0.18s ease !important;
}

.task-card-v3:hover {
  border-color: rgba(56, 189, 248, 0.4) !important;
  background: #141724 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35) !important;
}
`;

css = css + '\n' + redefinedStyles;
fs.writeFileSync(cssPath, css, 'utf8');
console.log('✓ style.css updated with redefined UI & frameless drag regions');
console.log('=== Redefinition Applied Successfully! ===');
