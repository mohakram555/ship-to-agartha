
import { performance } from 'node:perf_hooks';
import { SpatialHashGrid } from '../js/spatial.js';

// ==========================================
// Mock Data Setup
// ==========================================

const CANVAS_WIDTH = 4000;
const CANVAS_HEIGHT = 4000;

function createEntity(type, x, y) {
    if (type === 'projectile') {
        return { x, y, width: 10, height: 10, isEnemy: false, remove: false };
    }
    if (type === 'enemy') {
        return { x, y, width: 40, height: 40, health: 1, remove: false };
    }
    if (type === 'obstacle') {
        return { x, y, radius: 20, health: 3, remove: false };
    }
}

function setupState(numProjectiles, numEnemies, numObstacles) {
    const projectiles = [];
    const enemies = [];
    const obstacles = [];

    for (let i = 0; i < numProjectiles; i++) {
        projectiles.push(createEntity('projectile', Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT));
    }
    for (let i = 0; i < numEnemies; i++) {
        enemies.push(createEntity('enemy', Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT));
    }
    for (let i = 0; i < numObstacles; i++) {
        obstacles.push(createEntity('obstacle', Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT));
    }

    return { projectiles, enemies, obstacles };
}

// ==========================================
// Original Collision Logic (Naive)
// ==========================================

function distSq(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}

function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (cr * cr);
}

function runNaiveCollision(state) {
    let collisions = 0;
    const projectiles = state.projectiles;
    const enemies = state.enemies;
    const obstacles = state.obstacles;

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (p.isEnemy) continue;

        let pRemoved = false;

        // Player projectile vs Enemy
        for (let e of enemies) {
            if (distSq(p.x, p.y, e.x, e.y) < 30 ** 2) {
                collisions++;
                pRemoved = true;
                break;
            }
        }

        if (!pRemoved) {
            for (let obs of obstacles) {
                if (circleRectCollision(obs.x, obs.y, obs.radius, p.x - 5, p.y - 5, 10, 10)) {
                    collisions++;
                    break;
                }
            }
        }
    }
    return collisions;
}

function runSpatialCollision(state, grid) {
    let collisions = 0;
    const projectiles = state.projectiles;
    const enemies = state.enemies;
    const obstacles = state.obstacles;

    grid.clear();

    // Insert Targets (Enemies + Obstacles)
    // Note: In real game, enemies have width/height, obstacles have radius
    // We approximate bounds
    for (const e of enemies) {
        // Enemy collision radius is 30 (distSq < 30^2)
        // Insert bounding box covering this radius centered at e.x, e.y
        grid.insert(e, e.x - 30, e.y - 30, 60, 60);
    }
    for (const o of obstacles) {
        // Obstacle is circle, use bounding box
        grid.insert(o, o.x - o.radius, o.y - o.radius, o.radius * 2, o.radius * 2);
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (p.isEnemy) continue;

        // Query around projectile (10x10) + buffer?
        // Projectile is 10x10. We query its bounds.
        // Actually, we need to query the range of things that *could* collide.
        // If query returns cells intersecting projectile...
        // Objects in those cells are candidates.

        const candidates = grid.query(p.x - 5, p.y - 5, 10, 10);
        let pRemoved = false;

        for (const candidate of candidates) {
            // Distinguish Enemy vs Obstacle based on props?
            // In game they are in separate arrays. Here they are mixed in grid.
            // But we can check properties.

            if (candidate.width) { // Enemy (has width/height)
                if (distSq(p.x, p.y, candidate.x, candidate.y) < 30 ** 2) {
                     collisions++;
                     pRemoved = true;
                     break;
                }
            } else if (candidate.radius) { // Obstacle
                 if (circleRectCollision(candidate.x, candidate.y, candidate.radius, p.x - 5, p.y - 5, 10, 10)) {
                     collisions++;
                     pRemoved = true;
                     break;
                 }
            }
        }
    }
    return collisions;
}

// ==========================================
// Benchmark Runner
// ==========================================

export function runBenchmark() {
    console.log('Running Collision Benchmark...');

    // Scenario 1: Heavy Load
    const state = setupState(3000, 1000, 500);
    console.log(`Entities: ${state.projectiles.length} Projectiles, ${state.enemies.length} Enemies, ${state.obstacles.length} Obstacles`);

    const iterations = 100;

    // Warmup
    for(let i=0; i<10; i++) runNaiveCollision(state);

    const start = performance.now();
    let totalCollisions = 0;
    for (let i = 0; i < iterations; i++) {
        totalCollisions += runNaiveCollision(state);
    }
    const end = performance.now();

    const avgTime = (end - start) / iterations;
    console.log(`Baseline (Naive) Average Time: ${avgTime.toFixed(4)} ms per frame`);
    console.log(`Baseline Collisions: ${totalCollisions / iterations}`);

    // --- Spatial ---
    const grid = new SpatialHashGrid(CANVAS_WIDTH, CANVAS_HEIGHT, 150); // 150 cell size

    // Warmup
    for(let i=0; i<10; i++) runSpatialCollision(state, grid);

    const startS = performance.now();
    let totalCollisionsS = 0;
    for (let i = 0; i < iterations; i++) {
        totalCollisionsS += runSpatialCollision(state, grid);
    }
    const endS = performance.now();

    const avgTimeS = (endS - startS) / iterations;
    console.log(`Spatial Grid Average Time: ${avgTimeS.toFixed(4)} ms per frame`);
    console.log(`Spatial Collisions: ${totalCollisionsS / iterations}`);
    console.log(`Improvement: ${(avgTime / avgTimeS).toFixed(2)}x`);

    return avgTime;
}

// Run if main
if (process.argv[1] === import.meta.filename) {
    runBenchmark();
}
