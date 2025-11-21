const canvas = document.getElementById('network-bg');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

// --- Cyber Hex Shield Animation ---
const hexSize = 30;
const hexHeight = hexSize * 2;
const hexWidth = Math.sqrt(3) * hexSize;
const vertDist = hexHeight * 0.75;
let hexagons = [];

class Hexagon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.color = '#111'; // Base color
        this.targetColor = '#111';
        this.intensity = 0;
    }

    draw() {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = 2 * Math.PI / 6 * i;
            const x_i = this.x + hexSize * Math.cos(angle);
            const y_i = this.y + hexSize * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x_i, y_i);
            } else {
                ctx.lineTo(x_i, y_i);
            }
        }
        ctx.closePath();

        // Fill
        const r = Math.floor(17 + this.intensity * (138 - 17)); // From #111 to #8a2be2 (Purple)
        const g = Math.floor(17 + this.intensity * (43 - 17));
        const b = Math.floor(17 + this.intensity * (226 - 17));

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fill();

        // Stroke
        ctx.strokeStyle = `rgba(138, 43, 226, ${0.1 + this.intensity * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    update(mouseX, mouseY) {
        // Decay intensity
        this.intensity *= 0.95;

        // Mouse interaction
        if (mouseX != null) {
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
                this.intensity += (1 - dist / 150) * 0.2;
            }
        }

        // Random pulse
        if (Math.random() < 0.001) {
            this.intensity = 1;
        }

        // Clamp intensity
        if (this.intensity > 1) this.intensity = 1;
        if (this.intensity < 0) this.intensity = 0;
    }
}

function initAnimation() {
    resize();
    hexagons = [];
    let row = 0;
    for (let y = -hexHeight; y < height + hexHeight; y += vertDist) {
        let col = 0;
        const offset = (row % 2) * (hexWidth / 2);
        for (let x = -hexWidth; x < width + hexWidth; x += hexWidth) {
            hexagons.push(new Hexagon(x + offset, y));
            col++;
        }
        row++;
    }
}

let mouse = { x: null, y: null };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

function animate() {
    ctx.clearRect(0, 0, width, height);

    // Dark background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    hexagons.forEach(hex => {
        hex.update(mouse.x, mouse.y);
        hex.draw();
    });

    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    resize();
    initAnimation();
});

initAnimation();
animate();

// --- Mobile Menu ---
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

// --- Scroll Reveal ---
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

// --- Terminal Logic ---
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const promptText = '<span class="prompt">user@portfolio:~$</span>';

const commands = {
    help: `
        <div class="command-output">
            <strong>Commandes disponibles :</strong>
            <ul>
                <li><strong>about</strong> : En savoir plus sur moi</li>
                <li><strong>skills</strong> : Mes compétences techniques</li>
                <li><strong>projects</strong> : Mes projets récents</li>
                <li><strong>contact</strong> : Comment me joindre</li>
                <li><strong>clear</strong> : Effacer le terminal</li>
            </ul>
        </div>
    `,
    about: `
        <div class="command-output">
            <p>Je suis un étudiant passionné par les <strong>réseaux</strong> et la <strong>sécurité</strong> à l'IPI Toulouse.</p>
            <p>J'aime comprendre comment les choses fonctionnent "sous le capot" et sécuriser les infrastructures.</p>
        </div>
    `,
    skills: `
        <div class="command-output">
            <strong>Mes Compétences :</strong>
            <ul>
                <li>Systèmes : Windows Server, Linux (Debian/RedHat)</li>
                <li>Réseaux : Cisco CCNA, Routing, Switching</li>
                <li>Sécurité : Pfsense, VPN, Hardening</li>
            </ul>
        </div>
    `,
    projects: `
        <div class="command-output">
            <p>Tapez <a href="#projects" style="color:var(--accent-color)">ce lien</a> ou scrollez pour voir mes projets en détail.</p>
        </div>
    `,
    contact: `
        <div class="command-output">
            <p>Email : <a href="mailto:contact@example.com" style="color:var(--primary-color)">contact@example.com</a></p>
            <p>LinkedIn : <a href="#" style="color:var(--primary-color)">Mon Profil</a></p>
        </div>
    `,
    clear: "clear"
};

terminalInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        const input = this.value.toLowerCase().trim();
        let output = '';

        if (input === 'clear') {
            terminalOutput.innerHTML = `<div class="welcome-msg">Terminal effacé.</div><div class="input-line">${promptText}<input type="text" id="terminal-input" autocomplete="off"></div>`;
            // Re-attach event listener is tricky here without re-binding. 
            // Better approach: Don't destroy the input, just clear siblings.
            // For simplicity in this vanilla JS, we'll just reload the page logic or keep it simple.
            // Actually, let's just clear the previous logs and keep the input.
            const logs = terminalOutput.querySelectorAll('.log-entry, .welcome-msg');
            logs.forEach(log => log.remove());
            this.value = '';
            return;
        }

        if (commands[input]) {
            output = commands[input];
        } else if (input !== '') {
            output = `<div class="command-output" style="color:red">Commande non reconnue : ${input}. Tapez 'help'.</div>`;
        }

        if (input !== '') {
            // Create log entry container
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';

            // Previous command
            const cmdLine = document.createElement('div');
            cmdLine.innerHTML = `${promptText} ${input}`;
            logEntry.appendChild(cmdLine);

            // Output
            if (output) {
                const outDiv = document.createElement('div');
                outDiv.innerHTML = output;
                logEntry.appendChild(outDiv);
            }

            // Insert before the input line
            terminalOutput.insertBefore(logEntry, this.parentElement);
        }

        this.value = '';
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
});

document.querySelector('.terminal-body').addEventListener('click', () => {
    document.getElementById('terminal-input').focus();
});

// --- Email Copy to Clipboard ---
const emailBtn = document.getElementById('email-copy-btn');
const toast = document.getElementById('toast');

if (emailBtn) {
    emailBtn.addEventListener('click', () => {
        const email = "contact@example.com";
        navigator.clipboard.writeText(email).then(() => {
            showToast();
        }).catch(err => {
            console.error('Erreur copie :', err);
        });
    });
}

function showToast() {
    toast.className = "toast show";
    setTimeout(function () { toast.className = toast.className.replace("show", ""); }, 3000);
}
