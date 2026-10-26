/**
 * Nanan-AI — Moteur Frontend & Direction Artistique Dribbble
 * Interaction Vocale Baoulé & Dioula
 * 
 * - Web Audio API (Live AnalyserNode 16 bandes & Profiling Acoustique)
 * - MediaRecorder avec gestion d'état réactive (Ready, Recording, Preview, Processing)
 * - Lecteur Audio personnalisé sous forme de bulles compactes (User & AI)
 * - Tiroir d'historique de session interactif
 * - Retours sonores harmonieux synthétisés par oscillateur
 */

// ==========================================================================
// 1. Données Linguistiques & Corpus Audio Réels
// ==========================================================================

const MOCK_AUDIO_FILES = {
  baoule: 'samples/baoule_test.mp3',
  bci: 'samples/baoule_test.mp3',
  dioula: 'samples/dioula_test.mp3',
  dyu: 'samples/dioula_test.mp3'
};

const LANGUAGE_INFO = {
  dioula: {
    code: 'dyu',
    name: 'Dioula',
    fullName: 'Dioula',
    subTitle: 'Dioula - DYU',
    convoTitle: 'Conversation en Dioula'
  },
  baoule: {
    code: 'bci',
    name: 'Baoulé',
    fullName: 'Baoulé',
    subTitle: 'Baoulé - BCI',
    convoTitle: 'Conversation en Baoulé'
  }
};

// ==========================================================================
// 2. État Global de l'Application
// ==========================================================================

const appState = {
  currentLanguage: 'dioula',
  currentLanguageCode: 'dyu',

  // Enregistrement
  mediaRecorder: null,
  audioStream: null,
  audioChunks: [],
  recordedBlob: null,
  recordedUrl: null,
  recordingDurationSeconds: 0,
  timerInterval: null,

  // Préécoute
  previewAudioElement: null,
  isPreviewPlaying: false,

  // Web Audio Context & Visualiseur
  audioContext: null,
  analyserNode: null,
  visualizerAnimationId: null,

  // Messages & Gestion Audio
  sessionMessages: [],
  activeAudioElement: null,
  createdObjectUrls: new Set(),

  // Statut actuel : 'ready' | 'recording' | 'preview' | 'processing'
  currentState: 'ready'
};

// ==========================================================================
// 3. Références DOM
// ==========================================================================

// Barre Supérieure
const micStatusIndicator = document.getElementById('micStatusIndicator');
const micStatusDot = document.getElementById('micStatusDot');
const micStatusLabel = document.getElementById('micStatusLabel');
const btnNewSession = document.getElementById('btnNewSession');

// Navigation Latérale & Historique
const navTabConversation = document.getElementById('navTabConversation');
const navTabHistory = document.getElementById('navTabHistory');
const historyDrawerBackdrop = document.getElementById('historyDrawerBackdrop');
const btnCloseHistory = document.getElementById('btnCloseHistory');
const historyDrawerContent = document.getElementById('historyDrawerContent');
const historyEmpty = document.getElementById('historyEmpty');
const historyList = document.getElementById('historyList');

// Sélection de Langue
const langCardDyu = document.getElementById('langCardDyu');
const langCardBci = document.getElementById('langCardBci');
const sampleTagDyu = document.getElementById('sampleTagDyu');
const sampleTagBci = document.getElementById('sampleTagBci');
const languageSelect = document.getElementById('languageSelect');
const activeLangTitle = document.getElementById('activeLangTitle');
const studioLangSubtitle = document.getElementById('studioLangSubtitle');
const emptyLangMention = document.getElementById('emptyLangMention');
const processingLangLabel = document.getElementById('processingLangLabel');

// Carte de Conversation & Flux
const sessionCounterBadge = document.getElementById('sessionCounterBadge');
const conversationStream = document.getElementById('conversationStream');
const emptyConversationState = document.getElementById('emptyConversationState');
const messagesList = document.getElementById('messagesList');
const processingCard = document.getElementById('processingCard');
const btnQuickDemo = document.getElementById('btnQuickDemo');

// Studio Vocal & Commandes
const recordingDock = document.getElementById('recordingDock');
const btnRecord = document.getElementById('btnRecord');
const recordingTimer = document.getElementById('recordingTimer');
const audioVisualizer = document.getElementById('audioVisualizer');
const btnStop = document.getElementById('btnStop');
const stopIconGlyph = document.getElementById('stopIconGlyph');
const btnStopText = document.getElementById('btnStopText');
const btnCancelRecording = document.getElementById('btnCancelRecording');

// Actions Secondaires (Écouter & Envoyer)
const btnRetryRecord = document.getElementById('btnRetryRecord');
const btnListenLabel = document.getElementById('btnListenLabel');
const btnSend = document.getElementById('btnSend');

// Carte de Statut Inférieure
const studioStatusCard = document.getElementById('studioStatusCard');
const studioStatusTitle = document.getElementById('studioStatusTitle');
const studioStatusDesc = document.getElementById('studioStatusDesc');

// Docks de compatibilité masqués
const dockReadyPanel = document.getElementById('dockReadyPanel');
const dockRecordingPanel = document.getElementById('dockRecordingPanel');
const dockPreviewPanel = document.getElementById('dockPreviewPanel');
const previewDurationLabel = document.getElementById('previewDurationLabel');
const recordedPreviewPlayer = document.getElementById('recordedPreviewPlayer');
const btnDiscardRecording = document.getElementById('btnDiscardRecording');

// Modale & Notifications
const resetModal = document.getElementById('resetModal');
const btnCancelReset = document.getElementById('btnCancelReset');
const btnConfirmReset = document.getElementById('btnConfirmReset');
const toastContainer = document.getElementById('toastContainer');

// Éléments de compatibilité stricte avec anciens scripts/tests
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const messageBox = document.getElementById('messageBox');
const recordedAudioLegacy = document.getElementById('recordedAudio');
const responseAudioLegacy = document.getElementById('responseAudio');
const mockDetailsLegacy = document.getElementById('mockDetails');
const mockFileLoadedLegacy = document.getElementById('mockFileLoaded');

// ==========================================================================
// 4. Retours Sonores Studio (Web Audio Synthesis)
// ==========================================================================

function playStudioSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'start') {
      // Bip doux montant (vert / démarrage enregistrement)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.11);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'stop') {
      // Bip doux descendant (fin d'enregistrement)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.12);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'response') {
      // Carillon doux terracotta (réponse reçue)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.34);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 400);
  } catch (e) {
    // Ignorer si audio restreint
  }
}

// ==========================================================================
// 5. Notifications Toast
// ==========================================================================

function showToast(message, type = 'info', duration = 3200) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  let iconSvg = '';
  if (type === 'error') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else if (type === 'success') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  toastContainer.appendChild(toast);

  if (messageBox) {
    messageBox.textContent = message;
    if (type === 'error') messageBox.classList.remove('hidden');
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px) scale(0.96)';
    setTimeout(() => toast.remove(), 260);
  }, duration);
}

// ==========================================================================
// 6. Extraction de Waveform & Barres Visuelles
// ==========================================================================

async function extractWaveformData(audioSrc, barCount = 28) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return generateFallbackBars(barCount);

    const res = await fetch(audioSrc);
    if (!res.ok) return generateFallbackBars(barCount);
    const arrayBuffer = await res.arrayBuffer();

    const tempCtx = new AudioCtx();
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / barCount);
    const bars = [];

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j += 4) {
        sum += Math.abs(rawData[start + j] || 0);
      }
      const avg = sum / (blockSize / 4);
      const height = Math.max(6, Math.min(22, Math.round(avg * 56)));
      bars.push(height);
    }

    tempCtx.close().catch(() => {});
    return bars;
  } catch (err) {
    return generateFallbackBars(barCount);
  }
}

function generateFallbackBars(count = 28) {
  const bars = [];
  for (let i = 0; i < count; i++) {
    const progress = i / count;
    const envelope = Math.sin(progress * Math.PI);
    const randomVariation = (Math.random() * 0.45) + 0.75;
    const height = Math.max(5, Math.min(22, Math.round(envelope * 18 * randomVariation + 4)));
    bars.push(height);
  }
  return bars;
}

function formatDuration(seconds) {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// ==========================================================================
// 7. Visualiseur Microphone 16 Bandes Réactif
// ==========================================================================

function setupAudioVisualizer(stream) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    appState.audioContext = new AudioContextClass();
    const source = appState.audioContext.createMediaStreamSource(stream);
    appState.analyserNode = appState.audioContext.createAnalyser();
    appState.analyserNode.fftSize = 64;

    source.connect(appState.analyserNode);

    const bufferLength = appState.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const bars = audioVisualizer.querySelectorAll('.v-bar');

    function renderBars() {
      if (appState.currentState !== 'recording') return;

      appState.analyserNode.getByteFrequencyData(dataArray);

      bars.forEach((bar, index) => {
        const centerOffset = Math.abs(index - (bars.length / 2));
        const sampleIndex = Math.floor(centerOffset * (bufferLength / bars.length));
        const val = dataArray[sampleIndex] || 0;
        const barHeight = Math.max(6, Math.min(44, (val / 255) * 46));
        bar.style.height = `${barHeight}px`;
      });

      appState.visualizerAnimationId = requestAnimationFrame(renderBars);
    }

    renderBars();
  } catch (err) {
    console.warn("AudioContext restreint :", err);
  }
}

function stopAudioVisualizer() {
  if (appState.visualizerAnimationId) {
    cancelAnimationFrame(appState.visualizerAnimationId);
    appState.visualizerAnimationId = null;
  }
  if (appState.audioContext && appState.audioContext.state !== 'closed') {
    appState.audioContext.close().catch(() => {});
    appState.audioContext = null;
  }
  const bars = audioVisualizer.querySelectorAll('.v-bar');
  bars.forEach(b => { b.style.height = '8px'; });
}

// ==========================================================================
// 8. Gestion de la Prise de Voix
// ==========================================================================

function updateMicStatus(status) {
  if (!micStatusIndicator) return;
  micStatusIndicator.className = 'mic-status-pill';

  if (status === 'ready') {
    micStatusIndicator.classList.add('is-ready');
    micStatusLabel.textContent = 'Micro actif';
  } else if (status === 'recording') {
    micStatusIndicator.classList.add('is-recording');
    micStatusLabel.textContent = 'Enregistrement...';
  } else if (status === 'blocked') {
    micStatusIndicator.classList.add('is-blocked');
    micStatusLabel.textContent = 'Micro refusé';
  } else {
    micStatusIndicator.classList.add('is-prompt');
    micStatusLabel.textContent = 'Micro actif';
  }
}

function startRecordingTimer() {
  appState.recordingDurationSeconds = 0;
  recordingTimer.textContent = '00:00';

  clearInterval(appState.timerInterval);
  appState.timerInterval = setInterval(() => {
    appState.recordingDurationSeconds++;
    const mins = String(Math.floor(appState.recordingDurationSeconds / 60)).padStart(2, '0');
    const secs = String(appState.recordingDurationSeconds % 60).padStart(2, '0');
    recordingTimer.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopRecordingTimer() {
  clearInterval(appState.timerInterval);
}

async function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast("L'enregistrement audio n'est pas pris en charge par votre navigateur.", "error");
    updateMicStatus('blocked');
    return;
  }

  // Mettre en pause tout lecteur actif
  stopAllPlayback();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    appState.audioStream = stream;

    let mimeType = '';
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        mimeType = t;
        break;
      }
    }

    appState.mediaRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    appState.audioChunks = [];

    appState.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        appState.audioChunks.push(event.data);
      }
    };

    appState.mediaRecorder.onstop = () => {
      if (appState.audioStream) {
        appState.audioStream.getTracks().forEach(track => track.stop());
        appState.audioStream = null;
      }

      stopAudioVisualizer();
      stopRecordingTimer();

      appState.recordedBlob = new Blob(appState.audioChunks, {
        type: appState.mediaRecorder.mimeType || 'audio/webm'
      });

      if (appState.recordedUrl) {
        URL.revokeObjectURL(appState.recordedUrl);
      }

      appState.recordedUrl = URL.createObjectURL(appState.recordedBlob);
      appState.createdObjectUrls.add(appState.recordedUrl);

      if (recordedAudioLegacy) {
        recordedAudioLegacy.src = appState.recordedUrl;
      }

      const mins = String(Math.floor(appState.recordingDurationSeconds / 60)).padStart(2, '0');
      const secs = String(appState.recordingDurationSeconds % 60).padStart(2, '0');
      const formatted = `${mins}:${secs}`;
      previewDurationLabel.textContent = formatted;

      // Préparation du lecteur de préécoute
      setupPreviewAudio(appState.recordedUrl);

      setDockState('preview');
      updateMicStatus('ready');
      playStudioSound('stop');
      showToast("Prise enregistrée. Vous pouvez réécouter ou envoyer.", "info", 2800);
    };

    appState.mediaRecorder.start();
    setDockState('recording');
    updateMicStatus('recording');
    startRecordingTimer();
    setupAudioVisualizer(stream);
    playStudioSound('start');

  } catch (error) {
    console.error("Erreur d'accès au micro :", error);
    updateMicStatus('blocked');

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      showToast("Accès au micro refusé. Veuillez autoriser le microphone.", "error", 5000);
    } else {
      showToast(`Erreur micro : ${error.message || error.name}`, "error");
    }

    setDockState('ready');
  }
}

function stopRecording() {
  if (appState.mediaRecorder && appState.mediaRecorder.state !== 'inactive') {
    appState.mediaRecorder.stop();
  }
}

function cancelRecording() {
  if (appState.mediaRecorder && appState.mediaRecorder.state !== 'inactive') {
    appState.mediaRecorder.onstop = null;
    appState.mediaRecorder.stop();
  }

  if (appState.audioStream) {
    appState.audioStream.getTracks().forEach(track => track.stop());
    appState.audioStream = null;
  }

  stopAudioVisualizer();
  stopRecordingTimer();
  appState.recordedBlob = null;
  setDockState('ready');
  updateMicStatus('ready');
  showToast("Enregistrement annulé", "info", 1800);
}

function discardRecordedPreview() {
  if (appState.previewAudioElement) {
    appState.previewAudioElement.pause();
    appState.previewAudioElement = null;
  }
  appState.isPreviewPlaying = false;
  appState.recordedBlob = null;
  if (appState.recordedUrl) {
    URL.revokeObjectURL(appState.recordedUrl);
    appState.createdObjectUrls.delete(appState.recordedUrl);
    appState.recordedUrl = null;
  }
  setDockState('ready');
}

// ==========================================================================
// 9. Gestion de la Préécoute dans le Studio
// ==========================================================================

function setupPreviewAudio(audioSrc) {
  if (appState.previewAudioElement) {
    appState.previewAudioElement.pause();
  }

  const audio = new Audio(audioSrc);
  appState.previewAudioElement = audio;
  appState.isPreviewPlaying = false;

  audio.addEventListener('play', () => {
    appState.isPreviewPlaying = true;
    if (btnListenLabel) btnListenLabel.textContent = 'Pause';
  });

  audio.addEventListener('pause', () => {
    appState.isPreviewPlaying = false;
    if (btnListenLabel) btnListenLabel.textContent = 'Écouter';
  });

  audio.addEventListener('ended', () => {
    appState.isPreviewPlaying = false;
    if (btnListenLabel) btnListenLabel.textContent = 'Écouter';
  });

  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const remaining = Math.max(0, audio.duration - audio.currentTime);
      const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
      const secs = String(Math.floor(remaining % 60)).padStart(2, '0');
      recordingTimer.textContent = `${mins}:${secs}`;
    }
  });
}

function togglePreviewPlayback() {
  if (!appState.recordedUrl) {
    // Si aucun enregistrement n'est fait, audition de l'échantillon de test natif
    loadSampleForTesting(appState.currentLanguage);
    return;
  }

  if (!appState.previewAudioElement) {
    setupPreviewAudio(appState.recordedUrl);
  }

  const audio = appState.previewAudioElement;
  if (audio.paused) {
    stopAllPlayback();
    audio.play().catch(err => {
      console.warn("Échec lecture préécoute :", err);
    });
  } else {
    audio.pause();
  }
}

function stopAllPlayback() {
  if (appState.activeAudioElement) {
    appState.activeAudioElement.pause();
    appState.activeAudioElement = null;
  }
  if (appState.previewAudioElement) {
    appState.previewAudioElement.pause();
  }
}

// ==========================================================================
// 10. Gestion des États du Studio (Ready, Recording, Preview, Processing)
// ==========================================================================

function setDockState(state) {
  appState.currentState = state;

  // Réinitialiser les classes actives sur le studio
  recordingDock.classList.remove('is-recording-mode');
  btnRecord.classList.remove('is-recording');
  btnCancelRecording.classList.add('hidden');

  if (state === 'ready') {
    btnStopText.textContent = "Arrêter";
    stopIconGlyph.style.backgroundColor = "var(--c-forest-deep)";
    recordingTimer.textContent = "00:00";

    btnRetryRecord.disabled = false;
    btnListenLabel.textContent = "Écouter";
    btnSend.disabled = true;

    studioStatusTitle.textContent = "Prêt à enregistrer";
    studioStatusDesc.textContent = "Appuyez sur le micro pour parler";

    if (statusBadge) statusBadge.className = 'status-badge status-ready';
    if (statusText) statusText.textContent = 'État : Prêt';

  } else if (state === 'recording') {
    recordingDock.classList.add('is-recording-mode');
    btnRecord.classList.add('is-recording');
    btnCancelRecording.classList.remove('hidden');

    btnStopText.textContent = "Arrêter";
    btnRetryRecord.disabled = true;
    btnSend.disabled = true;

    studioStatusTitle.textContent = "Enregistrement en direct";
    studioStatusDesc.textContent = "Prise de voix en cours...";

    if (statusBadge) statusBadge.className = 'status-badge status-recording';
    if (statusText) statusText.textContent = 'État : Enregistrement...';

  } else if (state === 'preview') {
    btnStopText.textContent = "Nouvelle prise";
    btnRetryRecord.disabled = false;
    btnListenLabel.textContent = "Écouter";
    btnSend.disabled = false;

    studioStatusTitle.textContent = "Prêt à envoyer";
    studioStatusDesc.textContent = "Votre message a été enregistré";

    if (statusBadge) statusBadge.className = 'status-badge status-ready';
    if (statusText) statusText.textContent = 'État : Prêt';

  } else if (state === 'processing') {
    btnSend.disabled = true;
    btnRetryRecord.disabled = true;

    studioStatusTitle.textContent = "Synthèse en cours...";
    studioStatusDesc.textContent = "Nanan-AI prépare sa réponse vocale";

    if (statusBadge) statusBadge.className = 'status-badge status-processing';
    if (statusText) statusText.textContent = 'État : Traitement...';
  }
}

// ==========================================================================
// 11. Composant Lecteur Audio Bulle (Dribbble Pill Player)
// ==========================================================================

function createBubblePlayer(audioSrc, variant = 'user') {
  const isUser = variant === 'user';
  const barCount = 28;

  const playSvg = `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="7 4 19 12 7 20 7 4"></polygon>
    </svg>`;

  const pauseSvg = `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1"></rect>
      <rect x="14" y="4" width="4" height="16" rx="1"></rect>
    </svg>`;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`;

  bubble.innerHTML = `
    <button class="player-btn-toggle" type="button" aria-label="Lire l'enregistrement" title="Lecture">
      ${playSvg}
    </button>
    
    <div class="bubble-waveform-track" role="slider" aria-label="Progression audio" tabindex="0">
      <!-- Barres acoustiques injectées ci-dessous -->
    </div>
    
    <span class="bubble-time-label">0:00</span>
    
    ${isUser ? `
      <div class="user-avatar-badge" aria-hidden="true" title="Vous">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    ` : ''}
    
    <audio preload="metadata" src="${audioSrc}"></audio>
  `;

  const audioElement = bubble.querySelector('audio');
  const btnToggle = bubble.querySelector('.player-btn-toggle');
  const waveformTrack = bubble.querySelector('.bubble-waveform-track');
  const timeLabel = bubble.querySelector('.bubble-time-label');

  // Génération des barres de waveform
  const initialBars = generateFallbackBars(barCount);
  const barElements = [];

  initialBars.forEach((h, index) => {
    const bar = document.createElement('span');
    bar.className = 'bubble-waveform-slice';
    bar.style.height = `${h}px`;
    bar.setAttribute('data-index', index);
    waveformTrack.appendChild(bar);
    barElements.push(bar);
  });

  // Extraction PCM réelle en arrière-plan
  extractWaveformData(audioSrc, barCount).then(realBars => {
    realBars.forEach((h, idx) => {
      if (barElements[idx]) {
        barElements[idx].style.height = `${h}px`;
      }
    });
  });

  function updateDurationDisplay() {
    if (audioElement.duration && isFinite(audioElement.duration)) {
      timeLabel.textContent = formatDuration(audioElement.duration);
    }
  }

  audioElement.addEventListener('loadedmetadata', updateDurationDisplay);
  audioElement.addEventListener('durationchange', updateDurationDisplay);

  audioElement.addEventListener('timeupdate', () => {
    const duration = audioElement.duration || 1;
    const progress = Math.min(1, Math.max(0, audioElement.currentTime / duration));
    timeLabel.textContent = formatDuration(audioElement.currentTime);

    const activeIndex = Math.floor(progress * barCount);
    barElements.forEach((bar, idx) => {
      if (idx <= activeIndex && progress > 0) {
        bar.classList.add('is-played');
      } else {
        bar.classList.remove('is-played');
      }
    });
  });

  audioElement.addEventListener('play', () => {
    if (appState.activeAudioElement && appState.activeAudioElement !== audioElement) {
      appState.activeAudioElement.pause();
    }
    appState.activeAudioElement = audioElement;
    btnToggle.innerHTML = pauseSvg;
    btnToggle.setAttribute('title', 'Pause');
  });

  audioElement.addEventListener('pause', () => {
    btnToggle.innerHTML = playSvg;
    btnToggle.setAttribute('title', 'Lecture');
  });

  audioElement.addEventListener('ended', () => {
    btnToggle.innerHTML = playSvg;
    barElements.forEach(b => b.classList.remove('is-played'));
    updateDurationDisplay();
    if (appState.activeAudioElement === audioElement) {
      appState.activeAudioElement = null;
    }
  });

  btnToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (audioElement.paused) {
      audioElement.play().catch(err => {
        console.warn("Échec lecture :", err);
      });
    } else {
      audioElement.pause();
    }
  });

  // Scrubbing au clic
  waveformTrack.addEventListener('click', (e) => {
    const rect = waveformTrack.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    if (audioElement.duration && isFinite(audioElement.duration)) {
      audioElement.currentTime = ratio * audioElement.duration;
    }
  });

  bubble.cleanup = () => {
    audioElement.pause();
    audioElement.src = '';
  };

  return bubble;
}

// ==========================================================================
// 12. Ajout des Messages dans le Flux Conversationnel
// ==========================================================================

function appendUserMessage(audioBlob, audioUrl, langCode) {
  emptyConversationState.classList.add('hidden');
  messagesList.classList.remove('hidden');

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const row = document.createElement('div');
  row.className = 'chat-bubble-row user-row';

  const player = createBubblePlayer(audioUrl, 'user');
  row.appendChild(player);

  const timestamp = document.createElement('div');
  timestamp.className = 'chat-timestamp';
  timestamp.textContent = timeStr;
  row.appendChild(timestamp);

  messagesList.appendChild(row);
  conversationStream.scrollTop = conversationStream.scrollHeight;

  // Enregistrement dans l'historique
  appState.sessionMessages.push({
    type: 'user',
    lang: appState.currentLanguage,
    time: timeStr,
    audioUrl: audioUrl
  });
  updateHistoryDrawer();
}

function appendMockResponseMessage(audioPath, langKey) {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const row = document.createElement('div');
  row.className = 'chat-bubble-row ai-row';

  const cluster = document.createElement('div');
  cluster.className = 'chat-bubble-cluster';

  // Badge Nanan-AI Terracotta avec onde
  const aiBadge = document.createElement('div');
  aiBadge.className = 'ai-avatar-badge';
  aiBadge.setAttribute('aria-hidden', 'true');
  aiBadge.setAttribute('title', 'Nanan-AI');
  aiBadge.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
      <line x1="4" y1="12" x2="4" y2="12.01"/>
      <line x1="8" y1="9" x2="8" y2="15"/>
      <line x1="12" y1="6" x2="12" y2="18"/>
      <line x1="16" y1="9" x2="16" y2="15"/>
      <line x1="20" y1="12" x2="20" y2="12.01"/>
    </svg>
  `;
  cluster.appendChild(aiBadge);

  const player = createBubblePlayer(audioPath, 'ai');
  cluster.appendChild(player);

  row.appendChild(cluster);

  const timestamp = document.createElement('div');
  timestamp.className = 'chat-timestamp';
  timestamp.textContent = timeStr;
  row.appendChild(timestamp);

  messagesList.appendChild(row);
  conversationStream.scrollTop = conversationStream.scrollHeight;

  // Mise à jour rétrocompatible
  if (responseAudioLegacy) {
    responseAudioLegacy.src = audioPath;
  }
  if (mockFileLoadedLegacy) {
    mockFileLoadedLegacy.textContent = audioPath;
  }
  if (mockDetailsLegacy) {
    mockDetailsLegacy.classList.remove('hidden');
  }

  // Compteur d'échanges
  appState.sessionMessages.push({
    type: 'mock',
    lang: langKey,
    time: timeStr,
    audioUrl: audioPath
  });

  const exchangeCount = Math.floor(appState.sessionMessages.length / 2);
  sessionCounterBadge.textContent = `${exchangeCount} ${exchangeCount > 1 ? 'échanges' : 'échange'}`;

  updateHistoryDrawer();
  playStudioSound('response');
}

// ==========================================================================
// 13. Simulation de l'API Mock
// ==========================================================================

async function simulateMockApiCall(audioBlob, selectedLanguage) {
  if (!audioBlob) {
    showToast("Enregistrez un message d'abord.", "error");
    return;
  }

  const currentBlobUrl = appState.recordedUrl;
  appendUserMessage(audioBlob, currentBlobUrl, appState.currentLanguageCode);

  discardRecordedPreview();
  setDockState('processing');

  processingCard.classList.remove('hidden');
  conversationStream.scrollTop = conversationStream.scrollHeight;

  try {
    // Délai réaliste de synthèse acoustique
    await new Promise(resolve => setTimeout(resolve, 1100));

    const testAudioPath = MOCK_AUDIO_FILES[selectedLanguage] ||
                          MOCK_AUDIO_FILES[appState.currentLanguage] ||
                          MOCK_AUDIO_FILES.dioula;

    processingCard.classList.add('hidden');
    appendMockResponseMessage(testAudioPath, selectedLanguage);

    setDockState('ready');
    if (statusBadge) statusBadge.className = 'status-badge status-completed';
    if (statusText) statusText.textContent = 'État : Réponse reçue';
    showToast('Réponse vocale reçue', 'success', 2400);

  } catch (error) {
    console.error("Erreur API mock :", error);
    processingCard.classList.add('hidden');
    setDockState('ready');
    showToast("Erreur lors de la réponse vocale.", "error");
  }
}

// ==========================================================================
// 14. Chargement d'Échantillon Réel
// ==========================================================================

async function loadSampleForTesting(langKey) {
  setLanguage(langKey);
  const samplePath = MOCK_AUDIO_FILES[langKey] || MOCK_AUDIO_FILES.dioula;

  try {
    const res = await fetch(samplePath);
    if (!res.ok) throw new Error("Fichier audio non accessible");
    const blob = await res.blob();

    appState.recordedBlob = blob;
    if (appState.recordedUrl) {
      URL.revokeObjectURL(appState.recordedUrl);
      appState.createdObjectUrls.delete(appState.recordedUrl);
    }
    appState.recordedUrl = URL.createObjectURL(blob);
    appState.createdObjectUrls.add(appState.recordedUrl);

    if (recordedAudioLegacy) {
      recordedAudioLegacy.src = appState.recordedUrl;
    }

    const langName = LANGUAGE_INFO[langKey].name;
    recordingTimer.textContent = "00:03";
    previewDurationLabel.textContent = "00:03";

    setupPreviewAudio(appState.recordedUrl);
    setDockState('preview');

    showToast(`Échantillon natif en ${langName} chargé dans le studio.`, 'success', 3200);

    // Lecture automatique de l'extrait
    if (appState.previewAudioElement) {
      appState.previewAudioElement.play().catch(() => {});
    }

  } catch (err) {
    console.warn("Échec chargement échantillon :", err);
    showToast("Impossible d'accéder au fichier d'échantillon.", "error");
  }
}

// ==========================================================================
// 15. Sélection de Langue (Dioula / Baoulé)
// ==========================================================================

function setLanguage(langKey) {
  if (langKey !== 'dioula' && langKey !== 'baoule') return;

  appState.currentLanguage = langKey;
  appState.currentLanguageCode = LANGUAGE_INFO[langKey].code;

  if (langKey === 'dioula') {
    langCardDyu.classList.add('is-active');
    langCardDyu.setAttribute('aria-checked', 'true');
    langCardBci.classList.remove('is-active');
    langCardBci.setAttribute('aria-checked', 'false');
  } else {
    langCardBci.classList.add('is-active');
    langCardBci.setAttribute('aria-checked', 'true');
    langCardDyu.classList.remove('is-active');
    langCardDyu.setAttribute('aria-checked', 'false');
  }

  if (languageSelect) {
    languageSelect.value = langKey;
  }

  const info = LANGUAGE_INFO[langKey];
  activeLangTitle.textContent = info.convoTitle;
  if (studioLangSubtitle) {
    studioLangSubtitle.textContent = info.subTitle;
  }
  if (emptyLangMention) {
    emptyLangMention.textContent = info.name;
  }

  showToast(`Langue : ${info.fullName}`, 'info', 1600);
}

// ==========================================================================
// 16. Tiroir d'Historique
// ==========================================================================

function openHistoryDrawer() {
  historyDrawerBackdrop.classList.remove('hidden');
}

function closeHistoryDrawer() {
  historyDrawerBackdrop.classList.add('hidden');
}

function updateHistoryDrawer() {
  if (appState.sessionMessages.length === 0) {
    historyEmpty.classList.remove('hidden');
    historyList.classList.add('hidden');
    return;
  }

  historyEmpty.classList.add('hidden');
  historyList.classList.remove('hidden');
  historyList.innerHTML = '';

  appState.sessionMessages.forEach((msg, idx) => {
    const card = document.createElement('div');
    card.className = 'history-item-card';

    const isUser = msg.type === 'user';
    const langMeta = LANGUAGE_INFO[msg.lang] || { name: 'Africain' };

    card.innerHTML = `
      <div class="history-item-meta">
        <span>${isUser ? 'Vous' : 'Nanan-AI'} (${langMeta.name})</span>
        <span>${msg.time}</span>
      </div>
    `;

    const player = createBubblePlayer(msg.audioUrl, isUser ? 'user' : 'ai');
    card.appendChild(player);
    historyList.appendChild(card);
  });
}

// ==========================================================================
// 17. Réinitialisation de Conversation
// ==========================================================================

function openResetModal() {
  if (appState.sessionMessages.length === 0 && !appState.recordedBlob) {
    resetConversation();
    return;
  }
  resetModal.classList.remove('hidden');
}

function closeResetModal() {
  resetModal.classList.add('hidden');
}

function resetConversation() {
  closeResetModal();
  stopAllPlayback();

  const existingBubbles = messagesList.querySelectorAll('.chat-bubble');
  existingBubbles.forEach(b => {
    if (typeof b.cleanup === 'function') b.cleanup();
  });

  appState.createdObjectUrls.forEach(url => {
    try { URL.revokeObjectURL(url); } catch (e) {}
  });
  appState.createdObjectUrls.clear();

  messagesList.innerHTML = '';
  messagesList.classList.add('hidden');
  emptyConversationState.classList.remove('hidden');
  appState.sessionMessages = [];
  sessionCounterBadge.textContent = '0 échange';

  discardRecordedPreview();
  setDockState('ready');
  updateHistoryDrawer();

  showToast("Conversation réinitialisée.", "info", 2400);
}

// ==========================================================================
// 18. Écouteurs d'Événements
// ==========================================================================

// Sélection de langue
langCardDyu.addEventListener('click', () => setLanguage('dioula'));
langCardBci.addEventListener('click', () => setLanguage('baoule'));

sampleTagDyu.addEventListener('click', (e) => {
  e.stopPropagation();
  loadSampleForTesting('dioula');
});

sampleTagBci.addEventListener('click', (e) => {
  e.stopPropagation();
  loadSampleForTesting('baoule');
});

if (btnQuickDemo) {
  btnQuickDemo.addEventListener('click', () => {
    loadSampleForTesting(appState.currentLanguage);
  });
}

// Navigation & Historique
if (navTabConversation) {
  navTabConversation.addEventListener('click', () => {
    navTabConversation.classList.add('is-active');
    navTabHistory.classList.remove('is-active');
    closeHistoryDrawer();
  });
}

if (navTabHistory) {
  navTabHistory.addEventListener('click', () => {
    openHistoryDrawer();
  });
}

if (btnCloseHistory) {
  btnCloseHistory.addEventListener('click', closeHistoryDrawer);
}

historyDrawerBackdrop.addEventListener('click', (e) => {
  if (e.target === historyDrawerBackdrop) closeHistoryDrawer();
});

// Contrôles Studio Vocal
btnRecord.addEventListener('click', () => {
  if (appState.currentState === 'recording') {
    stopRecording();
  } else {
    startRecording();
  }
});

btnStop.addEventListener('click', () => {
  if (appState.currentState === 'recording') {
    stopRecording();
  } else if (appState.currentState === 'preview') {
    // Si déjà une prise, "Nouvelle prise" redémarre
    discardRecordedPreview();
    startRecording();
  } else {
    startRecording();
  }
});

btnCancelRecording.addEventListener('click', cancelRecording);

// Actions Secondaires (Écouter & Envoyer)
btnRetryRecord.addEventListener('click', togglePreviewPlayback);

btnSend.addEventListener('click', () => {
  if (!appState.recordedBlob) {
    showToast("Veuillez d'abord enregistrer un message vocal.", "error");
    return;
  }
  simulateMockApiCall(appState.recordedBlob, appState.currentLanguage);
});

// Réinitialisation de session
btnNewSession.addEventListener('click', openResetModal);
btnCancelReset.addEventListener('click', closeResetModal);
btnConfirmReset.addEventListener('click', resetConversation);

resetModal.addEventListener('click', (e) => {
  if (e.target === resetModal) closeResetModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!resetModal.classList.contains('hidden')) closeResetModal();
    if (!historyDrawerBackdrop.classList.contains('hidden')) closeHistoryDrawer();
  }
});

// Nettoyage avant fermeture de page
window.addEventListener('beforeunload', () => {
  if (appState.audioStream) {
    appState.audioStream.getTracks().forEach(t => t.stop());
  }
  appState.createdObjectUrls.forEach(url => {
    try { URL.revokeObjectURL(url); } catch (e) {}
  });
});

// ==========================================================================
// 19. Initialisation
// ==========================================================================

async function initApp() {
  updateMicStatus('ready');

  if (navigator.permissions && navigator.permissions.query) {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
      if (permissionStatus.state === 'granted') {
        updateMicStatus('ready');
      } else if (permissionStatus.state === 'denied') {
        updateMicStatus('blocked');
      }

      permissionStatus.onchange = () => {
        if (permissionStatus.state === 'granted') {
          updateMicStatus('ready');
        } else if (permissionStatus.state === 'denied') {
          updateMicStatus('blocked');
        }
      };
    } catch (e) {
      updateMicStatus('ready');
    }
  }

  setLanguage('dioula');
  setDockState('ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
