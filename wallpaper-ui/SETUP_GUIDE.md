# ⚡ Jagadish K — Live Animated Wallpaper Setup Guide

Transform your laptop desktop into a futuristic Cyberpunk Hardware HUD & 3D Interactive Lanyard ID Card wallpaper.

---

## 🚀 Quick Start Options

### Option 1: Lively Wallpaper (Recommended for Windows 10 & 11)
**Lively Wallpaper** is 100% Free & Open-Source on the Microsoft Store.

1. **Install Lively Wallpaper**:
   - Open **Microsoft Store** on your laptop and search for **Lively Wallpaper** (or get it from [rocksdanister.github.io/lively](https://rocksdanister.github.io/lively/)).
2. **Add Wallpaper**:
   - Open Lively Wallpaper.
   - Click the **`+ Add Wallpaper`** button in the top-right.
   - Simply **drag & drop** the `wallpaper-live` folder (or click Browse and select `wallpaper-live/index.html`).
3. **Set Active**:
   - Click the newly created wallpaper tile in your library to apply it to your laptop screen!

---

### Option 2: One-Click Desktop App (No Extra Software Needed)
If you want to view or test it in full borderless kiosk screen right away:
- Double-click **[`launch-wallpaper.bat`](launch-wallpaper.bat)** inside the `wallpaper-live/` folder.
- It will open in a borderless fullscreen window without browser toolbars or tabs!

---

### Option 3: Steam Wallpaper Engine
1. Open **Wallpaper Engine** on Steam.
2. Click **Wallpaper Editor** -> **Create Wallpaper**.
3. Select **New Web Wallpaper (HTML)**.
4. Browse to `wallpaper-live/index.html`.
5. Click **Apply Wallpaper**.

---

### Option 4: Fullscreen Web Browser
1. Double-click `index.html` to open it in Chrome, Edge, or Brave.
2. Press **`F11`** to enter fullscreen mode.

---

## 🎮 Interactive Controls & Keyboard Shortcuts

| Key | Action | Description |
| :--- | :--- | :--- |
| <kbd>Space</kbd> | **Cycle Theme** | Switches between Obsidian, Matrix Emerald, Crimson REDDOT, Cyberpunk Gold, Quantum Violet, and Neon Electric |
| <kbd>H</kbd> | **Toggle HUD** | Shows/hides all HUD panels and overlays for a clean wallpaper view |
| <kbd>F</kbd> / <kbd>F11</kbd> | **Fullscreen** | Toggles fullscreen display |
| <kbd>M</kbd> | **Mute / Sound** | Toggles generative sci-fi ambient synth drone sound FX |
| <kbd>C</kbd> | **Settings Deck** | Opens the customizable Wallpaper Control Deck |
| <kbd>1</kbd> | **Full Cyber HUD** | Shows all live telemetry, terminal logs, and 3D badge |
| <kbd>2</kbd> | **Minimalist Clock** | Displays clean large HUD clock & glowing circuit traces |
| <kbd>3</kbd> | **Badge Focus** | Highlights 3D Lanyard Card & ambient particle matrix |

---

## 🎨 Built-in Color Themes
- 💠 **Cyber Obsidian**: High-contrast black with crisp cyan electric glow (Default)
- 🟩 **Matrix Emerald**: Classic terminal hacker green
- 🔴 **Crimson REDDOT**: Aggressive hardware red & REDDOT styling
- 🟡 **Cyberpunk Amber**: High-voltage neon gold & yellow
- 🟣 **Quantum Violet**: Deep ultraviolet & magenta neon
- 🔷 **Neon Electric**: Ice blue glowing circuits

---

## 📁 File Structure
```
wallpaper-live/
├── index.html            # Main HTML5 Wallpaper shell
├── style.css             # Cyberpunk design system & themes
├── wallpaper.js          # 60-120 FPS Circuit Canvas, 3D physics & telemetry
├── LivelyInfo.json       # Windows Lively Wallpaper integration metadata
├── launch-wallpaper.bat  # Instant borderless launcher
├── assets/
│   ├── id-card.png       # Jagadish K high-res ID Card badge
│   └── ...               # Supplementary graphics
└── SETUP_GUIDE.md        # This setup guide
```
