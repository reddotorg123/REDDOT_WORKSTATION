const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'wallpaper-ui', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

const marker = '/* ==========================================================================\n   MANDATORY SCREEN: JAGADISH.K PORTFOLIO LIVE WALLPAPER';
const mIdx = css.indexOf(marker);

const perfectMandatoryStyles = `/* ==========================================================================
   MANDATORY SCREEN: JAGADISH.K PORTFOLIO LIVE WALLPAPER (media_1789230665421.png)
   Pixel-Perfect Symmetrical Harmony - DO NOT ALTER STRUCTURE
   ========================================================================== */

/* Full Viewport App Canvas */
body.mode-wallpaper {
  background-color: #06070a !important;
}

.wp-root {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 10 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  padding: 30px 64px !important;
  box-sizing: border-box !important;
  background: transparent !important;
  overflow: hidden !important;
}

/* Crisp Architectural Dark Grid (matching media_1789230665421.png) */
.grid-backdrop {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px) !important;
  background-size: 84px 84px !important;
  background-position: center center !important;
  z-index: 1 !important;
  pointer-events: none !important;
}

.vignette-overlay {
  position: fixed !important;
  inset: 0 !important;
  background: radial-gradient(circle at center, transparent 40%, rgba(3, 4, 6, 0.85) 100%) !important;
  pointer-events: none !important;
  z-index: 2 !important;
}

/* Top Bar: Left Hexagon Logo + Right Portfolio Nav Links */
.wp-root .top-bar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  width: 100% !important;
  z-index: 30 !important;
}

.brand-icon-box {
  width: 34px !important;
  height: 34px !important;
  background: #111218 !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6) !important;
}

.brand-hex {
  color: #ffffff !important;
  font-size: 16px !important;
  line-height: 1 !important;
}

.brand-meta {
  display: flex !important;
  flex-direction: column !important;
}

.brand-name {
  font-family: var(--font-display, 'Space Grotesk', sans-serif) !important;
  font-weight: 800 !important;
  font-size: 14px !important;
  letter-spacing: 0.12em !important;
  color: #ffffff !important;
  line-height: 1.1 !important;
}

.brand-sub {
  font-family: var(--font-mono, 'JetBrains Mono', monospace) !important;
  font-size: 8.5px !important;
  letter-spacing: 0.22em !important;
  color: #7a7e8e !important;
  margin-top: 2px !important;
  line-height: 1.1 !important;
}

/* Top Portfolio Nav Links */
.top-nav-links {
  display: flex !important;
  align-items: center !important;
  gap: 32px !important;
}

.top-nav-link {
  font-family: var(--font-sans, -apple-system, sans-serif) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0.14em !important;
  color: #8e92a4 !important;
  text-decoration: none !important;
  transition: color 0.18s ease !important;
  cursor: pointer !important;
}

.top-nav-link:hover {
  color: #ffffff !important;
}

.btn-top-contact {
  background: #ffffff !important;
  color: #000000 !important;
  font-family: var(--font-sans) !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  letter-spacing: 0.14em !important;
  padding: 8px 24px !important;
  border-radius: 20px !important;
  border: none !important;
  cursor: pointer !important;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
  box-shadow: 0 4px 14px rgba(255, 255, 255, 0.22) !important;
}

.btn-top-contact:hover {
  transform: translateY(-1px) scale(1.02) !important;
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.45) !important;
}

.subtle-win-ctrls {
  margin-left: 14px !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

/* Center Stage */
.center-stage {
  position: relative !important;
  width: 100% !important;
  flex: 1 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  box-sizing: border-box !important;
}

/* Side Tags */
.side-tag {
  display: flex !important;
  flex-direction: column !important;
  z-index: 25 !important;
  position: relative !important;
}

.left-tag {
  text-align: left !important;
}

.right-tag {
  text-align: right !important;
}

.cyan-accent {
  color: #38bdf8 !important;
  font-family: var(--font-sans) !important;
  font-weight: 700 !important;
  font-size: 12.5px !important;
  letter-spacing: 0.08em !important;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8) !important;
}

.white-accent {
  color: #ffffff !important;
  font-family: var(--font-sans) !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  letter-spacing: 0.08em !important;
  margin-top: 4px !important;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8) !important;
}

.right-tag .tag-bold {
  font-family: var(--font-sans) !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  letter-spacing: 0.08em !important;
  color: #ffffff !important;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8) !important;
}

/* Giant Centerpiece Typography */
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
  font-size: clamp(6rem, 15vw, 17.5rem) !important;
  font-weight: 900 !important;
  letter-spacing: -0.035em !important;
  color: #ffffff !important;
  line-height: 0.85 !important;
  text-transform: uppercase !important;
  user-select: none !important;
  text-shadow: 0 15px 60px rgba(0, 0, 0, 0.95) !important;
}

/* 3D Floating Lanyard Card */
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
.wp-root .bottom-bar {
  display: flex !important;
  align-items: flex-end !important;
  justify-content: space-between !important;
  width: 100% !important;
  z-index: 30 !important;
  position: relative !important;
}

.bottom-page-circle {
  width: 28px !important;
  height: 28px !important;
  border: 1px solid rgba(255, 255, 255, 0.28) !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-family: var(--font-sans) !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #ffffff !important;
}

.bottom-center {
  position: absolute !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  bottom: 0 !important;
}

.bottom-arrow-btn {
  width: 32px !important;
  height: 32px !important;
  border: 1px solid rgba(255, 255, 255, 0.28) !important;
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
  background: rgba(255, 255, 255, 0.16) !important;
  border-color: rgba(255, 255, 255, 0.75) !important;
  transform: translateY(2px) !important;
  box-shadow: 0 0 14px rgba(255, 255, 255, 0.3) !important;
}

.bottom-bar .watermark-tag {
  text-align: right !important;
}

.bottom-bar .watermark-sub {
  font-family: var(--font-sans) !important;
  font-size: 9px !important;
  font-weight: 600 !important;
  letter-spacing: 0.12em !important;
  color: #8e92a4 !important;
}

.bottom-bar .watermark-bold {
  font-family: var(--font-sans) !important;
  font-size: 11.5px !important;
  font-weight: 800 !important;
  letter-spacing: 0.12em !important;
  color: #ffffff !important;
  margin-top: 2px !important;
}

/* ==========================================================================
   COMMAND CENTER OVERLAY: 100% OPAQUE EXECUTIVE WORKSTATION WINDOW
   Zero bleed-through when open, completely hidden when collapsed
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

if (mIdx !== -1) {
  css = css.slice(0, mIdx) + perfectMandatoryStyles;
} else {
  css += '\n\n' + perfectMandatoryStyles;
}

fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ style.css updated with perfect mandatory wallpaper styles');
