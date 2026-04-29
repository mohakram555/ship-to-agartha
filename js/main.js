// ========================================
// AGARTHA: FALSE GUIDE - Main Entry
// ========================================

import { GameState, saveGame, loadGame, hasSaveData, resetLevel, resetGame } from './state.js';
import { Input, initInput, consumeAction, consumePause, resetInput, pollGamepad, VibrationPatterns, isControllerConnected } from './input.js';
import { PowerUpManager } from './entities/powerups.js';
import { initRenderer, clear, drawBackground, drawPlayer, drawEnemy, drawProjectile, drawCollectible, drawPowerUp, drawObstacle, drawBoss, getCanvasSize, drawText, generateObstacleVertices } from './renderer.js';
import { LEVELS, getLevelConfig, getDifficultyMultiplier, getTotalLevels } from './data/levels.js';
import { showDialogue, updateDialogue, isDialogueActive, hideDialogue } from './scenes/story.js';
import { AudioManager } from './audio.js';
import { SpatialHashGrid } from './spatial.js';

// ========================================
// Game Constants (modifiable via Dev Tools)
// ========================================

let BASE_PLAYER_SPEED = 280;
let MAX_VELOCITY = 500;
let BASE_FIRE_RATE = 0.3;
let BASE_PICKUP_RANGE = 45;
let ASTEROID_SPEED_MULT = 1.0;
let ENEMY_SPEED_MULT = 1.0;
let SPAWN_RATE_MULT = 1.0;
let PLAYER_INVINCIBLE = false;

// Collision radius constants
const COLLISION_RADIUS = {
    POWERUP: 40,
    COLLECTIBLE: 45,
    ENEMY: 35,
    PROJECTILE: 25,
    BOSS: 50,
    BOSS_BODY: 55
};

// Asteroid splitting constants
const ASTEROID_SPLIT_THRESHOLD = 20;
const ASTEROID_SPLIT_MULTIPLIER = 0.5;
const ASTEROID_SPEED_BOOST = 1.2;

// ========================================
// Settings
// ========================================

let slideFactor = 0.3;
let currentTheme = 'default';
const THEMES = ['default', 'cyberpunk', 'minimalist', 'deepspace', 'retro', 'glass'];

function loadSettings() {
    const saved = localStorage.getItem('agartha_settings');
    if (saved) {
        const settings = JSON.parse(saved);
        slideFactor = settings.slideFactor ?? 0.3;
        currentTheme = settings.theme || 'default';
    }
}

function saveSettings() {
    localStorage.setItem('agartha_settings', JSON.stringify({ slideFactor, theme: currentTheme }));
}

function applyTheme(themeName) {
    // Remove all theme classes
    document.body.classList.remove(...THEMES.map(t => `theme-${t}`));

    if (themeName && themeName !== 'default') {
        document.body.classList.add(`theme-${themeName}`);
    }

    currentTheme = themeName;
    saveSettings();
}

// ========================================
// DOM Elements  
// ========================================

let canvas, ctx;
let menuOverlay, loadingOverlay, hudElement, dialogueBox;
let btnStart, btnContinue, btnLevels, btnUpgrades;
let levelSelectOverlay, upgradesOverlay, creditsOverlay, pauseOverlay;
let victoryOverlay = null;
let bossHealthBar = null;
let btnPause = null;

let spatialGrid = null;

// ========================================
// Boss State
// ========================================

let boss = null;

function createBoss() {
    const { width } = getCanvasSize();
    boss = {
        x: width / 2,
        y: 190,
        width: 80,
        height: 100,
        health: 100,
        maxHealth: 100,
        phase: 1,
        moveTimer: 0,
        shootTimer: 0,
        patternTimer: 0,
        direction: 1,
        vulnerable: true,
        flashTimer: 0
    };
}

// ========================================
// Initialization
// ========================================

async function init() {
    console.log('Initializing AGARTHA: FALSE GUIDE');

    loadSettings();
    applyTheme(currentTheme);

    // Get DOM elements
    menuOverlay = document.getElementById('menu-overlay');
    loadingOverlay = document.getElementById('loading-overlay');
    hudElement = document.getElementById('hud');
    dialogueBox = document.getElementById('dialogue-box');
    levelSelectOverlay = document.getElementById('level-select-overlay');
    upgradesOverlay = document.getElementById('upgrades-overlay');
    creditsOverlay = document.getElementById('credits-overlay');
    pauseOverlay = document.getElementById('pause-overlay');

    // Buttons
    btnStart = document.getElementById('btn-start');
    btnContinue = document.getElementById('btn-continue');
    btnLevels = document.getElementById('btn-levels');
    btnUpgrades = document.getElementById('btn-upgrades');
    btnPause = document.getElementById('btn-pause');

    // Navigation Back Buttons
    document.getElementById('btn-level-back').addEventListener('click', showMainMenu);
    document.getElementById('btn-shop-back').addEventListener('click', () => {
        upgradesOverlay.classList.add('hidden');
        if (shopOpenedFromVictory) {
            victoryOverlay.classList.remove('hidden');
        } else {
            showMainMenu();
        }
    });
    document.getElementById('btn-credits-menu').addEventListener('click', showMainMenu);

    // Pause Menu Buttons
    document.getElementById('btn-resume').addEventListener('click', togglePause);
    document.getElementById('btn-restart').addEventListener('click', () => {
        togglePause();
        startLevel(GameState.currentLevel);
    });
    document.getElementById('btn-quit').addEventListener('click', () => {
        togglePause();
        showMainMenu();
    });

    if (btnPause) {
        btnPause.addEventListener('click', togglePause);
    }

    // Upgrade buttons
    document.getElementById('btn-buy-speed').addEventListener('click', () => buyUpgrade('speed'));
    document.getElementById('btn-buy-fire').addEventListener('click', () => buyUpgrade('fireRate'));
    document.getElementById('btn-buy-magnet').addEventListener('click', () => buyUpgrade('magnet'));
    document.getElementById('btn-buy-shield').addEventListener('click', () => buyUpgrade('shield'));

    // Create overlays and UI
    createVictoryOverlay();
    createBossHealthBar();
    createDevTools();

    // Initialize systems
    const renderer = initRenderer();
    canvas = renderer.canvas;
    ctx = renderer.ctx;

    // Initialize Spatial Grid (Cell size 150 seems good for 800x600 with objects ~50px)
    spatialGrid = new SpatialHashGrid(canvas.width, canvas.height, 150);

    initInput(canvas);

    // Setup menu buttons
    btnStart.addEventListener('click', startNewGame);
    btnContinue.addEventListener('click', continueGame);
    btnLevels.addEventListener('click', showLevelSelect);
    btnUpgrades.addEventListener('click', () => showUpgrades(false));

    // Setup Save Data
    if (hasSaveData()) {
        loadGame(); // Load immediately to unlock buttons
        btnContinue.classList.remove('hidden');
        btnLevels.classList.remove('hidden');
        btnUpgrades.classList.remove('hidden');
    }

    // Preload assets
    await preloadAssets();

    // Hide loading, show menu
    loadingOverlay.classList.add('hidden');

    // Start game loop
    requestAnimationFrame(gameLoop);

    // Initialize audio system
    await AudioManager.init();

    // Play menu music on first user interaction (browser autoplay policy)
    const enableAudio = () => {
        AudioManager.resume();
        if (GameState.scene === 'menu') {
            AudioManager.playMusic('menu');
        }
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('keydown', enableAudio);
        document.removeEventListener('touchstart', enableAudio);
    };
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    document.addEventListener('touchstart', enableAudio);
}

// ========================================
// UI & Menu Functions
// ========================================

function showMainMenu() {
    menuOverlay.classList.remove('hidden');
    levelSelectOverlay.classList.add('hidden');
    upgradesOverlay.classList.add('hidden');
    creditsOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    hudElement.classList.add('hidden');

    if (btnPause) btnPause.classList.add('hidden');

    GameState.scene = 'menu';
    GameState.paused = false;

    // Stop credits music if playing and play menu music
    import('./scenes/story.js').then(module => {
        if (module.resetCreditsMusic) module.resetCreditsMusic();
    });
    AudioManager.playMusic('menu');

    if (hasSaveData()) {
        btnContinue.classList.remove('hidden');
        btnLevels.classList.remove('hidden');
        btnUpgrades.classList.remove('hidden');
    }
}

function showCredits() {
    hudElement.classList.add('hidden');
    if (menuOverlay) menuOverlay.classList.add('hidden');
    if (victoryOverlay) victoryOverlay.classList.add('hidden');
    if (creditsOverlay) creditsOverlay.classList.remove('hidden');

    // Reset animation
    const content = creditsOverlay.querySelector('.credits-content');
    if (content) {
        content.style.animation = 'none';
        content.offsetHeight; /* trigger reflow */
        content.style.animation = '';
    }

    // Show the return button (appears after animation delay in CSS)
    const btn = document.getElementById('btn-credits-menu');
    if (btn) {
        btn.classList.remove('hidden');
        btn.style.animation = 'none';
        btn.offsetHeight;
        btn.style.animation = '';
    }
}

function showLevelSelect() {
    menuOverlay.classList.add('hidden');
    levelSelectOverlay.classList.remove('hidden');

    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';

    const totalLevels = getTotalLevels();
    const maxReached = GameState.maxLevelReached || 1;

    for (let i = 1; i <= totalLevels; i++) {
        const btn = document.createElement('div');
        btn.className = `level-btn ${i > maxReached ? 'locked' : ''}`;
        btn.textContent = i;

        if (i <= maxReached) {
            btn.addEventListener('click', () => {
                levelSelectOverlay.classList.add('hidden');
                hudElement.classList.remove('hidden');
                startLevel(i);
            });
        }

        grid.appendChild(btn);
    }
}

// Flag to track navigation
let shopOpenedFromVictory = false;

function showUpgrades(fromVictory = false) {
    shopOpenedFromVictory = fromVictory;
    menuOverlay.classList.add('hidden');

    if (fromVictory) {
        victoryOverlay.classList.add('hidden');
    }

    upgradesOverlay.classList.remove('hidden');
    updateUpgradeUI();
}

function updateUpgradeUI() {
    const u = GameState.upgrades;
    const stats = {
        speed: { cost: 10 * (u.speed + 1), max: 10 },
        fireRate: { cost: 15 * (u.fireRate + 1), max: 10 },
        magnet: { cost: 12 * (u.magnet + 1), max: 10 },
        shield: { cost: 20 * (u.shield + 1), max: 10 }
    };

    document.getElementById('shop-elixir').textContent = GameState.player.elixir;

    // Update Upgrade Items
    ['speed', 'fireRate', 'magnet', 'shield'].forEach(type => {
        const lvl = u[type];
        const cost = stats[type].cost;
        const btn = document.getElementById(`btn-buy-${type === 'fireRate' ? 'fire' : type}`);
        const lvlLabel = document.getElementById(`lvl-${type === 'fireRate' ? 'fire' : type}`);

        lvlLabel.textContent = lvl;

        if (lvl >= stats[type].max) {
            btn.textContent = 'MAX';
            btn.disabled = true;
        } else {
            btn.textContent = `Buy (${cost})`;
            btn.disabled = GameState.player.elixir < cost;
        }
    });
}

function buyUpgrade(type) {
    const u = GameState.upgrades;
    let cost = 0;

    if (type === 'speed') cost = 10 * (u.speed + 1);
    if (type === 'fireRate') cost = 15 * (u.fireRate + 1);
    if (type === 'magnet') cost = 12 * (u.magnet + 1);
    if (type === 'shield') cost = 20 * (u.shield + 1);

    if (GameState.player.elixir >= cost && u[type] < 10) {
        GameState.player.elixir -= cost;
        u[type]++;
        saveGame();
        updateUpgradeUI();

        // Visual feedback
        const btn = document.getElementById(`btn-buy-${type === 'fireRate' ? 'fire' : type}`);
        const originalText = btn.textContent;
        btn.textContent = 'BOUGHT!';
        setTimeout(() => updateUpgradeUI(), 500);
    }
}

// ========================================
// Pause Functions
// ========================================

function togglePause() {
    if (GameState.scene === 'menu' || GameState.gameOver || GameState.levelComplete) return;

    GameState.paused = !GameState.paused;

    if (GameState.paused) {
        pauseOverlay.classList.remove('hidden');
    } else {
        pauseOverlay.classList.add('hidden');
    }
}

// ========================================
// Dev Tools Panel
// ========================================

function createDevTools() {
    const devPanel = document.createElement('div');
    devPanel.id = 'dev-tools';
    const iconStyle = 'width:14px;height:14px;margin-right:4px;vertical-align:middle;display:inline-block;';
    const devIcon = `<svg style="${iconStyle}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;
    const paintIcon = `<svg style="${iconStyle}" viewBox="0 0 24 24" fill="none" stroke="#ff6666" stroke-width="2" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`;
    const boltIcon = `<svg style="${iconStyle}" viewBox="0 0 24 24" fill="none" stroke="#ff6666" stroke-width="2" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
    const mapIcon = `<svg style="${iconStyle}" viewBox="0 0 24 24" fill="none" stroke="#ff6666" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    const milkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#00ffff" aria-hidden="true"><path d="M12 2l6 6v14H6V8l6-6z"></path><path d="M8 10h8v3H8z" fill="#fffacd"></path></svg>`;
    const prevIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    const nextIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    const refreshIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`;
    const checkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    devPanel.innerHTML = `
        <button id="dev-toggle" class="hidden">${devIcon} DEV</button>
        <div id="dev-content" class="hidden">
            <h3>${paintIcon} Visuals</h3>
            <div class="dev-row">
                <button id="dev-milk" class="dev-btn-full">${milkIcon} +100 Milk</button>
            </div>
            <div class="dev-row">
                <label>Theme</label>
                <select id="dev-theme" style="width: 100%; background: #333; color: #fff; border: 1px solid #555; padding: 4px;">
                    <option value="default">Default</option>
                    <option value="cyberpunk">Cyberpunk Neon</option>
                    <option value="minimalist">Minimalist Light</option>
                    <option value="deepspace">Deep Space</option>
                    <option value="retro">Retro Arcade</option>
                    <option value="glass">Glassmorphism</option>
                </select>
            </div>

            <h3>${boltIcon} Game Balance</h3>
            
            <div class="dev-row">
                <label>Player Speed: <span id="dev-speed-val">${BASE_PLAYER_SPEED}</span></label>
                <input type="range" id="dev-speed" min="100" max="600" value="${BASE_PLAYER_SPEED}">
            </div>
            
            <div class="dev-row">
                <label>Max Velocity: <span id="dev-maxvel-val">${MAX_VELOCITY}</span></label>
                <input type="range" id="dev-maxvel" min="200" max="1000" value="${MAX_VELOCITY}">
            </div>
            
            <div class="dev-row">
                <label>Fire Rate: <span id="dev-fire-val">${BASE_FIRE_RATE.toFixed(2)}s</span></label>
                <input type="range" id="dev-fire" min="1" max="100" value="${BASE_FIRE_RATE * 100}">
            </div>
            
            <div class="dev-row">
                <label>Pickup Range: <span id="dev-pickup-val">${BASE_PICKUP_RANGE}px</span></label>
                <input type="range" id="dev-pickup" min="20" max="200" value="${BASE_PICKUP_RANGE}">
            </div>
            
            <div class="dev-row">
                <label>Asteroid Speed: <span id="dev-asteroid-val">${ASTEROID_SPEED_MULT.toFixed(1)}x</span></label>
                <input type="range" id="dev-asteroid" min="5" max="30" value="${ASTEROID_SPEED_MULT * 10}">
            </div>
            
            <div class="dev-row">
                <label>Enemy Speed: <span id="dev-enemy-val">${ENEMY_SPEED_MULT.toFixed(1)}x</span></label>
                <input type="range" id="dev-enemy" min="5" max="30" value="${ENEMY_SPEED_MULT * 10}">
            </div>
            
            <div class="dev-row">
                <label>Spawn Rate: <span id="dev-spawn-val">${SPAWN_RATE_MULT.toFixed(1)}x</span></label>
                <input type="range" id="dev-spawn" min="5" max="50" value="${SPAWN_RATE_MULT * 10}">
            </div>
            
            <div class="dev-row">
                <label><input type="checkbox" id="dev-invincible"> God Mode</label>
            </div>
            
            <h3>${mapIcon} Level Control</h3>
            <div class="dev-level-row">
                <button id="dev-prev-lvl">${prevIcon} Prev</button>
                <span id="dev-current-lvl">Level ${GameState.currentLevel}</span>
                <button id="dev-next-lvl">Next ${nextIcon}</button>
            </div>
            <button id="dev-restart-lvl" class="dev-btn-full">${refreshIcon} Restart Level</button>
            <button id="dev-complete-lvl" class="dev-btn-full">${checkIcon} Complete Level</button>
        </div>
    `;
    document.getElementById('game-container').appendChild(devPanel);

    // Styles
    const style = document.createElement('style');
    style.textContent = `
        #dev-tools {
            position: absolute;
            top: 60px;
            right: 15px;
            z-index: 300;
        }
        #dev-toggle {
            background: rgba(100, 0, 0, 0.8);
            border: 2px solid #ff4444;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 14px;
            color: #fff;
            cursor: pointer;
        }
        #dev-toggle:hover { background: rgba(150, 0, 0, 0.9); }
        #dev-content {
            background: rgba(20, 0, 0, 0.95);
            border: 2px solid #ff4444;
            border-radius: 8px;
            padding: 15px;
            margin-top: 8px;
            width: 260px;
            max-height: 70vh;
            overflow-y: auto;
        }
        #dev-content h3 {
            color: #ff6666;
            font-size: 14px;
            margin: 10px 0 8px 0;
            border-bottom: 1px solid #ff4444;
            padding-bottom: 4px;
        }
        #dev-content h3:first-child { margin-top: 0; }
        .dev-row {
            margin-bottom: 10px;
        }
        .dev-row label {
            color: #ccc;
            font-size: 12px;
            display: block;
            margin-bottom: 4px;
        }
        .dev-row input[type="range"] {
            width: 100%;
            cursor: pointer;
        }
        .dev-row input[type="checkbox"] {
            margin-right: 6px;
        }
        .dev-level-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
        }
        .dev-level-row button {
            background: #333;
            border: 1px solid #666;
            color: #fff;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
        }
        .dev-level-row button:hover { background: #444; }
        #dev-current-lvl {
            color: #ffd700;
            font-weight: bold;
        }
        .dev-btn-full {
            width: 100%;
            background: #333;
            border: 1px solid #666;
            color: #fff;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 6px;
        }
        .dev-btn-full:hover { background: #444; }
    `;
    document.head.appendChild(style);

    // Toggle panel
    document.getElementById('dev-toggle').addEventListener('click', () => {
        document.getElementById('dev-content').classList.toggle('hidden');
        updateDevLevelDisplay();
    });

    // Milk Button
    document.getElementById('dev-milk').addEventListener('click', () => {
        GameState.player.elixir += 100;
        updateHUD();
    });

    // Unlock logic
    let devClickTimes = [];
    const hudMission = document.getElementById('hud-mission');
    if (hudMission) {
        hudMission.addEventListener('click', () => {
            const now = Date.now();
            devClickTimes.push(now);
            // Keep clicks within last 3 seconds
            devClickTimes = devClickTimes.filter(t => now - t < 3000);

            if (devClickTimes.length >= 3) {
                document.getElementById('dev-toggle').classList.remove('hidden');
            }
        });
    }

    // Theme Selector
    const themeSelect = document.getElementById('dev-theme');
    if (themeSelect) {
        themeSelect.value = currentTheme;
        themeSelect.addEventListener('change', (e) => {
            applyTheme(e.target.value);
        });
    }

    // Slider events
    document.getElementById('dev-speed').addEventListener('input', (e) => {
        BASE_PLAYER_SPEED = parseInt(e.target.value);
        document.getElementById('dev-speed-val').textContent = BASE_PLAYER_SPEED;
    });

    document.getElementById('dev-maxvel').addEventListener('input', (e) => {
        MAX_VELOCITY = parseInt(e.target.value);
        document.getElementById('dev-maxvel-val').textContent = MAX_VELOCITY;
    });

    document.getElementById('dev-fire').addEventListener('input', (e) => {
        BASE_FIRE_RATE = parseInt(e.target.value) / 100;
        document.getElementById('dev-fire-val').textContent = BASE_FIRE_RATE.toFixed(2) + 's';
    });

    document.getElementById('dev-pickup').addEventListener('input', (e) => {
        BASE_PICKUP_RANGE = parseInt(e.target.value);
        document.getElementById('dev-pickup-val').textContent = BASE_PICKUP_RANGE + 'px';
    });

    document.getElementById('dev-asteroid').addEventListener('input', (e) => {
        ASTEROID_SPEED_MULT = parseInt(e.target.value) / 10;
        document.getElementById('dev-asteroid-val').textContent = ASTEROID_SPEED_MULT.toFixed(1) + 'x';
    });

    document.getElementById('dev-enemy').addEventListener('input', (e) => {
        ENEMY_SPEED_MULT = parseInt(e.target.value) / 10;
        document.getElementById('dev-enemy-val').textContent = ENEMY_SPEED_MULT.toFixed(1) + 'x';
    });

    document.getElementById('dev-spawn').addEventListener('input', (e) => {
        SPAWN_RATE_MULT = parseInt(e.target.value) / 10;
        document.getElementById('dev-spawn-val').textContent = SPAWN_RATE_MULT.toFixed(1) + 'x';
    });

    document.getElementById('dev-invincible').addEventListener('change', (e) => {
        PLAYER_INVINCIBLE = e.target.checked;
        if (PLAYER_INVINCIBLE) {
            GameState.player.invincible = true;
            GameState.player.invincibleTimer = 999999;
        }
    });

    // Level controls
    document.getElementById('dev-prev-lvl').addEventListener('click', () => {
        if (GameState.currentLevel > 1) {
            startLevel(GameState.currentLevel - 1);
            updateDevLevelDisplay();
        }
    });

    document.getElementById('dev-next-lvl').addEventListener('click', () => {
        if (GameState.currentLevel < getTotalLevels()) {
            startLevel(GameState.currentLevel + 1);
            updateDevLevelDisplay();
        }
    });

    document.getElementById('dev-restart-lvl').addEventListener('click', () => {
        startLevel(GameState.currentLevel);
    });

    document.getElementById('dev-complete-lvl').addEventListener('click', () => {
        completeLevel();
    });
}

function updateDevLevelDisplay() {
    const el = document.getElementById('dev-current-lvl');
    if (el) el.textContent = `Level ${GameState.currentLevel}`;
}

// ========================================
// Boss Health Bar
// ========================================

function createBossHealthBar() {
    bossHealthBar = document.createElement('div');
    bossHealthBar.id = 'boss-health-container';
    bossHealthBar.className = 'hidden';
    bossHealthBar.innerHTML = `
        <div id="boss-name">EMPEROR SAEL</div>
        <div id="boss-health-bar">
            <div id="boss-health-fill"></div>
        </div>
    `;
    document.getElementById('game-container').appendChild(bossHealthBar);

    const style = document.createElement('style');
    style.textContent = `
        #boss-health-container {
            position: absolute; top: 50px; left: 50%;
            transform: translateX(-50%); width: 300px;
            z-index: 55; text-align: center;
        }
        #boss-name {
            color: #ff4444; font-size: 16px; font-weight: bold;
            letter-spacing: 3px; margin-bottom: 6px;
            text-shadow: 0 0 10px rgba(255, 68, 68, 0.6);
        }
        #boss-health-bar {
            width: 100%; height: 16px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #ff4444; border-radius: 8px; overflow: hidden;
        }
        #boss-health-fill {
            height: 100%; width: 100%;
            background: linear-gradient(90deg, #ff4444, #ff6666);
            transition: width 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

function updateBossHealthBar() {
    if (!boss) return;
    const fill = document.getElementById('boss-health-fill');
    if (fill) {
        fill.style.width = `${(boss.health / boss.maxHealth) * 100}%`;
    }
}

// ========================================
// Victory/Fail Overlay
// ========================================

function createVictoryOverlay() {
    victoryOverlay = document.createElement('div');
    victoryOverlay.id = 'victory-overlay';
    victoryOverlay.className = 'hidden';
    victoryOverlay.innerHTML = `
        <div id="victory-text">MISSION COMPLETE</div>
        <div id="victory-subtitle">Well done, soldier</div>
        <div id="victory-buttons" class="hidden">
            <button id="btn-vic-continue" class="menu-btn small">CONTINUE</button>
            <button id="btn-vic-shop" class="menu-btn small">UPGRADES</button>
        </div>
    `;
    document.getElementById('game-container').appendChild(victoryOverlay);

    // Add Event Listeners
    document.getElementById('btn-vic-continue').addEventListener('click', () => {
        if (GameState.gameOver) {
            GameState.gameOver = false;
            GameState.paused = false;
            hideVictory();
            startLevel(GameState.currentLevel); // Retry
        } else {
            advanceToNextLevel();
        }
    });

    document.getElementById('btn-vic-shop').addEventListener('click', () => {
        showUpgrades(true); // true = from victory screen
    });

    const style = document.createElement('style');
    style.textContent = `
        #victory-overlay {
            position: absolute; top: 0; left: 0;
            width: 100%; height: 100%;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            background: rgba(0, 0, 0, 0.85); z-index: 150; pointer-events: auto;
        }
        #victory-text {
            font-size: 48px; font-weight: bold; color: #ffd700;
            text-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
            letter-spacing: 8px;
            animation: victoryPulse 0.5s ease-out forwards;
        }
        #victory-subtitle {
            font-size: 24px; color: #fff; margin-top: 20px;
            letter-spacing: 4px; opacity: 0;
            animation: fadeIn 0.5s ease-out 0.3s forwards;
            margin-bottom: 40px;
        }
        #victory-buttons {
            display: flex; gap: 20px;
            opacity: 0; animation: fadeIn 0.5s ease-out 1.0s forwards;
        }
        #victory-overlay.fail #victory-text { color: #ff4444; text-shadow: 0 0 30px rgba(255, 68, 68, 0.8); }
        @keyframes victoryPulse { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        @keyframes fadeIn { to { opacity: 1; } }
    `;
    document.head.appendChild(style);
}

function showVictory(isFail = false) {
    const textEl = document.getElementById('victory-text');
    const subtitleEl = document.getElementById('victory-subtitle');
    const btnCont = document.getElementById('btn-vic-continue');
    const buttons = document.getElementById('victory-buttons');

    buttons.classList.remove('hidden');

    if (isFail) {
        textEl.textContent = 'MISSION FAILED';
        subtitleEl.textContent = 'Try again, soldier';
        btnCont.textContent = 'RETRY';
        victoryOverlay.classList.add('fail');
    } else {
        textEl.textContent = 'MISSION COMPLETE';
        subtitleEl.textContent = 'Well done, soldier';
        btnCont.textContent = 'CONTINUE';
        victoryOverlay.classList.remove('fail');
    }

    // Reset animations
    textEl.style.animation = 'none';
    subtitleEl.style.animation = 'none';
    buttons.style.animation = 'none';

    void textEl.offsetWidth;

    textEl.style.animation = 'victoryPulse 0.5s ease-out forwards';
    subtitleEl.style.animation = 'fadeIn 0.5s ease-out 0.3s forwards';
    buttons.style.animation = 'fadeIn 0.5s ease-out 0.8s forwards';

    // Disable buttons initially (cooldown)
    const actionButtons = buttons.querySelectorAll('button');
    actionButtons.forEach(btn => btn.disabled = true);

    setTimeout(() => {
        actionButtons.forEach(btn => btn.disabled = false);
    }, 1500); // 1.5s delay to prevent accidental skips

    victoryOverlay.classList.remove('hidden');
}

function hideVictory() {
    victoryOverlay.classList.add('hidden');
}

// ========================================
// Asset Preloading
// ========================================

const portraits = {};

async function preloadAssets() {
    const portraitPaths = {
        'kael_neutral': 'assets/portraits/kael/neutral.png',
        'kael_concerned': 'assets/portraits/kael/concerned.png',
        'kael_shocked': 'assets/portraits/kael/shocked.png',
        'kael_grief': 'assets/portraits/kael/grief.png',
        'kael_rage': 'assets/portraits/kael/rage.png',
        'kael_awakened': 'assets/portraits/kael/awakened.png',
        'lyra_encouraging': 'assets/portraits/lyra/encouraging.png',
        'lyra_focused': 'assets/portraits/lyra/focused.png',
        'lyra_worried': 'assets/portraits/lyra/worried.png',
        'lyra_brave': 'assets/portraits/lyra/brave.png',
        'lyra_final': 'assets/portraits/lyra/final.png',
        'sael_authoritative': 'assets/portraits/sael_disguise/authoritative.png',
        'sael_sympathetic': 'assets/portraits/sael_disguise/sympathetic.png',
        'sael_encouraging': 'assets/portraits/sael_disguise/encouraging.png',
        'sael_commanding': 'assets/portraits/sael_true/commanding.png',
        'sael_mocking': 'assets/portraits/sael_true/mocking.png',
        'sael_enraged': 'assets/portraits/sael_true/enraged.png',
        'sael_defeated': 'assets/portraits/sael_true/defeated.png'
    };

    const loadPromises = Object.entries(portraitPaths).map(([key, path]) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => { portraits[key] = img; resolve(); };
            img.onerror = () => { console.warn('Failed to load:', path); resolve(); };
            img.src = path;
        });
    });

    await Promise.all(loadPromises);
    console.log('Assets loaded:', Object.keys(portraits).length, 'portraits');
}

export function getPortrait(key) {
    return portraits[key] || null;
}

// ========================================
// Game Start Functions
// ========================================

function startNewGame() {
    console.log('Starting new game');
    resetGame();
    showMainMenu(); // To hide other overlays
    menuOverlay.classList.add('hidden');
    hudElement.classList.remove('hidden');
    startLevel(1);
}

function continueGame() {
    console.log('Continuing game');
    const saveData = loadGame();
    if (saveData) {
        menuOverlay.classList.add('hidden');
        hudElement.classList.remove('hidden');
        // Always resume from the furthest reached level (Campaign Progression)
        let nextLevel = GameState.maxLevelReached || 1;
        const total = getTotalLevels();
        if (nextLevel > total) nextLevel = total;

        startLevel(nextLevel);
    }
}

// ========================================
// Level Management
// ========================================

function startLevel(levelNum) {
    console.log('Starting level:', levelNum);
    GameState.currentLevel = levelNum;
    resetLevel();
    hideVictory();
    boss = null;
    bossHealthBar.classList.add('hidden');
    if (btnPause) btnPause.classList.remove('hidden');

    // Reset formation system for boss fights
    formationTimer = 0;
    attackWaveTimer = 0;
    formationEnemies = [];

    const config = getLevelConfig(levelNum);
    if (!config) {
        console.error('No config for level:', levelNum);
        return;
    }

    // Setup mission
    GameState.mission.type = config.missionType;
    GameState.mission.target = config.missionTarget;
    GameState.mission.current = 0;
    GameState.mission.timeLimit = config.timeLimit || 60;
    GameState.mission.timeElapsed = 0;

    // Position player (Start at bottom)
    const { width, height } = getCanvasSize();
    GameState.player.x = width / 2;
    GameState.player.y = height - 100;
    GameState.player.vx = 0;
    GameState.player.vy = 0;

    // Boss level setup
    if (config.gameplayType === 'boss') {
        createBoss();
        if (config.bossHealth) boss.maxHealth = boss.health = config.bossHealth;
        bossHealthBar.classList.remove('hidden');
    }

    // Spawn initial formation for shooter/boss levels
    if (config.gameplayType === 'shooter' || config.gameplayType === 'boss') {
        spawnFormation(width, config.difficulty || 1);
    }

    // Set scene
    GameState.scene = 'story';

    // Show pre-level dialogue
    if (config.preDialogue && config.preDialogue.length > 0) {
        showDialogue(config.preDialogue);
    } else {
        GameState.scene = config.gameplayType;
        // Start level-appropriate music
        const musicType = AudioManager.getMusicTypeForLevel(config.gameplayType);
        AudioManager.playMusic(musicType);
    }
}

function completeLevel() {
    if (GameState.levelComplete) return;

    console.log('Level complete!');
    GameState.levelComplete = true;
    GameState.paused = true;

    // Update max reached
    if (GameState.currentLevel >= (GameState.maxLevelReached || 1)) {
        GameState.maxLevelReached = GameState.currentLevel + 1;
    }

    saveGame();
    showVictory(false);
}

function failLevel() {
    console.log('Level failed!');
    GameState.gameOver = true;
    GameState.paused = true;
    showVictory(true);
}

function advanceToNextLevel() {
    hideVictory();
    bossHealthBar.classList.add('hidden');

    const config = getLevelConfig(GameState.currentLevel);

    // Handle post-dialogue first
    if (config && config.postDialogue && config.postDialogue.length > 0) {
        GameState.scene = 'story';
        GameState.paused = false;
        showDialogue(config.postDialogue, () => {
            // After dialogue, check if game complete
            if (GameState.currentLevel >= getTotalLevels()) {
                showCredits();
            } else {
                startLevel(GameState.currentLevel + 1);
            }
        });
    } else if (GameState.currentLevel >= getTotalLevels()) {
        showCredits();
    } else {
        startLevel(GameState.currentLevel + 1);
    }
}

// ========================================
// Game Loop
// ========================================

let lastTime = 0;

function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    update(dt);
    render(dt);
    requestAnimationFrame(gameLoop);
}

// ========================================
// Update
// ========================================

function update(dt) {
    // Poll gamepad state each frame
    pollGamepad();

    if (GameState.scene === 'menu') return;

    // Check pause input (always active during gameplay/story)
    if (consumePause()) {
        togglePause();
    }

    if (GameState.paused) return;

    if (GameState.scene === 'story') {
        updateDialogue();
        return;
    }

    // Victory/Fail - STOP UPDATE (Wait for input)
    if (GameState.levelComplete || GameState.gameOver) {
        return;
    }

    const config = getLevelConfig(GameState.currentLevel);

    // Mission time
    if (GameState.mission.type === 'survive') {
        GameState.mission.timeElapsed += dt;
        if (GameState.mission.timeElapsed >= GameState.mission.timeLimit) {
            completeLevel();
            return;
        }
    }

    // Mission completion (non-survive, non-boss)
    if (GameState.mission.type !== 'survive' && GameState.mission.type !== 'boss') {
        if (GameState.mission.current >= GameState.mission.target) {
            completeLevel();
            return;
        }
    }

    // Boss defated
    if (config && config.gameplayType === 'boss' && boss && boss.health <= 0) {
        completeLevel();
        return;
    }

    PowerUpManager.update(dt); // Update active effects

    updatePlayer(dt);
    updateEntities(dt);
    updateShield(dt);
    if (boss) updateBoss(dt);
    handleShooting(dt);
    checkCollisions();
}

// ========================================
// Player Update
// ========================================

function updatePlayer(dt) {
    const player = GameState.player;
    const { width, height } = getCanvasSize();

    // APPLY SPEED UPGRADE (+10% per level)
    let speedMultiplier = 1 + (GameState.upgrades.speed * 0.1);

    // Power-Up: Speed Boost (+50%)
    if (GameState.activeEffects.speed > 0) speedMultiplier *= 1.5;

    const speed = BASE_PLAYER_SPEED * speedMultiplier;

    let targetVx = 0;
    let targetVy = 0;

    if (Input.up) targetVy = -speed;
    if (Input.down) targetVy = speed;
    if (Input.left) targetVx = -speed;
    if (Input.right) targetVx = speed;

    if (targetVx !== 0 && targetVy !== 0) {
        targetVx *= 0.707;
        targetVy *= 0.707;
    }

    // Slidy physics
    const friction = 1 - slideFactor;
    const acceleration = 8 + (1 - slideFactor) * 12;

    if (targetVx !== 0 || targetVy !== 0) {
        player.vx += (targetVx - player.vx) * acceleration * dt;
        player.vy += (targetVy - player.vy) * acceleration * dt;
    } else {
        const decel = 5 + friction * 15;
        player.vx *= Math.pow(0.1, decel * dt);
        player.vy *= Math.pow(0.1, decel * dt);
        if (Math.abs(player.vx) < 5) player.vx = 0;
        if (Math.abs(player.vy) < 5) player.vy = 0;
    }

    // Clamp
    player.vx = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, player.vx));
    player.vy = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, player.vy));

    // Apply
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Bounds
    player.x = Math.max(player.width / 2, Math.min(width - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(height - player.height / 2, player.y));

    // Invincibility
    if (player.invincible) {
        player.invincibleTimer -= dt;
        if (player.invincibleTimer <= 0) player.invincible = false;
    }
}

function playerShoot() {
    // Play shoot sound
    AudioManager.playSFX('shoot');

    // Power-Up: Triple Shot
    if (GameState.activeEffects.triple > 0) {
        // Center
        GameState.entities.projectiles.push({
            x: GameState.player.x,
            y: GameState.player.y - GameState.player.height / 2 - 5,
            vx: 0,
            vy: -600,
            isEnemy: false
        });
        // Left Diagonal
        GameState.entities.projectiles.push({
            x: GameState.player.x - 10,
            y: GameState.player.y - GameState.player.height / 2 - 5,
            vx: -150,
            vy: -550,
            isEnemy: false
        });
        // Right Diagonal
        GameState.entities.projectiles.push({
            x: GameState.player.x + 10,
            y: GameState.player.y - GameState.player.height / 2 - 5,
            vx: 150,
            vy: -550,
            isEnemy: false
        });
    } else {
        // Normal Shot
        GameState.entities.projectiles.push({
            x: GameState.player.x,
            y: GameState.player.y - GameState.player.height / 2 - 5,
            vx: 0,
            vy: -600,
            isEnemy: false
        });
    }
}

// ========================================
// Boss Update
// ========================================

function updateBoss(dt) {
    if (!boss) return;
    const { width } = getCanvasSize();
    boss.moveTimer += dt;
    boss.shootTimer -= dt;

    if (boss.health < boss.maxHealth * 0.6 && boss.phase === 1) boss.phase = 2;
    if (boss.health < boss.maxHealth * 0.3 && boss.phase === 2) boss.phase = 3;

    const moveSpeed = 150 + boss.phase * 50;

    if (boss.phase === 1) {
        boss.x += boss.direction * moveSpeed * dt;
        if (boss.x > width - 60 || boss.x < 60) boss.direction *= -1;
    } else if (boss.phase === 2) {
        boss.x = width / 2 + Math.sin(boss.moveTimer * 2) * (width / 3);
        boss.y = 80 + Math.sin(boss.moveTimer * 1.5) * 40;
    } else {
        boss.x = width / 2 + Math.sin(boss.moveTimer * 3) * (width / 2.5);
        boss.y = 80 + Math.sin(boss.moveTimer * 2) * 80;
    }

    const shootRate = 0.8 - boss.phase * 0.15;
    if (boss.shootTimer <= 0) {
        boss.shootTimer = shootRate;
        bossShoot();
    }

    if (boss.flashTimer > 0) boss.flashTimer -= dt;
}

function bossShoot() {
    if (!boss) return;
    // Phase 1: Single shot
    if (boss.phase === 1) {
        GameState.entities.projectiles.push({ x: boss.x, y: boss.y + 40, vy: 300, isEnemy: true, isBoss: true });
    }
    // Phase 2: 3-way spread
    else if (boss.phase === 2) {
        for (let angle = -25; angle <= 25; angle += 25) {
            const rad = angle * Math.PI / 180;
            GameState.entities.projectiles.push({ x: boss.x, y: boss.y + 40, vx: Math.sin(rad) * 120, vy: Math.cos(rad) * 250, isEnemy: true, isBoss: true });
        }
    }
    // Phase 3: intensified spread and fire rate.
    else {
        for (let angle = -30; angle <= 30; angle += 30) {
            const rad = angle * Math.PI / 180;
            GameState.entities.projectiles.push({ x: boss.x, y: boss.y + 40, vx: Math.sin(rad) * 100, vy: Math.cos(rad) * 280, isEnemy: true, isBoss: true });
        }
    }
}

// ========================================
// Shooting System
// ========================================

let fireTimer = 0;

function handleShooting(dt) {
    const config = getLevelConfig(GameState.currentLevel);
    if (!config) return;
    // Allow shooting in all gameplay modes except boss-only restrictions
    const canShoot = ['shooter', 'boss', 'dodge', 'collect'].includes(config.gameplayType);
    if (!canShoot) return;

    fireTimer -= dt;

    if (Input.fire) {
        // APPLY FIRE RATE UPGRADE (-10% cooldown per level)
        let rateMultiplier = Math.max(0.1, 1 - (GameState.upgrades.fireRate * 0.08));

        // Power-Up: Fire Rate Boost (Fast Fire)
        if (GameState.activeEffects.fireRate > 0) rateMultiplier *= 0.6; // 40% faster

        const currentFireRate = BASE_FIRE_RATE * rateMultiplier;

        if (fireTimer <= 0) {
            fireTimer = currentFireRate;
            playerShoot();
        }
    }
}

// ========================================
// Entity Updates
// ========================================

function updateEntities(dt) {
    const { width, height } = getCanvasSize();
    const config = getLevelConfig(GameState.currentLevel);
    const difficulty = config ? config.difficulty : 1;

    // Cap effective difficulty speed multiplier to prevent impossible speeds
    const speedDifficulty = Math.min(difficulty, 2.5);

    // MAGNET UPGRADE: Attract collectibles
    const pickupRange = BASE_PICKUP_RANGE + (GameState.upgrades.magnet * 25);
    const magnetSpeed = 400; // Attraction speed

    for (const item of GameState.entities.collectibles) {
        // Check distance to player
        const dx = GameState.player.x - item.x;
        const dy = GameState.player.y - item.y;
        const distSqVal = dx * dx + dy * dy;

        if (distSqVal < pickupRange * pickupRange) {
            // Move towards player
            const angle = Math.atan2(dy, dx);
            item.x += Math.cos(angle) * magnetSpeed * dt;
            item.y += Math.sin(angle) * magnetSpeed * dt;
        } else {
            // Fall normally
            item.y += item.speed * dt;
        }

        // Remove if off screen
        if (item.y > height + 50) item.remove = true;
    }
    // Filter collectibles
    GameState.entities.collectibles = GameState.entities.collectibles.filter(i => !i.remove);

    // Power-Ups Physics
    GameState.entities.powerups.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // Bounce off walls
        if (p.x < 20 || p.x > width - 20) p.vx *= -1;
        if (p.y > height + 50) p.remove = true;
    });
    GameState.entities.powerups = GameState.entities.powerups.filter(p => !p.remove);

    // Obstacles
    GameState.entities.obstacles.forEach(o => {
        o.y += o.speed * speedDifficulty * ASTEROID_SPEED_MULT * dt;
        if (o.vx) {
            o.x += o.vx * dt;
            // Bounce off screen edges
            if (o.x < o.radius || o.x > width - o.radius) o.vx *= -1;
        }
        if (o.flashTimer) o.flashTimer -= dt;

        if (o.y > height + o.radius) {
            o.remove = true;
            const shieldDamage = Math.min(25, Math.max(5, o.radius * 0.4));
            damageShield(shieldDamage);
        }
    });
    GameState.entities.obstacles = GameState.entities.obstacles.filter(o => !o.remove);

    // Enemies
    GameState.entities.enemies.forEach(e => {
        if (e.inFormation && !e.isAttacking) {
            // Formation position is handled by updateFormationSystem.
            e.shootTimer = (e.shootTimer || 0) - dt;
            if (e.shootTimer <= 0 && e.y > 30) {
                e.shootTimer = 3 + Math.random() * 2;
                enemyShoot(e);
            }
        } else {
            const moveSpd = e.isAttacking ? (e.speed || 100) : e.speed;
            e.y += moveSpd * speedDifficulty * ENEMY_SPEED_MULT * dt;
            e.moveTimer = (e.moveTimer || 0) + dt;
            e.x += Math.sin(e.moveTimer * e.moveFreq) * e.moveSpeed * dt;
            e.x = Math.max(30, Math.min(width - 30, e.x));
            e.shootTimer = (e.shootTimer || 0) - dt;
            if (e.shootTimer <= 0 && e.y > 50 && e.y < height - 200) {
                e.shootTimer = 1.2 / difficulty + Math.random();
                enemyShoot(e);
            }
        }
        if (e.y > height + e.height) {
            e.remove = true;
            // Damage shield
            const shieldDamage = e.type === 'elite' ? 15 : 8;
            damageShield(shieldDamage);
        }
    });
    GameState.entities.enemies = GameState.entities.enemies.filter(e => !e.remove);

    // Sync formation enemies
    formationEnemies = formationEnemies.filter(fe => !fe.remove);

    // Projectiles
    GameState.entities.projectiles.forEach(p => {
        p.x = (p.x || 0) + (p.vx || 0) * dt;
        p.y += p.vy * dt;

        // Homing Logic
        if (!p.isEnemy && GameState.activeEffects.homing > 0) {
            let best = p.target;

            // Validate cached target
            if (best) {
                if (best.remove || best.y < 0 || distSq(best.x, best.y, p.x, p.y) > 300 * 300) {
                    best = null;
                    p.target = null;
                }
            }

            if (!best) {
                let minDistSq = 300 * 300;
                for (const e of GameState.entities.enemies) {
                    const dSq = distSq(e.x, e.y, p.x, p.y);
                    if (dSq < minDistSq && e.y >= 0) { minDistSq = dSq; best = e; }
                }
                if (!best) {
                    for (const o of GameState.entities.obstacles) {
                        const dSq = distSq(o.x, o.y, p.x, p.y);
                        if (dSq < minDistSq && o.y >= 0) { minDistSq = dSq; best = o; }
                    }
                }
                if (best) {
                    p.target = best;
                }
            }

            if (best) {
                const ang = Math.atan2(best.y - p.y, best.x - p.x);
                const turnRate = 5 * dt;
                p.vx += (Math.cos(ang) * 600 - p.vx) * turnRate;
                p.vy += (Math.sin(ang) * 600 - p.vy) * turnRate;
            }
        }
        if (p.y < -50 || p.y > height + 50 || p.x < -50 || p.x > width + 50) p.remove = true;
    });
    GameState.entities.projectiles = GameState.entities.projectiles.filter(p => !p.remove);

    spawnEntities(dt);
}

function enemyShoot(enemy) {
    GameState.entities.projectiles.push({ x: enemy.x, y: enemy.y + 20, vx: 0, vy: 300, isEnemy: true });
}

let spawnTimer = 0;
function spawnEntities(dt) {
    const { width } = getCanvasSize();
    spawnTimer += dt;
    const config = getLevelConfig(GameState.currentLevel);
    if (!config) return;
    const spawnRate = config.spawnRate || 1;
    const difficulty = config.difficulty || 1;

    if (spawnTimer >= 1 / (spawnRate * SPAWN_RATE_MULT)) {
        spawnTimer = 0;
        const gType = config.gameplayType;

        if (gType === 'dodge' || gType === 'collect') {
            if (Math.random() < 0.4 + difficulty * 0.1) {
                const asteroidRadius = 12 + Math.random() * 20 + difficulty * 3;
                const seed = Math.random() * 1000;
                GameState.entities.obstacles.push({
                    x: Math.random() * (width - 60) + 30,
                    y: -30,
                    radius: asteroidRadius,
                    speed: 140 + Math.random() * 60 + difficulty * 25,
                    health: Math.max(1, Math.floor(asteroidRadius / 12)),
                    maxHealth: Math.max(1, Math.floor(asteroidRadius / 12)),
                    seed: seed,
                    vertices: generateObstacleVertices(seed, asteroidRadius)
                });
            }
            if (Math.random() < (gType === 'collect' ? 0.5 : 0.25)) {
                GameState.entities.collectibles.push({ x: Math.random() * (width - 40) + 20, y: -30, speed: 80 + Math.random() * 40 });
            }
        }

        if (gType === 'shooter' || gType === 'boss') {
            // Collectibles still spawn randomly
            if (Math.random() < 0.12) {
                GameState.entities.collectibles.push({ x: Math.random() * (width - 40) + 20, y: -30, speed: 70 });
            }
        }
    }

    const levelConfig = getLevelConfig(GameState.currentLevel);
    if (levelConfig && (levelConfig.gameplayType === 'shooter' || levelConfig.gameplayType === 'boss')) {
        updateFormationSystem(dt, levelConfig.difficulty || 1);
    }
}

// ========================================
// Formation System (Shooter & Boss Levels)
// ========================================

let formationTimer = 0;
let attackWaveTimer = 0;
let formationEnemies = []; // Enemies waiting in formation

function updateFormationSystem(dt, difficulty) {
    const { width, height } = getCanvasSize();
    // Use boss phase if in boss fight, otherwise use difficulty
    const intensity = boss ? boss.phase : Math.min(3, Math.ceil(difficulty));

    formationTimer += dt;
    attackWaveTimer += dt;

    // Spawn formation enemies periodically
    // Faster spawns at higher difficulty/phase
    const formationSpawnInterval = Math.max(3, 7 - intensity * 1.2);
    const maxFormationSize = 4 + intensity * 2; // More enemies at higher difficulty

    if (formationTimer >= formationSpawnInterval && formationEnemies.length < maxFormationSize) {
        formationTimer = 0;
        spawnFormation(width, difficulty);
    }

    // Send attackers in waves
    const attackInterval = Math.max(1.5, 4 - intensity * 0.6); // Faster waves at higher intensity
    const attackersPerWave = Math.min(1 + Math.floor(intensity / 1.5), 3); // 1-3 attackers

    if (attackWaveTimer >= attackInterval && formationEnemies.length > 0) {
        attackWaveTimer = 0;

        // Select random enemies from formation to attack
        for (let i = 0; i < attackersPerWave && formationEnemies.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * formationEnemies.length);
            const attacker = formationEnemies.splice(randomIndex, 1)[0];

            if (attacker) {
                // Mark as attacking - they'll now move toward the player
                attacker.isAttacking = true;
                attacker.speed = 60 + difficulty * 15 + intensity * 10;
                attacker.moveSpeed = 40 + difficulty * 10;
                attacker.moveFreq = 2 + Math.random();
            }
        }
    }

    // Update formation enemies (sway in position)
    formationEnemies.forEach((e) => {
        e.x += Math.sin(e.moveTimer * 2) * 25 * dt;
        e.moveTimer += dt;
        e.x = Math.max(50, Math.min(width - 50, e.x));
    });
}

function spawnFormation(width, difficulty) {
    // Spawn enemies in different formation types
    const formationCount = 3 + Math.floor(Math.random() * 3) + Math.floor(difficulty / 2);
    const centerX = width / 2;
    const baseY = 70;
    const spacing = 45;

    // Random formation type
    const formationType = Math.floor(Math.random() * 3); // 0=V, 1=Arc, 2=Line

    for (let i = 0; i < formationCount; i++) {
        let x, y;

        if (formationType === 0) {
            // V-formation: alternate left and right of center - WIDER
            const side = i % 2 === 0 ? -1 : 1;
            const row = Math.floor(i / 2);
            x = centerX + side * (row + 1) * spacing * 1.3;
            y = baseY + row * 40;
        } else if (formationType === 1) {
            // Arc formation - BIGGER ARC
            const angle = (Math.PI / (formationCount + 1)) * (i + 1);
            x = centerX + Math.cos(angle - Math.PI / 2) * 200;
            y = baseY + Math.sin(angle) * 50;
        } else {
            // Horizontal line with slight curve - WIDER SPREAD
            const offset = (i - formationCount / 2) * spacing * 1.4;
            x = centerX + offset;
            y = baseY + Math.abs(offset) * 0.1;
        }

        // More elites at higher difficulty
        const eliteChance = 0.15 + difficulty * 0.05;
        const type = Math.random() < eliteChance ? 'elite' : 'scout';

        const enemy = {
            x: x,
            y: y,
            width: type === 'elite' ? 60 : 38,
            height: type === 'elite' ? 75 : 48,
            speed: 0, // Stationary in formation
            type: type,
            health: type === 'elite' ? 2 : 1,
            moveTimer: Math.random() * Math.PI * 2,
            moveFreq: 2,
            moveSpeed: 0,
            shootTimer: 3 + Math.random() * 2,
            inFormation: true,
            isAttacking: false
        };

        formationEnemies.push(enemy);
        GameState.entities.enemies.push(enemy);
    }
}

// ========================================
// Collision Detection
// ========================================

/**
 * Split an asteroid into smaller pieces
 * @param {Object} obs - The obstacle to split
 */
function splitAsteroid(obs) {
    if (obs.radius <= ASTEROID_SPLIT_THRESHOLD) return;

    const newRadius = obs.radius * ASTEROID_SPLIT_MULTIPLIER;
    const newHealth = Math.max(1, Math.floor(newRadius / 12));
    const newSpeed = obs.speed * ASTEROID_SPEED_BOOST;

    // Spawn 2 smaller asteroids moving at angles
    const seed1 = Math.random() * 1000;
    const obs1 = {
        x: obs.x - 15,
        y: obs.y,
        radius: newRadius,
        speed: newSpeed,
        vx: -50 - Math.random() * 30,
        health: newHealth,
        maxHealth: newHealth,
        seed: seed1,
        vertices: generateObstacleVertices(seed1, newRadius)
    };
    const seed2 = Math.random() * 1000;
    const obs2 = {
        x: obs.x + 15,
        y: obs.y,
        radius: newRadius,
        speed: newSpeed,
        vx: 50 + Math.random() * 30,
        health: newHealth,
        maxHealth: newHealth,
        seed: seed2,
        vertices: generateObstacleVertices(seed2, newRadius)
    };

    GameState.entities.obstacles.push(obs1);
    GameState.entities.obstacles.push(obs2);

    // Update grid immediately so other projectiles can hit them
    if (spatialGrid) {
        spatialGrid.insert(obs1, obs1.x - obs1.radius, obs1.y - obs1.radius, obs1.radius * 2, obs1.radius * 2);
        spatialGrid.insert(obs2, obs2.x - obs2.radius, obs2.y - obs2.radius, obs2.radius * 2, obs2.radius * 2);
    }
}

function checkCollisions() {
    const player = GameState.player;

    // 1. Prepare Grid
    spatialGrid.clear();

    GameState.entities.obstacles.forEach(o => {
        spatialGrid.insert(o, o.x - o.radius, o.y - o.radius, o.radius * 2, o.radius * 2);
    });

    GameState.entities.enemies.forEach(e => {
        // Use conservative collision bounds (Radius 35)
        spatialGrid.insert(e, e.x - COLLISION_RADIUS.ENEMY, e.y - COLLISION_RADIUS.ENEMY, COLLISION_RADIUS.ENEMY * 2, COLLISION_RADIUS.ENEMY * 2);
    });

    // Player vs Power-Ups
    for (let i = GameState.entities.powerups.length - 1; i >= 0; i--) {
        const item = GameState.entities.powerups[i];
        if (distSq(player.x, player.y, item.x, item.y) < COLLISION_RADIUS.POWERUP ** 2) {
            GameState.entities.powerups.splice(i, 1);
            PowerUpManager.activatePowerUp(item.type);
            VibrationPatterns.powerUp();
        }
    }

    // Player vs Collectibles
    for (let i = GameState.entities.collectibles.length - 1; i >= 0; i--) {
        const item = GameState.entities.collectibles[i];
        if (distSq(player.x, player.y, item.x, item.y) < COLLISION_RADIUS.COLLECTIBLE ** 2) {
            GameState.entities.collectibles.splice(i, 1);
            GameState.player.elixir++;
            VibrationPatterns.collect();
            if (GameState.mission.type === 'collect') GameState.mission.current++;
        }
    }

    // Player vs Grid (Obstacles & Enemies)
    // Query Player area (slightly larger than radius)
    const pCandidates = spatialGrid.query(player.x - 40, player.y - 40, 80, 80);

    for (const item of pCandidates) {
        if (item.remove) continue;

        if (item.radius) { // Obstacle
            if (circleRectCollision(item.x, item.y, item.radius, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height)) {
                damagePlayer();
                item.remove = true;
                AudioManager.playSFX('destroy');
                splitAsteroid(item);
            }
        } else if (item.width) { // Enemy
            if (distSq(player.x, player.y, item.x, item.y) < COLLISION_RADIUS.ENEMY ** 2) {
                damagePlayer();
            }
        }
    }

    // Projectiles
    for (let i = GameState.entities.projectiles.length - 1; i >= 0; i--) {
        const p = GameState.entities.projectiles[i];
        if (p.isEnemy) {
            if (distSq(player.x, player.y, p.x, p.y) < COLLISION_RADIUS.PROJECTILE ** 2) {
                p.remove = true;
                damagePlayer();
            }
        } else {
            // Player projectile vs Grid
            // Query 10x10 area of projectile
            const candidates = spatialGrid.query(p.x - 5, p.y - 5, 10, 10);

            for (const target of candidates) {
                if (target.remove) continue;

                if (target.width) { // Enemy
                    if (distSq(p.x, p.y, target.x, target.y) < 30 ** 2) {
                        p.remove = true;
                        target.health--;
                        if (target.health <= 0) {
                            target.remove = true;
                            AudioManager.playSFX('destroy');
                            VibrationPatterns.explosion();
                            PowerUpManager.tryDrop(target.x, target.y);
                            if (GameState.mission.type === 'destroy') GameState.mission.current++;
                            if (Math.random() < 0.1) GameState.entities.collectibles.push({ x: target.x, y: target.y, speed: 60 });
                        }
                        break;
                    }
                } else if (target.radius) { // Obstacle
                    if (circleRectCollision(target.x, target.y, target.radius, p.x - 5, p.y - 5, 10, 10)) {
                        p.remove = true;
                        target.health = (target.health || 1) - 1;
                        target.flashTimer = 0.15;
                        AudioManager.playSFX('hit');

                        if (target.health <= 0) {
                            target.remove = true;
                            AudioManager.playSFX('destroy');
                            VibrationPatterns.explosion();
                            PowerUpManager.tryDrop(target.x, target.y);
                            splitAsteroid(target);
                            if (Math.random() < 0.08) {
                                GameState.entities.collectibles.push({ x: target.x, y: target.y, speed: 60 });
                            }
                        }
                        break;
                    }
                }
            }

            // Player projectile vs Boss (Manual Check)
            if (boss && !p.remove && distSq(p.x, p.y, boss.x, boss.y) < COLLISION_RADIUS.BOSS ** 2) {
                p.remove = true;
                boss.health -= 2;
                boss.flashTimer = 0.1;
                AudioManager.playSFX('bossHit');
                VibrationPatterns.bossHit();
                updateBossHealthBar();
            }
        }
    }

    // Cleanup removed entities
    GameState.entities.projectiles = GameState.entities.projectiles.filter(p => !p.remove);
    GameState.entities.obstacles = GameState.entities.obstacles.filter(o => !o.remove);
    GameState.entities.enemies = GameState.entities.enemies.filter(e => !e.remove);

    if (boss && distSq(player.x, player.y, boss.x, boss.y) < COLLISION_RADIUS.BOSS_BODY ** 2) damagePlayer();
}


function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (cr * cr);
}

function distSq(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}

function damagePlayer() {
    if (GameState.player.invincible || PLAYER_INVINCIBLE || GameState.levelComplete) return;

    // Power-Up: Shield
    if (GameState.activeEffects.shield > 0) {
        // Shield absorbs hit, no damage, remove shield
        GameState.activeEffects.shield = 0;
        GameState.player.invincible = true;
        GameState.player.invincibleTimer = 1.0;
        return;
    }

    // Power-Up: Heart +1 (Temporary Health)
    if (GameState.activeEffects.heartPlusOne) {
        // Lose the extra heart, but take no actual damage to base HP
        GameState.activeEffects.heartPlusOne = false;
        // Protected!
        GameState.player.invincible = true;
        GameState.player.invincibleTimer = 1.0;
        return;
    }

    GameState.player.health--;
    GameState.player.invincible = true;
    GameState.player.invincibleTimer = 1.5;

    // Play damage sound and vibrate controller
    AudioManager.playSFX('damage');
    VibrationPatterns.damage();

    if (GameState.player.health <= 0) failLevel();
}

// Damage the bottom shield
function damageShield(amount) {
    // Apply Shield Upgrade Resistance (5% per level)
    const resistance = GameState.upgrades.shield * 0.05;
    const finalDamage = Math.max(1, amount * (1 - resistance)); // Min 1 damage

    GameState.shield.current = Math.max(0, GameState.shield.current - finalDamage);
    GameState.shield.flashTimer = 0.3; // Flash red when hit

    // Shield depleted = mission failed
    if (GameState.shield.current <= 0) {
        failLevel();
    }
}

// Update shield flash timer
function updateShield(dt) {
    if (GameState.shield.flashTimer > 0) {
        GameState.shield.flashTimer -= dt;
    }
}

// ========================================
// Render
// ========================================

function render(dt) {
    clear();
    drawBackground(dt);
    if (GameState.scene === 'menu' || GameState.scene === 'story') return;

    // Draw bottom shield bar first (behind everything)
    drawShieldBar();

    GameState.entities.obstacles.forEach(o => drawObstacle(o));
    GameState.entities.collectibles.forEach(c => drawCollectible(c));
    GameState.entities.powerups.forEach(p => drawPowerUp(ctx, p)); // Draw Power-Ups
    GameState.entities.enemies.forEach(e => drawEnemy(e));
    GameState.entities.projectiles.forEach(p => drawProjectile(p));
    if (boss) drawBoss(boss);
    drawPlayer(GameState.player);
    updateHUD();
}

// Draw the bottom defense shield bar
function drawShieldBar() {
    const { width, height } = getCanvasSize();
    const shield = GameState.shield;
    const barHeight = 12;
    const barY = height - barHeight;
    const shieldPercent = shield.current / shield.max;

    // Background (dark)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, barY, width, barHeight);

    // Shield bar fill - color changes based on health
    let barColor;
    if (shield.flashTimer > 0) {
        // Flash white/red when hit
        barColor = Math.floor(shield.flashTimer * 10) % 2 === 0 ? '#ff0000' : '#ffffff';
    } else if (shieldPercent > 0.6) {
        barColor = '#00ccff'; // Cyan - healthy
    } else if (shieldPercent > 0.3) {
        barColor = '#ffaa00'; // Orange - warning
    } else {
        barColor = '#ff3300'; // Red - critical
    }

    // Shield bar gradient
    const gradient = ctx.createLinearGradient(0, barY, 0, barY + barHeight);
    gradient.addColorStop(0, barColor);
    gradient.addColorStop(0.5, shieldPercent > 0.3 ? '#ffffff' : barColor);
    gradient.addColorStop(1, barColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, barY, width * shieldPercent, barHeight);

    // Glow effect
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 10;
    ctx.fillRect(0, barY, width * shieldPercent, 2);
    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = shieldPercent > 0.3 ? '#00ffff' : '#ff4400';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, barY, width, barHeight);

    // Shield percentage text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SHIELD ${Math.ceil(shield.current)}%`, width / 2, barY + 9);
}

// Boss rendering now handled by renderer.js

function getHeartSVG(filled, extra = false) {
    const fill = extra ? '#ffd54f' : (filled ? '#ffb3b3' : '#4a2a2a');
    const stroke = extra ? '#f5a400' : (filled ? '#e67373' : '#6e3b3b');
    const highlight = filled || extra
        ? '<path d="M4 7 Q5 4 8 5" stroke="rgba(255,255,255,0.45)" stroke-width="1.5" fill="none"></path>'
        : '';

    return `<svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3));">
        <path d="M12 21.5 C6 16 1.5 11 2 7 C2.5 3.5 6 2.5 9 5 C10.5 6.2 11.5 7.5 12 8 C12.5 7.5 14 6 15.5 5 C18.5 2.5 22 3.5 22 7.5 C22 11.5 17 16 12 21.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
        ${highlight}
    </svg>`;
}

let lastHudState = { health: -1, maxHealth: -1, heartPlusOne: null, elixir: -1, mission: '' };

function updateHUD() {
    // Health
    if (
        lastHudState.health !== GameState.player.health ||
        lastHudState.maxHealth !== GameState.player.maxHealth ||
        lastHudState.heartPlusOne !== GameState.activeEffects.heartPlusOne
    ) {
        lastHudState.health = GameState.player.health;
        lastHudState.maxHealth = GameState.player.maxHealth;
        lastHudState.heartPlusOne = GameState.activeEffects.heartPlusOne;

        const healthContainer = document.getElementById('hud-health');
        healthContainer.innerHTML = '';
        for (let i = 0; i < GameState.player.maxHealth; i++) {
            const heart = document.createElement('span');
            heart.className = 'health-heart' + (i >= GameState.player.health ? ' empty' : '');
            heart.innerHTML = getHeartSVG(i < GameState.player.health);
            healthContainer.appendChild(heart);
        }

        if (GameState.activeEffects.heartPlusOne) {
            const extraHeart = document.createElement('span');
            extraHeart.className = 'health-heart extra';
            extraHeart.innerHTML = getHeartSVG(true, true);
            healthContainer.appendChild(extraHeart);
        }
    }

    // Elixir
    if (lastHudState.elixir !== GameState.player.elixir) {
        lastHudState.elixir = GameState.player.elixir;
        document.getElementById('elixir-count').textContent = GameState.player.elixir;
    }

    // Mission
    const { type, current, target, timeLimit, timeElapsed } = GameState.mission;
    let missionText = '';
    if (type === 'survive') missionText = `SURVIVE: ${Math.ceil(timeLimit - timeElapsed)}s`;
    else if (type === 'collect') missionText = `COLLECT: ${current}/${target}`;
    else if (type === 'destroy') missionText = `DESTROY: ${current}/${target}`;
    else if (type === 'boss') missionText = `DEFEAT SAEL`;

    if (lastHudState.mission !== missionText) {
        lastHudState.mission = missionText;
        document.getElementById('hud-mission').textContent = missionText;
    }
}

document.addEventListener('DOMContentLoaded', init);
