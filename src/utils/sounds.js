// sounds.js - Clean approach
const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;

let isMuted = false;

export const setMuted = (muted) => {
    isMuted = muted;
};

export const getMuted = () => isMuted;

function getCtx() {
    if (!ctx) ctx = new AudioContext();
    return ctx;
}

export const playHoverSound = () => {
    if (isMuted) return;
    try {
        const c = getCtx();
        if (c.state === 'suspended') return; // Don't try if user hasn't interacted
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = 800;
        gain.gain.value = 0.05;
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
        osc.connect(gain).connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.1);
    } catch (e) { }
};

export const playClickSound = () => {
    if (isMuted) return;
    try {
        const c = getCtx();
        if (c.state === 'suspended') {
            c.resume();
        }
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = 600;
        gain.gain.value = 0.08;
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
        osc.connect(gain).connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.15);
    } catch (e) { }
};
