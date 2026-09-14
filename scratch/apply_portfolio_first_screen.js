const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'wallpaper-ui');
const indexPath = path.join(uiDir, 'index.html');
const cssPath = path.join(uiDir, 'style.css');
const jsPath = path.join(uiDir, 'wallpaper.js');

console.log('⚡ Starting Primary Screen & Unified Dark Theme Application...');

// =========================================================================
// 1. UPDATE INDEX.HTML
// =========================================================================
let html = fs.readFileSync(indexPath, 'utf8');

// A. Set body classes to theme-obsidian mode-wallpaper
html = html.replace(/<body class="[^"]*">/, '<body class="theme-obsidian mode-wallpaper">');

// B. Define exact reference first screen HTML
const referenceWallpaperHtml = `  <!-- =========================================================================
       MANDATORY SCREEN: JAGADISH.K PORTFOLIO LIVE WALLPAPER (REFERENCE PIXEL-PERFECT)
       ========================================================================= -->
  <div id="wallpaperRoot" class="wp-root">

    <!-- Top Minimalist Bar: Hexagon Portfolio Logo & Nav Links -->
    <header class="top-bar">
      <div class="brand-block" id="btnBrandPortfolio" title="Jagadish K Portfolio - Click to Toggle Command Center">
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

      <!-- Giant Bold Centerpiece Typography: JAGADISH -->
      <div class="giant-name-backdrop pointer-events-none">
        <h1 class="giant-name" id="giantNameText">JAGADISH</h1>
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
          <div class="card-frame" id="cardBadgeTrigger" title="Click to open Workstation Command Center or View ID Card">
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

// Replace #wallpaperRoot in index.html
const wpStart = '<div id="wallpaperRoot" class="wp-root">';
const wpEnd = '<div id="commandCenterDrawer"';

const sIdx = html.indexOf(wpStart);
const eIdx = html.indexOf(wpEnd);

if (sIdx !== -1 && eIdx !== -1) {
  html = html.slice(0, sIdx) + referenceWallpaperHtml + '\n\n  <!-- =========================================================================\n       ENTERPRISE ADMIN & WORKSTATION COMMAND CENTER\n       ========================================================================= -->\n  ' + html.slice(eIdx);
  console.log('✅ #wallpaperRoot replaced with Reference First Screen layout');
} else {
  console.error('❌ Could not locate #wallpaperRoot boundaries');
}

// C. Ensure commandCenterDrawer starts with collapsed
html = html.replace(/<div id="commandCenterDrawer" class="command-center-overlay">/, '<div id="commandCenterDrawer" class="command-center-overlay collapsed">');

// D. Add Portfolio Modals before </body> if not present
const portfolioModalsHtml = `
  <!-- =========================================================================
       PORTFOLIO MODALS (ABOUT, RESUME, MOMENTS)
       ========================================================================= -->
  <!-- PORTFOLIO ABOUT MODAL -->
  <div id="aboutPortfolioModal" class="portfolio-modal-overlay hidden">
    <div class="portfolio-modal-backdrop" id="aboutModalBackdrop"></div>
    <div class="portfolio-modal-card">
      <div class="portfolio-modal-header">
        <div class="modal-header-brand">
          <span class="brand-hex">&#x2B22;</span>
          <div>
            <h3>JAGADISH K</h3>
            <span class="modal-sub">FOUNDER &amp; TECHNICAL HEAD</span>
          </div>
        </div>
        <button type="button" class="btn-modal-close" id="btnCloseAboutModal">&times;</button>
      </div>
      <div class="portfolio-modal-body">
        <div class="about-hero">
          <img src="assets/id-card.png" alt="Jagadish K" class="about-avatar">
          <div class="about-hero-text">
            <h4>Hardware Architect &amp; Embedded Systems</h4>
            <p>Pioneering high-throughput workstation operating architectures, real-time telemetry pipelines, and low-power hardware enclaves. Creator and lead architect of REDDOT Workstation OS.</p>
            <div class="about-pills">
              <span class="about-pill">FPGA / ASIC Design</span>
              <span class="about-pill">ARM Cortex RTOS</span>
              <span class="about-pill">Distributed Workstations</span>
              <span class="about-pill">TLS 1.3 Microkernels</span>
            </div>
          </div>
        </div>
        <div class="about-section">
          <h5>ARCHITECTURAL VISION</h5>
          <p>Building zero-surveillance, ultra-fast, offline-first operating environments where engineers own their data, hardware executes deterministically, and collaboration occurs at wire speeds.</p>
        </div>
      </div>
      <div class="portfolio-modal-footer">
        <button type="button" class="btn-modal-action-sec" id="btnAboutCloseFooter">Close</button>
        <button type="button" class="btn-modal-action-pri" id="btnAboutExploreWorkstation">Explore Workstation &rarr;</button>
      </div>
    </div>
  </div>

  <!-- PORTFOLIO RESUME MODAL -->
  <div id="resumePortfolioModal" class="portfolio-modal-overlay hidden">
    <div class="portfolio-modal-backdrop" id="resumeModalBackdrop"></div>
    <div class="portfolio-modal-card portfolio-resume-card">
      <div class="portfolio-modal-header">
        <div class="modal-header-brand">
          <span class="brand-hex">&#x2B22;</span>
          <div>
            <h3>CURRICULUM VITAE &bull; JAGADISH K</h3>
            <span class="modal-sub">TECHNICAL HEAD &amp; FOUNDER // HARDWARE ARCHITECT</span>
          </div>
        </div>
        <button type="button" class="btn-modal-close" id="btnCloseResumeModal">&times;</button>
      </div>
      <div class="portfolio-modal-body resume-modal-body">
        <div class="resume-block">
          <div class="resume-block-title">EXECUTIVE SUMMARY</div>
          <p>Technical Head &amp; Founder with extensive background in hardware architecture, embedded systems firmware, and distributed workstation OS engineering. Proven track record leading multidisciplinary teams across hardware-software co-design.</p>
        </div>
        <div class="resume-grid">
          <div class="resume-col">
            <div class="resume-block-title">CORE COMPETENCIES</div>
            <ul class="resume-list">
              <li><strong>Architecture:</strong> System-on-Chip (SoC), FPGA Co-processing, RISC-V</li>
              <li><strong>Embedded Firmware:</strong> Embedded C/C++, FreeRTOS, Zephyr, Device Drivers</li>
              <li><strong>Protocols:</strong> SPI, I2C, CAN, PCIe, USB 3.0, Ethernet PHY, TLS 1.3</li>
              <li><strong>Systems:</strong> Electron, Chromium V8, Linux Kernel, High-Performance SQLite</li>
            </ul>
          </div>
          <div class="resume-col">
            <div class="resume-block-title">LEADERSHIP &amp; EXPERIENCE</div>
            <div class="resume-item">
              <div class="resume-item-head">
                <strong>Founder &amp; Technical Head</strong>
                <span class="resume-dates">2022 &ndash; PRESENT</span>
              </div>
              <div class="resume-item-sub">REDDOT Technologies &bull; Enterprise Workstation Division</div>
              <p>Architected REDDOT Workstation OS v3.0, coordinating real-time telemetry, 60fps hardware renderer, and enterprise node orchestration.</p>
            </div>
          </div>
        </div>
      </div>
      <div class="portfolio-modal-footer">
        <button type="button" class="btn-modal-action-sec" id="btnResumeCloseFooter">Close</button>
        <button type="button" class="btn-modal-action-pri" id="btnResumePrint">Print / Save CV</button>
      </div>
    </div>
  </div>

  <!-- PORTFOLIO MOMENTS MODAL -->
  <div id="momentsPortfolioModal" class="portfolio-modal-overlay hidden">
    <div class="portfolio-modal-backdrop" id="momentsModalBackdrop"></div>
    <div class="portfolio-modal-card">
      <div class="portfolio-modal-header">
        <div class="modal-header-brand">
          <span class="brand-hex">&#x2B22;</span>
          <div>
            <h3>ENGINEERING MOMENTS &amp; MILESTONES</h3>
            <span class="modal-sub">REDDOT ARCHITECTURE JOURNEY</span>
          </div>
        </div>
        <button type="button" class="btn-modal-close" id="btnCloseMomentsModal">&times;</button>
      </div>
      <div class="portfolio-modal-body">
        <div class="moments-timeline">
          <div class="moment-item">
            <span class="moment-year">2026</span>
            <div class="moment-content">
              <strong>REDDOT Workstation OS v3.0 Enterprise Launch</strong>
              <p>Full deployment of node-04a cluster, persistent disk vault, and procedural architecture wallpapers.</p>
            </div>
          </div>
          <div class="moment-item">
            <span class="moment-year">2025</span>
            <div class="moment-content">
              <strong>Custom Hardware Prototype Lab &bull; Node Enclave</strong>
              <p>Fabrication of hardware badge controller and low-latency encrypted telemetry bridge.</p>
            </div>
          </div>
          <div class="moment-item">
            <span class="moment-year">2024</span>
            <div class="moment-content">
              <strong>Zero-Surveillance Architecture Specification</strong>
              <p>Published industrial privacy guidelines and offline-first peer synchronization framework.</p>
            </div>
          </div>
        </div>
      </div>
      <div class="portfolio-modal-footer">
        <button type="button" class="btn-modal-action-sec" id="btnMomentsCloseFooter">Close</button>
        <button type="button" class="btn-modal-action-pri" id="btnMomentsViewGallery">View Wallpaper Gallery &rarr;</button>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="aboutPortfolioModal"')) {
  html = html.replace('</body>', portfolioModalsHtml + '\n</body>');
  console.log('✅ Portfolio Modals added to index.html');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ index.html updated successfully');

// =========================================================================
// 2. UPDATE STYLE.CSS FOR MANDATORY SCREEN & UNIFIED DARK THEME
// =========================================================================
let css = fs.readFileSync(cssPath, 'utf8');

const mandatoryPortfolioCss = `
/* ==========================================================================
   PRIMARY SCREEN: JAGADISH.K PORTFOLIO LIVE WALLPAPER (REFERENCE PIXEL-PERFECT)
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

/* Subtle Architectural Grid Backdrop matching reference */
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

/* Top Bar: Left Hexagon Logo + Right Portfolio Nav Links */
.top-bar {
  position: relative !important;
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  z-index: 25 !important;
}

.brand-block {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  cursor: pointer !important;
  user-select: none !important;
}

.brand-icon-box {
  width: 32px !important;
  height: 32px !important;
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.brand-hex {
  font-size: 16px !important;
  color: #ffffff !important;
}

.brand-meta {
  display: flex !important;
  flex-direction: column !important;
}

.brand-name {
  font-family: var(--font-display, 'Space Grotesk', sans-serif) !important;
  font-weight: 800 !important;
  font-size: 13px !important;
  letter-spacing: 0.12em !important;
  color: #ffffff !important;
  line-height: 1.2 !important;
}

.brand-sub {
  font-family: var(--font-mono, monospace) !important;
  font-size: 9px !important;
  letter-spacing: 0.16em !important;
  color: #727284 !important;
  margin-top: 2px !important;
}

/* Top Portfolio Nav Links */
.top-nav-links {
  display: flex !important;
  align-items: center !important;
  gap: 28px !important;
}

.top-nav-link {
  font-family: var(--font-sans, 'Inter', sans-serif) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0.14em !important;
  color: #8e8e9f !important;
  text-decoration: none !important;
  transition: color 0.15s ease !important;
}

.top-nav-link:hover {
  color: #ffffff !important;
}

.btn-top-contact {
  background: #ffffff !important;
  color: #000000 !important;
  font-family: var(--font-sans, 'Inter', sans-serif) !important;
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
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.5) !important;
}

.subtle-win-ctrls {
  margin-left: 20px !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

/* Center Stage Side Tags */
.cyan-accent {
  color: #38bdf8 !important;
  font-family: var(--font-sans, 'Inter', sans-serif) !important;
  font-weight: 700 !important;
  font-size: 12.5px !important;
  letter-spacing: 0.08em !important;
}

.white-accent {
  color: #ffffff !important;
  font-family: var(--font-sans, 'Inter', sans-serif) !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  letter-spacing: 0.08em !important;
  margin-top: 4px !important;
}

.right-tag .tag-bold {
  font-family: var(--font-sans, 'Inter', sans-serif) !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  letter-spacing: 0.08em !important;
  color: #ffffff !important;
}

/* Giant Name Typography: JAGADISH */
.giant-name-backdrop {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: 100% !important;
  text-align: center !important;
  z-index: 5 !important;
  pointer-events: none !important;
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
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  z-index: 20 !important;
  perspective: 1200px !important;
}

.lanyard-card {
  position: relative !important;
  width: 295px !important;
  height: 472px !important;
  transform-style: preserve-3d !important;
  transition: transform 0.15s ease-out !important;
  cursor: pointer !important;
}

.lanyard-ribbon {
  position: absolute !important;
  bottom: 100% !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  margin-bottom: -6px !important;
  z-index: 10 !important;
}

.ribbon-line {
  width: 20px !important;
  height: 100vh !important;
  background: #111217 !important;
  border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.8) !important;
}

.metallic-clip {
  width: 38px !important;
  height: 22px !important;
  background: #1f2129 !important;
  border: 1px solid #333642 !important;
  border-radius: 4px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.9) !important;
  margin-top: -2px !important;
}

.clip-slot {
  width: 18px !important;
  height: 4px !important;
  background: #090a0d !important;
  border-radius: 2px !important;
}

.card-frame {
  position: relative !important;
  width: 100% !important;
  height: 100% !important;
  background: #111217 !important;
  border: 8px solid #14151a !important;
  border-radius: 28px !important;
  overflow: hidden !important;
  box-shadow: 
    0 40px 100px rgba(0, 0, 0, 0.98),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 12px 35px rgba(0, 0, 0, 0.9) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.card-image-box {
  width: 100% !important;
  height: 100% !important;
  border-radius: 20px !important;
  overflow: hidden !important;
  display: flex !important;
}

.card-image {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}

/* Bottom Bar: 01, Arrow, Watermark */
.bottom-page-circle {
  width: 26px !important;
  height: 26px !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-family: var(--font-sans, 'Inter', sans-serif) !important;
  font-size: 10.5px !important;
  font-weight: 700 !important;
  color: #ffffff !important;
}

.bottom-center {
  position: absolute !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  bottom: 24px !important;
}

.bottom-arrow-btn {
  width: 32px !important;
  height: 32px !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 50% !important;
  background: transparent !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 16px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.bottom-arrow-btn:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  border-color: rgba(255, 255, 255, 0.7) !important;
  transform: translateY(2px) !important;
  box-shadow: 0 0 14px rgba(255, 255, 255, 0.3) !important;
}

.bottom-bar .watermark-tag {
  text-align: right !important;
}

.bottom-bar .watermark-sub {
  font-family: var(--font-sans, 'Inter', sans-serif) !important;
  font-size: 9px !important;
  font-weight: 600 !important;
  letter-spacing: 0.1em !important;
  color: #8a8d9b !important;
}

.bottom-bar .watermark-bold {
  font-family: var(--font-sans, 'Inter', sans-serif) !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  letter-spacing: 0.1em !important;
  color: #ffffff !important;
  margin-top: 2px !important;
}

/* ==========================================================================
   COMMAND CENTER COLLAPSE & OPAQUE SHELL IN OBSIDIAN DARK THEME
   ========================================================================== */
.command-center-overlay.collapsed {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
  transform: scale(0.98) !important;
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

/* Active Nav Indicator in Dark Mode */
body.theme-dark .sidebar-nav-item.active,
body.theme-obsidian .sidebar-nav-item.active {
  background: rgba(0, 98, 255, 0.18) !important;
  color: #38bdf8 !important;
  font-weight: 700 !important;
  border: 1px solid rgba(56, 189, 248, 0.4) !important;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.15) !important;
}

/* Portfolio Modals Styling */
.portfolio-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.portfolio-modal-overlay.hidden {
  display: none;
}

.portfolio-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(8px);
}

.portfolio-modal-card {
  position: relative;
  width: 100%;
  max-width: 640px;
  background: #0e111a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2;
  animation: modalScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.portfolio-resume-card {
  max-width: 780px;
}

@keyframes modalScaleIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.portfolio-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: #121522;
}

.modal-header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header-brand h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.08em;
  font-family: var(--font-display, 'Space Grotesk', sans-serif);
}

.modal-sub {
  font-size: 10px;
  color: #38bdf8;
  font-weight: 700;
  letter-spacing: 0.1em;
  font-family: var(--font-mono, monospace);
}

.btn-modal-close {
  background: transparent;
  border: none;
  color: #8a8d9b;
  font-size: 22px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}

.btn-modal-close:hover {
  color: #ffffff;
}

.portfolio-modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: 70vh;
  color: #d1d5db;
  font-size: 13.5px;
  line-height: 1.6;
}

.about-hero {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.about-avatar {
  width: 90px;
  height: 140px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
}

.about-hero-text h4 {
  margin: 0 0 8px 0;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
}

.about-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.about-pill {
  font-size: 11px;
  font-weight: 600;
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 3px 10px;
  border-radius: 20px;
}

.about-section {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.about-section h5 {
  margin: 0 0 6px 0;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: #94a3b8;
}

.resume-block {
  margin-bottom: 18px;
}

.resume-block-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #38bdf8;
  margin-bottom: 8px;
  font-family: var(--font-mono, monospace);
}

.resume-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.resume-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.resume-list li {
  margin-bottom: 8px;
  font-size: 12.5px;
  color: #cbd5e1;
}

.resume-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px;
  border-radius: 8px;
}

.resume-item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ffffff;
  font-size: 13px;
}

.resume-dates {
  font-size: 10px;
  color: #94a3b8;
  font-family: var(--font-mono, monospace);
}

.resume-item-sub {
  font-size: 11.5px;
  color: #38bdf8;
  margin: 3px 0 6px 0;
}

.moments-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.moment-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.moment-year {
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  padding: 4px 8px;
  border-radius: 6px;
}

.moment-content strong {
  display: block;
  color: #ffffff;
  font-size: 13px;
  margin-bottom: 4px;
}

.moment-content p {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.portfolio-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: #121522;
}

.btn-modal-action-sec {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  padding: 7px 18px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-modal-action-sec:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-modal-action-pri {
  background: #0062ff;
  border: 1px solid #3b82f6;
  color: #ffffff;
  padding: 7px 20px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 2px 10px rgba(0, 98, 255, 0.3);
}

.btn-modal-action-pri:hover {
  background: #0072ff;
  box-shadow: 0 4px 14px rgba(0, 98, 255, 0.5);
}
`;

// Append CSS if not already present
const marker = '/* ==========================================================================\n   PRIMARY SCREEN: JAGADISH.K PORTFOLIO LIVE WALLPAPER';
if (!css.includes(marker)) {
  css += '\n\n' + mandatoryPortfolioCss;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ style.css updated with Primary Screen styles');
} else {
  // Replace existing marker block with updated CSS
  const mIdx = css.indexOf(marker);
  css = css.slice(0, mIdx) + mandatoryPortfolioCss;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ style.css updated (marker replaced)');
}

// =========================================================================
// 3. UPDATE WALLPAPER.JS (NAVIGATION, MODALS, DEFAULT DARK THEME)
// =========================================================================
let js = fs.readFileSync(jsPath, 'utf8');

// Ensure state starts with commandCenterOpen: false
js = js.replace(/commandCenterOpen:\s*true/g, 'commandCenterOpen: false');

// Ensure default theme is dark / obsidian
js = js.replace(/localStorage\.getItem\('reddot_theme'\)\s*\|\|\s*'light'/g, "localStorage.getItem('reddot_theme') || 'dark'");

// Add portfolio navigation and modal wireup
const portfolioWireup = `
  // =========================================================================
  // PORTFOLIO FIRST SCREEN WIREUP & MODALS
  // =========================================================================
  function initPortfolioFirstScreen() {
    // 1. Arrow Button & Lanyard Badge Click -> Open Command Center
    document.getElementById('btnOpenCommandCenter')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openCommandCenter();
    });

    document.getElementById('cardBadgeTrigger')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openCommandCenter();
    });

    document.getElementById('btnBrandPortfolio')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCommandCenter();
    });

    // 2. Top Nav Links
    document.getElementById('navAbout')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('aboutPortfolioModal')?.classList.remove('hidden');
    });

    document.getElementById('navProjects')?.addEventListener('click', (e) => {
      e.preventDefault();
      openCommandCenter();
      switchTab('tasks');
    });

    document.getElementById('navProducts')?.addEventListener('click', (e) => {
      e.preventDefault();
      openCommandCenter();
      switchTab('dashboard');
    });

    document.getElementById('navTools')?.addEventListener('click', (e) => {
      e.preventDefault();
      openCommandCenter();
      switchTab('dashboard');
    });

    document.getElementById('navMoments')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('momentsPortfolioModal')?.classList.remove('hidden');
    });

    document.getElementById('navResume')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('resumePortfolioModal')?.classList.remove('hidden');
    });

    document.getElementById('btnTopContact')?.addEventListener('click', (e) => {
      e.preventDefault();
      openCommandCenter();
      switchTab('chat');
      setTimeout(() => {
        document.getElementById('chatMsgInput')?.focus();
      }, 300);
    });

    // 3. Modal Close Triggers
    const closeAbout = () => document.getElementById('aboutPortfolioModal')?.classList.add('hidden');
    document.getElementById('btnCloseAboutModal')?.addEventListener('click', closeAbout);
    document.getElementById('btnAboutCloseFooter')?.addEventListener('click', closeAbout);
    document.getElementById('aboutModalBackdrop')?.addEventListener('click', closeAbout);

    document.getElementById('btnAboutExploreWorkstation')?.addEventListener('click', () => {
      closeAbout();
      openCommandCenter();
    });

    const closeResume = () => document.getElementById('resumePortfolioModal')?.classList.add('hidden');
    document.getElementById('btnCloseResumeModal')?.addEventListener('click', closeResume);
    document.getElementById('btnResumeCloseFooter')?.addEventListener('click', closeResume);
    document.getElementById('resumeModalBackdrop')?.addEventListener('click', closeResume);

    document.getElementById('btnResumePrint')?.addEventListener('click', () => {
      window.print();
    });

    const closeMoments = () => document.getElementById('momentsPortfolioModal')?.classList.add('hidden');
    document.getElementById('btnCloseMomentsModal')?.addEventListener('click', closeMoments);
    document.getElementById('btnMomentsCloseFooter')?.addEventListener('click', closeMoments);
    document.getElementById('momentsModalBackdrop')?.addEventListener('click', closeMoments);

    document.getElementById('btnMomentsViewGallery')?.addEventListener('click', () => {
      closeMoments();
      openCommandCenter();
      switchTab('wallpapers');
    });
  }
`;

if (!js.includes('initPortfolioFirstScreen()')) {
  const hookTarget = 'bindV3EventListeners();';
  if (js.includes(hookTarget)) {
    js = js.replace(hookTarget, hookTarget + '\n    initPortfolioFirstScreen();');
  } else {
    js = js.replace('bindEvents();', 'bindEvents();\n    initPortfolioFirstScreen();');
  }
  js += '\n\n' + portfolioWireup;
  console.log('✅ wallpaper.js hooked with initPortfolioFirstScreen');
} else {
  const pIdx = js.indexOf('function initPortfolioFirstScreen()');
  if (pIdx !== -1) {
    const endPIdx = js.indexOf('\n  }\n', pIdx);
    if (endPIdx !== -1) {
      js = js.slice(0, pIdx) + portfolioWireup + js.slice(endPIdx + 5);
      console.log('✅ wallpaper.js updated initPortfolioFirstScreen definition');
    }
  }
}

fs.writeFileSync(jsPath, js, 'utf8');
console.log('✅ wallpaper.js updated successfully');

console.log('🎉 Primary Screen and Unified Dark Theme Applied Successfully!');
