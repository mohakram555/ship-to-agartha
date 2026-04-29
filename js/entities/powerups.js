// ========================================
// AGARTHA: FALSE GUIDE - Power-Up Manager
// ========================================

import { GameState } from '../state.js';
import { AudioManager } from '../audio.js';

export const POWERUP_TYPES = {
    SPEED: 'speed',
    SHIELD: 'shield',
    FIRE_RATE: 'fireRate',
    TRIPLE: 'triple',
    HEART: 'heart',
    HOMING: 'homing',
    VRILL: 'vrill'
};

const POWERUP_DURATION = 4.7; // seconds

const DROP_CHANCE = 0.10; // 10%

// Weights for drop selection
const DROP_WEIGHTS = [
    { type: POWERUP_TYPES.SPEED, weight: 10 },
    { type: POWERUP_TYPES.SHIELD, weight: 10 },
    { type: POWERUP_TYPES.FIRE_RATE, weight: 10 },
    { type: POWERUP_TYPES.TRIPLE, weight: 10 },
    { type: POWERUP_TYPES.HEART, weight: 10 },
    { type: POWERUP_TYPES.HOMING, weight: 10 },
    { type: POWERUP_TYPES.VRILL, weight: 2 }
];

export const PowerUpManager = {

    // Attempt to drop a power-up at location
    tryDrop(x, y) {
        // Step 1: Drop Check
        if (Math.random() > DROP_CHANCE) return;

        // Step 2: Weighted Selection
        const totalWeight = DROP_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        let selectedType = POWERUP_TYPES.SPEED; // Default
        for (const item of DROP_WEIGHTS) {
            random -= item.weight;
            if (random <= 0) {
                selectedType = item.type;
                break;
            }
        }

        this.spawnPowerUp(selectedType, x, y);
    },

    spawnPowerUp(type, x, y) {
        GameState.entities.powerups.push({
            type: type,
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 50, // Slight horizontal drift
            vy: 60, // Falls down
            width: 24,
            height: 24,
            rotation: 0,
            bobTimer: Math.random() * Math.PI * 2
        });
    },

    activatePowerUp(type) {
        // Play pickup sound
        AudioManager.playSFX('pickup');

        // Vrill activates ALL timed buffs
        if (type === POWERUP_TYPES.VRILL) {
            this.activateEffect(POWERUP_TYPES.SPEED);
            this.activateEffect(POWERUP_TYPES.SHIELD);
            this.activateEffect(POWERUP_TYPES.FIRE_RATE);
            this.activateEffect(POWERUP_TYPES.TRIPLE);
            this.activateEffect(POWERUP_TYPES.HOMING);
            // Does NOT activate heart (per rules)
            return;
        }

        this.activateEffect(type);
    },

    activateEffect(type) {
        // Special Case: Heart +1
        if (type === POWERUP_TYPES.HEART) {
            if (!GameState.activeEffects.heartPlusOne) {
                GameState.activeEffects.heartPlusOne = true;
                // Grants temporary armor (heartPlusOne flag handles the protection in damagePlayer)
            }
            return;
        }

        // Timed Effects
        GameState.activeEffects[type] = POWERUP_DURATION;
    },

    update(dt) {
        // Update Active Effects
        for (const [key, value] of Object.entries(GameState.activeEffects)) {
            if (key === 'heartPlusOne') continue; // Not timed

            if (value > 0) {
                GameState.activeEffects[key] -= dt;
                if (GameState.activeEffects[key] <= 0) {
                    GameState.activeEffects[key] = 0;
                    // Effect automatically "deactivates" by being <= 0
                }
            }
        }

        // Update Entity Physics
        const { width, height } = { width: 800, height: 600 }; // Fallback match canvas usually, but entities are updated in main
        // Actually, physics for powerup items (falling) should probably be here or in main.
        // Let's defer entity physics to main loop for consistency with other entities, 
        // OR provide a helper updateEntities(dt) here.
        // For now, main.js usually iterates entities. I'll stick to that pattern if possible, 
        // but this update(dt) is good for timers.
    }
};
