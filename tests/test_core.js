import { GameState, resetGame, saveGame, loadGame, resetLevel } from '../js/state.js';

export async function runTests() {
    const results = [];

    // Group: GameState
    const stateTests = [];

    // Test 1: Reset Game
    try {
        GameState.player.health = 1;
        GameState.currentLevel = 5;
        resetGame();
        const passed = GameState.currentLevel === 1 && GameState.player.health === GameState.player.maxHealth;
        stateTests.push({ desc: 'resetGame() resets level and health', passed });
    } catch (e) {
        stateTests.push({ desc: 'resetGame() throws error', passed: false, error: e.message });
    }

    // Test 2: Save/Load (Mocking localStorage handled in runner or implied)
    try {
        GameState.player.elixir = 50;
        saveGame();

        // Reset to simulate new session
        GameState.player.elixir = 0;

        loadGame();
        const passed = GameState.player.elixir === 50;
        stateTests.push({ desc: 'saveGame() and loadGame() persist data', passed });
    } catch (e) {
        stateTests.push({ desc: 'Save/Load failed', passed: false, error: e.message });
    }

    // Test 3: Reset Level
    try {
        GameState.entities.enemies = [{x:0, y:0}];
        resetLevel();
        const passed = GameState.entities.enemies.length === 0;
        stateTests.push({ desc: 'resetLevel() clears entities', passed });
    } catch (e) {
        stateTests.push({ desc: 'resetLevel failed', passed: false, error: e.message });
    }

    results.push({ name: 'GameState Tests', tests: stateTests });

    return results;
}
