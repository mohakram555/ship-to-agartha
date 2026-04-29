// ========================================
// AGARTHA: FALSE GUIDE - Audio Manager
// Procedural Audio Engine & Music Handler
// ========================================

// ========================================
// Audio Configuration
// ========================================

const MUSIC_TRACKS = {
    menu: 'assets/music/menu.mp3',
    combat: 'assets/music/combat.mp3',
    asteroid: 'assets/music/asteroids.mp3',
    boss: 'assets/music/boss.mp3',
    credits: 'assets/music/credits.mp3'
};

// Modular Sound Patches (Procedural Definitions)
const SFX_PATCHES = {
    shoot: {
        type: 'square',
        freqStart: 880,
        freqEnd: 110,
        duration: 0.1,
        vol: 0.1,
        ramp: 'exponential'
    },
    hit: {
        type: 'sawtooth',
        freqStart: 200,
        freqEnd: 50,
        duration: 0.15,
        vol: 0.15,
        ramp: 'exponential'
    },
    destroy: {
        type: 'sawtooth',
        freqStart: 100,
        freqEnd: 20,
        duration: 0.3,
        vol: 0.25,
        ramp: 'exponential',
        noise: true // Mix in noise if possible, or simulate
    },
    pickup: {
        type: 'sine',
        sequence: [ // Arpeggio support
            { freq: 523, time: 0 },
            { freq: 659, time: 0.05 },
            { freq: 784, time: 0.1 }
        ],
        duration: 0.2,
        vol: 0.15
    },
    damage: {
        type: 'square',
        sequence: [
            { freq: 200, time: 0 },
            { freq: 150, time: 0.1 },
            { freq: 100, time: 0.2 }
        ],
        duration: 0.3,
        vol: 0.2
    },
    enemyHit: {
        type: 'triangle',
        freqStart: 150,
        freqEnd: 50,
        duration: 0.1,
        vol: 0.15,
        ramp: 'linear'
    },
    bossHit: {
        type: 'sawtooth',
        freqStart: 150,
        freqEnd: 30,
        duration: 0.25,
        vol: 0.3,
        ramp: 'exponential'
    }
};

// Character Voice Definitions
export const VOICE_PATCHES = {
    KAEL: {
        type: 'triangle',
        freqStart: 220,
        freqEnd: 200,
        duration: 0.05,
        vol: 0.08,
        interval: 3 // Play every 3 chars
    },
    LYRA: {
        type: 'sine',
        freqStart: 500, // Higher pitch
        freqEnd: 480,
        duration: 0.05,
        vol: 0.08,
        interval: 2
    },
    SAEL_DISGUISE: {
        type: 'sine',
        freqStart: 150, // Low, smooth
        freqEnd: 140,
        duration: 0.08,
        vol: 0.1,
        interval: 4 // Slower speech feel
    },
    SAEL_TRUE: {
        type: 'sawtooth', // Harsh, aggressive
        freqStart: 110,
        freqEnd: 100,
        duration: 0.06,
        vol: 0.09,
        interval: 3
    },
    SYSTEM: {
        type: 'square', // Robotic
        freqStart: 880,
        freqEnd: 880,
        duration: 0.02,
        vol: 0.03,
        interval: 1
    },
    UNKNOWN: {
        type: 'square',
        freqStart: 300,
        freqEnd: 250,
        duration: 0.05,
        vol: 0.05,
        interval: 3
    }
};

// ========================================
// Audio State
// ========================================

let audioContext = null;
let musicVolume = 0.5;
let sfxVolume = 0.7;

let currentMusic = null;
let currentMusicType = null;
let musicGainNode = null;
let sfxGainNode = null;
let audioInitialized = false;

// Preloaded music buffers only (No SFX files)
const musicBuffers = {};

// ========================================
// Initialization
// ========================================

/**
 * Initialize the audio system
 */
async function init() {
    if (audioInitialized) return;

    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContextClass();

        // Create master gain nodes
        musicGainNode = audioContext.createGain();
        musicGainNode.gain.value = musicVolume;
        musicGainNode.connect(audioContext.destination);

        sfxGainNode = audioContext.createGain();
        sfxGainNode.gain.value = sfxVolume;
        sfxGainNode.connect(audioContext.destination);

        audioInitialized = true;
        console.log('AudioManager: Engine Initialized (Procedural SFX Mode)');

        // Only preload music
        await preloadMusic();

    } catch (e) {
        console.warn('AudioManager: Failed to initialize', e);
    }
}

/**
 * Preload only music files
 */
async function preloadMusic() {
    const loadPromises = [];

    for (const [key, path] of Object.entries(MUSIC_TRACKS)) {
        loadPromises.push(loadAudioBuffer(path).then(buffer => {
            if (buffer) musicBuffers[key] = buffer;
        }));
    }

    await Promise.all(loadPromises);
    console.log('AudioManager: Loaded', Object.keys(musicBuffers).length, 'music tracks');
}

async function loadAudioBuffer(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            console.warn('AudioManager: Failed to fetch', path);
            return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
    } catch (e) {
        console.warn('AudioManager: Failed to load', path, e);
        return null;
    }
}

// ========================================
// Procedural Sound Engine
// ========================================

/**
 * Play a procedural sound effect based on a definition patch
 */
function playProceduralSound(patchName, volumeMult = 1.0) {
    if (!audioContext || !audioInitialized) return;

    const patch = SFX_PATCHES[patchName];
    if (!patch) {
        // Fallback for missing definitions
        generateTone({ type: 'sine', freqStart: 440, duration: 0.1, vol: 0.1 }, volumeMult);
        return;
    }

    if (patch.sequence) {
        playSequence(patch, volumeMult);
    } else {
        generateTone(patch, volumeMult);
    }
}

/**
 * Play a specific character voice tone
 */
function playVoice(character, volumeMult = 1.0) {
    if (!audioContext || !audioInitialized) return;

    // Determine patch based on character string
    let patch = VOICE_PATCHES[character];

    // Fallback if character not found directly
    if (!patch) {
        // Handle Sael variants if just 'SAEL' is passed (fallback)
        if (character.includes('SAEL')) patch = VOICE_PATCHES.SAEL_TRUE;
        else patch = VOICE_PATCHES.UNKNOWN;
    }

    generateTone(patch, volumeMult);
}

/**
 * Core Synthesis Function
 */
function generateTone(params, volumeMult = 1.0) {
    const now = audioContext.currentTime;

    // 1. Oscillator
    const osc = audioContext.createOscillator();
    osc.type = params.type || 'sine';

    // 2. Envelope (Gain)
    const gainNode = audioContext.createGain();
    const finalVol = (params.vol || 0.1) * volumeMult;

    // Attack (very fast)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(finalVol, now + 0.01);

    // Decay/Release
    if (params.ramp === 'exponential') {
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + params.duration);
    } else {
        gainNode.gain.linearRampToValueAtTime(0, now + params.duration);
    }

    // 3. Frequency Modulation
    if (params.freqStart) {
        osc.frequency.setValueAtTime(params.freqStart, now);
        if (params.freqEnd) {
            if (params.ramp === 'exponential') {
                osc.frequency.exponentialRampToValueAtTime(params.freqEnd, now + params.duration);
            } else {
                osc.frequency.linearRampToValueAtTime(params.freqEnd, now + params.duration);
            }
        }
    }

    // 4. Connect
    osc.connect(gainNode);
    gainNode.connect(sfxGainNode);

    // 5. Play & Cleanup
    osc.start(now);
    osc.stop(now + params.duration + 0.1);

    // Manual garbage collection help
    osc.onended = () => {
        osc.disconnect();
        gainNode.disconnect();
    };
}

/**
 * Play a sequence of tones (Arpeggio)
 */
function playSequence(patch, volumeMult) {
    const now = audioContext.currentTime;

    patch.sequence.forEach(note => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        osc.type = patch.type;
        osc.frequency.value = note.freq;

        const startTime = now + note.time;
        const noteDuration = (patch.duration / patch.sequence.length);

        // Envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime((patch.vol || 0.1) * volumeMult, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

        osc.connect(gainNode);
        gainNode.connect(sfxGainNode);

        osc.start(startTime);
        osc.stop(startTime + noteDuration + 0.1);

        osc.onended = () => {
            osc.disconnect();
            gainNode.disconnect();
        };
    });
}

// ========================================
// Music System (Preserved)
// ========================================

function playMusic(type, fadeTime = 1.0) {
    if (!audioInitialized || !audioContext) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (currentMusicType === type && currentMusic) return;

    const buffer = musicBuffers[type];
    if (!buffer) {
        // Silent fallback or retry logic could go here
        return;
    }

    if (currentMusic) {
        fadeOutMusic(fadeTime);
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const trackGain = audioContext.createGain();
    trackGain.gain.value = 0;

    source.connect(trackGain);
    trackGain.connect(musicGainNode);

    source.start(0);
    currentMusic = { source, gainNode: trackGain };
    currentMusicType = type;

    trackGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + fadeTime);
}

function fadeOutMusic(fadeTime = 1.0) {
    if (!currentMusic) return;
    const { source, gainNode } = currentMusic;

    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + fadeTime);
    setTimeout(() => {
        try { source.stop(); } catch (e) {}
    }, fadeTime * 1000);

    currentMusic = null;
}

function stopMusic() {
    if (!currentMusic) return;
    try { currentMusic.source.stop(); } catch (e) {}
    currentMusic = null;
    currentMusicType = null;
}

function setMusicVolume(volume) {
    musicVolume = Math.max(0, Math.min(1, volume));
    if (musicGainNode) musicGainNode.gain.value = musicVolume;
}

function setSFXVolume(volume) {
    sfxVolume = Math.max(0, Math.min(1, volume));
    if (sfxGainNode) sfxGainNode.gain.value = sfxVolume;
}

function resume() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function getMusicTypeForLevel(gameplayType) {
    switch (gameplayType) {
        case 'shooter': return 'combat';
        case 'dodge':
        case 'collect': return 'asteroid';
        case 'boss': return 'boss';
        default: return 'combat';
    }
}

// ========================================
// Public Interface
// ========================================

export const AudioManager = {
    init,
    playMusic,
    stopMusic,
    fadeOutMusic,
    playSFX: playProceduralSound, // Replaces old file-based player
    playVoice,                    // New functionality
    setMusicVolume,
    setSFXVolume,
    resume,
    getMusicTypeForLevel
};
