const canvas = document.getElementById('network-bg');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

// Configuration
const particleCount = 60;
const connectionDistance = 150;
const particleSpeed = 0.5;
const particleSize = 2;
const particleColor = 'rgba(138, 43, 226, 0.7)'; // Purple
const lineColor = 'rgba(138, 43, 226, 0.2)'; // Faint purple

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * particleSpeed;
        this.vy = (Math.random() - 0.5) * particleSpeed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, particleSize, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();
    }
}

function init() {
    resize();
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    // Update and draw particles
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
                ctx.beginPath();
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 1 - distance / connectionDistance;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animate);
}

// Mouse Interaction
let mouse = { x: null, y: null };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

// Modify animate function to include mouse interaction
function animate() {
    ctx.clearRect(0, 0, width, height);

    // Update and draw particles
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
                ctx.beginPath();
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 1 - distance / connectionDistance;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }

        // Connect to mouse
        if (mouse.x != null) {
            const dx = particles[i].x - mouse.x;
            const dy = particles[i].y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(187, 134, 252, 0.4)'; // Brighter connection for mouse
                ctx.lineWidth = 1 - distance / connectionDistance;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    resize();
    init();
});

init();
animate();

// Mobile Menu
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
});

document.querySelectorAll(".nav-links li a").forEach(n => n.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
}));

// Scroll Reveal Animation
const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
        }
    });
}, {
    root: null,
    threshold: 0.15,
});

revealElements.forEach(el => revealObserver.observe(el));

// Terminal Logic
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const promptText = '<span class="prompt">user@portfolio:~$</span>';

const commands = {
    help: "Commandes disponibles : help, about, skills, projects, contact, clear",
    about: "Je suis un étudiant passionné par les réseaux et la sécurité à l'IPI Toulouse.",
    skills: "Systèmes: Windows/Linux | Réseaux: Cisco/TCP-IP | Sécurité: Firewall/VPN",
    projects: "Tapez 'projects' pour voir mes réalisations récentes.",
    contact: "Email: contact@example.com",
    clear: "clear"
};

terminalInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        const input = this.value.toLowerCase().trim();
        let output = '';

        if (input === 'clear') {
            terminalOutput.innerHTML = `<div class="welcome-msg">Terminal effacé.</div><div class="input-line">${promptText}<input type="text" id="terminal-input" autocomplete="off" autofocus></div>`;
            // Re-attach event listener to new input (simplified for this demo, better to just clear previous lines)
            // For simplicity, we'll just clear the previous lines and keep the input
            const lines = terminalOutput.querySelectorAll('div:not(.input-line)');
            lines.forEach(line => line.remove());
            this.value = '';
            return;
        }

        if (commands[input]) {
            output = commands[input];
        } else if (input !== '') {
            output = `Commande non reconnue : ${input}. Tapez 'help' pour la liste.`;
        }

        if (input !== '') {
            // Create previous command line
            const historyLine = document.createElement('div');
            historyLine.innerHTML = `${promptText} ${input}`;
            terminalOutput.insertBefore(historyLine, this.parentElement);

            // Create output line
            if (output) {
                const outputLine = document.createElement('div');
                outputLine.style.marginBottom = '10px';
                outputLine.style.color = '#e0e0e0';
                outputLine.textContent = output;
                terminalOutput.insertBefore(outputLine, this.parentElement);
            }
        }

        this.value = '';
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
});

// Focus terminal input when clicking anywhere in the terminal body
document.querySelector('.terminal-body').addEventListener('click', () => {
    document.getElementById('terminal-input').focus();
});
