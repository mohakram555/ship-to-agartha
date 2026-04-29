
function distSq(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}

export function runBenchmark() {
    console.log("Setting up benchmark...");
    const projectiles = [];
    const enemies = [];
    const obstacles = [];
    const dt = 0.016;
    const FRAMES = 600; // 10 seconds of simulation

    // Setup Entities
    // Projectiles starting near bottom
    for(let i=0; i<200; i++) {
        projectiles.push({
            x: 400 + Math.random()*50 - 25,
            y: 550,
            vx: 0,
            vy: -400,
            isEnemy: false,
            target: null // Pre-allocate for fairness, though not strictly needed in JS
        });
    }

    // Enemies scattered above
    for(let i=0; i<50; i++) {
        enemies.push({
            x: Math.random()*800,
            y: Math.random()*400,
            remove: false
        });
    }

    // Obstacles scattered above
    for(let i=0; i<20; i++) {
        obstacles.push({
            x: Math.random()*800,
            y: Math.random()*400,
            remove: false
        });
    }

    const GameState = {
        entities: { enemies, obstacles },
        activeEffects: { homing: 1 }
    };

    console.log(`Running ${FRAMES} frames with ${projectiles.length} projectiles, ${enemies.length} enemies, ${obstacles.length} obstacles.`);

    // ==========================================
    // BASELINE
    // ==========================================

    // Deep copy projectiles for baseline to reset state
    const projectilesBase = JSON.parse(JSON.stringify(projectiles));

    const startBase = performance.now();

    for(let f=0; f<FRAMES; f++) {
        // Move projectiles slightly to simulate game
        for(const p of projectilesBase) {
            p.y += p.vy * dt;
            p.x += p.vx * dt;
        }

        // Homing Logic
        for (const p of projectilesBase) {
            if (!p.isEnemy && GameState.activeEffects.homing > 0) {
                let best = null, minDistSq = 300 * 300;
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
                    const ang = Math.atan2(best.y - p.y, best.x - p.x);
                    const turnRate = 5 * dt;
                    p.vx += (Math.cos(ang) * 600 - p.vx) * turnRate;
                    p.vy += (Math.sin(ang) * 600 - p.vy) * turnRate;
                }
            }
        }
    }

    const endBase = performance.now();
    const timeBase = endBase - startBase;

    // ==========================================
    // OPTIMIZED
    // ==========================================

    // Deep copy projectiles for optimized run
    const projectilesOpt = JSON.parse(JSON.stringify(projectiles));
    // Ensure target is null initially
    projectilesOpt.forEach(p => p.target = null);

    const startOpt = performance.now();

    for(let f=0; f<FRAMES; f++) {
        // Move projectiles slightly
        for(const p of projectilesOpt) {
            p.y += p.vy * dt;
            p.x += p.vx * dt;
        }

        // Homing Logic
        for (const p of projectilesOpt) {
            if (!p.isEnemy && GameState.activeEffects.homing > 0) {
                let best = p.target;

                // Validate cached target
                if (best) {
                    // Check if removed, out of range, or behind (y < 0 check in original loop)
                    if (best.remove || best.y < 0) {
                        best = null;
                        p.target = null;
                    } else {
                         const dSq = distSq(best.x, best.y, p.x, p.y);
                         if (dSq > 300 * 300) {
                             best = null;
                             p.target = null;
                         }
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
                    if (best) p.target = best;
                }

                if (best) {
                    const ang = Math.atan2(best.y - p.y, best.x - p.x);
                    const turnRate = 5 * dt;
                    p.vx += (Math.cos(ang) * 600 - p.vx) * turnRate;
                    p.vy += (Math.sin(ang) * 600 - p.vy) * turnRate;
                }
            }
        }
    }

    const endOpt = performance.now();
    const timeOpt = endOpt - startOpt;

    console.log(`Baseline Time:  ${timeBase.toFixed(2)}ms`);
    console.log(`Optimized Time: ${timeOpt.toFixed(2)}ms`);
    console.log(`Improvement:    ${(timeBase / timeOpt).toFixed(2)}x speedup`);
    console.log(`Time saved:     ${(timeBase - timeOpt).toFixed(2)}ms`);

    return { baseline: timeBase, optimized: timeOpt };
}
