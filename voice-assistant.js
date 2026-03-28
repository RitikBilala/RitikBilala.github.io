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
    this.btn = document.getElementById('voice-assistant-btn');
    this.statusText = document.getElementById('voice-assistant-status');
    
    if (this.btn) {
      this.btn.addEventListener('click', () => this.toggle());
    }
  }

  updateStatus(text, isActive = false) {
    if (this.statusText) {
      this.statusText.textContent = text;
    }
  }

  async initAudio() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    
    const workletCode = `
      class RecorderProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input && input.length > 0) {
            const channelData = input[0];
            const int16Data = new Int16Array(channelData.length);
            for (let i = 0; i < channelData.length; i++) {
              const s = Math.max(-1, Math.min(1, channelData[i]));
              int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            this.port.postMessage(int16Data.buffer, [int16Data.buffer]);
          }
          return true;
        }
      }
      registerProcessor('recorder-worklet', RecorderProcessor);
    `;
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    await this.audioContext.audioWorklet.addModule(url);
  }

  async toggle() {
    if (this.isRecording) {
      this.stop();
    } else {
      await this.start();
    }
  }

  async start() {
    try {
      this.updateStatus("Initializing...");
      if (!this.audioContext) await this.initAudio();
      if (this.audioContext.state === 'suspended') await this.audioContext.resume();

      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true } 
      });
      this.audioInput = this.audioContext.createMediaStreamSource(this.stream);
      this.processorNode = new AudioWorkletNode(this.audioContext, 'recorder-worklet');

      this.updateStatus("Connecting...");
      this.ws = new WebSocket(this.workerUrl);
      
      this.ws.onopen = () => {
        console.log('Voice Assistant Connected.');
        this.updateStatus("Listening...");
        this.nextPlayTime = this.audioContext.currentTime;
        
        // Protocol setup (Worker injects system instructions)
        this.ws.send(JSON.stringify({
          setup: {
            model: "models/gemini-2.0-flash-exp",
            generationConfig: {
              responseModalities: ["audio"]
            }
          }
        }));
        
        // Initial greeting
        setTimeout(() => {
          this.ws.send(JSON.stringify({
            clientContent: {
              turns: [{
                role: "user",
                parts: [{ text: "Hello! Please provide a very brief, friendly welcome greeting." }]
              }],
              turnComplete: true
            }
          }));
        }, 500);
      };

      this.processorNode.port.onmessage = (event) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const buffer = event.data;
          let binary = '';
          const bytes = new Uint8Array(buffer);
          // Process in smaller chunks to avoid call stack limits on String.fromCharCode.apply
          for (let i = 0; i < bytes.byteLength; i += 1024) {
             const chunk = bytes.subarray(i, i + 1024);
             binary += String.fromCharCode.apply(null, chunk);
          }
          const base64 = window.btoa(binary);
          
          this.ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                mimeType: "audio/pcm;rate=16000",
                data: base64
              }]
            }
          }));
        }
      };

      this.audioInput.connect(this.processorNode);

      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.serverContent && msg.serverContent.modelTurn) {
          const parts = msg.serverContent.modelTurn.parts;
          for (let part of parts) {
            if (part.inlineData && part.inlineData.data) {
               this.playAudio(part.inlineData.data);
            }
          }
        }
      };

      this.ws.onclose = () => {
        this.stop();
      }

      this.isRecording = true;
      if (this.btn) this.btn.classList.add('active');
    } catch (e) {
      console.error(e);
      this.updateStatus("Error: " + e.message);
      setTimeout(() => this.updateStatus("Ask AI"), 3000);
      this.stop(false);
    }
  }

  playAudio(base64Data) {
    const binaryString = atob(base64Data);
    const length = binaryString.length;
    const buffer = new ArrayBuffer(length);
    const dataView = new DataView(buffer);
    for (let i = 0; i < length; i++) {
      dataView.setUint8(i, binaryString.charCodeAt(i));
    }
    
    const int16Array = new Int16Array(buffer);
    const audioBuffer = this.audioContext.createBuffer(1, int16Array.length, 24000); // Output is 24kHz
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
  }

  stop(resetUI = true) {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.audioInput) {
      this.audioInput.disconnect();
      this.audioInput = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close();
      this.ws = null;
    }
    this.isRecording = false;
    
    if (resetUI) {
      if (this.btn) this.btn.classList.remove('active');
      this.updateStatus("Ask AI");
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Replace with your Cloudflare Worker URL
  const CLOUDFLARE_WORKER_URL = "wss://voice-talk.ritik-bilala.workers.dev/";
  const assistant = new VoiceAssistant(CLOUDFLARE_WORKER_URL);
});
