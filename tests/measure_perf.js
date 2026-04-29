
// Mock Global Environment
const mockCtx = {
    createRadialGradient: (x0, y0, r0, x1, y1, r1) => {
        return {
            addColorStop: (offset, color) => {}
        };
    },
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fill: () => {},
    stroke: () => {},
    arc: () => {},
    ellipse: () => {}, // Boss/Projectile might use this
    bezierCurveTo: () => {}, // Enemy uses this
    quadraticCurveTo: () => {}, // Enemy uses this
    fillStyle: '',
    strokeStyle: '',
    shadowColor: '',
    shadowBlur: 0,
    lineWidth: 0,
    createLinearGradient: () => ({ addColorStop: () => {} })
};

global.window = {
    innerWidth: 800,
    innerHeight: 600,
    addEventListener: () => {}
};

global.document = {
    getElementById: (id) => {
        if (id === 'game-canvas') {
            return {
                getContext: () => mockCtx,
                width: 800,
                height: 600
            };
        }
        return null;
    }
};

// Import Renderer
import { initRenderer, drawObstacle } from '../js/renderer.js';

async function runBenchmark() {
    console.log("Initializing Renderer...");
    initRenderer();

    // Create 100 dummy obstacles
    const obstacles = [];
    for (let i = 0; i < 100; i++) {
        obstacles.push({
            x: Math.random() * 800,
            y: Math.random() * 600,
            radius: 20 + Math.random() * 30,
            health: 3,
            maxHealth: 3,
            flashTimer: 0,
            seed: Math.random() * 1000
        });
    }

    // Spy on createRadialGradient
    let gradientCalls = 0;
    const originalCreateRadialGradient = mockCtx.createRadialGradient;
    mockCtx.createRadialGradient = (...args) => {
        gradientCalls++;
        return originalCreateRadialGradient(...args);
    };

    console.log("Running Frame 1 (100 obstacles)...");
    for (const obs of obstacles) {
        drawObstacle(obs);
    }
    const frame1Calls = gradientCalls;
    console.log(`Frame 1 Gradient Calls: ${frame1Calls}`);

    // Reset counter
    gradientCalls = 0;

    console.log("Running Frame 2 (100 obstacles - same state)...");
    for (const obs of obstacles) {
        drawObstacle(obs);
    }
    const frame2Calls = gradientCalls;
    console.log(`Frame 2 Gradient Calls: ${frame2Calls}`);

    // Test Flashing State
    console.log("Running Frame 3 (100 obstacles - flashing)...");
    gradientCalls = 0;
    for (const obs of obstacles) {
        obs.flashTimer = 0.5; // Set to flashing
        drawObstacle(obs);
    }
    const frame3Calls = gradientCalls;
    console.log(`Frame 3 Gradient Calls (Flashing): ${frame3Calls}`);

    // Test Return to Normal
    console.log("Running Frame 4 (100 obstacles - normal again)...");
    gradientCalls = 0;
    for (const obs of obstacles) {
        obs.flashTimer = 0; // Back to normal
        drawObstacle(obs);
    }
    const frame4Calls = gradientCalls;
    console.log(`Frame 4 Gradient Calls (Back to Normal): ${frame4Calls}`);

    console.log("\n--- SUMMARY ---");
    console.log(`Baseline Expectation: 100 calls per frame per 100 obstacles.`);
    console.log(`Actual Frame 1: ${frame1Calls}`);
    console.log(`Actual Frame 2: ${frame2Calls}`);

    if (frame2Calls === 0) {
        console.log("PASS: Caching is working for normal state (Frame 2 calls = 0).");
    } else {
        console.log("FAIL/BASELINE: Caching not active (Frame 2 calls > 0).");
    }
}

runBenchmark().catch(console.error);
