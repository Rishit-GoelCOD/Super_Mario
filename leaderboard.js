// Direct In-Game Leaderboard & Local Storage System with Photo Avatars

class LeaderboardManager {
  constructor() {
    this.storageKey = 'mario_nes_leaderboard';
    this.configKey = 'mario_sheets_config';

    this.webhookUrl = '';
    this.webhookToken = '';

    this.loadConfig();
    this.entries = this.loadEntries();
    this.render();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(this.configKey);
      if (saved) {
        const obj = JSON.parse(saved);
        this.webhookUrl = (obj.url || '').trim();
        this.webhookToken = (obj.token || '').trim();
      }
    } catch (e) {}
    this.updateStatusBadge();
  }

  saveConfig(url, token) {
    this.webhookUrl = (url || '').trim();
    this.webhookToken = (token || '').trim();
    localStorage.setItem(this.configKey, JSON.stringify({ url: this.webhookUrl, token: this.webhookToken }));
    this.updateStatusBadge();
    if (this.entries.length > 0 && this.webhookUrl) {
      this.syncToCloud(this.entries[0]);
    }
  }

  updateStatusBadge(statusText = null) {
    const badge = document.getElementById('cloud-sync-badge');
    if (!badge) return;

    if (statusText) {
      badge.textContent = statusText;
      badge.className = 'badge-status status-synced';
      return;
    }

    if (this.webhookUrl && this.webhookToken) {
      badge.textContent = 'CLOUD + LOCAL';
      badge.className = 'badge-status status-synced';
    } else {
      badge.textContent = 'IN-GAME SAVED';
      badge.className = 'badge-status status-local';
    }
  }

  loadEntries() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any legacy dummy records from earlier testing
          parsed = parsed.filter(item => item && item.name !== 'PLAYER1');
          return parsed;
        }
      }
    } catch (e) {}
    // Clean, empty leaderboard ready for fresh runs
    return [];
  }

  recordScore(name, score, coins, level, photo_b64) {
    const cleanName = (name || 'MARIO').trim().slice(0, 36) || 'MARIO';
    const entry = {
      name: cleanName,
      score: parseInt(score, 10) || 0,
      coins: parseInt(coins, 10) || 0,
      level: parseInt(level, 10) || 1,
      timestamp: new Date().toISOString(),
      photo_b64: photo_b64 || ""
    };

    this.entries.push(entry);
    this.entries.sort((a, b) => b.score - a.score);
    this.entries = this.entries.slice(0, 10);

    // Save directly into browser localStorage
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
    } catch (e) {
      console.warn("Storage quota fallback:", e);
    }

    this.render();
    this.updateStatusBadge('SCORE SAVED!');
    setTimeout(() => this.updateStatusBadge(), 3500);

    // Optional background cloud backup if configured
    if (this.webhookUrl && this.webhookToken) {
      this.syncToCloud(entry);
    }
  }

  clearLeaderboard() {
    if (confirm("Erase all leaderboard records? This cannot be undone.")) {
      this.entries = [];
      try {
        localStorage.removeItem(this.storageKey);
      } catch (e) {}
      this.render();
      this.updateStatusBadge('LEADERBOARD CLEARED');
      setTimeout(() => this.updateStatusBadge(), 3000);
    }
  }

  async syncToCloud(entry) {
    if (!this.webhookUrl) return;
    const payload = {
      token: this.webhookToken || 'mario_secret_token_123',
      name: entry.name,
      score: entry.score,
      coins: entry.coins,
      level: entry.level,
      timestamp: new Date().toISOString(),
      photo_b64: entry.photo_b64 || ""
    };

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Background retry fallback
      try {
        const params = new URLSearchParams({
          token: payload.token,
          name: payload.name,
          score: payload.score,
          coins: payload.coins,
          level: payload.level
        });
        const getUrl = `${this.webhookUrl}${this.webhookUrl.includes('?') ? '&' : '?'}${params.toString()}`;
        const img = new Image();
        img.src = getUrl;
      } catch (e) {}
    }
  }

  render() {
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (this.entries.length === 0) {
      listEl.innerHTML = `
        <div class="lb-empty-msg">
          NO RUNS RECORDED YET.<br>
          PLAY &amp; SET A NEW HIGH SCORE!
        </div>
      `;
      return;
    }

    this.entries.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'lb-row';
      row.style.cursor = 'pointer';
      row.title = 'Click to view full leaderboard';
      row.addEventListener('click', () => {
        window.open('leaderboard_page.html', '_blank');
      });

      // ── Rank ──
      const rankEl = document.createElement('span');
      rankEl.className = 'lb-rank';
      const medal = (idx === 0) ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));
      rankEl.textContent = medal;

      // ── Avatar (set src via JS to avoid innerHTML injection) ──
      const img = document.createElement('img');
      img.className = 'lb-avatar';
      img.alt = entry.name;
      if (entry.photo_b64) {
        // strip any existing prefix before adding it
        const raw = entry.photo_b64.replace(/^data:image\/[^;]+;base64,/, '');
        img.src = `data:image/jpeg;base64,${raw}`;
      } else {
        img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="28" fill="%23e52521"><rect width="36" height="28"/><circle cx="18" cy="14" r="8" fill="%23fcd116"/></svg>';
      }

      // ── Name (truncate display to 8 chars, show full on hover) ──
      const nameEl = document.createElement('span');
      nameEl.className = 'lb-name';
      nameEl.textContent = entry.name.length > 8 ? entry.name.slice(0, 7) + '…' : entry.name;
      nameEl.title = entry.name;

      // ── Score ──
      const scoreEl = document.createElement('span');
      scoreEl.className = 'lb-score';
      scoreEl.textContent = String(entry.score).padStart(6, '0');

      // ── Coins / World ──
      const coinsEl = document.createElement('span');
      coinsEl.className = 'lb-coins';
      coinsEl.textContent = `C:${entry.coins} W:1-${entry.level}`;

      row.appendChild(rankEl);
      row.appendChild(img);
      row.appendChild(nameEl);
      row.appendChild(scoreEl);
      row.appendChild(coinsEl);
      listEl.appendChild(row);
    });

    // ── "View Full Leaderboard" link ──
    const viewAll = document.createElement('div');
    viewAll.style.cssText = 'text-align:center;margin-top:8px;';
    const link = document.createElement('a');
    link.href = 'leaderboard_page.html';
    link.target = '_blank';
    link.textContent = '▶ VIEW FULL LEADERBOARD';
    link.style.cssText = 'color:#fcd116;font-size:8px;text-decoration:none;font-family:"Press Start 2P",monospace;letter-spacing:0.05em;';
    viewAll.appendChild(link);
    listEl.parentElement.appendChild(viewAll);
  }
}

const leaderboard = new LeaderboardManager();
