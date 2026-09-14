const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'wallpaper-ui');
const indexPath = path.join(uiDir, 'index.html');
const cssPath = path.join(uiDir, 'style.css');
const jsPath = path.join(uiDir, 'wallpaper.js');

let html = fs.readFileSync(indexPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');
let js = fs.readFileSync(jsPath, 'utf8');

console.log('🚀 Executing REDDOT Workstation Reference Overhaul...');

// =========================================================================
// 1. TOP HEADER & LEFT RAIL TRANSFORMATION (MATCHING media_1789227865004.jpg)
// =========================================================================

const newHeaderAndRail = `      <!-- WORKSTATION EXECUTIVE TOP HEADER (media_1789227865004.jpg) -->
      <header class="command-header workstation-top-header">
        <div class="header-left">
          <div class="rd-brand-badge" id="btnBrandHome" title="REDDOT Workstation (Space)">
            <div class="rd-brand-symbol">
              <span class="rd-symbol-ring"></span>
              <span class="rd-symbol-dot"></span>
            </div>
            <div class="rd-brand-titles">
              <span class="rd-brand-title">REDDOT</span>
              <span class="rd-brand-subtitle">WORKSTATION</span>
            </div>
          </div>
        </div>

        <!-- Universal Omnibox Search (Ctrl+K) -->
        <div class="omnibox-search-bar" id="topOmniboxSearchTrigger" title="Search for people, messages, files, or anything... (Ctrl+K)">
          <span class="search-icon">&#x1F50D;</span>
          <input type="text" id="globalOmniboxInput" class="omnibox-input" placeholder="Search for people, messages, files, or anything..." readonly>
          <kbd class="omnibox-kbd">Ctrl + K</kbd>
        </div>

        <!-- Window Controls, Telemetry & User Profile -->
        <div class="header-right">
          <!-- Online status pill -->
          <div class="header-status-pill">
            <span class="pulse-green"></span>
            <span class="header-status-text">Online</span>
          </div>

          <!-- Notification Bell -->
          <button type="button" id="btnNotificationBell" class="btn-header-tool btn-notif-bell" title="System Alerts &amp; Notifications">
            <span class="bell-icon">&#x1F514;</span>
            <span class="bell-badge" id="headerNotifBadge">3</span>
          </button>

          <!-- Dual Theme Switcher (Light Enterprise vs Obsidian Crimson Dark) -->
          <button type="button" id="btnThemeToggle" class="btn-header-tool" title="Toggle Theme (Alt+T)">
            <span id="themeToggleIcon">&#x2600;&#xFE0F;</span>
          </button>

          <!-- User Profile Chip -->
          <div class="header-user-profile" id="btnAuthTrigger" title="Switch User / View Profile">
            <img id="headerUserAvatar" class="header-user-avatar" src="assets/profile-photo.jpeg" alt="Jagadish K" onerror="this.src='assets/id-card.png';">
            <div class="header-user-info">
              <span class="header-user-name" id="headerUserName">JAGADISH K</span>
              <span class="header-user-role" id="headerUserRole">Founder</span>
            </div>
            <span class="header-user-caret">&#x25BE;</span>
          </div>

          <!-- Pin & Mode Controls -->
          <button id="btnCmdPinToggle" class="btn-outline-action" title="Toggle Desktop Background Pin Mode">
            <span id="cmdPinIcon">&#x1F4CC;</span> <span id="cmdPinText">Pin Mode</span>
          </button>
          <button id="btnToggleWallpaperMode" class="btn-outline-action" title="Return to Clean Live Wallpaper (Esc)">
            <span>&#x29E2; Wallpaper Mode [Esc]</span>
          </button>

          <!-- Native Window Buttons -->
          <div class="cmd-win-ctrl-group">
            <button id="btnCmdMinimize" class="cmd-win-btn" title="Minimize Window">&minus;</button>
            <button id="btnCmdMaximize" class="cmd-win-btn" title="Maximize Window">&#x25A2;</button>
            <button id="btnCloseCommandCenter" class="drawer-close-btn" title="Close (Esc)">&times;</button>
          </div>
        </div>
      </header>

      <!-- MAIN WORKSTATION BODY LAYOUT (Far-Left Navigation Rail + Content Deck) -->
      <div class="workstation-body-layout">
        <!-- Far-Left Iconic Icon Navigation Rail (media_1789227865004.jpg) -->
        <aside class="workstation-sidebar" id="workstationSidebar">
          <nav class="sidebar-nav-list" id="cmdTabNav">
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabDashboardView" id="tabBtnDashboard" title="Home / Dashboard">
              <span class="nav-icon">&#x2302;</span>
              <span class="nav-label">Home</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn active" data-target="tabChatView" id="tabBtnChat" title="Chat &amp; Channels">
              <span class="nav-icon">&#x1F4AC;</span>
              <span class="nav-label">Chat</span>
              <span class="nav-badge-red">2</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabWorkersView" id="tabBtnWorkers" title="Teams">
              <span class="nav-icon">&#x1F465;</span>
              <span class="nav-label">Teams</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabTimesheetsView" id="tabBtnCalendar" title="Calendar &amp; Shifts">
              <span class="nav-icon">&#x1F4C5;</span>
              <span class="nav-label">Calendar</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabTimesheetsView" id="tabBtnCalls" title="Calls">
              <span class="nav-icon">&#x1F4DE;</span>
              <span class="nav-label">Calls</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabDatabaseView" id="tabBtnFiles" title="Files">
              <span class="nav-icon">&#x1F4C1;</span>
              <span class="nav-label">Files</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabTasksView" id="tabBtnTasks" title="Tasks &amp; Sprint Management">
              <span class="nav-icon">&#x2611;</span>
              <span class="nav-label">Tasks</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabWorkersView" id="tabBtnDirectory" title="Directory &amp; Nodes">
              <span class="nav-icon">&#x1F464;</span>
              <span class="nav-label">Directory</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabTimesheetsView" id="tabBtnPresence" title="Presence">
              <span class="nav-icon">&#x1F50D;</span>
              <span class="nav-label">Presence</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabDatabaseView" id="tabBtnDatabase" title="Database">
              <span class="nav-icon">&#x1F4BE;</span>
              <span class="nav-label">Database</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabWallpapersView" id="tabBtnWallpapers" title="Wallpapers">
              <span class="nav-icon">&#x1F5BC;&#xFE0F;</span>
              <span class="nav-label">Wallpapers</span>
            </button>
            <button class="sidebar-nav-item cmd-tab-btn" data-target="tabWallpapersView" id="tabBtnSettings" title="Settings">
              <span class="nav-icon">&#x2699;</span>
              <span class="nav-label">Settings</span>
            </button>
          </nav>

          <!-- Bottom Branding & Slogan -->
          <div class="sidebar-rail-bottom">
            <button class="sidebar-nav-item" id="btnBottomSettings" title="Settings">
              <span class="nav-icon">&#x2699;</span>
              <span class="nav-label">Settings</span>
            </button>
            <div class="sidebar-slogan-block">
              <div class="slogan-line">IDEAS</div>
              <div class="slogan-line">SYSTEMS</div>
              <div class="slogan-line">PEOPLE<span class="slogan-red-dot">&bull;</span></div>
            </div>
            <div class="sidebar-version-tag">REDDOT v3.0.0</div>
            <!-- CPU Allocation Widget -->
            <div class="sidebar-cpu-box">
              <div class="cpu-meta-row">
                <span class="cpu-label">CPU Allocation</span>
                <span class="cpu-val" id="sidebarCpuPercent">28%</span>
              </div>
              <div class="cpu-bar-track">
                <div class="cpu-bar-fill" id="sidebarCpuFill" style="width: 28%;"></div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Tab Content Area -->
        <main class="command-body">`;

// Replace from <header class="command-header"> to <main class="command-body">
const startMarker = '<header class="command-header';
const endMarker = '<main class="command-body">';
const sIdx = html.indexOf(startMarker);
const eIdx = html.indexOf(endMarker);

if (sIdx !== -1 && eIdx !== -1) {
  html = html.slice(0, sIdx) + newHeaderAndRail + html.slice(eIdx + endMarker.length);
  console.log('✅ Top Header and Left Rail replaced successfully');
} else {
  console.error('❌ Could not locate header/sidebar markers');
}

// =========================================================================
// 2. COMPLETE 3-PANEL TAB CHAT VIEW (EXACT MATCH TO media_1789227865004.jpg)
// =========================================================================

const newChatSection = `        <!-- TAB 5: REDDOT WORKSTATION TEAM CHAT (Reference Image media_1789227865004.jpg) -->
        <section id="tabChatView" class="cmd-tab-pane active">
          <div class="rd-chat-3col-layout">
            <!-- COLUMN 1: CHANNELS & CONVERSATIONS SUB-SIDEBAR (260px) -->
            <aside class="rd-chat-sidebar">
              <div class="rd-chat-sidebar-header">
                <h3 class="rd-chat-sidebar-title">Chat</h3>
                <button type="button" class="btn-create-chat-plus" id="btnCreateChannel" title="New Conversation or Channel">+</button>
              </div>

              <!-- Search Conversations Bar -->
              <div class="rd-chat-search-wrap">
                <span class="search-icon">&#x1F50D;</span>
                <input type="text" id="searchChatsInput" class="rd-chat-search-input" placeholder="Search conversations...">
              </div>

              <!-- Filter Pills (All, Unread 2, Mentions, Pinned) -->
              <div class="rd-chat-filter-pills">
                <button type="button" class="rd-filter-pill active" data-filter="ALL">All</button>
                <button type="button" class="rd-filter-pill unread" data-filter="UNREAD">Unread <span class="pill-badge">2</span></button>
                <button type="button" class="rd-filter-pill" data-filter="MENTIONS">Mentions</button>
                <button type="button" class="rd-filter-pill" data-filter="PINNED">Pinned</button>
              </div>

              <!-- Scrollable Lists: Pinned, Channels, Direct Messages -->
              <div class="rd-chat-groups-scroll">
                <!-- PINNED SECTION -->
                <div class="rd-chat-group-block">
                  <div class="rd-chat-group-title-row">
                    <span class="rd-group-title">Pinned</span>
                    <span class="rd-group-caret">&#x2303;</span>
                  </div>
                  <div class="rd-pinned-list">
                    <div class="rd-conversation-item" data-channel="team-reddot">
                      <div class="rd-conv-avatar">
                        <img src="assets/profile-photo1.jpeg" alt="Team REDDOT" onerror="this.src='assets/id-card.png';">
                      </div>
                      <div class="rd-conv-info">
                        <div class="rd-conv-name-row">
                          <span class="rd-conv-name">Team REDDOT</span>
                          <span class="rd-conv-time">5:42 PM</span>
                        </div>
                        <div class="rd-conv-snippet">Karthik V: Final design looks great! &#x1F680;</div>
                      </div>
                    </div>
                    <div class="rd-conversation-item" data-channel="product-updates">
                      <div class="rd-conv-avatar">
                        <img src="assets/profile-photo.jpeg" alt="Product Updates" onerror="this.src='assets/id-card.png';">
                      </div>
                      <div class="rd-conv-info">
                        <div class="rd-conv-name-row">
                          <span class="rd-conv-name">Product Updates</span>
                          <span class="rd-conv-time">3:21 PM</span>
                        </div>
                        <div class="rd-conv-snippet">Divya M: v2.1 is live</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- CHANNELS SECTION -->
                <div class="rd-chat-group-block">
                  <div class="rd-chat-group-title-row">
                    <span class="rd-group-title">Channels</span>
                    <button type="button" class="rd-group-add-btn" id="btnAddChannelInline" title="Add Channel">+</button>
                  </div>
                  <div class="rd-channels-list" id="channelList">
                    <div class="rd-channel-pill active" data-channel="general" id="chanGeneral">
                      <span class="chan-hash">#</span>
                      <span class="chan-name">general</span>
                      <span class="chan-badge">24</span>
                    </div>
                    <div class="rd-channel-pill" data-channel="announcements" id="chanAnnouncements">
                      <span class="chan-hash">#</span>
                      <span class="chan-name">announcements</span>
                      <span class="chan-badge">8</span>
                    </div>
                    <div class="rd-channel-pill" data-channel="engineering" id="chanEngineering">
                      <span class="chan-hash">#</span>
                      <span class="chan-name">engineering</span>
                    </div>
                    <div class="rd-channel-pill" data-channel="design" id="chanDesign">
                      <span class="chan-hash">#</span>
                      <span class="chan-name">design</span>
                    </div>
                    <div class="rd-channel-pill" data-channel="hardware" id="chanHardware">
                      <span class="chan-hash">#</span>
                      <span class="chan-name">hardware</span>
                    </div>
                    <div class="rd-channel-pill" data-channel="software" id="chanSoftware">
                      <span class="chan-hash">#</span>
                      <span class="chan-name">software</span>
                    </div>
                    <div class="rd-channel-pill" data-channel="projects" id="chanProjects">
                      <span class="chan-hash">#</span>
                      <span class="chan-name">projects</span>
                    </div>
                    <div class="rd-channel-pill" data-channel="research" id="chanResearch">
                      <span class="chan-hash">#</span>
                      <span class="chan-name">research</span>
                    </div>
                  </div>
                </div>

                <!-- DIRECT MESSAGES SECTION -->
                <div class="rd-chat-group-block">
                  <div class="rd-chat-group-title-row">
                    <span class="rd-group-title">Direct Messages</span>
                    <span class="rd-group-caret">&#x2303;</span>
                  </div>
                  <div class="rd-dm-list" id="dmMembersList">
                    <div class="rd-dm-item" data-member="pavithra">
                      <div class="rd-dm-avatar-wrap">
                        <img src="assets/profile-photo1.jpeg" alt="Pavithra R" class="rd-dm-avatar" onerror="this.src='assets/id-card.png';">
                        <span class="rd-dm-dot online"></span>
                      </div>
                      <div class="rd-dm-meta">
                        <span class="rd-dm-name">Pavithra R</span>
                        <span class="rd-dm-time">5:24 PM</span>
                      </div>
                    </div>
                    <div class="rd-dm-item" data-member="arun">
                      <div class="rd-dm-avatar-wrap">
                        <img src="assets/profile-photo.jpeg" alt="Arun S" class="rd-dm-avatar" onerror="this.src='assets/id-card.png';">
                        <span class="rd-dm-dot online"></span>
                      </div>
                      <div class="rd-dm-meta">
                        <span class="rd-dm-name">Arun S</span>
                        <span class="rd-dm-time">5:39 PM</span>
                      </div>
                    </div>
                    <div class="rd-dm-item" data-member="karthik">
                      <div class="rd-dm-avatar-wrap">
                        <img src="assets/profile-photo1.jpeg" alt="Karthik V" class="rd-dm-avatar" onerror="this.src='assets/id-card.png';">
                        <span class="rd-dm-dot online"></span>
                      </div>
                      <div class="rd-dm-meta">
                        <span class="rd-dm-name">Karthik V</span>
                        <span class="rd-dm-time">4:12 PM</span>
                      </div>
                    </div>
                    <div class="rd-dm-item" data-member="divya">
                      <div class="rd-dm-avatar-wrap">
                        <img src="assets/profile-photo.jpeg" alt="Divya M" class="rd-dm-avatar" onerror="this.src='assets/id-card.png';">
                        <span class="rd-dm-dot online"></span>
                      </div>
                      <div class="rd-dm-meta">
                        <span class="rd-dm-name">Divya M</span>
                        <span class="rd-dm-time">3:21 PM</span>
                      </div>
                    </div>
                    <div class="rd-dm-item" data-member="sanjay">
                      <div class="rd-dm-avatar-wrap">
                        <img src="assets/profile-photo1.jpeg" alt="Sanjay P" class="rd-dm-avatar" onerror="this.src='assets/id-card.png';">
                        <span class="rd-dm-dot online"></span>
                      </div>
                      <div class="rd-dm-meta">
                        <span class="rd-dm-name">Sanjay P</span>
                        <span class="rd-dm-time">2:15 PM</span>
                      </div>
                    </div>
                    <div class="rd-dm-item" data-member="meena">
                      <div class="rd-dm-avatar-wrap">
                        <img src="assets/profile-photo.jpeg" alt="Meena S" class="rd-dm-avatar" onerror="this.src='assets/id-card.png';">
                        <span class="rd-dm-dot offline"></span>
                      </div>
                      <div class="rd-dm-meta">
                        <span class="rd-dm-name">Meena S</span>
                        <span class="rd-dm-time">Yesterday</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <!-- COLUMN 2: CENTER CHAT WORKSPACE (Clean High-Contrast White / Slate) -->
            <main class="rd-chat-center-deck">
              <!-- Channel Top Header -->
              <div class="rd-conv-top-bar">
                <div class="rd-conv-title-block">
                  <div class="rd-conv-main-row">
                    <span class="rd-conv-hash">#</span>
                    <h2 class="rd-conv-title" id="activeChatTitle">general</h2>
                  </div>
                  <p class="rd-conv-topic" id="activeChatTopic">Company-wide updates and collaboration.</p>
                </div>
                <div class="rd-conv-actions-block">
                  <div class="rd-members-badge">
                    <span class="rd-badge-icon">&#x1F465;</span>
                    <span class="rd-badge-val" id="activeChatMemberCount">24</span>
                  </div>
                  <button type="button" class="btn-rd-meet-primary" id="btnStartMeeting" title="Start Instant Video Meeting">
                    <span class="meet-icon">&#x1F4F9;</span>
                    <span class="meet-text">Meet</span>
                    <span class="meet-caret">&#x25BE;</span>
                  </button>
                  <button type="button" class="btn-rd-more-options" id="btnChatMoreOptions" title="More Channel Options">&hellip;</button>
                </div>
              </div>

              <!-- Channel Secondary Tab Bar (Messages, Files, Tasks, Whiteboard, Links, +) -->
              <div class="rd-conv-subtabs-bar">
                <button type="button" class="rd-subtab-btn active" data-tab="messages">Messages</button>
                <button type="button" class="rd-subtab-btn" data-tab="files">Files</button>
                <button type="button" class="rd-subtab-btn" data-tab="tasks">Tasks</button>
                <button type="button" class="rd-subtab-btn" data-tab="whiteboard">Whiteboard</button>
                <button type="button" class="rd-subtab-btn" data-tab="links">Links</button>
                <button type="button" class="rd-subtab-btn-add" title="Add Tab">+</button>
              </div>

              <!-- Main Messages Feed Stream -->
              <div class="rd-messages-feed" id="chatMessagesStream">
                <!-- Message 1: Pavithra R -->
                <div class="rd-msg-item">
                  <img src="assets/profile-photo1.jpeg" alt="Pavithra R" class="rd-msg-avatar" onerror="this.src='assets/id-card.png';">
                  <div class="rd-msg-body">
                    <div class="rd-msg-meta-row">
                      <span class="rd-msg-author">Pavithra R</span>
                      <span class="rd-msg-time">5:24 PM</span>
                    </div>
                    <div class="rd-msg-role-tag">UI/UX Designer</div>
                    <div class="rd-msg-text">The new UI build looks great! &#x1F680;<br>Here are the latest screens for review.</div>
                    <!-- Image Cards Row -->
                    <div class="rd-msg-cards-grid">
                      <div class="rd-preview-card">
                        <img src="assets/connected-ribbon.jpg" alt="Screen preview 1">
                        <div class="rd-preview-overlay">A more connected tomorrow.</div>
                      </div>
                      <div class="rd-preview-card">
                        <img src="assets/facility-banner.jpg" alt="Screen preview 2">
                        <div class="rd-preview-overlay">Workstation Nodes</div>
                      </div>
                      <div class="rd-preview-card">
                        <img src="assets/facility-banner.jpg" alt="Screen preview 3">
                        <div class="rd-preview-overlay">REDDOT - BUILD TOMORROW</div>
                      </div>
                    </div>
                    <!-- Reaction Pills -->
                    <div class="rd-reactions-row">
                      <button type="button" class="rd-reaction-pill">&#x1F44D; 12</button>
                      <button type="button" class="rd-reaction-pill">&#x2764;&#xFE0F; 4</button>
                      <button type="button" class="rd-reaction-pill">&#x1F389; 3</button>
                      <button type="button" class="rd-reaction-pill">&#x1F3AF;</button>
                    </div>
                  </div>
                </div>

                <!-- Message 2: Arun S -->
                <div class="rd-msg-item">
                  <img src="assets/profile-photo.jpeg" alt="Arun S" class="rd-msg-avatar" onerror="this.src='assets/id-card.png';">
                  <div class="rd-msg-body">
                    <div class="rd-msg-meta-row">
                      <span class="rd-msg-author">Arun S</span>
                      <span class="rd-msg-time">5:39 PM</span>
                    </div>
                    <div class="rd-msg-role-tag">Embedded Engineer</div>
                    <div class="rd-msg-text">I've pushed the latest firmware update to the repo.<br>Please pull and test on your end.</div>
                    <!-- File Attachment Card -->
                    <div class="rd-file-attach-card" id="btnDownloadFirmwareZip">
                      <div class="file-icon-box">&#x1F4E5;</div>
                      <div class="file-meta-box">
                        <span class="file-name">Firmware_v2.1.0.zip</span>
                        <span class="file-sub">12.4 MB &bull; Updated 2h ago</span>
                      </div>
                      <button type="button" class="btn-file-dl" title="Download">&#x2913;</button>
                    </div>
                    <div class="rd-reactions-row">
                      <button type="button" class="rd-reaction-pill">&#x1F44D; 6</button>
                      <button type="button" class="rd-reaction-reply">&#x21A9;</button>
                    </div>
                  </div>
                </div>

                <!-- Message 3: Karthik V -->
                <div class="rd-msg-item">
                  <img src="assets/profile-photo1.jpeg" alt="Karthik V" class="rd-msg-avatar" onerror="this.src='assets/id-card.png';">
                  <div class="rd-msg-body">
                    <div class="rd-msg-meta-row">
                      <span class="rd-msg-author">Karthik V</span>
                      <span class="rd-msg-time">4:12 PM</span>
                    </div>
                    <div class="rd-msg-role-tag">Software Engineer</div>
                    <div class="rd-msg-text">The backend services are stable now.<br>We can start the integration testing tomorrow.</div>
                    <div class="rd-reactions-row">
                      <button type="button" class="rd-reaction-pill">&#x1F44D; 4</button>
                      <button type="button" class="rd-reaction-pill">&#x1F517; 2</button>
                    </div>
                  </div>
                </div>

                <!-- Message 4: Divya M -->
                <div class="rd-msg-item">
                  <img src="assets/profile-photo.jpeg" alt="Divya M" class="rd-msg-avatar" onerror="this.src='assets/id-card.png';">
                  <div class="rd-msg-body">
                    <div class="rd-msg-meta-row">
                      <span class="rd-msg-author">Divya M</span>
                      <span class="rd-msg-time">3:21 PM</span>
                    </div>
                    <div class="rd-msg-role-tag">Product Designer</div>
                    <div class="rd-msg-text">Concept for the new onboarding flow. Feedback welcome!</div>
                    <!-- 4 Slide Thumbnails -->
                    <div class="rd-onboard-cards-grid">
                      <div class="rd-onboard-card">
                        <span class="ob-label">Welcome to REDDOT</span>
                        <span class="ob-sub">01</span>
                      </div>
                      <div class="rd-onboard-card">
                        <span class="ob-label">Built for people who build.</span>
                        <span class="ob-sub">02</span>
                      </div>
                      <div class="rd-onboard-card">
                        <span class="ob-label">Collaboration without limits.</span>
                        <span class="ob-sub">03</span>
                      </div>
                      <div class="rd-onboard-card">
                        <span class="ob-label">A more connected tomorrow.</span>
                        <span class="ob-sub">04</span>
                      </div>
                    </div>
                    <div class="rd-reactions-row">
                      <button type="button" class="rd-reaction-pill">&#x2764;&#xFE0F; 8</button>
                      <button type="button" class="rd-reaction-pill">&#x1F525; 3</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Channel Bottom Input Bar -->
              <div class="rd-chat-input-bar">
                <form id="chatMessageForm" class="rd-chat-form">
                  <input type="text" id="chatInputMessage" class="rd-chat-input-field" placeholder="Message #general..." autocomplete="off">
                  <div class="rd-chat-input-actions">
                    <div class="rd-input-tools-left">
                      <button type="button" class="btn-input-tool" title="Add Item">+</button>
                      <button type="button" class="btn-input-tool" id="btnChatEmoji" title="Insert Emoji">&#x1F60A;</button>
                      <button type="button" class="btn-input-tool" title="Insert GIF">GIF</button>
                      <button type="button" class="btn-input-tool" id="btnChatAttach" title="Attach File">&#x1F4CE;</button>
                      <button type="button" class="btn-input-tool" title="Voice Message">&#x1F3A4;</button>
                      <button type="button" class="btn-input-tool" title="Mention Member">@</button>
                    </div>
                    <div class="rd-input-tools-right">
                      <span class="rd-input-hint">Shift + Enter for new line</span>
                      <button type="submit" id="btnSendMessage" class="btn-rd-send" title="Send Message (Enter)">
                        <span class="send-icon">&#x27A4;</span>
                      </button>
                    </div>
                  </div>
                  <input type="file" id="chatFileInput" class="hidden">
                </form>
              </div>
            </main>

            <!-- COLUMN 3: RIGHT EXECUTIVE TELEMETRY & MEDIA PANEL (340px) -->
            <aside class="rd-executive-rail">
              <!-- 1. Top Card: Facility Banner (WORK TOGETHER BUILD TOMORROW) -->
              <div class="rd-facility-card">
                <div class="facility-img-wrap">
                  <img src="assets/facility-banner.jpg" alt="REDDOT Facility" class="facility-bg-img" onerror="this.style.display='none';">
                  <div class="facility-overlay">
                    <div class="facility-location">
                      <span class="loc-pin">&#x1F4CD;</span>
                      <span>Chennai, India</span>
                    </div>
                    <div class="facility-brand-text">
                      <span class="facility-brand">REDDOT</span>
                      <span class="facility-tagline">WORK TOGETHER<br>BUILD TOMORROW</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. Founder Video Card (JAGADISH K) -->
              <div class="rd-founder-video-card">
                <div class="founder-img-wrap">
                  <img src="assets/profile-photo.jpeg" alt="Jagadish K" class="founder-photo-img" onerror="this.src='assets/id-card.png';">
                  <div class="founder-audio-wave">
                    <span class="wave-bar bar1"></span>
                    <span class="wave-bar bar2"></span>
                    <span class="wave-bar bar3"></span>
                  </div>
                  <div class="founder-overlay-info">
                    <h3 class="founder-name">JAGADISH K</h3>
                    <span class="founder-role">Founder</span>
                    <p class="founder-quote">&ldquo;Build tools that outlive us.&rdquo;</p>
                  </div>
                </div>
                <!-- Call Action Controls Bar -->
                <div class="founder-call-controls">
                  <button type="button" class="btn-call-tool active" id="btnCallMute" title="Toggle Mic">&#x1F3A4;</button>
                  <button type="button" class="btn-call-tool active" id="btnCallVideo" title="Toggle Video">&#x1F4F9;</button>
                  <button type="button" class="btn-call-tool" id="btnCallShare" title="Share Screen">&#x1F5A5;&#xFE0F;</button>
                  <button type="button" class="btn-call-tool" id="btnCallMore" title="Call Settings">&hellip;</button>
                  <button type="button" class="btn-call-tool end" id="btnCallLeave" title="Leave Call">&#x1F4DE;</button>
                </div>
              </div>

              <!-- 3. Upcoming Meetings Card -->
              <div class="rd-rail-card">
                <div class="rd-rail-card-header">
                  <h4 class="rail-card-title">Upcoming</h4>
                  <button type="button" class="rail-card-link">View all</button>
                </div>
                <div class="rd-upcoming-list">
                  <div class="rd-upcoming-item">
                    <div class="upcoming-icon-box red">&#x1F4C5;</div>
                    <div class="upcoming-info">
                      <span class="upcoming-name">Team Sync</span>
                      <span class="upcoming-time">Today, 6:00 PM &ndash; 6:30 PM</span>
                    </div>
                    <button type="button" class="btn-upcoming-action join" id="btnJoinTeamSync">Join</button>
                    <button type="button" class="btn-upcoming-more">&hellip;</button>
                  </div>
                  <div class="rd-upcoming-item">
                    <div class="upcoming-icon-box orange">&#x1F4CB;</div>
                    <div class="upcoming-info">
                      <span class="upcoming-name">Design Review</span>
                      <span class="upcoming-time">Tomorrow, 11:00 AM &ndash; 12:00 PM</span>
                    </div>
                    <button type="button" class="btn-upcoming-action view">View</button>
                    <button type="button" class="btn-upcoming-more">&hellip;</button>
                  </div>
                  <div class="rd-upcoming-item">
                    <div class="upcoming-icon-box blue">&#x2699;</div>
                    <div class="upcoming-info">
                      <span class="upcoming-name">Hardware Discussion</span>
                      <span class="upcoming-time">Fri, 15 Sep, 03:00 PM &ndash; 04:00 PM</span>
                    </div>
                    <button type="button" class="btn-upcoming-action join">Join</button>
                    <button type="button" class="btn-upcoming-more">&hellip;</button>
                  </div>
                </div>
              </div>

              <!-- 4. Team Members Card -->
              <div class="rd-rail-card">
                <div class="rd-rail-card-header">
                  <h4 class="rail-card-title">Team Members</h4>
                  <button type="button" class="rail-card-link">View all</button>
                </div>
                <div class="rd-members-row">
                  <div class="member-chip-item">
                    <div class="chip-avatar-wrap">
                      <img src="assets/profile-photo.jpeg" alt="Jagadish K">
                      <span class="chip-dot online"></span>
                    </div>
                    <span class="chip-name">JAGADISH K</span>
                    <span class="chip-sub">Founder</span>
                  </div>
                  <div class="member-chip-item">
                    <div class="chip-avatar-wrap">
                      <img src="assets/profile-photo1.jpeg" alt="Pavithra R">
                      <span class="chip-dot online"></span>
                    </div>
                    <span class="chip-name">Pavithra R</span>
                    <span class="chip-sub">UI/UX</span>
                  </div>
                  <div class="member-chip-item">
                    <div class="chip-avatar-wrap">
                      <img src="assets/profile-photo.jpeg" alt="Arun S">
                      <span class="chip-dot online"></span>
                    </div>
                    <span class="chip-name">Arun S</span>
                    <span class="chip-sub">Embedded</span>
                  </div>
                  <div class="member-chip-item">
                    <div class="chip-avatar-wrap">
                      <img src="assets/profile-photo1.jpeg" alt="Karthik V">
                      <span class="chip-dot online"></span>
                    </div>
                    <span class="chip-name">Karthik V</span>
                    <span class="chip-sub">Software</span>
                  </div>
                  <button type="button" class="btn-members-arrow">&rsaquo;</button>
                </div>
              </div>

              <!-- 5. Presence World Map Card -->
              <div class="rd-rail-card">
                <div class="rd-rail-card-header">
                  <h4 class="rail-card-title">Presence</h4>
                  <button type="button" class="rail-card-link">View all</button>
                </div>
                <div class="rd-presence-body">
                  <!-- Stylized SVG World Map -->
                  <div class="presence-map-wrap">
                    <svg viewBox="0 0 400 200" class="presence-world-svg">
                      <!-- Grid & Continents Dots -->
                      <g fill="rgba(150, 160, 180, 0.35)">
                        <circle cx="80" cy="60" r="3"></circle><circle cx="95" cy="55" r="3"></circle><circle cx="110" cy="70" r="3"></circle>
                        <circle cx="90" cy="80" r="3"></circle><circle cx="105" cy="95" r="3"></circle><circle cx="120" cy="110" r="3"></circle>
                        <circle cx="180" cy="50" r="3"></circle><circle cx="195" cy="45" r="3"></circle><circle cx="210" cy="60" r="3"></circle>
                        <circle cx="200" cy="75" r="3"></circle><circle cx="215" cy="90" r="3"></circle><circle cx="225" cy="105" r="3"></circle>
                        <!-- Asia / India Pin (Chennai) -->
                        <circle cx="270" cy="95" r="4" fill="#0062ff"></circle>
                        <circle cx="280" cy="85" r="3"></circle><circle cx="295" cy="75" r="3"></circle><circle cx="310" cy="85" r="3"></circle>
                        <circle cx="325" cy="70" r="3"></circle><circle cx="340" cy="85" r="3"></circle><circle cx="330" cy="130" r="3"></circle>
                      </g>
                    </svg>
                  </div>
                  <div class="presence-legend-grid">
                    <div class="legend-item"><span class="leg-dot online"></span> Online <span class="leg-val">12</span></div>
                    <div class="legend-item"><span class="leg-dot meeting"></span> In a meeting <span class="leg-val">4</span></div>
                    <div class="legend-item"><span class="leg-dot break"></span> On break <span class="leg-val">2</span></div>
                    <div class="legend-item"><span class="leg-dot offline"></span> Offline <span class="leg-val">3</span></div>
                  </div>
                </div>
              </div>

              <!-- 6. Shared Files Card -->
              <div class="rd-rail-card">
                <div class="rd-rail-card-header">
                  <h4 class="rail-card-title">Shared Files</h4>
                  <button type="button" class="rail-card-link">View all</button>
                </div>
                <div class="rd-files-list">
                  <div class="rd-file-row">
                    <div class="file-icon-square purple">&#x1F3A5;</div>
                    <div class="file-row-info">
                      <span class="file-row-name">Product_Demo.mp4</span>
                      <span class="file-row-sub">12.4 MB &bull; Today</span>
                    </div>
                    <button type="button" class="btn-file-more">&hellip;</button>
                  </div>
                  <div class="rd-file-row">
                    <div class="file-icon-square red">&#x1F4D5;</div>
                    <div class="file-row-info">
                      <span class="file-row-name">System_Architecture.pdf</span>
                      <span class="file-row-sub">3.1 MB &bull; Yesterday</span>
                    </div>
                    <button type="button" class="btn-file-more">&hellip;</button>
                  </div>
                  <div class="rd-file-row">
                    <div class="file-icon-square fig">&#x2756;</div>
                    <div class="file-row-info">
                      <span class="file-row-name">UI_Concept.fig</span>
                      <span class="file-row-sub">8.7 MB &bull; 11 Sep</span>
                    </div>
                    <button type="button" class="btn-file-more">&hellip;</button>
                  </div>
                  <div class="rd-file-row">
                    <div class="file-icon-square blue">&#x1F4C4;</div>
                    <div class="file-row-info">
                      <span class="file-row-name">Firmware_Release_Notes.md</span>
                      <span class="file-row-sub">12 KB &bull; 10 Sep</span>
                    </div>
                    <button type="button" class="btn-file-more">&hellip;</button>
                  </div>
                </div>
              </div>

              <!-- 7. Bottom Card: A More Connected Tomorrow (connected-ribbon.jpg) -->
              <div class="rd-ribbon-card">
                <img src="assets/connected-ribbon.jpg" alt="A more connected tomorrow" class="ribbon-bg-img" onerror="this.style.display='none';">
                <div class="ribbon-text-overlay">
                  <h3>A more<br>connected<br>tomorrow<span class="ribbon-red-dot">&bull;</span></h3>
                </div>
              </div>
            </aside>
          </div>
        </section>`;

// Replace tabChatView
const chatStart = '<section id="tabChatView" class="cmd-tab-pane';
const chatEnd = '</section>\n\n        <!-- TAB 6: FLEET HARDWARE & SYSTEM TELEMETRY -->';
const csIdx = html.indexOf(chatStart);
const ceIdx = html.indexOf(chatEnd);

if (csIdx !== -1 && ceIdx !== -1) {
  html = html.slice(0, csIdx) + newChatSection + html.slice(ceIdx + '</section>'.length);
  console.log('✅ tabChatView successfully replaced with 3-column reference layout');
} else {
  // Try finding next section
  const nextSec = '<section id="tabTelemetryView"';
  const nIdx = html.indexOf(nextSec);
  if (csIdx !== -1 && nIdx !== -1) {
    const endSecIdx = html.lastIndexOf('</section>', nIdx);
    html = html.slice(0, csIdx) + newChatSection + '\n\n        ' + html.slice(nIdx);
    console.log('✅ tabChatView replaced using tabTelemetryView boundary');
  } else {
    console.error('❌ Could not locate tabChatView boundaries');
  }
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ index.html written successfully');
