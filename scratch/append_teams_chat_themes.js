const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'wallpaper-ui');
const hotpatchUiDir = path.join(process.env.APPDATA, 'reddot-workstation-os', 'hotpatch', 'wallpaper-ui');

const cssPath = path.join(uiDir, 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

const teamsChatOverrides = `

/* ==========================================================================
   TEAMS CHAT FULL THEME UNIFICATION (LIGHT & DARK)
   Eliminates all dark patches in Light mode & guarantees pristine Dark mode
   ========================================================================== */

/* --- LIGHT THEME TEAMS CHAT --- */
body.theme-light .teams-deck-area {
  background: #f1f5f9 !important;
}

body.theme-light .chat-layout {
  background: #f1f5f9 !important;
}

body.theme-light .chat-sidebar {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
}

body.theme-light .chat-conversation-pane {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
}

body.theme-light .chat-middle-stage,
body.theme-light .chat-stream-column,
body.theme-light .chat-tab-pane,
body.theme-light .chat-messages-scroll {
  background: #f8fafc !important;
}

body.theme-light .chat-conv-header {
  background: #ffffff !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

body.theme-light .conv-title-wrap h4,
body.theme-light #activeChatTitle {
  color: #0f172a !important;
}

body.theme-light .conv-title-wrap p,
body.theme-light #activeChatTopic {
  color: #64748b !important;
}

body.theme-light .chat-hub-tabs {
  background: #ffffff !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

body.theme-light .hub-tab-btn {
  color: #64748b !important;
}

body.theme-light .hub-tab-btn:hover {
  color: #0f172a !important;
}

body.theme-light .hub-tab-btn.active {
  color: #2563eb !important;
  border-bottom-color: #2563eb !important;
  background: rgba(37, 99, 235, 0.06) !important;
}

body.theme-light .chat-pinned-banner {
  background: #fffbeb !important;
  border-bottom: 1px solid #fef3c7 !important;
  color: #92400e !important;
}

body.theme-light .pinned-text {
  color: #78350f !important;
}

body.theme-light .pinned-label {
  color: #b45309 !important;
}

body.theme-light .btn-text-action {
  background: #fef3c7 !important;
  border: 1px solid #fde68a !important;
  color: #92400e !important;
}

body.theme-light .btn-icon-xs {
  color: #92400e !important;
}

body.theme-light .chat-input-bar {
  background: #ffffff !important;
  border-top: 1px solid #e2e8f0 !important;
}

body.theme-light .chat-composer-wrap {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
}

body.theme-light .chat-composer-wrap:focus-within {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15) !important;
}

body.theme-light .chat-text-input {
  color: #0f172a !important;
}

body.theme-light .chat-text-input::placeholder {
  color: #94a3b8 !important;
}

body.theme-light .composer-action-bar {
  background: #f8fafc !important;
  border-top: 1px solid #e2e8f0 !important;
}

body.theme-light .composer-tool-btn,
body.theme-light .tool-icon-btn {
  color: #64748b !important;
}

body.theme-light .composer-tool-btn:hover,
body.theme-light .tool-icon-btn:hover {
  color: #0f172a !important;
  background: #e2e8f0 !important;
}

body.theme-light .btn-send-msg {
  background: #2563eb !important;
  color: #ffffff !important;
}

body.theme-light .btn-send-msg:hover {
  background: #1d4ed8 !important;
}

body.theme-light .msg-bubble {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
  color: #0f172a !important;
}

body.theme-light .msg-self .msg-bubble {
  background: #eff6ff !important;
  border-color: #bfdbfe !important;
}

body.theme-light .msg-sender {
  color: #0f172a !important;
}

body.theme-light .msg-time {
  color: #94a3b8 !important;
}

body.theme-light .msg-text {
  color: #1e293b !important;
}

body.theme-light .msg-reply-quote {
  background: #f1f5f9 !important;
  border-left-color: #2563eb !important;
}

body.theme-light .reply-quote-sender {
  color: #2563eb !important;
}

body.theme-light .reply-quote-text {
  color: #475569 !important;
}

body.theme-light .msg-file-card {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
}

body.theme-light .msg-file-card:hover {
  background: #f1f5f9 !important;
}

body.theme-light .file-meta-name {
  color: #0f172a !important;
}

body.theme-light .file-ext-badge {
  background: #eff6ff !important;
  border-color: #93c5fd !important;
  color: #2563eb !important;
}

body.theme-light .reaction-chip {
  background: #f1f5f9 !important;
  border: 1px solid #cbd5e1 !important;
  color: #475569 !important;
}

body.theme-light .reaction-chip:hover {
  background: #e2e8f0 !important;
  color: #0f172a !important;
}

body.theme-light .reaction-chip.has-my-reaction {
  background: #eff6ff !important;
  border-color: #93c5fd !important;
  color: #2563eb !important;
}

body.theme-light .chat-format-toolbar {
  background: #f8fafc !important;
  border-top: 1px solid #e2e8f0 !important;
}

body.theme-light .format-btn {
  color: #475569 !important;
}

body.theme-light .format-btn:hover {
  background: #e2e8f0 !important;
  color: #0f172a !important;
}

body.theme-light .chat-typing-bar {
  background: #ffffff !important;
  color: #64748b !important;
}

body.theme-light .chat-reply-bar {
  background: #eff6ff !important;
  border-left-color: #2563eb !important;
  border-top: 1px solid #e2e8f0 !important;
}

body.theme-light .reply-to-label {
  color: #0f172a !important;
}

body.theme-light .reply-bar-snippet {
  color: #64748b !important;
}

/* --- DARK THEME TEAMS CHAT --- */
body.theme-dark .teams-deck-area,
body.theme-obsidian .teams-deck-area {
  background: #090a0f !important;
}

body.theme-dark .chat-layout,
body.theme-obsidian .chat-layout {
  background: #090a0f !important;
}

body.theme-dark .chat-sidebar,
body.theme-obsidian .chat-sidebar {
  background: #11131c !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

body.theme-dark .chat-conversation-pane,
body.theme-obsidian .chat-conversation-pane {
  background: #0d0f17 !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

body.theme-dark .chat-middle-stage,
body.theme-obsidian .chat-middle-stage,
body.theme-dark .chat-stream-column,
body.theme-obsidian .chat-stream-column,
body.theme-dark .chat-tab-pane,
body.theme-obsidian .chat-tab-pane,
body.theme-dark .chat-messages-scroll,
body.theme-obsidian .chat-messages-scroll {
  background: #0a0c13 !important;
}

body.theme-dark .chat-conv-header,
body.theme-obsidian .chat-conv-header {
  background: #0f111a !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

body.theme-dark .conv-title-wrap h4,
body.theme-obsidian .conv-title-wrap h4 {
  color: #ffffff !important;
}

body.theme-dark .conv-title-wrap p,
body.theme-obsidian .conv-title-wrap p {
  color: #8a8d9b !important;
}

body.theme-dark .chat-hub-tabs,
body.theme-obsidian .chat-hub-tabs {
  background: #0f111a !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

body.theme-dark .hub-tab-btn,
body.theme-obsidian .hub-tab-btn {
  color: #8a8d9b !important;
}

body.theme-dark .hub-tab-btn:hover,
body.theme-obsidian .hub-tab-btn:hover {
  color: #ffffff !important;
}

body.theme-dark .hub-tab-btn.active,
body.theme-obsidian .hub-tab-btn.active {
  color: #00d2ff !important;
  border-bottom-color: #00d2ff !important;
  background: rgba(0, 210, 255, 0.08) !important;
}

body.theme-dark .chat-input-bar,
body.theme-obsidian .chat-input-bar {
  background: #0f111a !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
}

body.theme-dark .chat-composer-wrap,
body.theme-obsidian .chat-composer-wrap {
  background: rgba(0, 0, 0, 0.45) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
}

body.theme-dark .chat-text-input,
body.theme-obsidian .chat-text-input {
  color: #ffffff !important;
}

body.theme-dark .composer-action-bar,
body.theme-obsidian .composer-action-bar {
  background: rgba(0, 0, 0, 0.25) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
}

body.theme-dark .msg-bubble,
body.theme-obsidian .msg-bubble {
  background: #141724 !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #ededed !important;
}

body.theme-dark .msg-self .msg-bubble,
body.theme-obsidian .msg-self .msg-bubble {
  background: #1b2034 !important;
  border-color: rgba(0, 210, 255, 0.3) !important;
}
`;

css += teamsChatOverrides;
fs.writeFileSync(cssPath, css, 'utf8');
fs.writeFileSync(path.join(hotpatchUiDir, 'style.css'), css, 'utf8');
console.log('✅ Teams chat theme overrides appended and mirrored to hotpatch');
