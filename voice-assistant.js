class VoiceAssistant {
  constructor(workerUrl) {
    this.workerUrl = workerUrl;
    this.ws = null;
    this.audioContext = null;
    this.stream = null;
    this.isRecording = false;
    this.nextPlayTime = 0;
    this.processorNode = null;
    this.audioInput = null;
    this.audioInput = null;
    this.isReady = false;
    this.isConnecting = false;
    this.activeSources = []; // Track playing AudioBufferSourceNodes

    // Audio level analysis
    this.analyserNode = null;
    this.analyserData = null;
    this.animFrameId = null;
    this.lastUserSpeechTime = 0;

    // DOM refs
    this.btn = document.getElementById("voice-assistant-btn");
    this.statusText = document.getElementById("voice-status-text");
    this.endBtn = document.getElementById("voice-end-btn");
    this.barsContainer = document.getElementById("voice-audio-bars");
    this.bars = this.barsContainer
      ? Array.from(this.barsContainer.querySelectorAll(".voice-bar"))
      : [];
    this.levelRings = this.btn
      ? Array.from(this.btn.querySelectorAll(".voice-btn-level-ring"))
      : [];

    // Event listeners
    if (this.btn) {
      this.btn.addEventListener("click", () => this.toggle());
    }
    if (this.endBtn) {
      this.endBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.stop();
      });
    }
  }

  updateStatus(text) {
    if (this.statusText) {
      this.statusText.textContent = text;
    }
  }

  showEndButton(show) {
    if (this.endBtn) {
      if (show) {
        this.endBtn.classList.add("visible");
      } else {
        this.endBtn.classList.remove("visible");
      }
    }
  }

  async initAudio() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000,
    });

    const workletCode = `
      class RecorderProcessor extends AudioWorkletProcessor {
        process(inputs) {
          const input = inputs[0];
          if (input && input.length > 0) {
            const channelData = input[0];
            const int16 = new Int16Array(channelData.length);
            for (let i = 0; i < channelData.length; i++) {
              const s = Math.max(-1, Math.min(1, channelData[i]));
              int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            this.port.postMessage(int16.buffer, [int16.buffer]);
          }
          return true;
        }
      }
      registerProcessor('recorder-worklet', RecorderProcessor);
    `;
    const blob = new Blob([workletCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    await this.audioContext.audioWorklet.addModule(url);
  }

  // ─── Audio Level Visualizer ───
  startLevelVisualization() {
    if (!this.audioContext || !this.audioInput) return;

    // Create an analyser node for measuring audio levels
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.6;
    this.analyserData = new Uint8Array(this.analyserNode.frequencyBinCount);

    // Connect input -> analyser
    this.audioInput.connect(this.analyserNode);

    const updateVisuals = () => {
      if (!this.isRecording || !this.analyserNode) return;

      this.analyserNode.getByteFrequencyData(this.analyserData);

      // Calculate overall audio level (0-1)
      let sum = 0;
      const len = this.analyserData.length;
      for (let i = 0; i < len; i++) {
        sum += this.analyserData[i];
      }
      const avgLevel = sum / len / 255;

      // Calculate per-bar levels from frequency bands
      const bandSize = Math.floor(len / this.bars.length);
      for (let b = 0; b < this.bars.length; b++) {
        let bandSum = 0;
        const start = b * bandSize;
        for (let i = start; i < start + bandSize && i < len; i++) {
          bandSum += this.analyserData[i];
        }
        const bandLevel = bandSum / bandSize / 255;

        // Map to height: min 4px, max 32px
        const barHeight = 4 + bandLevel * 28;
        this.bars[b].style.height = barHeight + "px";

        // Pause CSS idle animation when real audio is detected
        if (avgLevel > 0.02) {
          this.bars[b].style.animationPlayState = "paused";
        } else {
          this.bars[b].style.animationPlayState = "running";
        }
      }

      // ─── Status Text Logic (Thinking vs Listening) ───
      const currentStatus = this.statusText ? this.statusText.textContent : "";
      
      // Increased threshold to 0.15 so continuous fan/room noise doesn't register as speech
      if (avgLevel > 0.15) {
        this.lastUserSpeechTime = Date.now();
        
        // Return to listening if we were thinking, unless AI is actively speaking
        if (currentStatus === "Thinking\u2026") {
           this.updateStatus("Listening\u2026");
        }
      } else {
        // If it's been quiet for 400ms and we are in "Listening...", switch to "Thinking..."
        if (
           Date.now() - this.lastUserSpeechTime > 400 && 
           currentStatus === "Listening\u2026"
        ) {
           this.updateStatus("Thinking\u2026");
        }
      }

      // Update level rings based on audio intensity
      if (this.levelRings.length >= 3) {
        const ring1Scale = 1 + avgLevel * 0.6;
        const ring2Scale = 1 + avgLevel * 1.0;
        const ring3Scale = 1 + avgLevel * 1.5;
        const ringOpacity = Math.min(1, avgLevel * 2.5);

        this.levelRings[0].style.transform = "translate(-50%, -50%) scale(" + ring1Scale + ")";
        this.levelRings[0].style.opacity = ringOpacity * 0.6;

        this.levelRings[1].style.transform = "translate(-50%, -50%) scale(" + ring2Scale + ")";
        this.levelRings[1].style.opacity = ringOpacity * 0.4;

        this.levelRings[2].style.transform = "translate(-50%, -50%) scale(" + ring3Scale + ")";
        this.levelRings[2].style.opacity = ringOpacity * 0.2;
      }

      this.animFrameId = requestAnimationFrame(updateVisuals);
    };

    this.animFrameId = requestAnimationFrame(updateVisuals);
  }

  stopLevelVisualization() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.analyserNode) {
      try { this.analyserNode.disconnect(); } catch (_) {}
      this.analyserNode = null;
    }
    // Reset bar heights
    this.bars.forEach((bar) => {
      bar.style.height = "";
      bar.style.animationPlayState = "";
    });
    // Reset rings
    this.levelRings.forEach((ring) => {
      ring.style.transform = "";
      ring.style.opacity = "";
    });
  }

  async toggle() {
    if (this.isConnecting) return; // Prevent double clicks
    if (this.isRecording) {
      this.stop();
    } else {
      await this.start();
    }
  }

  async start() {
    if (this.isConnecting) return;
    this.isConnecting = true;
    try {
      this.updateStatus("Initializing\u2026");
      this.showEndButton(false);

      if (!this.audioContext) await this.initAudio();
      if (this.audioContext.state === "suspended")
        await this.audioContext.resume();

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });
      this.audioInput = this.audioContext.createMediaStreamSource(this.stream);
      this.processorNode = new AudioWorkletNode(
        this.audioContext,
        "recorder-worklet"
      );

      this.updateStatus("Connecting\u2026");
      this.isReady = false;
      this.ws = new WebSocket(this.workerUrl);

      // ─── WebSocket Opened ───
      this.ws.onopen = () => {
        console.log("[VA] WebSocket connected to Worker");
        this.updateStatus("Setting up\u2026");
        this.nextPlayTime = this.audioContext.currentTime;
      };

      // ─── Messages from Worker/Gemini ───
      this.ws.onmessage = async (event) => {
        try {
          let raw = event.data;
          if (raw instanceof Blob) {
            raw = await raw.text();
          }

          if (!raw || raw.trim().length === 0) return;

          let msg;
          try {
            msg = JSON.parse(raw);
          } catch (parseErr) {
            console.warn("[VA] Non-JSON message (ignoring):", raw.substring(0, 100));
            return;
          }

          console.log("[VA] Message received:", Object.keys(msg));

          // Setup confirmation
          if (
            !this.isReady &&
            (msg.setupComplete !== undefined ||
              msg.setup_complete !== undefined)
          ) {
            console.log("[VA] Setup confirmed \u2014 session is live!");
            this.isReady = true;
            this.updateStatus("Listening\u2026");
            this.showEndButton(true);
            this.audioInput.connect(this.processorNode);
            // Start visualizing audio levels
            this.startLevelVisualization();
            return;
          }

          // Handle interruption (barge-in) — user spoke while AI was talking
          if (msg.serverContent && msg.serverContent.interrupted) {
            console.log("[VA] Interrupted — clearing playback queue");
            this.clearPlaybackQueue();
            this.updateStatus("Listening\u2026");
            return;
          }

          // Handle audio responses
          if (msg.serverContent && msg.serverContent.modelTurn) {
            const parts = msg.serverContent.modelTurn.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                  console.log("[VA] Playing audio chunk");
                  this.updateStatus("Speaking\u2026");
                  this.playAudio(part.inlineData.data);
                }
              }
            }
          }

          // Turn completion
          if (msg.serverContent && msg.serverContent.turnComplete) {
            console.log("[VA] Model turn complete");
            this.updateStatus("Listening\u2026");
          }
        } catch (e) {
          console.error("[VA] Message handler error:", e);
        }
      };

      // ─── Stream microphone audio to Worker ───
      this.processorNode.port.onmessage = (event) => {
        if (!this.isReady) return;
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const buffer = event.data;
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i += 1024) {
          const chunk = bytes.subarray(i, i + 1024);
          binary += String.fromCharCode.apply(null, chunk);
        }
        const base64 = btoa(binary);

        this.ws.send(
          JSON.stringify({
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64,
                },
              ],
            },
          })
        );
      };

      // ─── Connection Closed ───
      this.ws.onclose = (event) => {
        console.log(
          "[VA] WebSocket closed: code=" + event.code + " reason=" + event.reason
        );
        this.stop();
      };

      // ─── Connection Error ───
      this.ws.onerror = (event) => {
        console.error("[VA] WebSocket error:", event);
      };

      this.isRecording = true;
      this.isConnecting = false;
      if (this.btn) this.btn.classList.add("active");
    } catch (e) {
      console.error("[VA] Start error:", e);
      this.updateStatus("Error: " + e.message);
      setTimeout(() => this.updateStatus("Ask Ritik's AI"), 3000);
      this.isConnecting = false;
      this.stop(false);
    }
  }

  // Stop all queued/playing audio immediately (used for barge-in and session end)
  clearPlaybackQueue() {
    if (this.activeSources) {
      this.activeSources.forEach((src) => {
        try { src.stop(); } catch (_) {}
      });
      this.activeSources = [];
    }
    this.nextPlayTime = 0;
  }

  playAudio(base64Data) {
    try {
      const binaryString = atob(base64Data);
      const length = binaryString.length;
      const buffer = new ArrayBuffer(length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < length; i++) {
        view[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(buffer);
      const audioBuffer = this.audioContext.createBuffer(
        1,
        int16Array.length,
        24000
      );
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }

      if (this.audioContext.currentTime > this.nextPlayTime) {
        this.nextPlayTime = this.audioContext.currentTime;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;

      // Track source so we can stop it on session end
      this.activeSources.push(source);
      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) this.activeSources.splice(idx, 1);
      };
    } catch (e) {
      console.error("[VA] Audio playback error:", e);
    }
  }

  stop(resetUI = true) {
    this.isReady = false;
    this.isConnecting = false;

    // Stop all queued/playing audio immediately
    this.clearPlaybackQueue();

    // Stop level visualization
    this.stopLevelVisualization();

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.audioInput) {
      this.audioInput.disconnect();
      this.audioInput = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close();
      this.ws = null;
    }
    this.isRecording = false;

    if (resetUI) {
      if (this.btn) this.btn.classList.remove("active");
      this.updateStatus("Ask Ritik's AI");
      this.showEndButton(false);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const CLOUDFLARE_WORKER_URL = "wss://voice-talk.ritik-bilala.workers.dev/";
  const assistant = new VoiceAssistant(CLOUDFLARE_WORKER_URL);
});
