/**
 * confetti.js
 * A lightweight, branded confetti burst utility for StarBridge gamification rewards.
 * Uses CSS animation approach — no external library needed.
 */

const COLORS = ['#FBBF24', '#F59E0B', '#EF4444', '#10B981', '#6366F1', '#FFFFFF'];
const STAR_EMOJIS = ['⭐', '🌟', '✨', '🏆', '🎉'];

let confettiContainer = null;

function ensureContainer() {
    if (document.getElementById('sb-confetti-container')) {
        return document.getElementById('sb-confetti-container');
    }
    const container = document.createElement('div');
    container.id = 'sb-confetti-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
    `;
    document.body.appendChild(container);
    confettiContainer = container;
    return container;
}

function createParticle(container, x, y) {
    const particle = document.createElement('div');
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const size = Math.random() * 10 + 6;
    const angle = Math.random() * 360;
    const velocityX = (Math.random() - 0.5) * 400;
    const velocityY = -(Math.random() * 300 + 200);
    const duration = Math.random() * 800 + 600;
    const isEmoji = Math.random() > 0.7;

    if (isEmoji) {
        particle.textContent = STAR_EMOJIS[Math.floor(Math.random() * STAR_EMOJIS.length)];
        particle.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            font-size: ${size + 8}px;
            user-select: none;
            animation: sb-confetti-fall ${duration}ms ease-out forwards;
            --vx: ${velocityX}px;
            --vy: ${velocityY}px;
        `;
    } else {
        particle.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            animation: sb-confetti-fall ${duration}ms ease-out forwards;
            --vx: ${velocityX}px;
            --vy: ${velocityY}px;
            transform: rotate(${angle}deg);
        `;
    }

    container.appendChild(particle);
    setTimeout(() => particle.remove(), duration + 100);
}

function injectStyles() {
    if (document.getElementById('sb-confetti-styles')) return;
    const style = document.createElement('style');
    style.id = 'sb-confetti-styles';
    style.textContent = `
        @keyframes sb-confetti-fall {
            0% {
                transform: translate(0, 0) rotate(0deg) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(var(--vx), calc(var(--vy) * -1 + 400px)) rotate(720deg) scale(0);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Burst confetti from a specific element or default to screen center.
 * @param {HTMLElement|null} targetElement - Optional element to burst from
 * @param {number} count - Number of particles
 */
export function burstConfetti(targetElement = null, count = 40) {
    injectStyles();
    const container = ensureContainer();

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
    }

    for (let i = 0; i < count; i++) {
        setTimeout(() => createParticle(container, x, y), Math.random() * 150);
    }
}

/**
 * Play a short chime sound for star rewards.
 * Uses the Web Audio API — no external files needed.
 */
export function playStarChime() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();

        const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        frequencies.forEach((freq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

            gainNode.gain.setValueAtTime(0, ctx.currentTime + index * 0.08);
            gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + index * 0.08 + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.3);

            oscillator.start(ctx.currentTime + index * 0.08);
            oscillator.stop(ctx.currentTime + index * 0.08 + 0.35);
        });
    } catch (e) {
        console.warn('[StarChime] Audio context not available:', e);
    }
}
