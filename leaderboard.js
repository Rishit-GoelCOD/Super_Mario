// Leaderboard & Google Sheets Webhook Cloud Sync

class LeaderboardManager {
  constructor() {
    this.storageKey = 'mario_nes_leaderboard';
    this.configKey = 'mario_sheets_config';
    this.pendingKey = 'mario_pending_sync';

    this.webhookUrl = '';
    this.webhookToken = '';

    this.loadConfig();
    this.entries = this.loadEntries();
    this.render();

    // Check pending sync queue
    setTimeout(() => this.flushPendingQueue(), 3000);
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
    this.updateCloudBadge();
  }

  saveConfig(url, token) {
    this.webhookUrl = (url || '').trim();
    this.webhookToken = (token || '').trim();
    localStorage.setItem(this.configKey, JSON.stringify({ url: this.webhookUrl, token: this.webhookToken }));
    this.updateCloudBadge();
    this.flushPendingQueue();
  }

  updateCloudBadge(statusText = null) {
    const badge = document.getElementById('cloud-sync-badge');
    if (!badge) return;

    if (statusText) {
      badge.textContent = statusText;
      if (statusText === 'CLOUD SYNCED') {
        badge.className = 'badge-status status-synced';
      } else if (statusText.includes('SYNCING')) {
        badge.className = 'badge-status status-syncing';
      } else {
        badge.className = 'badge-status status-local';
      }
      return;
    }

    if (this.webhookUrl && this.webhookToken) {
      badge.textContent = 'CLOUD READY';
      badge.className = 'badge-status status-synced';
    } else {
      badge.textContent = 'LOCAL ONLY';
      badge.className = 'badge-status status-local';
    }
  }

  loadEntries() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    // Initial default records seeded from the desktop session
    return [
      { name: "PLAYER1", score: 6900, coins: 22, level: 2, timestamp: "2026-11-01T08:53:53Z", photo_b64: "" },
      { name: "RISHIT", score: 5100, coins: 16, level: 2, timestamp: "2026-11-01T08:30:41Z", photo_b64: "" },
      { name: "RISHIT", score: 4400, coins: 12, level: 2, timestamp: "2026-11-01T08:30:04Z", photo_b64: "" }
    ];
  }

  recordScore(name, score, coins, level, photo_b64, allowCloud = true) {
    const cleanName = (name || 'MARIO').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10) || 'MARIO';
    const entry = {
      name: cleanName,
      score: parseInt(score, 10) || 0,
      coins: parseInt(coins, 10) || 0,
      level: parseInt(level, 10) || 1,
      timestamp: new Date().toISOString(),
      photo_b64: (allowCloud && photo_b64) ? photo_b64 : ""
    };

    this.entries.push(entry);
    this.entries.sort((a, b) => b.score - a.score);
    this.entries = this.entries.slice(0, 10);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
    } catch (e) {}

    this.render();

    if (allowCloud && this.webhookUrl && this.webhookToken) {
      this.syncToCloud(entry);
    }
  }

  async syncToCloud(entry) {
    if (!this.webhookUrl) {
      this.updateCloudBadge('LOCAL ONLY');
      return false;
    }

    if (this.webhookUrl.includes('/edit')) {
      this.updateCloudBadge('USE /exec URL');
      return false;
    }

    this.updateCloudBadge('SYNCING...');
    const payload = {
      token: this.webhookToken || 'mario_secret_token_123',
      name: entry.name,
      score: entry.score,
      coins: entry.coins,
      level: entry.level,
      timestamp: entry.timestamp,
      photo_b64: entry.photo_b64 || ""
    };

    try {
      // Primary: POST request with mode: 'no-cors' (includes base64 photo avatar)
      await fetch(this.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      this.updateCloudBadge('CLOUD SYNCED');
      setTimeout(() => this.updateCloudBadge(), 4000);
      return true;
    } catch (err) {
      console.warn("POST sync failed, trying GET fallback...", err);
      // Fallback: GET request (CORS-immune query beacon)
      try {
        const params = new URLSearchParams({
          token: payload.token,
          name: payload.name,
          score: payload.score,
          coins: payload.coins,
          level: payload.level,
          timestamp: payload.timestamp
        });
        const getUrl = `${this.webhookUrl}${this.webhookUrl.includes('?') ? '&' : '?'}${params.toString()}`;
        const img = new Image();
        img.src = getUrl;

        this.updateCloudBadge('CLOUD SYNCED');
        setTimeout(() => this.updateCloudBadge(), 4000);
        return true;
      } catch (getErr) {
        this.queuePending(entry);
        this.updateCloudBadge('QUEUED RETRY');
        return false;
      }
    }
  }

  queuePending(entry) {
    try {
      let queue = [];
      const saved = localStorage.getItem(this.pendingKey);
      if (saved) queue = JSON.parse(saved);
      queue.push(entry);
      localStorage.setItem(this.pendingKey, JSON.stringify(queue.slice(-20)));
    } catch (e) {}
  }

  async flushPendingQueue() {
    if (!this.webhookUrl || !this.webhookToken) return;
    try {
      const saved = localStorage.getItem(this.pendingKey);
      if (!saved) return;
      const queue = JSON.parse(saved);
      if (!Array.isArray(queue) || queue.length === 0) return;

      const remaining = [];
      for (const item of queue) {
        const ok = await this.syncToCloud(item);
        if (!ok) remaining.push(item);
      }
      localStorage.setItem(this.pendingKey, JSON.stringify(remaining));
    } catch (e) {}
  }

  render() {
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    this.entries.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'lb-row';

      const avatarSrc = entry.photo_b64 
        ? `data:image/jpeg;base64,${entry.photo_b64}` 
        : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="22" fill="%23e52521"><rect width="28" height="22"/><circle cx="14" cy="11" r="6" fill="%23fcd116"/></svg>';

      row.innerHTML = `
        <span class="lb-rank">#${idx + 1}</span>
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

