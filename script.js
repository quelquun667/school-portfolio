const canvas = document.getElementById('network-bg');
const ctx = canvas.getContext('2d');

let width, height;
let nodes = [];
let edges = [];
let pulses = [];

// Configuration
const config = {
    gridSize: 40, // Reduced size (was 60) for more density
    pulseCount: 30, // Increased pulse count for the denser grid
    pulseSpeed: 1.5,
    color: '#8a2be2',
    baseColor: 'rgba(138, 43, 226, 0)',
    highlightColor: 'rgba(138, 43, 226, 0.4)',
    mouseRadius: 90,
    // No drift config needed
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
    initNetwork();
}

window.addEventListener('resize', resize);

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.neighbors = [];
    }
}

class Pulse {
    constructor(startNode) {
        this.currentNode = startNode;
        this.targetNode = null;
        this.previousNode = null;
        this.progress = 0;
        this.speed = config.pulseSpeed;
        this.x = this.currentNode.x;
        this.y = this.currentNode.y;
        this.history = [];
        this.opacity = 1;
    }

    update() {
        // Movement
        if (!this.targetNode) {
            let choices = this.currentNode.neighbors;

            // Try to avoid going back if possible
            if (choices.length > 1 && this.previousNode) {
                choices = choices.filter(n => n !== this.previousNode);
            }

            if (choices.length > 0) {
                this.targetNode = choices[Math.floor(Math.random() * choices.length)];
            } else if (this.previousNode) {
                this.targetNode = this.previousNode;
            } else {
                return;
            }
        }

        if (this.targetNode) {
            let p1 = this.currentNode;
            let p2 = this.targetNode;

            let d1 = Math.abs(p2.x - p1.x);
            let d2 = Math.abs(p2.y - p1.y);
            let totalDist = d1 + d2;

            if (totalDist === 0) totalDist = 1;

            this.progress += this.speed / totalDist;

            if (this.progress >= 1) {
                this.previousNode = this.currentNode;
                this.currentNode = this.targetNode;
                this.targetNode = null;
                this.progress = 0;
            } else {
                let currentDist = this.progress * totalDist;
                if (currentDist < d1) {
                    this.x = p1.x + (p2.x > p1.x ? 1 : -1) * currentDist;
                    this.y = p1.y;
                } else {
                    this.x = p2.x;
                    this.y = p1.y + (p2.y > p1.y ? 1 : -1) * (currentDist - d1);
                }
            }
        }

        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 10) this.history.shift();
    }

    draw() {
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

        ctx.beginPath();
        ctx.shadowBlur = 10;
        ctx.shadowColor = config.color;
        ctx.fillStyle = `rgba(255, 255, 255, 1)`;
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function initNetwork() {
    nodes = [];
    edges = [];
    pulses = [];

    let cols = Math.ceil(width / config.gridSize);
    let rows = Math.ceil(height / config.gridSize);
    let grid = [];

    for (let y = 0; y < rows; y++) {
        let row = [];
        for (let x = 0; x < cols; x++) {
            let node = new Node(x * config.gridSize, y * config.gridSize);
            row.push(node);
            nodes.push(node);
        }
        grid.push(row);
    }

    // Determine Random Edge Start Node
    let startNode;
    const side = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left

    if (side === 0) { // Top
        startNode = grid[0][Math.floor(Math.random() * cols)];
    } else if (side === 1) { // Right
        startNode = grid[Math.floor(Math.random() * rows)][cols - 1];
    } else if (side === 2) { // Bottom
        startNode = grid[rows - 1][Math.floor(Math.random() * cols)];
    } else { // Left
        startNode = grid[Math.floor(Math.random() * rows)][0];
    }

    // Recursive Backtracker
    let visited = new Set();
    let stack = [startNode];
    visited.add(startNode);

    while (stack.length > 0) {
        let current = stack[stack.length - 1];
        let gx = Math.round(current.x / config.gridSize);
        let gy = Math.round(current.y / config.gridSize);
        let neighbors = [];

        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
            let nx = gx + dx;
            let ny = gy + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                let neighbor = grid[ny][nx];
                if (!visited.has(neighbor)) {
                    neighbors.push(neighbor);
                }
            }
        });

        if (neighbors.length > 0) {
            let next = neighbors[Math.floor(Math.random() * neighbors.length)];

            current.neighbors.push(next);
            next.neighbors.push(current);
            edges.push({ p1: current, p2: next });

            visited.add(next);
            stack.push(next);
        } else {
            stack.pop();
        }
    }

    // Add extra loops for "more routes" (20% of nodes get an extra connection)
    for (let i = 0; i < nodes.length * 0.2; i++) {
        let node = nodes[Math.floor(Math.random() * nodes.length)];
        let gx = Math.round(node.x / config.gridSize);
        let gy = Math.round(node.y / config.gridSize);

        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
            let nx = gx + dx;
            let ny = gy + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                let neighbor = grid[ny][nx];
                // Connect if not already connected
                if (!node.neighbors.includes(neighbor)) {
                    node.neighbors.push(neighbor);
                    neighbor.neighbors.push(node);
                    edges.push({ p1: node, p2: neighbor });
                }
            }
        });
    }

    // Spawn Pulses at Edge Start
    for (let i = 0; i < config.pulseCount; i++) {
        pulses.push(new Pulse(startNode));
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw Edges
    ctx.lineWidth = 2;
    for (let edge of edges) {
        let p1 = edge.p1;
        let p2 = edge.p2;

        let midX = (p1.x + p2.x) / 2;
        let midY = (p1.y + p2.y) / 2;

        let distMouse = Math.hypot(midX - mouse.x, midY - mouse.y);
        let opacityMouse = Math.max(0, 1 - (distMouse / config.mouseRadius));

        let opacityPulse = 0;
        for (let pulse of pulses) {
            let distPulse = Math.hypot(midX - pulse.x, midY - pulse.y);
            let op = Math.max(0, 1 - (distPulse / 150));
            if (op > opacityPulse) opacityPulse = op;
        }

        let opacity = Math.max(opacityMouse, opacityPulse);
        opacity = Math.pow(opacity, 2);

        if (opacity > 0.01) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(138, 43, 226, ${opacity})`;

            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p1.y);
            ctx.lineTo(p2.x, p2.y);

            ctx.stroke();

            if (opacity > 0.3) {
                ctx.fillStyle = `rgba(138, 43, 226, ${opacity})`;
                ctx.beginPath();
                ctx.arc(p1.x, p1.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Update Pulses
    for (let pulse of pulses) {
        pulse.update();
        pulse.draw();
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
