// ========================================
// AGARTHA: FALSE GUIDE - Renderer
// Procedural Asset Rendering System
// ========================================

let canvas, ctx;
let canvasWidth, canvasHeight;

// Star field background
const stars = [];
const STAR_COUNT = 100;

// Animation time tracker
let animTime = 0;

// ========================================
// Initialize Renderer
// ========================================

export function initRenderer() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize star field
    initStars();

    console.log('Renderer initialized:', canvasWidth, 'x', canvasHeight);
    return { canvas, ctx };
}

function resizeCanvas() {
    const aspectRatio = 9 / 16;
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    if (maxWidth / maxHeight < aspectRatio) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth / aspectRatio;
    } else {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * aspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    initStars();
}

export function getCanvasSize() {
    return { width: canvasWidth, height: canvasHeight };
}

// ========================================
// Star Field
// ========================================

function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.5 + 0.3
        });
    }
}

function updateStars(dt) {
    for (const star of stars) {
        star.y += star.speed * dt * 60;
        if (star.y > canvasHeight) {
            star.y = 0;
            star.x = Math.random() * canvasWidth;
        }
    }
}

function drawStars() {
    for (const star of stars) {
        // Optimization: Use rgba instead of changing globalAlpha state
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
}

// ========================================
// Clear & Background
// ========================================

export function clear() {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

export function drawBackground(dt) {
    animTime += dt;
    updateStars(dt);
    drawStars();
}

// ========================================
// PLAYER SHIP (Kael's Vrill Fighter)
// ========================================

export function drawPlayer(player) {
    const { x, y, width, height, invincible, invincibleTimer } = player;

    // Flicker when invincible
    if (invincible && Math.floor(Date.now() / 80) % 2 === 0) {
        drawShieldEffect(x, y, width, height);
        return;
    }

    ctx.save();
    ctx.translate(x, y);

    // Engine flame (animated)
    drawEngineFlame(0, height * 0.35, width * 0.4, true);

    // Wings (swept back)
    ctx.fillStyle = '#2a5a8a';
    ctx.beginPath();
    ctx.moveTo(-width * 0.1, 0);
    ctx.lineTo(-width * 0.55, height * 0.4);
    ctx.lineTo(-width * 0.45, height * 0.3);
    ctx.lineTo(-width * 0.15, height * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(width * 0.1, 0);
    ctx.lineTo(width * 0.55, height * 0.4);
    ctx.lineTo(width * 0.45, height * 0.3);
    ctx.lineTo(width * 0.15, height * 0.1);
    ctx.closePath();
    ctx.fill();

    // Main hull (elongated diamond)
    const gradient = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
    gradient.addColorStop(0, '#5aa0e9');
    gradient.addColorStop(0.5, '#4a90d9');
    gradient.addColorStop(1, '#2a5a8a');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(0, -height * 0.5);           // Nose
    ctx.lineTo(width * 0.25, height * 0.1); // Right side
    ctx.lineTo(width * 0.15, height * 0.4); // Right rear
    ctx.lineTo(0, height * 0.3);            // Center rear
    ctx.lineTo(-width * 0.15, height * 0.4);// Left rear
    ctx.lineTo(-width * 0.25, height * 0.1);// Left side
    ctx.closePath();
    ctx.fill();

    // Hull edge highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cockpit (cyan glow)
    const cockpitGrad = ctx.createRadialGradient(0, -height * 0.15, 0, 0, -height * 0.15, width * 0.12);
    cockpitGrad.addColorStop(0, '#ffffff');
    cockpitGrad.addColorStop(0.3, '#00ffff');
    cockpitGrad.addColorStop(1, '#006666');
    ctx.fillStyle = cockpitGrad;
    ctx.beginPath();
    ctx.ellipse(0, -height * 0.15, width * 0.1, height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vrill glow aura
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.5);
    ctx.lineTo(width * 0.25, height * 0.1);
    ctx.lineTo(width * 0.15, height * 0.4);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Shield effect when invincible
    if (invincible) {
        drawShieldEffect(x, y, width, height);
    }
}

function drawEngineFlame(x, y, size, isPlayer) {
    const flicker = Math.sin(animTime * 20) * 0.2 + 0.8;
    const flameLength = size * 1.5 * flicker;

    // Outer flame (orange)
    const outerGrad = ctx.createLinearGradient(x, y, x, y + flameLength);
    outerGrad.addColorStop(0, isPlayer ? '#ff6600' : '#ff3300');
    outerGrad.addColorStop(1, 'rgba(255, 102, 0, 0)');
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, y);
    ctx.lineTo(x + size * 0.5, y);
    ctx.lineTo(x + size * 0.2 + Math.random() * 3, y + flameLength * 0.7);
    ctx.lineTo(x, y + flameLength);
    ctx.lineTo(x - size * 0.2 - Math.random() * 3, y + flameLength * 0.7);
    ctx.closePath();
    ctx.fill();

    // Inner flame (yellow-white)
    const innerGrad = ctx.createLinearGradient(x, y, x, y + flameLength * 0.6);
    innerGrad.addColorStop(0, '#ffffff');
    innerGrad.addColorStop(0.5, '#ffff00');
    innerGrad.addColorStop(1, 'rgba(255, 255, 0, 0)');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.25, y);
    ctx.lineTo(x + size * 0.25, y);
    ctx.lineTo(x, y + flameLength * 0.6);
    ctx.closePath();
    ctx.fill();
}

function drawShieldEffect(x, y, width, height) {
    const pulse = Math.sin(animTime * 8) * 0.15 + 0.35;
    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = `rgba(0, 255, 255, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;

    // Hexagonal shield
    ctx.beginPath();
    const shieldSize = Math.max(width, height) * 0.8;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * shieldSize;
        const py = Math.sin(angle) * shieldSize;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

// ========================================
// ENEMY SCOUT (Dossam Scout)
// ========================================

export function drawEnemy(enemy) {
    const { x, y, width, height, type } = enemy;

    if (type === 'elite') {
        drawEnemyElite(x, y, width, height, enemy);
        return;
    }

    // Void Larva (Scout)
    ctx.save();
    ctx.translate(x, y);

    // Organic pulsing body
    const pulse = Math.sin(animTime * 10) * 0.1 + 0.9;
    ctx.scale(pulse, pulse);

    // Main body (Teardrop shape)
    const gradient = ctx.createRadialGradient(0, -height * 0.2, 0, 0, 0, height * 0.6);
    gradient.addColorStop(0, '#4a0000');
    gradient.addColorStop(1, '#2a0020');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(0, height * 0.5);
    ctx.bezierCurveTo(width * 0.6, height * 0.2, width * 0.5, -height * 0.4, 0, -height * 0.5);
    ctx.bezierCurveTo(-width * 0.5, -height * 0.4, -width * 0.6, height * 0.2, 0, height * 0.5);
    ctx.fill();

    // Veins
    ctx.strokeStyle = 'rgba(153, 0, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Single glowing eye
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, -height * 0.1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Pupil
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, -height * 0.1, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawEnemyElite(x, y, width, height, enemy) {
    ctx.save();
    ctx.translate(x, y);

    // Void Hunter (Spider-like)

    // Legs/Claws
    ctx.strokeStyle = '#330000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Left Claw
    ctx.moveTo(-width * 0.2, 0);
    ctx.quadraticCurveTo(-width * 0.6, -height * 0.2, -width * 0.4, height * 0.4);
    // Right Claw
    ctx.moveTo(width * 0.2, 0);
    ctx.quadraticCurveTo(width * 0.6, -height * 0.2, width * 0.4, height * 0.4);
    ctx.stroke();

    // Main Body (Armored Carapace)
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.5);
    gradient.addColorStop(0, '#4a0000');
    gradient.addColorStop(1, '#1a0000');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.35, height * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Purple Veins
    const pulse = Math.sin(animTime * 5) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(153, 0, 255, ${pulse * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.3);
    ctx.lineTo(0, height * 0.3);
    ctx.moveTo(-width * 0.2, -height * 0.1);
    ctx.lineTo(width * 0.2, -height * 0.1);
    ctx.stroke();

    // Multiple Eyes
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 8;

    // Central eye
    ctx.beginPath(); ctx.arc(0, -height * 0.15, 4, 0, Math.PI * 2); ctx.fill();
    // Side eyes
    ctx.beginPath(); ctx.arc(-width * 0.15, -height * 0.05, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(width * 0.15, -height * 0.05, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
}

// ========================================
// BOSS SHIP (Emperor Sael's Warship)
// ========================================

export function drawBoss(boss) {
    if (!boss) return;
    const { x, y, width, height, phase, flashTimer } = boss;

    ctx.save();
    ctx.translate(x, y);

    const isFlashing = flashTimer > 0;
    if (isFlashing) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = '#fff';
    }

    // Eldritch Tentacles (Sine wave limbs)
    const tentacleCount = 6 + (phase * 2);
    ctx.strokeStyle = '#2a0020';
    ctx.lineWidth = 6;
    for (let i = 0; i < tentacleCount; i++) {
        const angle = (i / tentacleCount) * Math.PI * 2 + animTime;
        const len = width * 0.8;

        ctx.beginPath();
        for (let j = 0; j < 10; j++) {
            const dist = (j / 10) * len;
            const wave = Math.sin(animTime * 5 + j + angle) * 15 * (phase * 0.5 + 0.5);
            const px = Math.cos(angle) * dist + Math.sin(angle) * wave;
            const py = Math.sin(angle) * dist + Math.cos(angle) * wave;
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }

    // Central Core (Pulsing)
    const pulse = Math.sin(animTime * 3) * 0.1 + 1;
    ctx.scale(pulse, pulse);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.4);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.6, '#4a0000');
    gradient.addColorStop(1, '#1a001a');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.arc(0, 0, width * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // The Great Eye
    if (phase >= 1) {
        // Sclera
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.ellipse(0, 0, width * 0.25, width * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Slit Pupil
        ctx.fillStyle = '#000';
        const pupilWidth = width * 0.05 * (Math.sin(animTime) * 0.5 + 1); // Dilating
        ctx.beginPath();
        ctx.ellipse(0, 0, pupilWidth, width * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye Shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(width * 0.08, -width * 0.05, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Phase 3 Aura
    if (phase >= 3) {
        ctx.strokeStyle = 'rgba(153, 0, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, width * 0.6, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

function drawBossFlame(x, y, size, phase) {
    const flicker = Math.sin(animTime * 25 + x) * 0.3 + 0.7;
    const flameLength = size * 2.5 * flicker;

    const color1 = phase >= 3 ? '#9900ff' : '#ff3300';
    const color2 = phase >= 3 ? '#ff00ff' : '#ff6600';

    const grad = ctx.createLinearGradient(x, y, x, y - flameLength);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, y);
    ctx.lineTo(x + size * 0.5, y);
    ctx.lineTo(x, y - flameLength);
    ctx.closePath();
    ctx.fill();
}

// ========================================
// PROJECTILES
// ========================================

export function drawProjectile(proj) {
    const { x, y, isEnemy, isBoss } = proj;

    if (isBoss) {
        drawBossProjectile(x, y);
    } else if (isEnemy) {
        drawEnemyProjectile(x, y);
    } else {
        drawPlayerProjectile(x, y);
    }
}

function drawPlayerProjectile(x, y) {
    // Trailing effect
    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main bolt
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.ellipse(x, y, 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // White core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, y, 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}

function drawEnemyProjectile(x, y) {
    ctx.fillStyle = '#ff3300';
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 10;

    // Outer glow
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Bright core
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}

function drawBossProjectile(x, y) {
    // Spinning ring effect
    const spinAngle = animTime * 5;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spinAngle);

    // Particle ring
    ctx.strokeStyle = 'rgba(153, 0, 153, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();

    // Dark purple orb
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 8);
    grad.addColorStop(0, '#ff0000');
    grad.addColorStop(0.5, '#660066');
    grad.addColorStop(1, '#330033');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#660066';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}

// ========================================
// COLLECTIBLES (Elixir/Raw Milk)
// ========================================

export function drawCollectible(item) {
    const { x, y } = item;

    // Bobbing animation
    const bob = Math.sin(animTime * 4 + x) * 3;
    const drawY = y + bob;

    ctx.save();
    ctx.translate(x, drawY);

    // Golden glow aura
    ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Milk carton body
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;

    // Carton shape
    ctx.beginPath();
    ctx.moveTo(-8, -12);  // Top left
    ctx.lineTo(8, -12);   // Top right
    ctx.lineTo(8, 10);    // Bottom right
    ctx.lineTo(-8, 10);   // Bottom left
    ctx.closePath();
    ctx.fill();

    // Peaked top
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.lineTo(0, -18);
    ctx.lineTo(8, -12);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    // Cream accent stripe
    ctx.fillStyle = '#fffacd';
    ctx.fillRect(-6, -8, 12, 4);

    // Vrill mark.
    ctx.fillStyle = '#00ffff';
    ctx.strokeStyle = '#00ffff';
    drawIcon(ctx, 'heart', 12);

    // Sparkle particles
    const sparkle = Math.sin(animTime * 8 + x) > 0.7;
    if (sparkle) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(10 + Math.random() * 5, -5 + Math.random() * 10, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// ========================================
// OBSTACLES (Asteroids)
// ========================================

export function generateObstacleVertices(seed, radius) {
    const vertices = 7;
    const points = [];
    for (let i = 0; i < vertices; i++) {
        const angle = (i / vertices) * Math.PI * 2;
        const variance = 0.7 + (((seed * (i + 1)) % 100) / 100) * 0.5;
        const vx = Math.cos(angle) * radius * variance;
        const vy = Math.sin(angle) * radius * variance;
        points.push({ x: vx, y: vy });
    }
    return points;
}

export function drawObstacle(obs) {
    const { x, y, radius, health, maxHealth, flashTimer, seed: obsSeed } = obs;

    // Use stored seed for consistent shape, fallback to old method if missing
    const seed = obsSeed || (Math.floor(x * y) % 1000);

    ctx.save();
    ctx.translate(x, y);

    // Slow rotation
    ctx.rotate(animTime * 0.05 + seed * 0.01);

    // Flash white when hit
    const isFlashing = !!(flashTimer && flashTimer > 0);

    // Caching Strategy: Reuse gradient if state hasn't changed
    if (!obs._renderCache) {
        obs._renderCache = {};
    }

    if (!obs._renderCache.gradient || obs._renderCache.isFlashing !== isFlashing) {
        let baseColor1, baseColor2;
        if (isFlashing) {
            baseColor1 = '#ffffff';
            baseColor2 = '#dddddd';
        } else {
            baseColor1 = '#6b5b4f';
            baseColor2 = '#4a4a4a';
        }

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, baseColor1);
        gradient.addColorStop(1, baseColor2);

        obs._renderCache.gradient = gradient;
        obs._renderCache.isFlashing = isFlashing;
    }

    ctx.fillStyle = obs._renderCache.gradient;

    ctx.beginPath();
    const vertices = obs.vertices || generateObstacleVertices(seed, radius);
    if (vertices.length > 0) {
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
    }
    ctx.closePath();
    ctx.fill();

    // Edge (changes color based on damage)
    const currentHealth = health || 1;
    const currentMaxHealth = maxHealth || 1;
    const damageRatio = 1 - (currentHealth / currentMaxHealth);

    if (isFlashing) {
        ctx.strokeStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
    } else if (damageRatio > 0) {
        // Show damage with orange/red edge
        ctx.strokeStyle = damageRatio > 0.5 ? '#ff4400' : '#ff8800';
    } else {
        ctx.strokeStyle = '#333333';
    }
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Craters
    ctx.fillStyle = isFlashing ? '#cccccc' : '#3a3a3a';
    ctx.beginPath();
    ctx.arc(-radius * 0.25, -radius * 0.2, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(radius * 0.2, radius * 0.15, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Draw damage cracks if asteroid has been hit
    if (damageRatio > 0 && !isFlashing) {
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Crack 1
        ctx.moveTo(0, 0);
        ctx.lineTo(radius * 0.6, radius * 0.3);
        if (damageRatio > 0.3) {
            // Crack 2
            ctx.moveTo(0, 0);
            ctx.lineTo(-radius * 0.5, -radius * 0.4);
        }
        if (damageRatio > 0.6) {
            // Crack 3
            ctx.moveTo(0, 0);
            ctx.lineTo(radius * 0.2, -radius * 0.7);
        }
        ctx.stroke();

        // Glowing core when heavily damaged
        if (damageRatio > 0.5) {
            ctx.fillStyle = `rgba(255, 100, 0, ${damageRatio * 0.4})`;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

// ========================================
// EXPLOSIONS
// ========================================

export function drawExplosion(x, y, progress) {
    const maxRadius = 50;
    const radius = maxRadius * progress;
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer ring (orange)
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Middle ring (yellow)
    ctx.strokeStyle = '#ffd93d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow (white-yellow)
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.5);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#ffd93d');
    grad.addColorStop(1, 'rgba(255, 107, 53, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Debris particles
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + progress * 2;
        const dist = radius * 0.8;
        const px = x + Math.cos(angle) * dist;
        const py = y + Math.sin(angle) * dist;

        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// ========================================
// TEXT & HUD
// ========================================

function drawIcon(ctx, type, size) {
    ctx.save();
    const scale = size / 20;
    ctx.scale(scale, scale);

    switch (type) {
        case 'speed':
            ctx.beginPath();
            ctx.moveTo(2, -8);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-1, 0);
            ctx.lineTo(-3, 8);
            ctx.lineTo(4, -1);
            ctx.lineTo(1, -1);
            ctx.closePath();
            ctx.fill();
            break;
        case 'shield':
            ctx.beginPath();
            ctx.moveTo(-6, -6);
            ctx.lineTo(6, -6);
            ctx.lineTo(6, 0);
            ctx.quadraticCurveTo(0, 8, -6, 0);
            ctx.closePath();
            ctx.fill();
            break;
        case 'fireRate':
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.quadraticCurveTo(5, -2, 5, 3);
            ctx.quadraticCurveTo(5, 8, 0, 8);
            ctx.quadraticCurveTo(-5, 8, -5, 3);
            ctx.quadraticCurveTo(-5, -2, 0, -8);
            ctx.fill();
            break;
        case 'triple':
            ctx.fillRect(-6, -4, 3, 8);
            ctx.fillRect(-1.5, -4, 3, 8);
            ctx.fillRect(3, -4, 3, 8);
            break;
        case 'heart':
            ctx.beginPath();
            ctx.moveTo(0, -3);
            ctx.bezierCurveTo(4, -8, 9, -3, 0, 6);
            ctx.bezierCurveTo(-9, -3, -4, -8, 0, -3);
            ctx.fill();
            break;
        case 'homing':
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(0, 8);
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
            break;
        case 'vrill':
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const x = Math.cos(angle) * 7;
                const y = Math.sin(angle) * 7;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            break;
    }

    ctx.restore();
}

export function drawPowerUp(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);

    // Gentle bobbing animation
    const bob = Math.sin(Date.now() / 200 + p.bobTimer) * 3;
    ctx.translate(0, bob);

    // Icon/Color based on type
    let color = '#fff';

    switch (p.type) {
        case 'speed': color = '#00ffff'; break;
        case 'shield': color = '#4444ff'; break;
        case 'fireRate': color = '#ffaa00'; break;
        case 'triple': color = '#ff00ff'; break;
        case 'heart': color = '#ff0000'; break;
        case 'homing': color = '#00ff00'; break;
        case 'vrill': color = '#ffffff'; break;
    }

    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    // Draw Diamond Shape
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw Icon
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.shadowBlur = 0;
    drawIcon(ctx, p.type, 14);

    ctx.restore();
}

export function drawText(text, x, y, options = {}) {
    const {
        size = 20,
        color = '#ffffff',
        align = 'center',
        shadow = true
    } = options;

    ctx.font = `${size}px 'Segoe UI', sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';

    if (shadow) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(text, x + 2, y + 2);
    }

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

export function drawMissionProgress(mission) {
    const { type, current, target, timeLimit, timeElapsed } = mission;

    let text = '';
    switch (type) {
        case 'survive':
            const remaining = Math.max(0, timeLimit - timeElapsed);
            text = `SURVIVE: ${Math.ceil(remaining)}s`;
            break;
        case 'collect':
            text = `ELIXIR: ${current}/${target}`;
            break;
        case 'destroy':
            text = `DESTROY: ${current}/${target}`;
            break;
        case 'flawless':
            text = `FLAWLESS: ${current}/${target}`;
            break;
    }

    drawText(text, canvasWidth / 2, 50, { size: 18, color: '#ffd93d' });
}
