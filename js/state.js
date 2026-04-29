// ========================================
// AGARTHA: FALSE GUIDE - Game State
// ========================================

export const GameState = {
    // Current scene
    scene: 'menu', // menu, story, dodge, shooter, boss

    // Player stats
    player: {
        health: 3,
        maxHealth: 3,
        elixir: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        width: 50,
        height: 60,
        invincible: false,
        invincibleTimer: 0
    },

    // Upgrades
    upgrades: {
        speed: 0,       // +10% speed per level
        fireRate: 0,    // -10% Cooldown per level
        magnet: 0,      // +20px pickup range per level
        shield: 0       // +5% damage resistance per level
    },

    // Level progress
    currentLevel: 1,
    maxLevel: 30,
    maxLevelReached: 1,
    levelComplete: false,

    // Mission tracking
    mission: {
        type: 'survive', // survive, collect, destroy, flawless
        target: 0,
        current: 0,
        timeLimit: 0,
        timeElapsed: 0
    },

    // Story progress
    story: {
        dialogueIndex: 0,
        lyraAlive: true,
        saelRevealed: false,
        vrillAwakened: false
    },

    // Game entities
    entities: {
        enemies: [],
        projectiles: [],
        collectibles: [],
        obstacles: [],
        powerups: [] // New: Power-Up Items
    },

    // Active Power-Up Effects
    activeEffects: {
        speed: 0,
        shield: 0,
        fireRate: 0,
        triple: 0,
        homing: 0,
        heartPlusOne: false
    },

    // Bottom shield (defense line)
    shield: {
        current: 100,
        max: 100,
        flashTimer: 0
    },

    // Flags
    paused: false,
    gameOver: false
};

// ========================================
// Save / Load System
// ========================================

const SAVE_KEY = 'agartha_save';

export function saveGame() {
    // Update max level reached
    if (GameState.currentLevel > GameState.maxLevelReached) {
        GameState.maxLevelReached = GameState.currentLevel;
    }

    const saveData = {
        currentLevel: GameState.currentLevel,
        maxLevelReached: GameState.maxLevelReached,
        elixir: GameState.player.elixir,
        upgrades: { ...GameState.upgrades },
        story: { ...GameState.story },
        timestamp: Date.now()
    };

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        console.log('Game saved');
        return true;
    } catch (e) {
        console.error('Failed to save:', e);
        return false;
    }
}

export function loadGame() {
    try {
        const data = localStorage.getItem(SAVE_KEY);
        if (!data) return null;

        const saveData = JSON.parse(data);
        console.log('Game loaded');

        // Apply loaded data to GameState
        GameState.currentLevel = saveData.currentLevel;
        GameState.maxLevelReached = saveData.maxLevelReached || 1;
        GameState.player.elixir = saveData.elixir;
        GameState.upgrades = saveData.upgrades || { speed: 0, fireRate: 0, magnet: 0, shield: 0 };

        // Ensure shield upgrade exists if loading old save
        if (typeof GameState.upgrades.shield === 'undefined') {
            GameState.upgrades.shield = 0;
        }

        GameState.story = saveData.story;

        return saveData;
    } catch (e) {
        console.error('Failed to load:', e);
        return null;
    }
}

export function hasSaveData() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
}

// ========================================
// State Reset Functions
// ========================================

export function resetPlayer() {
    GameState.player.health = GameState.player.maxHealth;
    GameState.player.x = 0;
    GameState.player.y = 0;
    GameState.player.vx = 0;
    GameState.player.vy = 0;
    GameState.player.invincible = false;
    GameState.player.invincibleTimer = 0;
}

export function resetLevel() {
    resetPlayer();
    GameState.levelComplete = false;
    GameState.mission.current = 0;
    GameState.mission.timeElapsed = 0;
    GameState.entities.enemies = [];
    GameState.entities.projectiles = [];
    GameState.entities.collectibles = [];
    GameState.entities.obstacles = [];
    GameState.entities.powerups = [];

    // Clear active effects (Round end)
    GameState.activeEffects = {
        speed: 0,
        shield: 0,
        fireRate: 0,
        triple: 0,
        homing: 0,
        heartPlusOne: false
    };

    GameState.shield.current = GameState.shield.max;
    GameState.shield.flashTimer = 0;
    GameState.paused = false;
    GameState.gameOver = false;
}

export function resetGame() {
    GameState.currentLevel = 1;
    GameState.maxLevelReached = 1;
    GameState.player.elixir = 0;
    GameState.upgrades = { speed: 0, fireRate: 0, magnet: 0, shield: 0 };
    GameState.story.dialogueIndex = 0;
    GameState.story.lyraAlive = true;
    GameState.story.saelRevealed = false;
    GameState.story.vrillAwakened = false;
    resetLevel();
}
