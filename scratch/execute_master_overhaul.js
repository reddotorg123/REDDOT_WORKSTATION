const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'wallpaper-ui');
const indexPath = path.join(uiDir, 'index.html');
const cssPath = path.join(uiDir, 'style.css');
const jsPath = path.join(uiDir, 'wallpaper.js');

console.log('🚀 Starting REDDOT Workstation Master Overhaul & Color Correction...');

// =========================================================================
// 1. STYLE.CSS: COLOR CORRECTION & COMPLETE 3-COLUMN CHAT + RAIL STYLING
// =========================================================================
let css = fs.readFileSync(cssPath, 'utf8');

// Replace all blue accent references with REDDOT Signature Crimson Palette
css = css.replace(/--accent-primary:\s*#0062ff/g, '--accent-primary: #e6192d');
css = css.replace(/--accent-primary-hover:\s*#[a-f0-9]+/gi, '--accent-primary-hover: #ff2a3f');
css = css.replace(/--accent-primary-light:\s*#[a-f0-9]+/gi, '--accent-primary-light: rgba(230, 25, 45, 0.12)');
css = css.replace(/--sidebar-active-text:\s*#0062ff/g, '--sidebar-active-text: #ff2a3f');
css = css.replace(/--sidebar-active-bg:\s*#e8f1ff/g, '--sidebar-active-bg: rgba(230, 25, 45, 0.12)');
css = css.replace(/--sidebar-active-text:\s*#00d2ff/g, '--sidebar-active-text: #ff2a3f');
css = css.replace(/--sidebar-active-bg:\s*rgba\(0,\s*98,\s*255,\s*0\.16\)/g, '--sidebar-active-bg: rgba(230, 25, 45, 0.15)');

// In dept-pill and task pills
css = css.replace(/\.dept-pill\.active\s*\{\s*background:\s*#0062ff\s*!important;\s*color:\s*#fff\s*!important;\s*border-color:\s*#0062ff\s*!important;\s*\}/g,
  `.dept-pill.active { background: #e6192d !important; color: #fff !important; border-color: #e6192d !important; box-shadow: 0 0 12px rgba(230, 25, 45, 0.35); }`);

// Master CSS for Workstation Header, 72px Left Rail, 3-Column Chat & Symmetrical Alignment
const masterStyles = `
/* ==========================================================================
   REDDOT WORKSTATION EXECUTIVE DESIGN SYSTEM (media_1789227865004.jpg)
   Signature Crimson Red (#e6192d) & Obsidian Matte Black Identity
   ========================================================================== */

/* Brand & Palette Overrides */
:root {
  --rd-crimson: #e6192d;
  --rd-crimson-bright: #ff2a3f;
  --rd-crimson-dark: #b31020;
  --rd-crimson-glow: rgba(230, 25, 45, 0.25);
  --rd-crimson-tint: rgba(230, 25, 45, 0.12);
  --rd-green: #22c55e;
  --rd-amber: #f59e0b;
  --rd-blue-semantic: #3b82f6;
  --rd-purple-semantic: #a855f7;

  /* Executive Dark Backgrounds */
  --rd-bg-matte: #0c0d12;
  --rd-bg-rail: #0d0e14;
  --rd-bg-subnav: #13141b;
  --rd-bg-panel: #111218;
  --rd-bg-card: #151620;
  --rd-border-subtle: rgba(255, 255, 255, 0.08);
  --rd-border-light: rgba(255, 255, 255, 0.14);
}

/* --- TOP COMMAND HEADER (EXACT REFERENCE PARITY) --- */
.workstation-top-header {
  height: 56px !important;
  min-height: 56px !important;
  background: #0b0c10 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 0 18px !important;
  z-index: 100 !important;
  position: relative !important;
}

/* Brand Badge */
.rd-brand-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.rd-brand-symbol {
  width: 28px;
  height: 28px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rd-symbol-ring {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 2.5px solid #e6192d;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(230, 25, 45, 0.5);
  animation: rdPulseRing 3s ease-in-out infinite alternate;
}

.rd-symbol-dot {
  position: absolute;
  width: 9px;
  height: 9px;
  background: #e6192d;
  border-radius: 50%;
  box-shadow: 0 0 8px #ff2a3f;
}

@keyframes rdPulseRing {
  0% { transform: scale(0.96); opacity: 0.85; }
  100% { transform: scale(1.04); opacity: 1; box-shadow: 0 0 14px rgba(230, 25, 45, 0.7); }
}

.rd-brand-titles {
  display: flex;
  flex-direction: column;
}

.rd-brand-title {
  font-family: var(--font-display, 'Space Grotesk', sans-serif);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 1.2px;
  color: #ffffff;
  line-height: 1.1;
}

.rd-brand-subtitle {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 2.5px;
  color: #8a8d9b;
  line-height: 1.1;
  margin-top: 2px;
}

/* Universal Omnibox Search */
.omnibox-search-bar {
  flex: 0 1 540px;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.omnibox-search-bar:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(230, 25, 45, 0.4);
  box-shadow: 0 0 12px rgba(230, 25, 45, 0.15);
}

.omnibox-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #d1d5db;
  font-size: 12.5px;
  font-family: var(--font-sans);
  outline: none;
  cursor: pointer;
}

.omnibox-kbd {
  font-family: var(--font-mono);
  font-size: 10px;
  color: #8a8d9b;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
}

/* Header Right Telemetry & Profile */
.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-status-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 600;
  color: #22c55e;
}

.pulse-green {
  width: 7px;
  height: 7px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 8px #22c55e;
  animation: pulseDot 2s infinite;
}

@keyframes pulseDot {
  0% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 12px #22c55e; }
  100% { transform: scale(0.9); opacity: 0.8; }
}

.btn-header-tool {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa1b2;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.btn-header-tool:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}

.bell-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #e6192d;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 6px rgba(230, 25, 45, 0.8);
}

/* User Profile Chip */
.header-user-profile {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 3px 8px 3px 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.header-user-profile:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(230, 25, 45, 0.3);
}

.header-user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
}

.header-user-info {
  display: flex;
  flex-direction: column;
}

.header-user-name {
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.1;
  letter-spacing: 0.3px;
}

.header-user-role {
  font-size: 9.5px;
  color: #8a8d9b;
  line-height: 1.1;
}

.header-user-caret {
  font-size: 10px;
  color: #8a8d9b;
}

/* Mode Outline Action Buttons */
.btn-outline-action {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #9aa1b2;
  font-size: 11.5px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-outline-action:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border-color: rgba(230, 25, 45, 0.4);
}

/* Native Window Controls */
.cmd-win-ctrl-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cmd-win-btn, .drawer-close-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #8a8d9b;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.cmd-win-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.drawer-close-btn:hover {
  background: #e6192d;
  color: #ffffff;
}

/* ==========================================================================
   FAR-LEFT ICONIC NAVIGATION RAIL (72px, media_1789227865004.jpg)
   ========================================================================== */
.workstation-body-layout {
  display: flex !important;
  width: 100vw !important;
  height: calc(100vh - 56px) !important;
  overflow: hidden !important;
}

.workstation-sidebar {
  width: 72px !important;
  min-width: 72px !important;
  max-width: 72px !important;
  height: 100% !important;
  background: #0d0e14 !important;
  border-right: 1px solid rgba(255, 255, 255, 0.07) !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  padding: 10px 0 14px 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  z-index: 90 !important;
}

.sidebar-nav-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
}

.sidebar-nav-item {
  width: 64px !important;
  height: 52px !important;
  border-radius: 8px !important;
  background: transparent !important;
  border: none !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
  color: #8a8d9b !important;
  cursor: pointer !important;
  position: relative !important;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
  padding: 0 !important;
}

.sidebar-nav-item:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #ffffff !important;
}

.sidebar-nav-item.active {
  background: rgba(230, 25, 45, 0.14) !important;
  color: #ff2a3f !important;
}

.sidebar-nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3.5px;
  background: #e6192d;
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 8px #e6192d;
}

.sidebar-nav-item .nav-icon {
  font-size: 18px !important;
  line-height: 1 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.sidebar-nav-item .nav-label {
  font-size: 9.5px !important;
  font-weight: 600 !important;
  letter-spacing: 0.2px !important;
  line-height: 1 !important;
}

.nav-badge-red {
  position: absolute;
  top: 4px;
  right: 10px;
  background: #e6192d;
  color: #ffffff;
  font-size: 9px;
  font-weight: 800;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 6px rgba(230, 25, 45, 0.8);
}

/* Rail Bottom Branding & Slogan */
.sidebar-rail-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-slogan-block {
  text-align: center;
  font-family: var(--font-display, 'Space Grotesk', sans-serif);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.5px;
  line-height: 1.25;
  color: #4e5264;
}

.slogan-red-dot {
  color: #e6192d;
  font-size: 12px;
  margin-left: 1px;
}

.sidebar-version-tag {
  font-family: var(--font-mono);
  font-size: 8px;
  color: #55596b;
  letter-spacing: 0.5px;
}

.sidebar-cpu-box {
  width: 58px;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
}

.cpu-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: #72778a;
  margin-bottom: 3px;
}

.cpu-bar-track {
  height: 3.5px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.cpu-bar-fill {
  height: 100%;
  background: #e6192d;
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(230, 25, 45, 0.6);
}

/* ==========================================================================
   MAIN CONTENT VIEWPORT CONTAINER
   ========================================================================== */
.command-body {
  flex: 1 !important;
  height: 100% !important;
  overflow: hidden !important;
  background: #090a0f !important;
  position: relative !important;
}

.cmd-tab-pane {
  display: none !important;
  width: 100% !important;
  height: 100% !important;
  overflow-y: auto !important;
}

.cmd-tab-pane.active {
  display: block !important;
}

/* ==========================================================================
   3-COLUMN TEAM CHAT VIEWPORT (media_1789227865004.jpg)
   ========================================================================== */
#tabChatView.active {
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.rd-chat-3col-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0c0d12;
}

/* COLUMN 1: CHAT SUB-SIDEBAR (260px) */
.rd-chat-sidebar {
  width: 260px;
  min-width: 260px;
  max-width: 260px;
  height: 100%;
  background: #13141b;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rd-chat-sidebar-header {
  height: 52px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.rd-chat-sidebar-title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
}

.btn-create-chat-plus {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-create-chat-plus:hover {
  background: #e6192d;
  border-color: #ff2a3f;
}

/* Chat Search Box */
.rd-chat-search-wrap {
  padding: 10px 14px;
  position: relative;
}

.rd-chat-search-wrap .search-icon {
  position: absolute;
  left: 24px;
  top: 18px;
  font-size: 13px;
  color: #72778a;
}

.rd-chat-search-input {
  width: 100%;
  height: 32px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 0 10px 0 32px;
  font-size: 12px;
  color: #ffffff;
  outline: none;
  font-family: var(--font-sans);
  transition: border-color 0.2s;
}

.rd-chat-search-input:focus {
  border-color: #e6192d;
}

/* Filter Pills */
.rd-chat-filter-pills {
  display: flex;
  gap: 6px;
  padding: 4px 14px 10px 14px;
  overflow-x: auto;
}

.rd-filter-pill {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  font-size: 11px;
  font-weight: 500;
  color: #8a8d9b;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.rd-filter-pill:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.rd-filter-pill.active {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}

.rd-filter-pill.unread {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rd-filter-pill.unread .pill-badge {
  background: #e6192d;
  color: #ffffff;
  font-size: 9px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 10px;
}

/* Scrollable Chat Groups */
.rd-chat-groups-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rd-chat-group-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  color: #72778a;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.rd-group-add-btn {
  background: transparent;
  border: none;
  color: #8a8d9b;
  font-size: 14px;
  cursor: pointer;
}

.rd-group-add-btn:hover {
  color: #ffffff;
}

/* Pinned Conversations */
.rd-pinned-list, .rd-dm-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rd-conversation-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.rd-conversation-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.rd-conv-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.rd-conv-info {
  flex: 1;
  min-width: 0;
}

.rd-conv-name-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.rd-conv-name {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
}

.rd-conv-time {
  font-size: 9.5px;
  color: #72778a;
}

.rd-conv-snippet {
  font-size: 11px;
  color: #8a8d9b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Channels List */
.rd-channels-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rd-channel-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 12.5px;
  color: #9aa1b2;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.rd-channel-pill:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
}

.rd-channel-pill.active {
  background: rgba(230, 25, 45, 0.16) !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  border-left: 3px solid #e6192d !important;
}

.chan-hash {
  color: #72778a;
  font-weight: 700;
  font-family: var(--font-mono);
}

.rd-channel-pill.active .chan-hash {
  color: #ff2a3f;
}

.chan-name {
  flex: 1;
}

.chan-badge {
  background: rgba(230, 25, 45, 0.2);
  color: #ff2a3f;
  border: 1px solid rgba(230, 25, 45, 0.3);
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
}

/* Direct Messages List */
.rd-dm-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.rd-dm-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.rd-dm-avatar-wrap {
  position: relative;
}

.rd-dm-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.rd-dm-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid #13141b;
}

.rd-dm-dot.online { background: #22c55e; }
.rd-dm-dot.offline { background: #64748b; }

.rd-dm-meta {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rd-dm-name {
  font-size: 12px;
  font-weight: 500;
  color: #d1d5db;
}

.rd-dm-time {
  font-size: 9.5px;
  color: #72778a;
}

/* ==========================================================================
   COLUMN 2: CENTER CHAT WORKSPACE (Clean High-Contrast White / Obsidian)
   ========================================================================== */
.rd-chat-center-deck {
  flex: 1;
  height: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* In Obsidian Dark Theme, Center Workspace is Dark */
body.theme-obsidian .rd-chat-center-deck,
body.theme-dark .rd-chat-center-deck {
  background: #0f1017;
}

/* Channel Top Bar */
.rd-conv-top-bar {
  height: 56px;
  min-height: 56px;
  padding: 0 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
}

body.theme-obsidian .rd-conv-top-bar,
body.theme-dark .rd-conv-top-bar {
  background: #11121a;
  border-bottom-color: rgba(255, 255, 255, 0.07);
}

.rd-conv-main-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rd-conv-hash {
  font-size: 20px;
  font-weight: 700;
  color: #6b7280;
  font-family: var(--font-mono);
}

.rd-conv-title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  font-family: var(--font-display);
}

body.theme-obsidian .rd-conv-title,
body.theme-dark .rd-conv-title {
  color: #ffffff;
}

.rd-conv-topic {
  font-size: 11.5px;
  color: #6b7280;
  margin-top: 1px;
}

body.theme-obsidian .rd-conv-topic,
body.theme-dark .rd-conv-topic {
  color: #9aa1b2;
}

.rd-conv-actions-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rd-members-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 6px;
}

body.theme-obsidian .rd-members-badge,
body.theme-dark .rd-members-badge {
  background: rgba(255, 255, 255, 0.06);
  color: #d1d5db;
}

/* Meet Button */
.btn-rd-meet-primary {
  background: #e6192d !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 6px !important;
  padding: 6px 14px !important;
  font-size: 12.5px !important;
  font-weight: 700 !important;
  display: flex !important;
  align-items: center !important;
  gap: 7px !important;
  cursor: pointer !important;
  box-shadow: 0 2px 8px rgba(230, 25, 45, 0.35) !important;
  transition: all 0.15s ease !important;
}

.btn-rd-meet-primary:hover {
  background: #ff2a3f !important;
  box-shadow: 0 4px 14px rgba(230, 25, 45, 0.5) !important;
  transform: translateY(-1px);
}

.btn-rd-more-options {
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  font-size: 16px;
  cursor: pointer;
}

body.theme-obsidian .btn-rd-more-options,
body.theme-dark .btn-rd-more-options {
  border-color: rgba(255, 255, 255, 0.1);
  color: #9aa1b2;
}

/* Subtabs Bar */
.rd-conv-subtabs-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

body.theme-obsidian .rd-conv-subtabs-bar,
body.theme-dark .rd-conv-subtabs-bar {
  background: #11121a;
  border-bottom-color: rgba(255, 255, 255, 0.07);
}

.rd-subtab-btn {
  background: transparent;
  border: none;
  padding: 12px 2px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  position: relative;
  transition: color 0.15s;
}

body.theme-obsidian .rd-subtab-btn,
body.theme-dark .rd-subtab-btn {
  color: #9aa1b2;
}

.rd-subtab-btn:hover {
  color: #111827;
}

body.theme-obsidian .rd-subtab-btn:hover,
body.theme-dark .rd-subtab-btn:hover {
  color: #ffffff;
}

.rd-subtab-btn.active {
  color: #e6192d !important;
}

.rd-subtab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2.5px;
  background: #e6192d;
  border-radius: 2px 2px 0 0;
}

.rd-subtab-btn-add {
  background: transparent;
  border: none;
  font-size: 15px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
}

/* Messages Feed */
.rd-messages-feed {
  flex: 1;
  overflow-y: auto;
  padding: 22px 26px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.rd-msg-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.rd-msg-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.rd-msg-body {
  flex: 1;
  min-width: 0;
}

.rd-msg-meta-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}

.rd-msg-author {
  font-size: 13.5px;
  font-weight: 700;
  color: #111827;
}

body.theme-obsidian .rd-msg-author,
body.theme-dark .rd-msg-author {
  color: #ffffff;
}

.rd-msg-time {
  font-size: 10.5px;
  color: #6b7280;
}

body.theme-obsidian .rd-msg-time,
body.theme-dark .rd-msg-time {
  color: #72778a;
}

.rd-msg-role-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 5px;
}

body.theme-obsidian .rd-msg-role-tag,
body.theme-dark .rd-msg-role-tag {
  color: #8a8d9b;
}

.rd-msg-text {
  font-size: 13.5px;
  line-height: 1.5;
  color: #374151;
  margin-bottom: 8px;
}

body.theme-obsidian .rd-msg-text,
body.theme-dark .rd-msg-text {
  color: #d1d5db;
}

/* Attached Image Cards Grid */
.rd-msg-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 160px);
  gap: 10px;
  margin: 10px 0;
}

.rd-preview-card {
  position: relative;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

body.theme-obsidian .rd-preview-card,
body.theme-dark .rd-preview-card {
  border-color: rgba(255, 255, 255, 0.1);
}

.rd-preview-card:hover {
  transform: scale(1.02);
}

.rd-preview-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rd-preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: #ffffff;
  font-size: 9.5px;
  font-weight: 600;
  padding: 4px 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* File Attachment Card */
.rd-file-attach-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  width: fit-content;
  max-width: 320px;
  cursor: pointer;
  margin: 8px 0;
  transition: all 0.15s;
}

body.theme-obsidian .rd-file-attach-card,
body.theme-dark .rd-file-attach-card {
  background: #181924;
  border-color: rgba(255, 255, 255, 0.08);
}

.rd-file-attach-card:hover {
  border-color: #e6192d;
  box-shadow: 0 2px 10px rgba(230, 25, 45, 0.15);
}

.file-icon-box {
  font-size: 22px;
}

.file-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #111827;
}

body.theme-obsidian .file-name,
body.theme-dark .file-name {
  color: #ffffff;
}

.file-sub {
  font-size: 10.5px;
  color: #6b7280;
}

.file-dl-icon {
  margin-left: auto;
  font-size: 16px;
  color: #6b7280;
}

/* Reaction Pills */
.rd-reactions-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.rd-reaction-pill {
  padding: 3px 8px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 11.5px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s;
}

body.theme-obsidian .rd-reaction-pill,
body.theme-dark .rd-reaction-pill {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
  color: #9aa1b2;
}

.rd-reaction-pill:hover {
  background: rgba(230, 25, 45, 0.1);
  border-color: #e6192d;
  color: #ff2a3f;
}

/* Chat Input Composer */
.rd-chat-composer {
  padding: 14px 24px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
}

body.theme-obsidian .rd-chat-composer,
body.theme-dark .rd-chat-composer {
  background: #11121a;
  border-top-color: rgba(255, 255, 255, 0.07);
}

.rd-composer-box {
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.2s;
}

body.theme-obsidian .rd-composer-box,
body.theme-dark .rd-composer-box {
  background: #161722;
  border-color: rgba(255, 255, 255, 0.1);
}

.rd-composer-box:focus-within {
  border-color: #e6192d;
  box-shadow: 0 0 10px rgba(230, 25, 45, 0.2);
}

.rd-composer-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13.5px;
  color: #111827;
  font-family: var(--font-sans);
}

body.theme-obsidian .rd-composer-input,
body.theme-dark .rd-composer-input {
  color: #ffffff;
}

.rd-composer-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
}

.composer-tool-btn {
  background: transparent;
  border: none;
  font-size: 15px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
}

body.theme-obsidian .composer-tool-btn,
body.theme-dark .composer-tool-btn {
  color: #8a8d9b;
}

.composer-tool-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #111827;
}

body.theme-obsidian .composer-tool-btn:hover,
body.theme-dark .composer-tool-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.composer-hint {
  margin-left: auto;
  font-size: 11px;
  color: #9ca3af;
}

.btn-rd-send {
  background: #e6192d !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 6px !important;
  width: 32px !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 14px !important;
  cursor: pointer !important;
  box-shadow: 0 2px 6px rgba(230, 25, 45, 0.4) !important;
  transition: all 0.15s !important;
}

.btn-rd-send:hover {
  background: #ff2a3f !important;
  transform: scale(1.05);
}

/* ==========================================================================
   COLUMN 3: RIGHT EXECUTIVE MEDIA & TELEMETRY RAIL (340px)
   ========================================================================== */
.rd-executive-rail {
  width: 340px;
  min-width: 340px;
  max-width: 340px;
  height: 100%;
  background: #0d0e14;
  border-left: 1px solid rgba(255, 255, 255, 0.07);
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 1. Facility Banner Card */
.facility-banner-card {
  position: relative;
  height: 150px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.facility-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.facility-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.facility-tag {
  align-self: flex-end;
  font-size: 10px;
  color: #e2e8f0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  padding: 3px 8px;
  border-radius: 12px;
}

.facility-title-block h3 {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.5px;
  line-height: 1.15;
}

.facility-sub {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #cbd5e1;
  margin-top: 3px;
}

/* 2. Founder Live Video Card */
.founder-video-card {
  position: relative;
  height: 230px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #000;
}

.founder-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.founder-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.9) 100%);
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8px;
}

.founder-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.founder-name {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
}

.founder-role {
  font-size: 10px;
  color: #9aa1b2;
}

/* Animated Green Audio Wave Bars */
.live-audio-wave {
  display: flex;
  align-items: flex-end;
  gap: 2.5px;
  height: 16px;
}

.live-audio-wave .wave-bar {
  width: 3px;
  background: #22c55e;
  border-radius: 2px;
  box-shadow: 0 0 6px #22c55e;
  animation: waveAnim 1.2s ease-in-out infinite alternate;
}

.live-audio-wave .wave-bar:nth-child(1) { height: 6px; animation-delay: 0.1s; }
.live-audio-wave .wave-bar:nth-child(2) { height: 14px; animation-delay: 0.3s; }
.live-audio-wave .wave-bar:nth-child(3) { height: 10px; animation-delay: 0.5s; }

@keyframes waveAnim {
  0% { height: 4px; }
  100% { height: 16px; }
}

.founder-quote {
  font-size: 11px;
  font-style: italic;
  color: #cbd5e1;
  line-height: 1.3;
}

/* Call Control Buttons Bar */
.founder-call-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}

.btn-founder-ctrl {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-founder-ctrl:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.08);
}

.btn-founder-ctrl.end-call {
  background: #e6192d !important;
  border-color: #ff2a3f !important;
  box-shadow: 0 0 10px rgba(230, 25, 45, 0.6);
}

/* 3. Upcoming Meetings & Shared Rail Cards */
.rd-rail-card {
  background: #13141c;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rd-rail-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rail-card-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #ffffff;
}

.rail-card-link {
  background: transparent;
  border: none;
  color: #ff2a3f;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.rail-card-link:hover {
  text-decoration: underline;
}

/* Meeting Row */
.rd-meeting-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.rd-meeting-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.meeting-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.meeting-icon-box.red { background: rgba(230, 25, 45, 0.15); color: #ff2a3f; }
.meeting-icon-box.amber { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.meeting-icon-box.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }

.meeting-info {
  flex: 1;
  min-width: 0;
}

.meeting-title {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
}

.meeting-time {
  font-size: 10px;
  color: #8a8d9b;
}

.btn-meeting-join {
  background: #e6192d !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 4px !important;
  padding: 3px 10px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  transition: all 0.15s;
}

.btn-meeting-join:hover {
  background: #ff2a3f !important;
}

.btn-meeting-view {
  background: rgba(255, 255, 255, 0.08);
  color: #d1d5db;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 3px 10px;
  font-size: 11px;
  cursor: pointer;
}

.btn-meeting-more {
  background: transparent;
  border: none;
  color: #72778a;
  cursor: pointer;
}

/* 4. Team Members Row */
.rd-members-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.rd-member-avatar-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.rd-member-avatar-chip img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
}

.chip-name {
  font-size: 9px;
  font-weight: 700;
  color: #ffffff;
}

.chip-role {
  font-size: 8px;
  color: #8a8d9b;
}

.btn-members-scroll {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 5. Presence World Map */
.presence-map-wrap {
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.25);
  padding: 4px;
}

.world-map-svg {
  width: 100%;
  height: auto;
  display: block;
}

.presence-legend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  font-size: 10px;
  color: #9aa1b2;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.legend-dot.green { background: #22c55e; }
.legend-dot.amber { background: #f59e0b; }
.legend-dot.red { background: #e6192d; }
.legend-dot.gray { background: #64748b; }

.legend-val {
  margin-left: auto;
  font-weight: 700;
  color: #ffffff;
}

/* 6. Shared Files List */
.rd-files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rd-file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  cursor: pointer;
}

.file-icon-square {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.file-icon-square.purple { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
.file-icon-square.red { background: rgba(230, 25, 45, 0.15); color: #ff2a3f; }
.file-icon-square.fig { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.file-icon-square.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }

.file-row-info {
  flex: 1;
  min-width: 0;
}

.file-row-name {
  display: block;
  font-size: 11.5px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-row-sub {
  display: block;
  font-size: 9.5px;
  color: #72778a;
}

.btn-file-more {
  background: transparent;
  border: none;
  color: #72778a;
  cursor: pointer;
}

/* 7. Bottom Crimson Ribbon Card */
.rd-ribbon-card {
  position: relative;
  height: 120px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(230, 25, 45, 0.25);
  box-shadow: 0 4px 20px rgba(230, 25, 45, 0.15);
}

.ribbon-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ribbon-text-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.7) 0%, transparent 80%);
  display: flex;
  align-items: center;
  padding: 16px;
}

.ribbon-text-overlay h3 {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 800;
  line-height: 1.2;
  color: #ffffff;
}

.ribbon-red-dot {
  color: #e6192d;
  font-size: 22px;
}

/* ==========================================================================
   COLOR CORRECTION & ALIGNMENT FOR DASHBOARD, TASKS, ATTENDANCE & DIRECTORY
   ========================================================================== */

/* Dashboard Enhancements */
.btn-dash-action.primary {
  background: #e6192d !important;
  color: #ffffff !important;
  box-shadow: 0 0 14px rgba(230, 25, 45, 0.4) !important;
}

.btn-dash-action.primary:hover {
  background: #ff2a3f !important;
  transform: translateY(-1px);
}

.dash-kpi-bar {
  background: linear-gradient(90deg, #e6192d, #ff2a3f) !important;
  box-shadow: 0 0 8px rgba(230, 25, 45, 0.6);
}

.dash-gauge-fill {
  stroke: #e6192d !important;
  filter: drop-shadow(0 0 6px rgba(230, 25, 45, 0.6)) !important;
}

.btn-shift-action.break {
  background: rgba(245, 158, 11, 0.15) !important;
  color: #f59e0b !important;
  border-color: rgba(245, 158, 11, 0.3) !important;
}

.btn-shift-action.clockout {
  background: rgba(230, 25, 45, 0.18) !important;
  color: #ff2a3f !important;
  border-color: rgba(230, 25, 45, 0.4) !important;
}

.btn-shift-action.clockout:hover {
  background: #e6192d !important;
  color: #ffffff !important;
}

/* Priority Objectives Checkbox */
.obj-checkbox {
  accent-color: #e6192d !important;
}

/* Tasks Enhancements */
.btn-sprint-action.primary,
#btnDrawerMarkComplete {
  background: #e6192d !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: 0 2px 10px rgba(230, 25, 45, 0.4) !important;
}

#btnDrawerMarkComplete:hover {
  background: #ff2a3f !important;
}

.subtask-cb {
  accent-color: #e6192d !important;
}

/* Time & Shifts Attendance Enhancements */
.shift-progress-fill {
  background: linear-gradient(90deg, #e6192d, #ff2a3f) !important;
}

.btn-punch-action.out {
  background: #e6192d !important;
  color: #ffffff !important;
  box-shadow: 0 2px 10px rgba(230, 25, 45, 0.4) !important;
}

.btn-punch-action.in {
  background: #16a34a !important;
  color: #ffffff !important;
}

.mean-bar.today {
  background: linear-gradient(180deg, #ff2a3f, #e6192d) !important;
}
`;

css += '\n\n' + masterStyles;
fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ style.css updated with Master REDDOT Crimson Design System');

// =========================================================================
// 2. WALLPAPER.JS: INTERACTIVE WIRE-UP (CHANNELS, REACTIONS, CONTROLS)
// =========================================================================
let js = fs.readFileSync(jsPath, 'utf8');

// Ensure wireup for REDDOT Workstation Chat & Reference Interactions
const wireupCode = `
// =========================================================================
// REDDOT WORKSTATION EXECUTIVE INTERACTIONS (media_1789227865004.jpg)
// =========================================================================
function initWorkstationReferenceFeatures() {
  console.log('🔗 Initializing REDDOT Workstation Executive Interactivity...');

  // 1. Omnibox Search Bar Click
  const omniTrigger = document.getElementById('topOmniboxSearchTrigger');
  if (omniTrigger) {
    omniTrigger.addEventListener('click', () => {
      const modal = document.getElementById('globalOmniboxModal');
      const input = document.getElementById('omniboxSearchInput');
      if (modal && input) {
        modal.classList.remove('hidden');
        input.focus();
      }
    });
  }

  // 2. Chat Channels Switcher
  const channelPills = document.querySelectorAll('.rd-channel-pill');
  const activeTitle = document.getElementById('activeChatTitle');
  const activeTopic = document.getElementById('activeChatTopic');

  const channelTopics = {
    general: 'Company-wide updates and collaboration.',
    announcements: 'Official executive announcements and leadership directives.',
    engineering: 'Kernel microcode, firmware flashing, and hardware architecture.',
    design: 'Design tokens, Figma specs, and high-contrast UI paradigms.',
    hardware: 'TPU Enclave Biometric Pulse Bridge & physical schematics.',
    software: 'Workstation OS runtime, SQLite NVMe WAL sync, and distributed telemetry.',
    projects: 'Sprint milestone tracking and customer deliverables.',
    research: 'Neural interfaces, optical tracking, and low-latency audio pipelines.'
  };

  channelPills.forEach(pill => {
    pill.addEventListener('click', () => {
      channelPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const chan = pill.getAttribute('data-channel');
      if (activeTitle) activeTitle.textContent = chan;
      if (activeTopic) activeTopic.textContent = channelTopics[chan] || 'Channel collaboration stream.';
    });
  });

  // 3. Chat Filter Pills
  const filterPills = document.querySelectorAll('.rd-filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  // 4. Message Reaction Toggles
  const reactionPills = document.querySelectorAll('.rd-reaction-pill');
  reactionPills.forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('reacted');
      const txt = pill.textContent.trim();
      const parts = txt.split(' ');
      if (parts.length === 2 && !isNaN(parts[1])) {
        const count = parseInt(parts[1], 10);
        pill.textContent = \`\${parts[0]} \${pill.classList.contains('reacted') ? count + 1 : count - 1}\`;
      }
    });
  });

  // 5. Firmware File Download Simulation
  const dlCard = document.getElementById('btnDownloadFirmwareZip');
  if (dlCard) {
    dlCard.addEventListener('click', () => {
      alert('⚡ Downloading Firmware_v2.1.0.zip (12.4 MB)\\n\\nSHA-256 Verified by Hardware Enclave.');
    });
  }

  // 6. Founder Call Controls
  const ctrlMic = document.getElementById('ctrlFounderMic');
  const ctrlCam = document.getElementById('ctrlFounderCam');
  const ctrlShare = document.getElementById('ctrlFounderShare');
  const ctrlLeave = document.getElementById('ctrlFounderLeave');

  if (ctrlMic) {
    ctrlMic.addEventListener('click', () => {
      const isMuted = ctrlMic.classList.toggle('muted');
      ctrlMic.textContent = isMuted ? '🔇' : '🎤';
      ctrlMic.title = isMuted ? 'Unmute Microphone' : 'Mute Microphone';
    });
  }

  if (ctrlCam) {
    ctrlCam.addEventListener('click', () => {
      const isOff = ctrlCam.classList.toggle('off');
      ctrlCam.textContent = isOff ? '📷' : '📹';
      ctrlCam.title = isOff ? 'Start Video' : 'Stop Video';
    });
  }

  if (ctrlShare) {
    ctrlShare.addEventListener('click', () => {
      alert('🖥️ Screen Share: Select a window or display to broadcast to the REDDOT Engineering Node.');
    });
  }

  if (ctrlLeave) {
    ctrlLeave.addEventListener('click', () => {
      if (confirm('Leave live executive call with Jagadish K?')) {
        const card = document.querySelector('.founder-video-card');
        if (card) card.style.opacity = '0.5';
      }
    });
  }

  // 7. Instant Meet Button in Chat Header
  const meetBtn = document.getElementById('btnStartMeeting');
  if (meetBtn) {
    meetBtn.addEventListener('click', () => {
      const room = 'REDDOT-General-' + Math.random().toString(36).substring(2, 7);
      window.open('https://meet.jit.si/' + room, '_blank');
    });
  }

  // 8. Bottom Chat Composer Send
  const sendBtn = document.getElementById('btnSendChatMessage');
  const chatInput = document.getElementById('chatInputMessage');
  const stream = document.getElementById('chatMessagesStream');

  function sendNewMessage() {
    if (!chatInput) return;
    const val = chatInput.value.trim();
    if (!val) return;

    if (stream) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const msgEl = document.createElement('div');
      msgEl.className = 'rd-msg-item';
      msgEl.innerHTML = \`
        <img src="assets/profile-photo.jpeg" alt="Jagadish K" class="rd-msg-avatar" onerror="this.src='assets/id-card.png';">
        <div class="rd-msg-body">
          <div class="rd-msg-meta-row">
            <span class="rd-msg-author">Jagadish K</span>
            <span class="rd-msg-time">\${timeStr}</span>
          </div>
          <div class="rd-msg-role-tag">Founder &amp; Lead Architect</div>
          <div class="rd-msg-text">\${val.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      \`;
      stream.appendChild(msgEl);
      stream.scrollTop = stream.scrollHeight;
    }
    chatInput.value = '';
  }

  if (sendBtn) sendBtn.addEventListener('click', sendNewMessage);
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendNewMessage();
      }
    });
  }
}

// Auto-run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWorkstationReferenceFeatures);
} else {
  initWorkstationReferenceFeatures();
}
`;

if (!js.includes('function initWorkstationReferenceFeatures()')) {
  js += '\n\n' + wireupCode;
  fs.writeFileSync(jsPath, js, 'utf8');
  console.log('✅ wallpaper.js updated with Reference Features & Interactivity');
} else {
  console.log('ℹ️ wallpaper.js already contains initWorkstationReferenceFeatures');
}

console.log('🎉 Master Overhaul execution completed successfully.');
