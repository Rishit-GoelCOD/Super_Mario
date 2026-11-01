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
    const cleanName = (name || 'MARIO').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10) || 'MARIO';
    const entry = {
      name: cleanName,
      score: parseInt(score, 10) || 0,
      coins: parseInt(coins, 10) || 0,
      level: parseInt(level, 10) || 1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

      const avatarSrc = entry.photo_b64 
        ? `data:image/jpeg;base64,${entry.photo_b64}` 
        : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="22" fill="%23e52521"><rect width="28" height="22"/><circle cx="14" cy="11" r="6" fill="%23fcd116"/></svg>';

      const medal = (idx === 0) ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));

      row.innerHTML = `
        <span class="lb-rank">${medal}</span>
        <img class="lb-avatar" src="${avatarSrc}" alt="${entry.name}">
        <span class="lb-name">${entry.name}</span>
        <span class="lb-score">${String(entry.score).padStart(6, '0')}</span>
        <span class="lb-coins">C:${entry.coins} W:1-${entry.level}</span>
      `;
      listEl.appendChild(row);
    });
  }
}

const leaderboard = new LeaderboardManager();
