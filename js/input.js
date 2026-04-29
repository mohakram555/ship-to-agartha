// ========================================
// AGARTHA: FALSE GUIDE - Input Handler
// ========================================

export const Input = {
    // Current input state
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    action: false,  // For dialogue advance, menu select
    pause: false,   // Pause toggle

    // Device type
    isMobile: false
};

// ========================================
// Controller State
// ========================================

let gamepadIndex = null;
let gamepadConnected = false;
let lastGamepad = null;

// Controller configuration
const CONTROLLER_CONFIG = {
    DEADZONE: 0.25,           // Analog stick deadzone (0.0-1.0)
    VIBRATION_DURATION: 100,  // Default vibration duration (ms)

    // DualShock / PlayStation button indices
    // Standard mapping: https://w3c.github.io/gamepad/#remapping
    BUTTONS: {
        CROSS: 0,      // X (Cross) - Fire/Action
        CIRCLE: 1,     // O (Circle) - Action
        SQUARE: 2,     // □ (Square)
        TRIANGLE: 3,   // △ (Triangle)
        L1: 4,         // Left Bumper
        R1: 5,         // Right Bumper
        L2: 6,         // Left Trigger
        R2: 7,         // Right Trigger - Fire
        SHARE: 8,      // Share / Select
        OPTIONS: 9,    // Options / Start - Pause
        L3: 10,        // Left Stick Press
        R3: 11,        // Right Stick Press
        DPAD_UP: 12,
        DPAD_DOWN: 13,
        DPAD_LEFT: 14,
        DPAD_RIGHT: 15,
        PS_BUTTON: 16, // PlayStation button
        TOUCHPAD: 17   // Touchpad press (DualShock 4+)
    },

    // Analog axes indices
    AXES: {
        LEFT_X: 0,
        LEFT_Y: 1,
        RIGHT_X: 2,
        RIGHT_Y: 3
    }
};

// ========================================
// Initialize Input System
// ========================================

export function initInput(canvas) {
    // Detect mobile
    Input.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || ('ontouchstart' in window);

    // Keyboard events
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse events (for desktop testing)
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Gamepad events
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Mobile Controls Logic
    if (Input.isMobile) {
        setupMobileControls();
    }

    console.log('Input initialized. Mobile:', Input.isMobile);
}

// ========================================
// Gamepad / Controller Support
// ========================================

function handleGamepadConnected(e) {
    gamepadIndex = e.gamepad.index;
    gamepadConnected = true;
    lastGamepad = e.gamepad;

    // Log controller info
    const gp = e.gamepad;
    console.log(`🎮 Controller connected: ${gp.id}`);
    console.log(`   Index: ${gp.index}, Buttons: ${gp.buttons.length}, Axes: ${gp.axes.length}`);

    // Identify controller type
    const id = gp.id.toLowerCase();
    if (id.includes('dualshock') || id.includes('playstation') || id.includes('sony') || id.includes('054c')) {
        console.log('   Type: PlayStation DualShock / DualSense');
    } else if (id.includes('xbox') || id.includes('microsoft')) {
        console.log('   Type: Xbox Controller');
    } else {
        console.log('   Type: Generic Controller');
    }

    // Hide mobile controls when controller is connected
    hideMobileControls();

    // Welcome vibration
    // triggerVibration(200, 0.3, 0.3);
}

function handleGamepadDisconnected(e) {
    if (e.gamepad.index === gamepadIndex) {
        console.log(`🎮 Controller disconnected: ${e.gamepad.id}`);
        gamepadIndex = null;
        gamepadConnected = false;
        lastGamepad = null;

        // Show mobile controls again if on mobile
        if (Input.isMobile) {
            showMobileControls();
        }
    }
}


/**
 * Check if a controller is currently connected
 */
export function isControllerConnected() {
    return gamepadConnected;
}

/**
 * Get connected controller info
 */
export function getControllerInfo() {
    if (!gamepadConnected || !lastGamepad) return null;
    return {
        id: lastGamepad.id,
        index: lastGamepad.index,
        buttons: lastGamepad.buttons.length,
        axes: lastGamepad.axes.length,
        connected: true
    };
}

/**
 * Trigger controller vibration (DualShock/Xbox)
 * @param {number} duration - Duration in milliseconds
 * @param {number} weakMagnitude - Weak motor intensity (0.0-1.0) - high frequency
 * @param {number} strongMagnitude - Strong motor intensity (0.0-1.0) - low frequency
 */
export function triggerVibration(duration = 100, weakMagnitude = 0.5, strongMagnitude = 0.5) {
    if (gamepadIndex === null) return;

    // Get fresh gamepad state
    const gamepads = navigator.getGamepads();
    const gp = gamepads[gamepadIndex];
    
    if (!gp) return;

    // Check for vibration support
    const actuator = gp.vibrationActuator;
    if (actuator && actuator.playEffect) {
        // Modern Gamepad API (Chrome)
        actuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: duration,
            weakMagnitude: Math.min(1, Math.max(0, weakMagnitude)),
            strongMagnitude: Math.min(1, Math.max(0, strongMagnitude))
        }).catch((e) => {
            // Silently fail if vibration not supported
            // console.warn('Vibration failed:', e);
        });
    } else if (gp.hapticActuators && gp.hapticActuators.length > 0) {
        // Fallback for older API
        gp.hapticActuators[0].pulse(strongMagnitude, duration).catch(() => { });
    }
}

/**
 * Preset vibration patterns for game events
 */
export const VibrationPatterns = {
    // Light tap for collecting items
    collect: () => triggerVibration(50, 0.2, 0.1),

    // Medium pulse for taking damage
    damage: () => triggerVibration(150, 0.6, 0.8),

    // Strong jolt for explosions/death
    explosion: () => triggerVibration(300, 1.0, 1.0),

    // Quick double tap for power-up
    powerUp: () => {
        triggerVibration(80, 0.4, 0.3);
        setTimeout(() => triggerVibration(80, 0.4, 0.3), 120);
    },

    // Subtle continuous for engine/thrust (call repeatedly)
    thrust: () => triggerVibration(50, 0.1, 0.15),

    // Boss hit confirmation
    bossHit: () => triggerVibration(100, 0.5, 0.4),

    // Menu navigation feedback
    menuMove: () => triggerVibration(30, 0.15, 0.1),
    menuSelect: () => triggerVibration(60, 0.3, 0.2)
};

// ========================================
// Menu Navigation (Controller)
// ========================================

let menuNavDebounce = { up: 0, down: 0, left: 0, right: 0, select: 0 };
const MENU_NAV_DELAY = 200; // ms between menu moves
let controllerUsedRecently = false;
let cursorHidden = false;

/**
 * Menu Navigation Manager
 * Handles controller-based menu navigation
 */
export const MenuNavigation = {
    /**
     * Get all visible, focusable buttons in priority order
     */
    getFocusableButtons() {
        // Check different menu contexts in priority order
        const selectors = [
            // Victory/Fail overlay (highest priority)
            '#victory-overlay:not(.hidden) button:not(.hidden)',
        // Pause overlay
        '#pause-overlay:not(.hidden) button:not(.hidden)',
            // Upgrades overlay
            '#upgrades-overlay:not(.hidden) button:not(.hidden)',
            // Level select overlay
            '#level-select-overlay:not(.hidden) button:not(.hidden)',
            // Main menu overlay
            '#menu-overlay:not(.hidden) button:not(.hidden)',
        ];

        for (const selector of selectors) {
            const buttons = document.querySelectorAll(selector);
            if (buttons.length > 0) {
                return Array.from(buttons).filter(btn => {
                    const style = window.getComputedStyle(btn);
                    return style.display !== 'none' && style.visibility !== 'hidden' && !btn.disabled;
                });
            }
        }
        return [];
    },

    /**
     * Get currently focused button or null
     */
    getCurrentFocused() {
        return document.activeElement?.tagName === 'BUTTON' ? document.activeElement : null;
    },

    /**
     * Focus a specific button with visual highlight
     */
    focusButton(button) {
        if (!button) return;
        button.focus();
        button.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    /**
     * Navigate to next/previous button
     * @param {number} direction - 1 for next, -1 for previous
     */
    navigate(direction) {
        const buttons = this.getFocusableButtons();
        if (buttons.length === 0) return;

        const current = this.getCurrentFocused();
        let currentIndex = buttons.indexOf(current);

        if (currentIndex === -1) {
            // No button focused, focus first/last based on direction
            currentIndex = direction > 0 ? -1 : buttons.length;
        }

        let nextIndex = currentIndex + direction;

        // Wrap around
        if (nextIndex < 0) nextIndex = buttons.length - 1;
        if (nextIndex >= buttons.length) nextIndex = 0;

        this.focusButton(buttons[nextIndex]);
        VibrationPatterns.menuMove();
    },

    /**
     * Navigate in 2D grid layout (for level select)
     * @param {'up'|'down'|'left'|'right'} direction
     */
    navigateGrid(direction) {
        const buttons = this.getFocusableButtons();
        if (buttons.length === 0) return;

        let current = this.getCurrentFocused();
        
        // If current focus is not in the visible list, ignore it
        if (current && !buttons.includes(current)) {
            current = null;
        }

        if (!current) {
            this.focusButton(buttons[0]);
            VibrationPatterns.menuMove();
            return;
        }

        // Get grid layout info
        const currentRect = current.getBoundingClientRect();
        const currentCenter = {
            x: currentRect.left + currentRect.width / 2,
            y: currentRect.top + currentRect.height / 2
        };

        let best = null;
        let bestScore = Infinity;

        for (const btn of buttons) {
            if (btn === current) continue;

            const rect = btn.getBoundingClientRect();
            const center = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            const dx = center.x - currentCenter.x;
            const dy = center.y - currentCenter.y;

            // Check if button is in the right direction
            let valid = false;
            let score = 0;

            switch (direction) {
                case 'up':
                    valid = dy < -10;
                    score = Math.abs(dy) + Math.abs(dx) * 2;
                    break;
                case 'down':
                    valid = dy > 10;
                    score = Math.abs(dy) + Math.abs(dx) * 2;
                    break;
                case 'left':
                    valid = dx < -10;
                    score = Math.abs(dx) + Math.abs(dy) * 2;
                    break;
                case 'right':
                    valid = dx > 10;
                    score = Math.abs(dx) + Math.abs(dy) * 2;
                    break;
            }

            if (valid && score < bestScore) {
                bestScore = score;
                best = btn;
            }
        }

        if (best) {
            this.focusButton(best);
            VibrationPatterns.menuMove();
        }
    },

    /**
     * Select/click the currently focused button
     */
    select() {
        const current = this.getCurrentFocused();
        if (current) {
            VibrationPatterns.menuSelect();
            current.click();
            return true;
        }

        // If nothing focused, try to focus first button
        const buttons = this.getFocusableButtons();
        if (buttons.length > 0) {
            this.focusButton(buttons[0]);
            return false;
        }
        return false;
    },

    /**
     * Check if any menu is currently open
     */
    isMenuOpen() {
        return this.getFocusableButtons().length > 0;
    }
};

/**
 * Hide/show cursor based on controller usage
 */
function updateCursorVisibility() {
    if (controllerUsedRecently && !cursorHidden) {
        document.body.style.cursor = 'none';
        cursorHidden = true;
    }
}

function showCursor() {
    if (cursorHidden) {
        document.body.style.cursor = '';
        cursorHidden = false;
        controllerUsedRecently = false;
    }
}

// Show cursor on any mouse movement
document.addEventListener('mousemove', showCursor);
document.addEventListener('mousedown', showCursor);

/**
 * Poll menu navigation from controller
 * Should be called in pollGamepad when menu is open
 */
function pollMenuNavigation() {
    if (!gamepadConnected || gamepadIndex === null) return;

    const gamepads = navigator.getGamepads();
    const gp = gamepads[gamepadIndex];
    if (!gp) return;

    const { DEADZONE, BUTTONS, AXES } = CONTROLLER_CONFIG;
    const now = Date.now();

    // Check if any menu is open
    if (!MenuNavigation.isMenuOpen()) return;

    // Mark controller as recently used
    controllerUsedRecently = true;
    updateCursorVisibility();

    // Left stick for navigation
    const lx = gp.axes[AXES.LEFT_X] || 0;
    const ly = gp.axes[AXES.LEFT_Y] || 0;

    // D-pad and stick navigation with debouncing
    const navUp = ly < -DEADZONE || gp.buttons[BUTTONS.DPAD_UP]?.pressed;
    const navDown = ly > DEADZONE || gp.buttons[BUTTONS.DPAD_DOWN]?.pressed;
    const navLeft = lx < -DEADZONE || gp.buttons[BUTTONS.DPAD_LEFT]?.pressed;
    const navRight = lx > DEADZONE || gp.buttons[BUTTONS.DPAD_RIGHT]?.pressed;

    const isLevelSelect = !document.getElementById('level-select-overlay').classList.contains('hidden');

    // Up navigation
    if (navUp && now - menuNavDebounce.up > MENU_NAV_DELAY) {
        menuNavDebounce.up = now;
        if (isLevelSelect) {
            MenuNavigation.navigateGrid('up');
        } else {
            MenuNavigation.navigate(-1);
        }
    }

    // Down navigation
    if (navDown && now - menuNavDebounce.down > MENU_NAV_DELAY) {
        menuNavDebounce.down = now;
        if (isLevelSelect) {
            MenuNavigation.navigateGrid('down');
        } else {
            MenuNavigation.navigate(1);
        }
    }

    // Left navigation
    if (navLeft && now - menuNavDebounce.left > MENU_NAV_DELAY) {
        menuNavDebounce.left = now;
        MenuNavigation.navigateGrid('left');
    }

    // Right navigation
    if (navRight && now - menuNavDebounce.right > MENU_NAV_DELAY) {
        menuNavDebounce.right = now;
        MenuNavigation.navigateGrid('right');
    }

    // Select with X/Cross or Circle button
    const selectPressed = gp.buttons[BUTTONS.CROSS]?.pressed || gp.buttons[BUTTONS.CIRCLE]?.pressed;
    if (selectPressed && now - menuNavDebounce.select > MENU_NAV_DELAY * 1.5) {
        menuNavDebounce.select = now;
        MenuNavigation.select();
    }
}

// Override pollGamepad with menu-aware version
const pollGamepadWithMenu = () => {
    if (!gamepadConnected || gamepadIndex === null) return;

    const gamepads = navigator.getGamepads();
    const gp = gamepads[gamepadIndex];
    if (!gp) return;

    lastGamepad = gp;

    // Always check menu navigation first
    pollMenuNavigation();

    // Pause toggle (Options / Start)
    if (gp.buttons[CONTROLLER_CONFIG.BUTTONS.OPTIONS]?.pressed) {
        Input.pause = true;
    }

    // If menu is open, don't update game input
    if (MenuNavigation.isMenuOpen()) {
        // Clear game inputs when in menu
        Input.up = false;
        Input.down = false;
        Input.left = false;
        Input.right = false;
        Input.fire = false;
        Input.action = false;
        return;
    }

    // Regular game input polling
    const { DEADZONE, BUTTONS, AXES } = CONTROLLER_CONFIG;

    // Left analog stick for movement
    const lx = gp.axes[AXES.LEFT_X] || 0;
    const ly = gp.axes[AXES.LEFT_Y] || 0;

    // Apply deadzone and set movement
    Input.left = lx < -DEADZONE;
    Input.right = lx > DEADZONE;
    Input.up = ly < -DEADZONE;
    Input.down = ly > DEADZONE;

    // D-pad as alternative movement (overrides stick if pressed)
    if (gp.buttons[BUTTONS.DPAD_UP]?.pressed) Input.up = true;
    if (gp.buttons[BUTTONS.DPAD_DOWN]?.pressed) Input.down = true;
    if (gp.buttons[BUTTONS.DPAD_LEFT]?.pressed) Input.left = true;
    if (gp.buttons[BUTTONS.DPAD_RIGHT]?.pressed) Input.right = true;

    // Fire: X (Cross) button OR R2 trigger
    const r2Value = gp.buttons[BUTTONS.R2]?.value || 0;
    Input.fire = gp.buttons[BUTTONS.CROSS]?.pressed || r2Value > 0.5;

    // Action: X (Cross) OR Circle button (for dialogue/menus)
    Input.action = gp.buttons[BUTTONS.CROSS]?.pressed || gp.buttons[BUTTONS.CIRCLE]?.pressed;
};

// Export the menu-aware pollGamepad function
export { pollGamepadWithMenu as pollGamepad };


// ========================================
// Mobile Controls
// ========================================

function hideMobileControls() {
    const controls = document.getElementById('mobile-controls');
    if (controls) {
        controls.classList.remove('visible');
        controls.classList.add('hidden');
    }
}

function showMobileControls() {
    const controls = document.getElementById('mobile-controls');
    if (controls) {
        controls.classList.remove('hidden');
        controls.classList.add('visible');
    }
}

function setupMobileControls() {
    const controls = document.getElementById('mobile-controls');
    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');
    const fireBtn = document.getElementById('btn-fire');

    if (!controls || !joystickZone || !joystickKnob || !fireBtn) return;

    // Show controls
    controls.classList.remove('hidden');
    controls.classList.add('visible');

    // Joystick State
    let joystickActive = false;
    let joystickCenter = { x: 0, y: 0 };
    const maxRadius = 40; // Max distance knob can move

    // Joystick Touch Handlers
    joystickZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = joystickZone.getBoundingClientRect();

        joystickActive = true;
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        updateJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    joystickZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (joystickActive) {
            updateJoystick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
    }, { passive: false });

    joystickZone.addEventListener('touchend', (e) => {
        e.preventDefault();
        resetJoystick();
    }, { passive: false });

    // Joystick Logic
    function updateJoystick(clientX, clientY) {
        let dx = clientX - joystickCenter.x;
        let dy = clientY - joystickCenter.y;

        // Calculate distance and clamp to max radius
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > maxRadius) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * maxRadius;
            dy = Math.sin(angle) * maxRadius;
        }

        // Move Knob
        joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        // Update Input State based on threshold
        const threshold = 10;
        Input.right = dx > threshold;
        Input.left = dx < -threshold;
        Input.down = dy > threshold;
        Input.up = dy < -threshold;
    }

    function resetJoystick() {
        joystickActive = false;
        joystickKnob.style.transform = `translate(-50%, -50%)`;
        Input.left = false;
        Input.right = false;
        Input.up = false;
        Input.down = false;
    }

    // Fire Button Handlers
    fireBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        fireBtn.classList.add('active');
        Input.fire = true;
        Input.action = true; // Use fire button for dialogue interactions too
    }, { passive: false });

    fireBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        fireBtn.classList.remove('active');
        Input.fire = false;
        Input.action = false;
    }, { passive: false });
}

// ========================================
// Keyboard Handlers
// ========================================

function handleKeyDown(e) {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
            Input.up = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            Input.down = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            Input.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            Input.right = true;
            break;
        case 'Space':
            Input.fire = true;
            break;
        case 'Enter':
        case 'KeyE':
            Input.action = true;
            break;
        case 'Escape':
        case 'KeyP':
            Input.pause = true;
            break;
    }
}

function handleKeyUp(e) {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
            Input.up = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            Input.down = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            Input.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            Input.right = false;
            break;
        case 'Space':
            Input.fire = false;
            break;
        case 'Enter':
        case 'KeyE':
            Input.action = false;
            break;
        case 'Escape':
        case 'KeyP':
            // Don't clear pause on key up to ensure it's caught by game loop
            break;
    }
}

// ========================================
// Mouse Handlers (Desktop)
// ========================================

function handleMouseDown(e) {
    // Basic mouse support for testing on desktop
    Input.fire = true;
    Input.action = true;
}

function handleMouseUp(e) {
    Input.fire = false;
    Input.action = false;
}

function handleMouseMove(e) {
    // Reserved for future mouse-tracking features
}

// ========================================
// Utility
// ========================================

export function resetInput() {
    Input.up = false;
    Input.down = false;
    Input.left = false;
    Input.right = false;
    Input.fire = false;
    Input.action = false;
    Input.pause = false;
}

// Consume action (returns true once, then false)
let actionConsumed = false;
export function consumeAction() {
    if (Input.action && !actionConsumed) {
        actionConsumed = true;
        setTimeout(() => { actionConsumed = false; }, 100);
        return true;
    }
    return false;
}

let pauseConsumed = false;
export function consumePause() {
    if (Input.pause && !pauseConsumed) {
        // console.log('Pause consumed');
        pauseConsumed = true;
        setTimeout(() => { pauseConsumed = false; }, 300); // Higher debounce for pause

        // Clear input so it acts as a trigger
        Input.pause = false;
        return true;
    }
    return false;
}
