const canvas = document.getElementById('network-bg');
const ctx = canvas.getContext('2d');

let width, height;
let circuits = [];
let pulses = [];

// Configuration
const config = {
    gridSize: 30, // Distance between potential nodes
    pathCount: 60, // Increased density
    pulseChance: 0.005, // Reduced frequency
    pulseSpeed: 3, // Slower, more elegant
    color: '#8a2be2', // Primary purple
    baseColor: 'rgba(138, 43, 226, 0.05)', // Faint static color
    highlightColor: 'rgba(138, 43, 226, 0.4)', // Mouse highlight
    mouseRadius: 200
};

// Mouse State
const mouse = {
    x: null,
    y: null
};

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

// Resize Handler
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initCircuits();
}

window.addEventListener('resize', resize);

class Circuit {
    constructor() {
        this.path = [];
        this.generatePath();
        this.highlighted = false;
    }

    generatePath() {
        // Start point (snapped to grid)
        let x = Math.floor(Math.random() * (width / config.gridSize)) * config.gridSize;
        let y = Math.floor(Math.random() * (height / config.gridSize)) * config.gridSize;

        this.path.push({ x, y });

        // Generate random path (Manhattan style)
        let length = Math.floor(Math.random() * 15) + 5; // Longer paths
        let currentX = x;
        let currentY = y;

        for (let i = 0; i < length; i++) {
            if (Math.random() > 0.5) {
                // Move Horizontal
                currentX += (Math.random() > 0.5 ? 1 : -1) * config.gridSize;
            } else {
                // Move Vertical
                currentY += (Math.random() > 0.5 ? 1 : -1) * config.gridSize;
            }
            this.path.push({ x: currentX, y: currentY });
        }
    }

    draw() {
        // Check distance to mouse for highlight
        let dist = Math.hypot(this.path[0].x - mouse.x, this.path[0].y - mouse.y);
        this.highlighted = dist < config.mouseRadius;

        ctx.beginPath();
        ctx.strokeStyle = this.highlighted ? config.highlightColor : config.baseColor;
        ctx.lineWidth = this.highlighted ? 2 : 1;

        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();

        // Draw nodes at corners
        ctx.fillStyle = this.highlighted ? config.color : config.baseColor;
        for (let p of this.path) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, this.highlighted ? 2 : 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Pulse {
    constructor(circuit) {
        this.circuit = circuit;
        this.pathIndex = 0;
        this.progress = 0; // 0 to 1 between current node and next node
        this.x = circuit.path[0].x;
        this.y = circuit.path[0].y;
        this.dead = false;
        this.speed = config.pulseSpeed;
        this.history = []; // For trail effect
    }

    update() {
        if (this.pathIndex >= this.circuit.path.length - 1) {
            this.dead = true;
            return;
        }

        // Store history for trail
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 10) this.history.shift();

        let p1 = this.circuit.path[this.pathIndex];
        let p2 = this.circuit.path[this.pathIndex + 1];

        let dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        this.progress += this.speed / dist;

        if (this.progress >= 1) {
            this.progress = 0;
            this.pathIndex++;
            if (this.pathIndex >= this.circuit.path.length - 1) {
                this.dead = true;
                return;
            }
            p1 = this.circuit.path[this.pathIndex];
            p2 = this.circuit.path[this.pathIndex + 1];
        }

        this.x = p1.x + (p2.x - p1.x) * this.progress;
        this.y = p1.y + (p2.y - p1.y) * this.progress;
    }

    draw() {
        // Draw Trail
        ctx.beginPath();
        ctx.strokeStyle = `rgba(138, 43, 226, 0.5)`;
        ctx.lineWidth = 2;
        if (this.history.length > 0) {
            ctx.moveTo(this.history[0].x, this.history[0].y);
            for (let p of this.history) {
                ctx.lineTo(p.x, p.y);
            }
        }
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        // Draw Head
        ctx.beginPath();
        ctx.shadowBlur = 15;
        ctx.shadowColor = config.color;
        ctx.fillStyle = '#fff';
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function initCircuits() {
    circuits = [];
    for (let i = 0; i < config.pathCount; i++) {
        circuits.push(new Circuit());
    }
}

function animate() {
    // Trail effect: instead of clearing, draw semi-transparent black
    ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
    ctx.fillRect(0, 0, width, height);
    // Note: If we want pure clear, use clearRect. 
    // But for "Tron" trails, the fade is nice. 
    // However, static circuits need to be redrawn every frame if we do this, 
    // or they will fade out? 
    // Actually, if we fillRect, everything fades. 
    // So we must redraw static circuits every frame on top.

    // To avoid static circuits becoming too bright or flickering if we draw them every frame with opacity,
    // we should probably just clearRect if we want a clean look, OR accept the fade.
    // Let's try clearRect for a cleaner look first, but use a "tail" for the pulse class itself.
    ctx.clearRect(0, 0, width, height);

    // Draw static circuits
    circuits.forEach(circuit => circuit.draw());

    // Spawn pulses
    if (Math.random() < config.pulseChance) {
        let randomCircuit = circuits[Math.floor(Math.random() * circuits.length)];
        pulses.push(new Pulse(randomCircuit));
    }

    // Mouse interaction: Spawn pulses on nearby circuits
    if (mouse.x) {
        circuits.forEach(circuit => {
            if (circuit.highlighted && Math.random() < 0.01) {
                pulses.push(new Pulse(circuit));
            }
        });
    }

    // Update and draw pulses
    for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].update();
        pulses[i].draw();
        if (pulses[i].dead) {
            pulses.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

// Initialize
resize();
animate();


// --- Email Copy Functionality ---
document.addEventListener('DOMContentLoaded', () => {
    const emailBtn = document.getElementById('email-copy-btn');
    const toast = document.getElementById('toast');

    if (emailBtn) {
        emailBtn.addEventListener('click', () => {
            const email = "contact@example.com";
            navigator.clipboard.writeText(email).then(() => {
                showToast();
            }).catch(err => {
                console.error('Erreur copie:', err);
            });
        });
    }

    function showToast() {
        toast.className = "toast show";
        setTimeout(() => {
            toast.className = toast.className.replace("show", "");
        }, 3000);
    }

    // Scroll Reveal
    const reveals = document.querySelectorAll('.reveal');

    function checkReveal() {
        const triggerBottom = window.innerHeight / 5 * 4;

        reveals.forEach(reveal => {
            const boxTop = reveal.getBoundingClientRect().top;
            if (boxTop < triggerBottom) {
                reveal.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', checkReveal);
    checkReveal(); // Initial check

    // Mobile Menu
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
});
