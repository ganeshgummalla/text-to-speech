// theme toggle
const toggle = document.getElementById('themeToggle');
toggle.addEventListener('change', () => {
  document.documentElement.setAttribute('data-theme', toggle.checked ? 'dark' : 'light');
});

// character count
const textInput = document.getElementById('text');
const charCount = document.getElementById('charCount');
textInput.addEventListener('input', () => {
  charCount.textContent = `${textInput.value.length} characters`;
});

// spinner & status
const spinner = document.getElementById('spinner');
const statusText = document.getElementById('statusText');
function setStatus(text, busy) {
  statusText.textContent = text;
  spinner.style.display = busy ? 'inline-block' : 'none';
  startBtn.disabled = busy;
  stopBtn.disabled = !busy;
}

// your existing TTS & recording logic (unchanged)
const synth = window.speechSynthesis;
const voiceSelect = document.getElementById('voiceSelect');
const rateInput = document.getElementById('rate');
const pitchInput = document.getElementById('pitch');
const rateValue = document.getElementById('rateValue');
const pitchValue = document.getElementById('pitchValue');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const audioPlayback = document.getElementById('audioPlayback');
const downloadContainer = document.getElementById('downloadLinkContainer');

let voices = [], mediaRecorder, audioChunks;
const audioContext = new AudioContext();
const dest = audioContext.createMediaStreamDestination();

function populateVoices() {
  voices = synth.getVoices();
  voiceSelect.innerHTML = '';
  voices.forEach((v,i) => {
    const opt = document.createElement('option');
    opt.textContent = `${v.name} (${v.lang})${v.default?' — DEFAULT':''}`;
    opt.value = i;
    voiceSelect.appendChild(opt);
  });
}
populateVoices();
speechSynthesis.onvoiceschanged = populateVoices;

rateInput.oninput = () => rateValue.textContent = rateInput.value;
pitchInput.oninput = () => pitchValue.textContent = pitchInput.value;

function onRecordingStop() {
  const blob = new Blob(audioChunks, { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  audioPlayback.src = url;

  // clear old link
  downloadContainer.innerHTML = '';
  const link = document.createElement('a');
  link.href = url;
  link.download = 'speech.wav';
  link.textContent = '⬇️ Download Recorded Speech';
  downloadContainer.appendChild(link);

  setStatus('Done', false);
}

function startSpeech() {
  const text = textInput.value.trim();
  if (!text) { alert('Please enter text!'); return; }
  const utter = new SpeechSynthesisUtterance(text);
  utter.voice  = voices[voiceSelect.value];
  utter.rate   = parseFloat(rateInput.value);
  utter.pitch  = parseFloat(pitchInput.value);

  // keep context alive
  const osc = audioContext.createOscillator();
  osc.connect(dest);
  osc.start();
  osc.stop(audioContext.currentTime + 0.1);

  mediaRecorder = new MediaRecorder(dest.stream);
  audioChunks = [];
  mediaRecorder.ondataavailable = e => {
    if (e.data.size) audioChunks.push(e.data);
  };
  mediaRecorder.onstop = onRecordingStop;
  mediaRecorder.start();

  utter.onend = () => {
    if (mediaRecorder.state === 'recording') mediaRecorder.stop();
  };

  setStatus('Speaking…', true);
  synth.speak(utter);
}

function stopSpeech() {
  if (synth.speaking) synth.cancel();
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}

startBtn.addEventListener('click', startSpeech);
stopBtn.addEventListener('click', stopSpeech);
// initialize state
setStatus('Idle', false);
