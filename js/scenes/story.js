// ========================================
// AGARTHA: FALSE GUIDE - Dialogue System
// ========================================

import { GameState } from '../state.js';
import { consumeAction } from '../input.js';
import { AudioManager, VOICE_PATCHES } from '../audio.js';

// DOM Elements
let dialogueBox, portraitEl, speakerEl, textEl, continueEl;

// Current dialogue state
let dialogueQueue = [];
let currentLine = null;
let displayedText = '';
let charIndex = 0;
let typewriterTimer = 0;
const TYPE_SPEED = 30; // ms per character

let onCompleteCallback = null;

// End credits music
let creditsMusic = null;
let creditsMusicStarted = false;

// ========================================
// Initialize
// ========================================

export function initDialogue() {
    dialogueBox = document.getElementById('dialogue-box');
    portraitEl = document.getElementById('dialogue-portrait');
    speakerEl = document.getElementById('dialogue-speaker');
    textEl = document.getElementById('dialogue-text');
    continueEl = document.getElementById('dialogue-continue');
    // Music will be created when needed (on user interaction)
}

// Start credits music (called on user interaction when reaching final dialogue)
export function startCreditsMusic() {
    AudioManager.playMusic('credits');
}

// Reset music state (for new game)
export function resetCreditsMusic() {
    // AudioManager handles transitions, but we can ensure stop here if needed.
    // Transition to menu music in main.js will handle the fade out.
}

// ========================================
// Show Dialogue
// ========================================

export function showDialogue(lines, onComplete = null) {
    if (!dialogueBox) initDialogue();

    dialogueQueue = [...lines];
    onCompleteCallback = onComplete;

    dialogueBox.classList.remove('hidden');
    advanceDialogue();
}

export function hideDialogue() {
    if (!dialogueBox) return;
    dialogueBox.classList.add('hidden');
    dialogueQueue = [];
    currentLine = null;
}

export function isDialogueActive() {
    return currentLine !== null || dialogueQueue.length > 0;
}

// ========================================
// Advance Dialogue
// ========================================

function advanceDialogue() {
    if (dialogueQueue.length === 0) {
        // Dialogue complete
        hideDialogue();

        if (onCompleteCallback) {
            onCompleteCallback();
            onCompleteCallback = null;
        } else {
            // Return to gameplay - use async import
            import('../data/levels.js').then(module => {
                const config = module.getLevelConfig(GameState.currentLevel);
                if (config) {
                    GameState.scene = config.gameplayType || 'dodge';
                    console.log('Transitioning to gameplay:', GameState.scene);

                    // Start level-appropriate music after dialogue
                    const musicType = AudioManager.getMusicTypeForLevel(config.gameplayType);
                    AudioManager.playMusic(musicType);
                }
            }).catch(() => {
                // Fallback
                GameState.scene = 'dodge';
                console.log('Fallback to dodge mode');
                AudioManager.playMusic('combat');
            });
        }
        return;
    }

    currentLine = dialogueQueue.shift();
    displayedText = '';
    charIndex = 0;

    // Set speaker
    speakerEl.textContent = currentLine.speaker + ':';

    // Set portrait
    if (currentLine.portrait) {
        import('../main.js').then(main => {
            const img = main.getPortrait(currentLine.portrait);
            if (img) {
                portraitEl.style.backgroundImage = `url(${img.src})`;
            } else {
                // Fallback color based on character
                const colors = {
                    'KAEL': '#64d9ff',
                    'LYRA': '#4ade80',
                    'SAEL': '#fbbf24'
                };
                portraitEl.style.backgroundImage = 'none';
                portraitEl.style.backgroundColor = colors[currentLine.speaker] || '#4a4a5a';
            }
        });
    }

    // Hide continue indicator while typing
    continueEl.style.visibility = 'hidden';
}

// ========================================
// Update (Typewriter Effect)
// ========================================

function playDialogueSound(line, index) {
    // Determine which voice to use
    let voiceKey = line.speaker;

    // Special logic for Sael's different forms
    if (line.speaker === 'SAEL') {
        if (line.portrait && line.portrait.includes('disguise')) {
            voiceKey = 'SAEL_DISGUISE';
        } else {
            voiceKey = 'SAEL_TRUE';
        }
    }

    // Default interval
    let interval = 2;
    if (VOICE_PATCHES[voiceKey] && VOICE_PATCHES[voiceKey].interval) {
        interval = VOICE_PATCHES[voiceKey].interval;
    }

    // Play sound on interval
    if (index % interval === 0) {
        // Skip spaces? (Optional preference, usually good to skip)
        if (line.text[index] !== ' ') {
            AudioManager.playVoice(voiceKey);
        }
    }
}

export function updateDialogue() {
    if (!currentLine) return;

    // Typewriter effect
    if (charIndex < currentLine.text.length) {
        typewriterTimer += 16; // Approximate frame time

        while (typewriterTimer >= TYPE_SPEED && charIndex < currentLine.text.length) {
            typewriterTimer -= TYPE_SPEED;
            displayedText += currentLine.text[charIndex];

            // Play dialogue voice sound
            playDialogueSound(currentLine, charIndex);

            charIndex++;
        }

        textEl.textContent = displayedText;

        // Skip if action pressed mid-typing
        if (consumeAction()) {
            displayedText = currentLine.text;
            charIndex = currentLine.text.length;
            textEl.textContent = displayedText;
        }
    } else {
        // Show continue indicator
        continueEl.style.visibility = 'visible';

        // Advance on action
        if (consumeAction()) {
            // Start music when user clicks to advance past "THE END" or "CREDITS"
            // This happens ON user interaction which bypasses autoplay restrictions
            if (currentLine.text && (currentLine.text.includes('THE END') || currentLine.text.includes('CREDITS'))) {
                startCreditsMusic();
            }
            advanceDialogue();
        }
    }
}


