/**
 * Append REDDOT Workstation v3.0 Styling System to style.css
 */
const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'wallpaper-ui', 'style.css');

const v3Styles = `
/* ==========================================================================
   REDDOT WORKSTATION v3.0 - ADVANCED ENTERPRISE DESIGN SYSTEM
   Pixel-Perfect Executive Layout matching Reference Images 1, 2, 3, 4, 5
   ========================================================================== */

/* --- DUAL THEME TOKENS --- */
:root, body.theme-light {
  --theme-name: 'light';
  --shell-bg: #f4f6f9;
  --header-bg: #ffffff;
  --sidebar-bg: #ffffff;
  --sidebar-border: #e2e5eb;
  --sidebar-text: #4b5563;
  --sidebar-text-hover: #111827;
  --sidebar-active-bg: #e8f1ff;
  --sidebar-active-text: #0062ff;

  --card-bg: #ffffff;
  --card-border: #e2e5eb;
  --card-hover-border: #cbd5e1;
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.05);
  --card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.08);

  --panel-bg: #ffffff;
  --panel-border: #e2e5eb;

  --text-white: #111827;
  --text-pure: #111827;
  --text-primary: #1f2937;
  --text-secondary: #4b5563;
  --text-muted: #6b7280;
  --text-subtle: #9ca3af;

  --accent-primary: #0062ff;
  --accent-primary-hover: #0050d4;
  --accent-primary-light: #e8f1ff;
  --accent-blue: #0062ff;
  --accent-cyan: #0062ff;
  --accent-green: #008a3e;
  --accent-red: #da1e28;
  --accent-amber: #e06a00;
  --accent-purple: #8a3ffc;

  --status-online: #008a3e;
  --status-break: #e06a00;
  --status-offline: #6b7280;

  --input-bg: #ffffff;
  --input-border: #d1d5db;
  --input-focus-border: #0062ff;
}

body.theme-dark, body.theme-obsidian {
  --theme-name: 'dark';
  --shell-bg: #0a0b10;
  --header-bg: #0f1118;
  --sidebar-bg: #0f1118;
  --sidebar-border: rgba(255, 255, 255, 0.08);
  --sidebar-text: #9aa1b2;
  --sidebar-text-hover: #ffffff;
  --sidebar-active-bg: rgba(0, 98, 255, 0.16);
  --sidebar-active-text: #00d2ff;

  --card-bg: #131620;
  --card-border: rgba(255, 255, 255, 0.08);
  --card-hover-border: rgba(255, 255, 255, 0.18);
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);
  --card-shadow-hover: 0 8px 30px rgba(0, 0, 0, 0.65);

  --panel-bg: #131620;
  --panel-border: rgba(255, 255, 255, 0.08);

  --text-white: #ffffff;
  --text-pure: #ffffff;
  --text-primary: #ededed;
  --text-secondary: #9aa1b2;
  --text-muted: #5e6678;
  --text-subtle: #404656;

  --accent-primary: #0062ff;
  --accent-primary-hover: #0072ff;
  --accent-primary-light: rgba(0, 98, 255, 0.2);
  --accent-blue: #0084ff;
  --accent-cyan: #00d2ff;
  --accent-green: #00e676;
  --accent-red: #ff2a4d;
  --accent-amber: #ffb300;
  --accent-purple: #b388ff;

  --status-online: #00e676;
  --status-break: #ffb300;
  --status-offline: #565668;

  --input-bg: rgba(0, 0, 0, 0.4);
  --input-border: rgba(255, 255, 255, 0.14);
  --input-focus-border: #00d2ff;
}

/* --- WORKSTATION SHELL REDESIGN --- */
.command-center-shell {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  border-radius: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  background: var(--shell-bg) !important;
  display: flex !important;
  flex-direction: column !important;
  box-shadow: none !important;
}

/* --- EXECUTIVE TOP HEADER --- */
.workstation-top-header {
  height: 58px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--sidebar-border);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  z-index: 100;
}

.workstation-top-header .header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cmd-brand-icon {
  width: 36px;
  height: 36px;
  background: #0062ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px rgba(0, 98, 255, 0.35);
}

.cmd-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cmd-title-row .cmd-title {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-white);
  letter-spacing: -0.01em;
}

.connected-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(0, 138, 62, 0.1);
  color: var(--accent-green);
  border: 1px solid rgba(0, 138, 62, 0.2);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
  box-shadow: 0 0 8px var(--accent-green);
}

.cmd-title-meta .cmd-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
}

/* Omnibox Search Bar */
.omnibox-search-bar {
  flex: 1;
  max-width: 480px;
  height: 34px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 8px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.omnibox-search-bar:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-primary-light);
}

.omnibox-search-bar .search-icon {
  font-size: 13px;
  color: var(--text-muted);
}

.omnibox-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  font-family: var(--font-sans);
  outline: none;
  cursor: pointer;
}

.omnibox-kbd {
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: var(--text-muted);
  font-size: 10px;
  font-family: var(--font-mono);
  padding: 2px 6px;
  border-radius: 4px;
}

body.theme-dark .omnibox-kbd {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

/* Header Tools & Controls */
.workstation-top-header .header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-header-tool {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: var(--transition-fast);
}

.btn-header-tool:hover {
  background: var(--sidebar-active-bg);
  color: var(--accent-primary);
  border-color: var(--card-border);
}

.btn-notif-bell .bell-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--accent-red);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--header-bg);
}

/* User Profile Chip */
.header-user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: var(--transition-fast);
}

.header-user-profile:hover {
  background: var(--sidebar-active-bg);
  border-color: var(--card-border);
}

.header-user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--accent-primary);
  border: 1px solid var(--card-border);
}

.header-user-info {
  display: flex;
  flex-direction: column;
}

.header-user-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-white);
  line-height: 1.2;
}

.header-user-role {
  font-size: 10px;
  color: var(--text-muted);
}

.header-user-caret {
  font-size: 10px;
  color: var(--text-muted);
}

/* --- MAIN BODY & LEFT SIDEBAR --- */
.workstation-body-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.workstation-sidebar {
  width: 220px;
  min-width: 220px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  padding: 16px 10px;
  gap: 4px;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 4px 10px 8px;
  text-transform: uppercase;
}

.sidebar-nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--sidebar-text);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-sans);
  text-align: left;
  cursor: pointer;
  transition: var(--transition-fast);
  width: 100%;
}

.sidebar-nav-item:hover {
  background: rgba(0, 0, 0, 0.04);
  color: var(--sidebar-text-hover);
}

body.theme-dark .sidebar-nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.sidebar-nav-item.active {
  background: var(--sidebar-active-bg) !important;
  color: var(--sidebar-active-text) !important;
  font-weight: 600;
}

.sidebar-nav-item .nav-icon {
  font-size: 15px;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-nav-item .nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Sidebar Bottom Widget */
.sidebar-footer-widget {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--sidebar-border);
}

.sidebar-cpu-box {
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  border-radius: 6px;
  padding: 10px;
}

.cpu-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 6px;
}

.cpu-bar-track {
  width: 100%;
  height: 5px;
  background: var(--card-border);
  border-radius: 3px;
  overflow: hidden;
}

.cpu-bar-fill {
  height: 100%;
  background: #0062ff;
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Content Deck */
.command-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  background: var(--shell-bg);
}

/* --- SYSTEM FOOTER --- */
.workstation-system-footer {
  height: 28px;
  background: var(--header-bg);
  border-top: 1px solid var(--sidebar-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.workstation-system-footer .footer-left,
.workstation-system-footer .footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-divider {
  opacity: 0.3;
}

.latency-dot {
  color: var(--accent-green);
  font-size: 8px;
}

/* ==========================================================================
   MODULE 1: DASHBOARD (DAILY EXECUTIVE PULSE - Reference Image 1)
   ========================================================================== */
.dash-exec-header {
  margin-bottom: 24px;
}

.dash-exec-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 138, 62, 0.1);
  color: var(--accent-green);
  border-radius: 12px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.dash-exec-main-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.dash-exec-greeting {
  font-family: var(--font-sans);
  font-size: 28px;
  font-weight: 800;
  color: var(--text-white);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.dash-exec-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.dash-exec-actions {
  display: flex;
  gap: 10px;
}

.btn-dash-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-dash-action.secondary {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  color: var(--text-primary);
}

.btn-dash-action.secondary:hover {
  border-color: var(--card-hover-border);
  background: var(--shell-bg);
}

.btn-dash-action.primary {
  background: #0062ff;
  border: 1px solid #0062ff;
  color: #fff;
}

.btn-dash-action.primary:hover {
  background: #0050d4;
  border-color: #0050d4;
}

/* 4 Metric Cards Grid */
.dash-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.dash-kpi-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 18px 20px;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  transition: var(--transition-fast);
}

.dash-kpi-card:hover {
  box-shadow: var(--card-shadow-hover);
  border-color: var(--card-hover-border);
}

.dash-kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dash-kpi-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.dash-kpi-icon {
  font-size: 15px;
  color: var(--accent-primary);
}

.dash-kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.dash-kpi-val {
  font-family: var(--font-sans);
  font-size: 26px;
  font-weight: 800;
  color: var(--text-white);
  letter-spacing: -0.02em;
}

.dash-kpi-sub-unit {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-muted);
  margin-right: 4px;
}

.dash-kpi-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
}

.dash-kpi-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.green-accent {
  color: var(--accent-green) !important;
  font-weight: 600;
}

.dash-kpi-bar-wrap {
  position: relative;
  width: 100%;
  height: 6px;
  background: var(--shell-bg);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}

.dash-kpi-bar {
  height: 100%;
  background: #0062ff;
  border-radius: 3px;
}

.dash-kpi-bar-text {
  position: absolute;
  right: 0;
  top: -18px;
  font-size: 11px;
  font-weight: 700;
  color: #0062ff;
}

/* 2-Column Responsive Operational Grid */
.dash-columns-grid {
  display: grid;
  grid-template-columns: 1.65fr 1fr;
  gap: 20px;
}

.dash-panel {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 20px;
  box-shadow: var(--card-shadow);
}

.dash-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dash-panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dash-panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-white);
}

.dash-panel-badge {
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  color: var(--text-secondary);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.dash-link-action {
  background: none;
  border: none;
  color: var(--accent-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.dash-link-action:hover {
  text-decoration: underline;
}

/* Objectives List */
.dash-objectives-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dash-objective-item {
  display: flex;
  gap: 14px;
  padding: 14px;
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.dash-objective-item:hover {
  border-color: var(--accent-primary);
  background: var(--card-bg);
}

.dash-objective-checkbox {
  width: 18px;
  height: 18px;
  border: 1px solid var(--card-border);
  border-radius: 4px;
  background: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.dash-objective-content {
  flex: 1;
}

.dash-objective-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.dash-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.04em;
}

.tag-firmware { background: #e8f1ff; color: #0062ff; }
.tag-ui { background: #f4f4f4; color: #393939; }
.tag-cloud { background: #defbe6; color: #008a3e; }
.tag-hardware { background: #fdf3d8; color: #b25e00; }

body.theme-dark .tag-firmware { background: rgba(0, 98, 255, 0.2); color: #00d2ff; }
body.theme-dark .tag-ui { background: rgba(255, 255, 255, 0.1); color: #fff; }
body.theme-dark .tag-cloud { background: rgba(0, 230, 118, 0.2); color: #00e676; }

.dash-due-time {
  font-size: 11px;
  color: var(--text-muted);
}

.dash-due-time.critical {
  color: var(--accent-red);
  font-weight: 600;
}

.dash-objective-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-white);
  line-height: 1.3;
}

.dash-objective-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Activity Stream */
.dash-activity-stream {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dash-activity-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  position: relative;
}

.dash-activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-primary);
  margin-top: 6px;
  flex-shrink: 0;
}

.dash-activity-main {
  flex: 1;
}

.dash-activity-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.dash-activity-author {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-white);
}

.dash-activity-time {
  font-size: 11px;
  color: var(--text-muted);
}

.dash-activity-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Right Column: Shift Status Summary */
.dash-section-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 12px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
}

.status-pill-active {
  background: rgba(0, 138, 62, 0.1);
  color: var(--accent-green);
  border: 1px solid rgba(0, 138, 62, 0.2);
}

.dash-shift-summary-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

/* Circular SVG Gauge */
.dash-gauge-container {
  width: 150px;
  height: 150px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.dash-gauge-svg {
  width: 140px;
  height: 140px;
}

.dash-gauge-bg {
  fill: none;
  stroke: var(--card-border);
  stroke-width: 10;
}

.dash-gauge-fill {
  fill: none;
  stroke: #0062ff;
  stroke-width: 10;
  stroke-linecap: round;
  stroke-dasharray: 402.12;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dashoffset 0.6s ease;
}

body.theme-dark .dash-gauge-fill {
  stroke: #00d2ff;
}

.dash-gauge-inner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.dash-gauge-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-white);
  line-height: 1;
}

.dash-gauge-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  margin-top: 4px;
}

.dash-shift-meta-list {
  width: 100%;
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.dash-shift-meta-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.dash-shift-meta-item .meta-label {
  color: var(--text-muted);
}

.dash-shift-meta-item .meta-val {
  font-weight: 600;
  color: var(--text-white);
}

.dash-shift-action-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
}

.btn-shift-action {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: var(--transition-fast);
}

.btn-shift-action.break {
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  color: var(--text-primary);
}

.btn-shift-action.break:hover {
  background: var(--card-bg);
  border-color: var(--card-hover-border);
}

.btn-shift-action.clockout {
  background: rgba(218, 30, 40, 0.08);
  border: 1px solid rgba(218, 30, 40, 0.2);
  color: var(--accent-red);
}

.btn-shift-action.clockout:hover {
  background: rgba(218, 30, 40, 0.16);
}

/* Quick Tools */
.dash-quick-tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.dash-quick-tool-card {
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: var(--transition-fast);
}

.dash-quick-tool-card:hover {
  border-color: var(--accent-primary);
  background: var(--card-bg);
}

.quick-tool-icon {
  font-size: 18px;
  margin-bottom: 6px;
}

.quick-tool-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-white);
}

.quick-tool-sub {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Security Posture Panel */
.dash-security-panel {
  padding: 16px 20px;
}

.dash-security-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.security-shield-icon {
  color: #0062ff;
  font-size: 14px;
}

.security-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-white);
}

.dash-security-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-secondary);
}

.security-dot {
  color: var(--accent-green);
  font-size: 8px;
}

.security-policy-sub {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
}

/* ==========================================================================
   MODULE 2: TIME & SHIFTS (ATTENDANCE LOG - Reference Image 2)
   ========================================================================== */
.shift-view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.shift-header-tag {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.shift-header-sync {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--accent-green);
  background: rgba(0, 138, 62, 0.08);
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.sync-dot {
  color: var(--accent-green);
  font-size: 8px;
}

/* Huge Attendance Hero Card */
.attendance-hero-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 24px 28px;
  box-shadow: var(--card-shadow);
  margin-bottom: 24px;
}

.attendance-hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.attendance-active-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 138, 62, 0.1);
  color: var(--accent-green);
  border-radius: 14px;
  padding: 4px 12px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.active-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
}

.attendance-tz {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.attendance-hero-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  flex-wrap: wrap;
}

.attendance-clock-block {
  flex: 1;
  min-width: 280px;
}

.attendance-huge-clock {
  font-family: var(--font-sans);
  font-size: 64px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-white);
  line-height: 1;
  margin-bottom: 12px;
}

.clock-unit-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  margin-left: 8px;
}

.attendance-progress-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.dot-sep {
  opacity: 0.4;
}

.text-accent {
  color: #0062ff !important;
  font-weight: 700;
}

.attendance-progress-track {
  width: 100%;
  height: 7px;
  background: var(--shell-bg);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.attendance-progress-fill {
  height: 100%;
  background: #0062ff;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.attendance-track-markers {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
}

.attendance-actions-block {
  display: flex;
  gap: 12px;
}

.btn-attendance-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-attendance-action.break {
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  color: var(--text-primary);
}

.btn-attendance-action.break:hover:not(:disabled) {
  background: var(--card-bg);
  border-color: var(--card-hover-border);
}

.btn-attendance-action.clockout {
  background: #0062ff;
  border: 1px solid #0062ff;
  color: #fff;
}

.btn-attendance-action.clockout:hover:not(:disabled) {
  background: #0050d4;
}

.btn-attendance-action.clockin {
  background: var(--accent-green);
  border: 1px solid var(--accent-green);
  color: #fff;
}

.action-kbd {
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.15);
  font-size: 10px;
  font-family: var(--font-mono);
  padding: 1px 5px;
  border-radius: 3px;
}

/* 3 Attendance KPI Cards */
.attendance-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.attendance-kpi-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 18px 20px;
  box-shadow: var(--card-shadow);
}

.att-kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.att-kpi-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.att-kpi-icon {
  font-size: 14px;
  color: #0062ff;
}

.att-kpi-val-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}

.att-kpi-val {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-white);
  letter-spacing: -0.02em;
}

.att-kpi-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
}

.att-kpi-bar-wrap {
  width: 100%;
  height: 5px;
  background: var(--shell-bg);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.att-kpi-bar {
  height: 100%;
  background: #0062ff;
  border-radius: 3px;
}

.att-kpi-target {
  font-size: 11px;
  color: var(--text-muted);
}

.att-kpi-sub {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 4px;
}

.text-green {
  color: var(--accent-green) !important;
  font-weight: 600;
}

/* 7-Day Mini Bar Chart */
.att-mini-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 48px;
  margin-top: 10px;
}

.att-chart-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
}

.att-chart-bar {
  width: 100%;
  max-width: 14px;
  background: rgba(0, 98, 255, 0.2);
  border-radius: 2px;
  min-height: 4px;
  transition: height 0.3s ease;
}

.att-chart-col.active .att-chart-bar {
  background: #0062ff;
}

.att-chart-col span {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
}

/* Shift Punch Log & Audit Ledger */
.punch-log-section {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 20px;
  box-shadow: var(--card-shadow);
}

.punch-log-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.punch-log-header-row .section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-white);
  margin: 0;
}

.punch-log-header-row .section-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.punch-table-wrap {
  overflow-x: auto;
}

.punch-table {
  width: 100%;
  border-collapse: collapse;
}

.punch-table th {
  text-align: left;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  padding: 10px 12px;
  border-bottom: 1px solid var(--card-border);
}

.punch-table td {
  padding: 12px;
  font-size: 12.5px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--card-border);
}

.punch-table tr:hover td {
  background: var(--shell-bg);
}

.pill-verified-hw {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent-green);
  font-weight: 600;
  font-size: 11.5px;
}

/* ==========================================================================
   MODULE 3: TEAM & DIRECTORY (Reference Image 3)
   ========================================================================== */
.personnel-header {
  margin-bottom: 20px;
}

.personnel-badge {
  font-size: 11px;
  font-weight: 800;
  color: #0062ff;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.personnel-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.personnel-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-white);
  letter-spacing: -0.02em;
}

.personnel-sub {
  font-size: 13px;
  color: var(--text-muted);
  max-width: 680px;
  margin-top: 4px;
}

.personnel-telemetry-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.telemetry-pill {
  display: flex;
  flex-direction: column;
}

.telemetry-label {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
}

.telemetry-val {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-white);
}

.telemetry-slash, .telemetry-unit {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

/* Filter Toolbar */
.workers-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.workers-search-wrap {
  flex: 1;
  min-width: 260px;
  height: 36px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 8px;
}

.workers-search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 12.5px;
  outline: none;
}

.workers-dept-pills {
  display: flex;
  gap: 6px;
}

.dept-pill {
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.dept-pill:hover {
  background: var(--shell-bg);
  color: var(--text-primary);
}

.dept-pill.active {
  background: #0062ff !important;
  color: #fff !important;
  border-color: #0062ff !important;
}

.workers-status-select {
  height: 36px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 6px;
  padding: 0 10px;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

/* Engineering Node Member Cards Grid */
.workers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.node-member-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--card-shadow);
  transition: var(--transition-fast);
}

.node-member-card:hover {
  border-color: var(--card-hover-border);
  box-shadow: var(--card-shadow-hover);
}

.node-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.node-card-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-card-avatar {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #0062ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  position: relative;
  flex-shrink: 0;
}

.node-card-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.node-avatar-status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-green);
  border: 2px solid var(--card-bg);
}

.node-card-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-white);
  line-height: 1.2;
}

.node-card-role {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 2px;
}

.node-status-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.badge-online { background: rgba(0, 138, 62, 0.1); color: var(--accent-green); }
.badge-focus { background: rgba(0, 98, 255, 0.1); color: #0062ff; }
.badge-break { background: rgba(224, 106, 0, 0.1); color: var(--accent-amber); }
.badge-offline { background: rgba(107, 114, 128, 0.1); color: var(--text-muted); }

.node-arch-box {
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.node-arch-label {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
}

.node-arch-code {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--text-secondary);
}

.node-arch-val {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-white);
  margin-top: 2px;
}

.node-directive-box {
  margin-bottom: 16px;
  flex: 1;
}

.node-directive-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.node-directive-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.node-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--card-border);
}

.btn-node-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  color: var(--text-secondary);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-node-action:hover {
  background: var(--card-bg);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

/* Provision Card */
.node-provision-card {
  border: 1.5px dashed var(--card-border);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  transition: var(--transition-fast);
}

.node-provision-card:hover {
  border-color: #0062ff;
  background: var(--sidebar-active-bg);
}

.provision-plus-icon {
  font-size: 28px;
  color: #0062ff;
  margin-bottom: 10px;
}

.provision-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-white);
}

.provision-sub {
  font-size: 11.5px;
  color: var(--text-muted);
  max-width: 220px;
  margin-top: 4px;
}

/* ==========================================================================
   MODULE 4: TASKS & SPRINT MANAGEMENT (Reference Image 4)
   ========================================================================== */
.sprint-header {
  margin-bottom: 20px;
}

.sprint-header-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.sprint-tag {
  font-size: 11px;
  font-weight: 800;
  color: #0062ff;
  letter-spacing: 0.06em;
}

.sprint-sync-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--accent-green);
}

.sprint-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.sprint-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-white);
  letter-spacing: -0.02em;
}

.sprint-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.sprint-view-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.view-mode-toggle {
  display: flex;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 6px;
  padding: 2px;
}

.view-mode-btn {
  padding: 5px 12px;
  border-radius: 4px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
}

.view-mode-btn.active {
  background: var(--sidebar-active-bg);
  color: #0062ff;
}

/* Sprint 14 Execution Cycle Banner */
.sprint-cycle-banner {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
  box-shadow: var(--card-shadow);
  flex-wrap: wrap;
}

.sprint-cycle-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 280px;
}

.sprint-cycle-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(0, 98, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #0062ff;
}

.sprint-cycle-info {
  flex: 1;
}

.sprint-cycle-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.sprint-cycle-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-white);
}

.sprint-phase-pill {
  background: rgba(0, 138, 62, 0.1);
  color: var(--accent-green);
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
}

.sprint-cycle-date {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.sprint-cycle-bar-wrap {
  width: 100%;
  height: 6px;
  background: var(--shell-bg);
  border-radius: 3px;
  overflow: hidden;
}

.sprint-cycle-bar {
  height: 100%;
  background: #0062ff;
  border-radius: 3px;
}

.sprint-cycle-stats {
  display: flex;
  gap: 24px;
}

.sprint-stat-item {
  display: flex;
  flex-direction: column;
}

.sprint-stat-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.sprint-stat-val {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-white);
}

.text-blue { color: #0062ff !important; }

/* Filter Toolbar */
.tasks-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tasks-search-wrap {
  flex: 1;
  min-width: 240px;
  height: 34px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 8px;
}

.tasks-search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
}

.tasks-dropdown-group {
  display: flex;
  gap: 12px;
}

.tasks-filter-select-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.tasks-filter-select {
  height: 34px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 6px;
  padding: 0 8px;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
}

/* Tasks Deck & Slide-Out Drawer */
.tasks-main-deck-wrapper {
  display: flex;
  gap: 20px;
  position: relative;
}

.tasks-deck-scroll-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.tasks-section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title-dot-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blue-dot { width: 8px; height: 8px; border-radius: 50%; background: #0062ff; }
.green-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-green); }

.tasks-section-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-white);
}

.tasks-section-count-badge {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
}

.green-badge {
  background: rgba(0, 138, 62, 0.1);
  color: var(--accent-green);
  border-color: rgba(0, 138, 62, 0.2);
}

.btn-sort-tasks, .btn-archive-review {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
}

.task-cards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card-v3 {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  padding: 16px 18px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.task-card-v3:hover {
  border-color: #0062ff;
  box-shadow: var(--card-shadow);
}

.task-card-v3.active-selected {
  border-color: #0062ff;
  background: var(--sidebar-active-bg);
}

.task-card-meta-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-tags-group {
  display: flex;
  gap: 6px;
  align-items: center;
}

.task-p-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.p-high { background: rgba(218, 30, 40, 0.1); color: var(--accent-red); }
.p-med { background: rgba(224, 106, 0, 0.1); color: var(--accent-amber); }
.p-low { background: rgba(107, 114, 128, 0.1); color: var(--text-muted); }

.task-mod-badge {
  background: var(--shell-bg);
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.task-due-date {
  font-size: 11px;
  color: var(--text-muted);
}

.task-card-title {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--text-white);
  line-height: 1.3;
  margin-bottom: 6px;
}

.task-card-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 12px;
}

.task-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-assignee-chip {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-assignee-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #0062ff;
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.task-assignee-name {
  font-size: 11.5px;
  color: var(--text-primary);
  font-weight: 600;
}

.task-subtasks-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subtasks-count {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}

.subtasks-bar-track {
  width: 50px;
  height: 4px;
  background: var(--shell-bg);
  border-radius: 2px;
  overflow: hidden;
}

.subtasks-bar-fill {
  height: 100%;
  background: #0062ff;
}

/* Slide-Out Task Detail Drawer (Image 4) */
.task-detail-drawer {
  width: 380px;
  min-width: 380px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 20px;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  height: fit-content;
}

.task-drawer-header {
  border-bottom: 1px solid var(--card-border);
  padding-bottom: 14px;
  margin-bottom: 14px;
}

.drawer-code-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.drawer-task-code {
  font-size: 11px;
  font-weight: 700;
  color: #0062ff;
}

.drawer-window-tools {
  display: flex;
  gap: 6px;
}

.btn-drawer-tool {
  width: 24px;
  height: 24px;
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-task-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-white);
  line-height: 1.3;
}

.drawer-meta-table {
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drawer-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
}

.drawer-meta-label {
  color: var(--text-muted);
}

.drawer-meta-val {
  font-weight: 600;
  color: var(--text-primary);
}

.drawer-meta-val.link-val {
  color: #0062ff;
  font-family: var(--font-mono);
}

.drawer-meta-val.text-red {
  color: var(--accent-red);
}

.drawer-section-heading {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: 6px;
  display: block;
}

.drawer-scope-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.drawer-subtasks-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.drawer-subtasks-percent {
  font-size: 11px;
  font-weight: 700;
  color: #0062ff;
}

.drawer-subtasks-checklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtask-check-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
}

.subtask-checkbox {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid var(--card-border);
  background: var(--shell-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  flex-shrink: 0;
  margin-top: 1px;
}

.subtask-check-row.done .subtask-checkbox {
  background: #0062ff;
  border-color: #0062ff;
}

.subtask-check-row.done span {
  text-decoration: line-through;
  color: var(--text-muted);
}

.drawer-prototype-card {
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  border-radius: 6px;
  padding: 10px;
  position: relative;
  text-align: center;
}

.drawer-prototype-card img {
  max-width: 100%;
  max-height: 110px;
  border-radius: 4px;
}

.prototype-overlay-tag {
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 10px;
  font-family: var(--font-mono);
  padding: 2px 8px;
  border-radius: 4px;
  position: absolute;
  bottom: 14px;
  left: 14px;
}

.btn-drawer-action.primary {
  width: 100%;
  padding: 10px;
  background: #0062ff;
  border: 1px solid #0062ff;
  color: #fff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 8px;
}

.btn-drawer-action.primary:hover {
  background: #0050d4;
}

.drawer-secondary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn-drawer-action.secondary {
  padding: 8px;
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  color: var(--text-secondary);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* ==========================================================================
   UNIVERSAL OMNIBOX SEARCH MODAL (Ctrl+K)
   ========================================================================== */
.omnibox-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  z-index: 100000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
}

.omnibox-modal-backdrop {
  position: absolute;
  inset: 0;
}

.omnibox-modal-card {
  position: relative;
  width: 90%;
  max-width: 600px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.omnibox-modal-search {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--card-border);
}

.omnibox-modal-icon {
  font-size: 16px;
  color: var(--text-muted);
}

.omnibox-modal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--text-white);
  font-family: var(--font-sans);
}

.omnibox-modal-esc {
  background: var(--shell-bg);
  border: 1px solid var(--card-border);
  font-size: 10px;
  font-family: var(--font-mono);
  padding: 3px 6px;
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
}

.omnibox-results-list {
  max-height: 380px;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.omnibox-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.omnibox-result-item:hover, .omnibox-result-item.selected {
  background: var(--sidebar-active-bg);
}

.omnibox-result-icon {
  font-size: 16px;
}

.omnibox-result-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-white);
  flex: 1;
}

.omnibox-result-category {
  font-size: 10.5px;
  color: var(--text-muted);
  background: var(--shell-bg);
  padding: 2px 6px;
  border-radius: 4px;
}

.omnibox-footer-shortcuts {
  padding: 8px 16px;
  background: var(--shell-bg);
  border-top: 1px solid var(--card-border);
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: var(--text-muted);
}

.omnibox-footer-shortcuts kbd {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: var(--font-mono);
}
`;

fs.appendFileSync(cssPath, v3Styles, 'utf8');
console.log('✅ Successfully appended v3.0 CSS Design System to style.css!');
