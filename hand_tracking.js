// MediaPipe Hand Gesture Tracking & Computer Vision Telemetry

class HandTracker {
  constructor() {
    this.videoElement = document.getElementById('webcam-video');
    this.overlayCanvas = document.getElementById('camera-overlay');
    this.ctx = this.overlayCanvas ? this.overlayCanvas.getContext('2d') : null;
    this.statusEl = document.getElementById('camera-status');
    this.gestureEl = document.getElementById('ai-gesture-display');

    this.fingerPills = {
      THUMB: document.getElementById('f-thumb'),
      INDEX: document.getElementById('f-index'),
      MIDDLE: document.getElementById('f-middle'),
      RING: document.getElementById('f-ring'),
      PINKY: document.getElementById('f-pinky')
    };

    this.currentGesture = "STOP";
    this.fingerStates = { THUMB: false, INDEX: false, MIDDLE: false, RING: false, PINKY: false };
    this.handDetected = false;
    this.cameraActive = false;
    this.hands = null;
    this.camera = null;

    this.capturedPhotoB64 = "";

    this.initMediaPipe();
  }

  async initMediaPipe() {
    if (!window.Hands) {
      if (this.statusEl) this.statusEl.textContent = "MEDIAPIPE LOADING...";
      setTimeout(() => this.initMediaPipe(), 500);
      return;
    }

    try {
      this.hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.hands.onResults((results) => this.onResults(results));

      this.startCamera();
    } catch (err) {
      console.error("MediaPipe initialization error:", err);
      if (this.statusEl) this.statusEl.textContent = "CAMERA ERROR / USE KEYBOARD";
    }
  }

  startCamera() {
    if (!this.videoElement) return;

    if (window.Camera) {
      this.camera = new window.Camera(this.videoElement, {
        onFrame: async () => {
          if (this.hands && this.cameraActive) {
            await this.hands.send({ image: this.videoElement });
          }
        },
        width: 640,
        height: 480
      });
      this.camera.start().then(() => {
        this.cameraActive = true;
        if (this.statusEl) this.statusEl.style.display = 'none';
      }).catch((e) => {
        console.warn("Camera access denied or unavailable:", e);
        if (this.statusEl) this.statusEl.textContent = "CAM BLOCKED / USE KEYS";
      });
    } else {
      // Fallback getUserMedia
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then((stream) => {
          this.videoElement.srcObject = stream;
          this.videoElement.play();
          this.cameraActive = true;
          if (this.statusEl) this.statusEl.style.display = 'none';
          const loop = async () => {
            if (this.hands && this.cameraActive) {
              await this.hands.send({ image: this.videoElement });
            }
            requestAnimationFrame(loop);
          };
          requestAnimationFrame(loop);
        })
        .catch(() => {
          if (this.statusEl) this.statusEl.textContent = "CAMERA UNAVAILABLE (KEYS ACTIVE)";
        });
    }
  }

  toggleCamera() {
    this.cameraActive = !this.cameraActive;
    const btn = document.getElementById('btn-cam-toggle');
    if (btn) {
      btn.textContent = `CAMERA: ${this.cameraActive ? 'ON' : 'OFF'}`;
      btn.style.color = this.cameraActive ? '#fff' : '#ff5555';
    }
    if (!this.cameraActive && this.ctx) {
      this.ctx.fillStyle = '#0c1017';
      this.ctx.fillRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      this.currentGesture = "STOP";
      this.updateUI();
    }
  }

  dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  analyzeHand(landmarks) {
    const wrist = landmarks[0];
    const specs = [
      ["INDEX", 8, 6, 5],
      ["MIDDLE", 12, 10, 9],
      ["RING", 16, 14, 13],
      ["PINKY", 20, 18, 17]
    ];

    const states = {};
    for (const [name, tip, pip, mcp] of specs) {
      const tipD = this.dist(landmarks[tip], wrist);
      const pipD = this.dist(landmarks[pip], wrist);
      const mcpD = this.dist(landmarks[mcp], wrist);
      states[name] = (tipD > pipD * 1.07) && (tipD > mcpD * 1.14);
    }

    const palmW = Math.max(0.05, this.dist(landmarks[5], landmarks[17]));
    states["THUMB"] = (
      this.dist(landmarks[4], landmarks[17]) > palmW * 1.22 &&
      this.dist(landmarks[4], landmarks[5]) > palmW * 0.52
    );

    let upCount = 0;
    for (const k in states) {
      if (states[k]) upCount++;
    }

    const { INDEX: idx, MIDDLE: mid, RING: rng, PINKY: pnk, THUMB: thb } = states;

    let gesture = "STOP";
    if (upCount >= 4 || (idx && mid && rng && pnk)) {
      gesture = "RUN RIGHT";
    } else if ((idx && mid && rng && !pnk) || (thb && idx && mid && !rng && !pnk)) {
      gesture = "JUMP + RIGHT";
    } else if (idx && mid && !rng && !pnk) {
      gesture = "RUN LEFT";
    } else if ((idx && !mid && !rng && !pnk) || (thb && !mid && !rng && !pnk)) {
      gesture = "JUMP";
    }

    return { gesture, states, upCount };
  }

  onResults(results) {
    if (!this.ctx || !this.cameraActive) return;

    const w = this.overlayCanvas.width;
    const h = this.overlayCanvas.height;

    // Draw camera image
    this.ctx.save();
    this.ctx.drawImage(results.image, 0, 0, w, h);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      this.handDetected = true;

      const analysis = this.analyzeHand(landmarks);
      this.currentGesture = analysis.gesture;
      this.fingerStates = analysis.states;

      // Draw hand landmarks & connecting skeleton
      this.drawHandSkeleton(landmarks, w, h);
    } else {
      this.handDetected = false;
      this.currentGesture = "STOP";
      for (const k in this.fingerStates) this.fingerStates[k] = false;
    }

    this.ctx.restore();
    this.updateUI();
  }

  drawHandSkeleton(lm, w, h) {
    const connections = [
      [0,1],[1,2],[2,3],[3,4], // Thumb
      [0,5],[5,6],[6,7],[7,8], // Index
      [5,9],[9,10],[10,11],[11,12], // Middle
      [9,13],[13,14],[14,15],[15,16], // Ring
      [13,17],[17,18],[18,19],[19,20], // Pinky
      [0,17] // Palm base
    ];

    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#5cf45c';
    this.ctx.shadowColor = '#00a800';
    this.ctx.shadowBlur = 6;

    for (const [i, j] of connections) {
      this.ctx.beginPath();
      this.ctx.moveTo(lm[i].x * w, lm[i].y * h);
      this.ctx.lineTo(lm[j].x * w, lm[j].y * h);
      this.ctx.stroke();
    }

    // Draw joint nodes
    for (let i = 0; i < lm.length; i++) {
      const x = lm[i].x * w;
      const y = lm[i].y * h;
      this.ctx.beginPath();
      this.ctx.arc(x, y, [4,8,12,16,20].includes(i) ? 5 : 3, 0, 2 * Math.PI);
      this.ctx.fillStyle = [4,8,12,16,20].includes(i) ? '#fcd116' : '#ffffff';
      this.ctx.fill();
    }
  }

  updateUI() {
    if (this.gestureEl) {
      this.gestureEl.textContent = `AI: ${this.currentGesture}`;
      if (this.currentGesture !== "STOP") {
        this.gestureEl.className = "badge-active active";
      } else {
        this.gestureEl.className = "badge-active";
      }
    }

    for (const [finger, pill] of Object.entries(this.fingerPills)) {
      if (pill) {
        if (this.fingerStates[finger]) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      }
    }

    // Update bottom control bar cards highlight
    const rightActive = this.currentGesture === "RUN RIGHT";
    const jumpRightActive = this.currentGesture === "JUMP + RIGHT";
    const leftActive = this.currentGesture === "RUN LEFT";
    const jumpActive = this.currentGesture === "JUMP";

    const cRight = document.getElementById('card-run-right');
    const cJRight = document.getElementById('card-jump-right');
    const cLeft = document.getElementById('card-run-left');
    const cJump = document.getElementById('card-jump');

    if (cRight) cRight.classList.toggle('active', rightActive);
    if (cJRight) cJRight.classList.toggle('active', jumpRightActive);
    if (cLeft) cLeft.classList.toggle('active', leftActive);
    if (cJump) cJump.classList.toggle('active', jumpActive);
  }

  captureSnapshot() {
    if (!this.videoElement || !this.videoElement.videoWidth) return null;
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 160;
    snapCanvas.height = 120;
    const snapCtx = snapCanvas.getContext('2d');

    // Mirror image for consistency
    snapCtx.translate(160, 0);
    snapCtx.scale(-1, 1);
    snapCtx.drawImage(this.videoElement, 0, 0, 160, 120);

    const dataUrl = snapCanvas.toDataURL('image/jpeg', 0.75);
    this.capturedPhotoB64 = dataUrl.split(',')[1] || "";

    // Draw on preview canvas in registration modal
    const prevCanvas = document.getElementById('photo-preview-canvas');
    if (prevCanvas) {
      const pCtx = prevCanvas.getContext('2d');
      pCtx.drawImage(snapCanvas, 0, 0, prevCanvas.width, prevCanvas.height);
    }

    audio.playSnap();
    return this.capturedPhotoB64;
  }
}

const handTracker = new HandTracker();

