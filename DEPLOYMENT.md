# 🚀 Super Mario Bros (AI Vision Edition) - Deployment Guide

This project is now a high-performance, browser-ready web application powered by **HTML5 Canvas**, **MediaPipe Hand Tracking (WebGL/WASM)**, **Web Audio API NES sound synthesis**, and **Google Sheets Cloud Leaderboard Sync**.

---

## 🎮 1. Test Locally Right Now

A local server is currently running in your workspace:
- Open your browser (Google Chrome, Edge, Brave, or Safari recommended for camera access) and visit:
  👉 **[http://localhost:8080](http://localhost:8080)**
- Grant webcam permission when prompted so the AI hand gesture tracking can initialize.

*(If you ever need to restart the local server, run: `python3 -m http.server 8080`)*

---

## 🌐 2. Deploy to the Web (Free, 1-Click)

### Option A: Vercel (Recommended — Automatic HTTPS & Custom Domain)
1. Push this folder to GitHub (or install Vercel CLI: `npm i -g vercel`).
2. If using Vercel CLI, simply run:
   ```bash
   vercel
   ```
3. If using the Vercel web dashboard:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Import your GitHub repository.
   - Leave build settings as default (Framework Preset: **Other**, Build Command: empty).
   - Click **Deploy**.
   - Your game is immediately live at `https://your-mario-game.vercel.app`!

### Option B: GitHub Pages (100% Free Hosting directly from GitHub)
1. Push this project to a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Mario AI Web Game"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
2. On GitHub, go to your repository **Settings** &rarr; **Pages**.
3. Under **Build and deployment** &rarr; **Source**, select `Deploy from a branch`.
4. Select `main` branch and `/ (root)` folder, then click **Save**.
5. Your game will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO/` within 60 seconds!

### Option C: Netlify (Instant Drag-and-Drop)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop this folder (`2nd_Project`) directly into the browser window.
3. Netlify will deploy it instantly with a live `.netlify.app` URL and free SSL.

---

## 📊 3. Setting Up the Google Sheets Cloud Leaderboard

When deployed to the web, player scores and webcam snapshot avatars can automatically sync to a live Google Sheet in real time.

1. Open a new Google Sheet at **[sheets.new](https://sheets.new)**.
2. In the top menu, go to **Extensions** &rarr; **Apps Script**.
3. Paste the entire code from [`google_apps_script.js`](google_apps_script.js).
4. (Optional) Customize the secret token on line 18:
   ```javascript
   const SECRET_AUTH_TOKEN = "mario_secret_token_123";
   ```
5. Click **Deploy** (blue button in top right) &rarr; **New deployment**.
6. Select gear icon &rarr; **Web app**:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
7. Click **Deploy**, authorize permissions, and copy the **Web app URL** (`https://script.google.com/macros/s/.../exec`).
8. In the game, click the **CLOUD CONFIG** button at the top, paste the URL and your token, and click **SAVE & CONNECT**.
   - The status badge will switch to **`CLOUD READY`**.
   - Every time any player completes a run or loses their lives, their score, coins, level, timestamp, and webcam avatar will automatically sync to your Google Sheet!

---

## 🕹️ Controls Guide
- **Hand Gestures**:
  - ✋ **4–5 Fingers**: RUN RIGHT
  - ✌️+Thumb **3 Fingers**: JUMP + RUN RIGHT
  - ✌️ **2 Fingers**: RUN LEFT
  - ☝️ **1 Finger**: JUMP
  - ✊ **Closed Fist**: STOP
- **Keyboard Alternative**:
  - `D` / `→`: Move Right
  - `A` / `←`: Move Left
  - `W` / `Space` / `↑`: Jump
  - `C`: Toggle Camera On/Off
  - `M`: Toggle Sound Mute
  - `R`: Reset / Restart Level
  - `N`: New Player Registration
  - `1`, `2`, `3`, `4`: Instant Warp to Worlds 1-1, 1-2, 1-3, 1-4

