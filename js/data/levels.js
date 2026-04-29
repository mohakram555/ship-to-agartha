// ========================================
// AGARTHA: FALSE GUIDE - Level Configurations
// Full 30-Level Campaign
// ========================================

// ========================================
// ACT I: THE TEAM (Levels 1-14 with Lyra)
// ========================================

export const LEVELS = {
    1: {
        name: 'Escape',
        gameplayType: 'dodge',
        missionType: 'survive',
        missionTarget: 1,
        timeLimit: 45,
        spawnRate: 0.6,
        difficulty: 1,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'All units, the portal has collapsed. Begin emergency evacuation.' },
            { speaker: 'LYRA', portrait: 'lyra_encouraging', text: "Kael, stay close. I'll guide you through." },
            { speaker: 'LYRA', portrait: 'lyra_focused', text: 'Use arrow keys to move. Collect the glowing cartons for Elixir.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Navigate the debris field. Survive.' }
        ],
        postDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_encouraging', text: 'The Dossam Empire patrols these outer sectors. They hoard all the Elixir.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Without Raw Milk, our Vrill fades. We cannot open the portal home.' }
        ]
    },

    2: {
        name: 'First Patrol',
        gameplayType: 'dodge',
        missionType: 'survive',
        missionTarget: 1,
        timeLimit: 50,
        spawnRate: 0.8,
        difficulty: 1.1,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Dossam patrol ahead. Weapons offline. Evade.' },
            { speaker: 'LYRA', portrait: 'lyra_focused', text: 'The Dossam control all the Elixir routes. We have to slip past.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Avoid detection. Survive the patrol.' }
        ],
        postDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_worried', text: "They're why Agartha sealed itself. The Dossam wanted our Vrill power." }
        ]
    },

    3: {
        name: 'The Elixir',
        gameplayType: 'collect',
        missionType: 'collect',
        missionTarget: 12,
        spawnRate: 1.0,
        difficulty: 1.2,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Supply cache detected. Raw Milk — the Agarthan Elixir.' },
            { speaker: 'LYRA', portrait: 'lyra_encouraging', text: 'This is what powers our Vrill. The Dossam stole it all.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Collect 12 Elixir cartons.' }
        ],
        postDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_focused', text: 'Each carton restores a bit of our power. Enough Elixir, enough Vrill to go home.' }
        ]
    },

    4: {
        name: 'Lessons',
        gameplayType: 'collect',
        missionType: 'collect',
        missionTarget: 15,
        spawnRate: 1.1,
        difficulty: 1.3,
        preDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_encouraging', text: 'Vrill is the energy of Agartha. It flows through us.' },
            { speaker: 'LYRA', portrait: 'lyra_focused', text: "But on the surface, it fades without Elixir. That's why we need the Raw Milk." },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Collect 15 Elixir. Stay focused.' }
        ],
        postDialogue: []
    },

    5: {
        name: 'First Fight',
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 15,
        spawnRate: 0.9,
        difficulty: 1.4,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Weapons online. Dossam interceptors incoming.' },
            { speaker: 'LYRA', portrait: 'lyra_brave', text: "I'll be right beside you. Press SPACE to fire." },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Destroy 15 Dossam ships.' }
        ],
        postDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_encouraging', text: 'The Dossam fear us when we fight back. They know what Vrill can do.' }
        ]
    },

    6: {
        name: 'Supply Run',
        gameplayType: 'collect',
        missionType: 'collect',
        missionTarget: 18,
        spawnRate: 1.2,
        difficulty: 1.5,
        preDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_focused', text: 'More supply caches ahead. We need all we can get.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Collect 18 Elixir.' }
        ],
        postDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_encouraging', text: "You're getting stronger, Kael. I can feel it." }
        ]
    },

    7: {
        name: 'Patrol Assault',
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 12,
        spawnRate: 0.8,
        difficulty: 1.15,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Heavy patrol detected. Engage.' },
            { speaker: 'LYRA', portrait: 'lyra_brave', text: 'Watch their patterns. Strike when they pause.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Destroy 20 Dossam ships.' }
        ],
        postDialogue: []
    },

    8: {
        name: 'Through the Field',
        gameplayType: 'dodge',
        missionType: 'survive',
        missionTarget: 1,
        timeLimit: 40,
        spawnRate: 0.7,
        difficulty: 1.2,
        preDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_worried', text: 'Asteroid field ahead. This will be rough.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Clear the asteroid field. Survive 60 seconds.' }
        ],
        postDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_encouraging', text: 'Excellent flying! Agartha would be proud.' }
        ]
    },

    9: {
        name: 'Growing Threat',
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 14,
        spawnRate: 0.85,
        difficulty: 1.25,
        preDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_worried', text: 'The Dossam are getting more aggressive.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Their emperor is watching. Show no weakness.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Destroy 25 Dossam ships.' }
        ],
        postDialogue: []
    },

    10: {
        name: 'The Blockade',
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 16,
        spawnRate: 0.9,
        difficulty: 1.3,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Major Dossam blockade. This is their stronghold.' },
            { speaker: 'LYRA', portrait: 'lyra_brave', text: "We've trained for this. Let's break through." },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Destroy 30 Dossam ships.' }
        ],
        postDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_worried', text: "Something's wrong. The Dossam know exactly where we're going." }
        ]
    },

    11: {
        name: 'Suspicion',
        gameplayType: 'collect',
        missionType: 'collect',
        missionTarget: 14,
        spawnRate: 0.9,
        difficulty: 1.35,
        preDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_worried', text: 'Kael, I need to tell you something.' },
            { speaker: 'LYRA', portrait: 'lyra_worried', text: "The Dossam... they always seem to know our plans." },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Focus on the mission. Collect 22 Elixir.' }
        ],
        postDialogue: [
            { speaker: 'KAEL', portrait: 'kael_concerned', text: "Lyra, what are you trying to say?" },
            { speaker: 'LYRA', portrait: 'lyra_worried', text: 'Nothing. Just... stay alert.' }
        ]
    },

    12: {
        name: 'Push Forward',
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 18,
        spawnRate: 0.9,
        difficulty: 1.4,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'More interceptors. Push through.' },
            { speaker: 'LYRA', portrait: 'lyra_brave', text: "I've got your back." },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Destroy 32 Dossam ships.' }
        ],
        postDialogue: []
    },

    13: {
        name: 'Gathering Storm',
        gameplayType: 'dodge',
        missionType: 'survive',
        missionTarget: 1,
        timeLimit: 45,
        spawnRate: 0.8,
        difficulty: 1.4,
        preDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_worried', text: 'Massive debris field. Stay sharp!' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Survive the storm. 75 seconds.' }
        ],
        postDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_focused', text: "We're close to something big. I can feel it." }
        ]
    },

    14: {
        name: 'Final Approach',
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 20,
        spawnRate: 0.9,
        difficulty: 1.45,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Scanners show heavy Dossam concentration ahead.' },
            { speaker: 'LYRA', portrait: 'lyra_brave', text: 'Whatever happens, remember what I taught you.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Clear the area. Destroy 35 ships.' }
        ],
        postDialogue: []
    },

    // ========================================
    // LEVEL 15: LYRA'S DEATH
    // ========================================

    15: {
        name: "Lyra's Sacrifice",
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 22,
        spawnRate: 1.0,
        difficulty: 1.5,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'MASSIVE Dossam ambush incoming!' },
            { speaker: 'LYRA', portrait: 'lyra_brave', text: "There's too many! I'll draw them off!" },
            { speaker: 'KAEL', portrait: 'kael_shocked', text: 'Lyra, NO!' },
            { speaker: 'LYRA', portrait: 'lyra_brave', text: 'You have to survive! GO!' }
        ],
        postDialogue: [
            { speaker: 'LYRA', portrait: 'lyra_final', text: "You're stronger than you know. Your Vrill... you're special." },
            { speaker: 'LYRA', portrait: 'lyra_final', text: 'Remember Agartha for me.' },
            { speaker: 'KAEL', portrait: 'kael_grief', text: 'LYRA!!!' },
            { speaker: 'SAEL', portrait: 'sael_sympathetic', text: "She's gone. The Dossam... they will pay for this." },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Her mission is now yours. We continue.' }
        ],
        storyEvent: 'lyra_death'
    },

    // ========================================
    // ACT II: UNDER SAEL (Levels 16-24)
    // ========================================

    16: {
        name: 'Alone',
        gameplayType: 'collect',
        missionType: 'collect',
        missionTarget: 16,
        spawnRate: 0.9,
        difficulty: 1.5,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_sympathetic', text: 'Grief is natural. But the Dossam do not pause.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Collect 25 Elixir. Your Vrill must grow.' }
        ],
        postDialogue: [
            { speaker: 'KAEL', portrait: 'kael_rage', text: 'I want to destroy every Dossam ship I see.' },
            { speaker: 'SAEL', portrait: 'sael_encouraging', text: 'Good. That anger strengthens your Vrill.' }
        ]
    },

    17: {
        name: 'Rage',
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 24,
        spawnRate: 1.0,
        difficulty: 1.55,
        preDialogue: [
            { speaker: 'KAEL', portrait: 'kael_rage', text: 'More Dossam. GOOD.' },
            { speaker: 'SAEL', portrait: 'sael_encouraging', text: 'Channel that anger. Mission: Destroy 45 ships.' }
        ],
        postDialogue: []
    },

    18: {
        name: 'No Mercy',
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 26,
        spawnRate: 1.0,
        difficulty: 1.6,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_encouraging', text: 'Your Vrill grows stronger with each battle.' },
            { speaker: 'KAEL', portrait: 'kael_rage', text: 'Good. I need more power to make them pay.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Destroy 48 ships.' }
        ],
        postDialogue: []
    },

    19: {
        name: 'Deep Strike',
        gameplayType: 'collect',
        missionType: 'collect',
        missionTarget: 18,
        spawnRate: 0.95,
        difficulty: 1.65,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Major Elixir cache ahead. Take it all.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Collect 28 Elixir.' }
        ],
        postDialogue: []
    },

    20: {
        name: 'Power Surge',
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 28,
        spawnRate: 1.05,
        difficulty: 1.7,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_encouraging', text: 'Your Vrill is on the verge of awakening fully.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Destroy 50 Dossam. Unleash your power.' }
        ],
        postDialogue: [
            { speaker: 'KAEL', portrait: 'kael_shocked', text: "This power... I've never felt anything like it." },
            { speaker: 'SAEL', portrait: 'sael_encouraging', text: 'Your Vrill has awakened. You can open the portal now.' }
        ],
        storyEvent: 'vrill_awakened'
    },

    21: {
        name: 'Strange Silence',
        gameplayType: 'dodge',
        missionType: 'survive',
        missionTarget: 1,
        timeLimit: 45,
        spawnRate: 0.85,
        difficulty: 1.7,
        preDialogue: [
            { speaker: 'KAEL', portrait: 'kael_concerned', text: "Something's different. Less fire." },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'They fear you. Proceed to the gate.' }
        ],
        postDialogue: []
    },

    22: {
        name: 'Escort',
        gameplayType: 'dodge',
        missionType: 'survive',
        missionTarget: 1,
        timeLimit: 40,
        spawnRate: 0.8,
        difficulty: 1.7,
        preDialogue: [
            { speaker: 'KAEL', portrait: 'kael_concerned', text: "They're... escorting us?" },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'They know better than to attack you now.' }
        ],
        postDialogue: []
    },

    23: {
        name: 'Memory',
        gameplayType: 'collect',
        missionType: 'collect',
        missionTarget: 18,
        spawnRate: 0.9,
        difficulty: 1.75,
        preDialogue: [
            { speaker: 'KAEL', portrait: 'kael_concerned', text: 'Lyra would have loved to see this much Elixir.' },
            { speaker: 'SAEL', portrait: 'sael_sympathetic', text: 'Honor her by completing our mission.' },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Mission: Collect 30 Elixir.' }
        ],
        postDialogue: []
    },

    24: {
        name: 'Gate Approach',
        gameplayType: 'dodge',
        missionType: 'survive',
        missionTarget: 1,
        timeLimit: 50,
        spawnRate: 0.9,
        difficulty: 1.8,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'The gate coordinates are near. Proceed.' },
            { speaker: 'KAEL', portrait: 'kael_concerned', text: "The Dossam aren't even attacking anymore." },
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'They fear your awakened Vrill. Continue.' }
        ],
        postDialogue: []
    },

    // ========================================
    // LEVEL 25: THE BETRAYAL
    // ========================================

    25: {
        name: 'The Betrayal',
        gameplayType: 'dodge',
        missionType: 'survive',
        missionTarget: 1,
        timeLimit: 55,
        spawnRate: 1.0,
        difficulty: 1.85,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_authoritative', text: 'Coordinates reached. Well done, Key.' },
            { speaker: 'KAEL', portrait: 'kael_concerned', text: 'Key?' },
            { speaker: 'SAEL', portrait: 'sael_mocking', text: 'You have served your purpose perfectly.' },
            { speaker: 'KAEL', portrait: 'kael_shocked', text: 'Sael?!' }
        ],
        postDialogue: [
            { speaker: 'SAEL', portrait: 'sael_commanding', text: 'I am Sael. Emperor of the Dossam Empire.' },
            { speaker: 'KAEL', portrait: 'kael_rage', text: 'YOU ordered them to kill Lyra!' },
            { speaker: 'SAEL', portrait: 'sael_mocking', text: "Of course. She was protecting you too well. You needed to be hardened." },
            { speaker: 'SAEL', portrait: 'sael_commanding', text: 'Only an Agarthan with awakened Vrill can open the portal. I cannot.' },
            { speaker: 'SAEL', portrait: 'sael_commanding', text: 'My Dossam have hoarded the Elixir for centuries, waiting for this moment.' },
            { speaker: 'KAEL', portrait: 'kael_rage', text: "I'LL DESTROY YOU!" },
            { speaker: 'SAEL', portrait: 'sael_mocking', text: 'Pathetic. But first... open my door to Agartha.' }
        ],
        storyEvent: 'sael_revealed'
    },

    // ========================================
    // ACT III: REVENGE (Levels 26-30)
    // ========================================

    26: {
        name: 'Escape',
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 22,
        spawnRate: 1.0,
        difficulty: 1.85,
        preDialogue: [
            { speaker: 'KAEL', portrait: 'kael_awakened', text: 'I have to get out of here!' }
        ],
        postDialogue: [
            { speaker: 'UNKNOWN', portrait: null, text: "Agarthan! We will help you!" },
            { speaker: 'KAEL', portrait: 'kael_shocked', text: 'Who?' },
            { speaker: 'UNKNOWN', portrait: null, text: "The Emperor has lied to us. We are rogues now. Fight!" }
        ]
    },

    27: {
        name: 'Rogue Allies',
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 24,
        spawnRate: 1.05,
        difficulty: 1.9,
        preDialogue: [
            { speaker: 'UNKNOWN', portrait: null, text: 'The loyal Dossam are pursuing. We will cover you.' },
            { speaker: 'KAEL', portrait: 'kael_awakened', text: 'Sael will answer for everything.' },
            { speaker: 'UNKNOWN', portrait: null, text: 'Then destroy his forces. We fight together.' }
        ],
        postDialogue: []
    },

    28: {
        name: 'Gate Chase',
        gameplayType: 'dodge',
        missionType: 'survive',
        missionTarget: 1,
        timeLimit: 55,
        spawnRate: 1.0,
        difficulty: 1.9,
        preDialogue: [
            { speaker: 'UNKNOWN', portrait: null, text: 'The Emperor is fleeing to the main gate!' },
            { speaker: 'KAEL', portrait: 'kael_awakened', text: 'He CANNOT escape.' }
        ],
        postDialogue: []
    },

    29: {
        name: 'Through the Armada',
        gameplayType: 'shooter',
        missionType: 'destroy',
        missionTarget: 28,
        spawnRate: 1.1,
        difficulty: 1.95,
        preDialogue: [
            { speaker: 'KAEL', portrait: 'kael_awakened', text: "Sael's personal guard. This is it." },
            { speaker: 'UNKNOWN', portrait: null, text: 'Clear them. Reach the Emperor.' }
        ],
        postDialogue: [
            { speaker: 'KAEL', portrait: 'kael_awakened', text: "Sael... you're going to pay for what you did to Lyra." }
        ]
    },

    // ========================================
    // LEVEL 30: FINAL BOSS
    // ========================================

    30: {
        name: 'Final Battle',
        gameplayType: 'boss',
        missionType: 'boss',
        missionTarget: 1,
        spawnRate: 0.2,
        difficulty: 2.0,
        bossHealth: 80,
        preDialogue: [
            { speaker: 'SAEL', portrait: 'sael_commanding', text: 'You actually made it here. Impressive.' },
            { speaker: 'KAEL', portrait: 'kael_awakened', text: 'This ends NOW, Sael.' },
            { speaker: 'SAEL', portrait: 'sael_mocking', text: 'You were just a key! A tool!' },
            { speaker: 'KAEL', portrait: 'kael_awakened', text: "Lyra's Vrill is with me. You LOSE." },
            { speaker: 'SAEL', portrait: 'sael_enraged', text: 'THEN DIE!' }
        ],
        postDialogue: [
            { speaker: 'SAEL', portrait: 'sael_defeated', text: 'Impossible... The Vrill... it chose YOU?' },
            { speaker: 'KAEL', portrait: 'kael_awakened', text: 'It was never yours to control.' },
            { speaker: 'SAEL', portrait: 'sael_defeated', text: 'Without me... the Dossam will fall... everything I built...' },
            { speaker: 'KAEL', portrait: 'kael_awakened', text: 'Good.' },
            { speaker: 'SYSTEM', portrait: null, text: '...' },
            { speaker: 'SYSTEM', portrait: null, text: 'The portal to Agartha opens before you...' },
            { speaker: 'KAEL', portrait: 'kael_shocked', text: 'This light... it feels familiar...' },
            { speaker: '???', portrait: 'lyra_final', text: 'Kael...' },
            { speaker: 'KAEL', portrait: 'kael_shocked', text: 'That voice... no... it cannot be...' },
            { speaker: 'LYRA', portrait: 'lyra_encouraging', text: 'The Vrill brought me here. I have been waiting for you.' },
            { speaker: 'KAEL', portrait: 'kael_grief', text: 'LYRA! I thought... I thought I lost you forever!' },
            { speaker: 'LYRA', portrait: 'lyra_encouraging', text: 'You never lost me. I was always with you, guiding your Vrill.' },
            { speaker: 'LYRA', portrait: 'lyra_brave', text: 'Sael could not understand. The Vrill does not destroy — it transforms.' },
            { speaker: 'KAEL', portrait: 'kael_awakened', text: 'We made it. We actually made it to Agartha.' },
            { speaker: 'LYRA', portrait: 'lyra_encouraging', text: 'Welcome home, Kael. Welcome home.' },
            { speaker: 'SYSTEM', portrait: null, text: 'THE END' },
            { speaker: 'SYSTEM', portrait: null, text: '[ CREDITS ]' }
        ],
        storyEvent: 'game_complete'
    }
};

// ========================================
// Helper Functions
// ========================================

export function getLevelConfig(levelNum) {
    return LEVELS[levelNum] || null;
}

export function getTotalLevels() {
    return Object.keys(LEVELS).length;
}

// Calculate difficulty multipliers
export function getDifficultyMultiplier(levelNum) {
    const config = LEVELS[levelNum];
    return config ? config.difficulty : 1;
}
