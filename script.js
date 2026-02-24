const canvas = document.getElementById('particle-canvas'); const ctx = canvas.getContext('2d');
let particles = []; let particleCount = 80; let connectionDistance = 120;
let mouse = { x: null, y: null, radius: 200, hoverTime: 0, hoverTarget: null };
window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
window.addEventListener('mouseout', () => { mouse.x = undefined; mouse.y = undefined; mouse.hoverTime = 0; mouse.hoverTarget = null; });
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

// Skills Settings
let isSkillsActive = false;
let constellations = [];
const skillsData = [
    { category: 'Languages', skills: ['Python', 'C++', 'HTML'] },
    { category: 'AI/ML', skills: ['PyTorch', 'TensorFlow', 'OpenCV', 'Scikit-Learn', 'Keras', 'NLP'] },
    { category: 'Hardware', skills: ['3D Printing', 'Arduino', 'Raspberry Pi'] },
    { category: 'Generative AI', skills: ['Generative AI', 'Agentic AI', "LLM", 'RAG', 'ChatGPT', 'Claude', 'LLaMa', "Gemini"] },
    { category: 'Product Development', skills: ['Product Development', 'DIY', '3D Design', '3D Printing', 'System Design', 'UI/UX'] },
];

let shootingStars = [];

function initConstellations() {
    constellations = [];
    const padding = 200; // Keep away from edges

    // Clear old text if any
    const overlay = document.getElementById('skills-overlay');
    if (overlay) overlay.innerHTML = '';

    skillsData.forEach(data => {
        // Constellations now have their own velocity to drift slowly
        const baseVx = (Math.random() - 0.5) * 0.4;
        const baseVy = (Math.random() - 0.5) * 0.4;
        constellations.push({
            x: padding + Math.random() * (canvas.width - padding * 2),
            y: padding + Math.random() * (canvas.height - padding * 2),
            vx: baseVx,
            vy: baseVy,
            category: data.category,
            skills: data.skills,
            shuffledSkills: [...data.skills].sort(() => Math.random() - 0.5), // Initialize shuffled pool
            particles: [],
            cooldown: 0,
            activeTextEl: null
        });
    });

    // Add extra particles for density ONLY during skills section
    while (particles.length < 150) {
        particles.push(new Particle(true)); // isExtra = true
    }
    connectionDistance = 100;

    // Distribute base particles to their nearest constellation
    particles.forEach((p) => {
        if (Math.random() < 0.6) { // Assign roughly 60% of ALL particles to clusters
            // Find the nearest constellation
            let nearestC = null;
            let minDist = Infinity;
            constellations.forEach(c => {
                const dx = c.x - p.x;
                const dy = c.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    minDist = dist;
                    nearestC = c;
                }
            });

            p.targetConstellation = nearestC;
            if (nearestC) {
                nearestC.particles.push(p);
            }
        } else {
            p.targetConstellation = null;
        }
    });
}

class Particle {
    constructor(isExtra = false) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseVx = (Math.random() - 0.5) * 0.6;
        this.baseVy = (Math.random() - 0.5) * 0.6;
        this.vx = this.baseVx;
        this.vy = this.baseVy;
        this.size = Math.random() * 2;
        this.targetConstellation = null;
        this.isExtra = isExtra;
        this.alpha = isExtra ? 0 : 1;
        this.fadeState = isExtra ? 'in' : 'none';
    }
    update() {
        if (this.fadeState === 'in') {
            this.alpha += 0.02;
            if (this.alpha >= 1) { this.alpha = 1; this.fadeState = 'none'; }
        } else if (this.fadeState === 'out') {
            this.alpha -= 0.02;
        }

        if (isSkillsActive && this.targetConstellation) {
            // Smooth, slow drift towards moving constellation
            const dx = this.targetConstellation.x - this.x;
            const dy = this.targetConstellation.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 60) {
                // Gentle pull towards center
                this.vx += dx * 0.0002;
                this.vy += dy * 0.0002;
            } else {
                // Minimal jitter for soothing feel
                this.vx += (Math.random() - 0.5) * 0.05;
                this.vy += (Math.random() - 0.5) * 0.05;
            }
            // Less friction, more flowing
            this.vx *= 0.98;
            this.vy *= 0.98;
        } else {
            // Normal drift
            if (!isSkillsActive) {
                // Gradually slow down from the burst speed back to normal slow drift
                this.baseVx *= 0.99;
                this.baseVy *= 0.99;

                // Keep a minimum speed
                if (Math.abs(this.baseVx) < 0.3) this.baseVx = Math.sign(this.baseVx) * 0.3 || (Math.random() - 0.5) * 0.6;
                if (Math.abs(this.baseVy) < 0.3) this.baseVy = Math.sign(this.baseVy) * 0.3 || (Math.random() - 0.5) * 0.6;

                this.vx = this.baseVx;
                this.vy = this.baseVy;
            }
        }

        this.x += this.vx;
        this.y += this.vy;

        // Bounce logic
        if (this.x < 0 || this.x > canvas.width) { this.baseVx *= -1; this.vx *= -1; }
        if (this.y < 0 || this.y > canvas.height) { this.baseVy *= -1; this.vy *= -1; }
    }
    draw() {
        ctx.fillStyle = `rgba(216, 67, 57, ${0.8 * this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class ShootingStar {
    constructor(x, y, textEl, skillName) {
        this.x = x;
        this.y = y;

        // Shoot towards the horizontal center loosely
        let dirX = x > canvas.width / 2 ? -1 : 1;

        // Give it a strong horizontal burst if it's low on the screen so it travels further before falling off
        let horizontalBurst = y > canvas.height * 0.6 ? 7 + Math.random() * 5 : 4 + Math.random() * 4;

        this.vx = dirX * horizontalBurst; // Pronounced diagonal burst
        // Always shoot downwards like a real falling shooting star
        this.vy = 5 + Math.random() * 4; // Fast downward drop

        this.size = 3;
        this.life = 1.0; // Life starts at 1.0 = opaque
        this.history = []; // For the fading streak trail
        this.textEl = textEl;
        this.skillName = skillName;
        this.textDisplayed = false;
    }
    update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 40) this.history.shift(); // Much longer trail length for shooting star effect
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.010; // Slower fade to accommodate longer tail

        // Reveal text midway through falling
        if (this.life < 0.8 && !this.textDisplayed && this.textEl) {
            this.textDisplayed = true;

            // Push text slightly further in the direction the star went
            let targetX = this.x + (this.vx * 6);
            let targetY = this.y + (this.vy * 2) - 15;

            // Keep within safe bounds of the screen
            const paddingX = 150;
            const paddingY = 80;

            targetX = Math.max(paddingX, Math.min(window.innerWidth - paddingX, targetX));
            targetY = Math.max(paddingY, Math.min(window.innerHeight - paddingY, targetY));

            this.textEl.style.left = `${targetX}px`;
            this.textEl.style.top = `${targetY}px`;

            this.textEl.classList.add('active');
        }
    }
    draw() {
        if (this.history.length === 0) return;
        ctx.beginPath();
        for (let i = 0; i < this.history.length; i++) {
            const point = this.history[i];
            const ratio = i / this.history.length;
            ctx.lineTo(point.x, point.y);
            // Thicker trail near the head
            ctx.lineWidth = this.size * ratio * 1.5;
            // Bright white/yellow transitioning to red-orange in the tail
            ctx.strokeStyle = `rgba(255, ${120 + ratio * 135}, ${ratio * 200}, ${this.life * ratio})`;
        }
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        // Tip of shooting star
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2); // Larger, brighter head
        ctx.fillStyle = `rgba(255, 255, 255, ${this.life})`;
        ctx.shadowBlur = 20; // Intense glow
        ctx.shadowColor = '#fff';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset for other particles
    }
}

function scrambleText(element, finalString) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let iterations = 0;
    const maxIterations = 20;

    const interval = setInterval(() => {
        let text = finalString.split('').map((letter, index) => {
            if (letter === ' ') return ' ';
            if (index < iterations / (maxIterations / finalString.length)) {
                return finalString[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
        }).join('');

        element.innerText = text;

        if (iterations >= maxIterations) {
            clearInterval(interval);
            element.innerText = finalString;
        }
        iterations += 1;
    }, 30);
}

function triggerShootingStar(constellation) {
    if (constellation.cooldown > 0) return;
    constellation.cooldown = 150; // Delay between stars

    // Reveal HTML Text Element along with shooting star
    const overlay = document.getElementById('skills-overlay');
    if (!overlay) return;

    // Fade out previous text if it exists
    if (constellation.activeTextEl) {
        const textToFade = constellation.activeTextEl;
        textToFade.classList.remove('active');
        setTimeout(() => { if (textToFade.parentElement) textToFade.remove(); }, 500);
    }

    // Pick random target skill from the shuffled pool
    if (!constellation.shuffledSkills || constellation.shuffledSkills.length === 0) {
        // Reshuffle when empty to ensure pure random without immediate repeats
        constellation.shuffledSkills = [...constellation.skills].sort(() => Math.random() - 0.5);
    }
    const skillName = constellation.shuffledSkills.pop();

    const textEl = document.createElement('div');
    textEl.className = 'skill-text';
    textEl.style.position = 'fixed';
    textEl.style.zIndex = '1000'; // Make sure it renders over other layers

    // Initial position, will be updated by shooting star
    textEl.style.left = `${constellation.x}px`;
    textEl.style.top = `${constellation.y}px`;

    // Crucial fix: Append direct to body to avoid CSS transform relative offsets
    document.body.appendChild(textEl);

    // Scramble effect applied here rather than direct innerText
    scrambleText(textEl, skillName);

    constellation.activeTextEl = textEl;

    shootingStars.push(new ShootingStar(constellation.x, constellation.y, textEl, skillName));

    // Auto fade out after reading time
    setTimeout(() => {
        if (constellation.activeTextEl === textEl) {
            textEl.classList.remove('active');
            setTimeout(() => { if (textEl.parentElement) textEl.remove(); }, 500);
            constellation.activeTextEl = null;
        }
    }, 2500);
}

function init() { particles = []; for (let i = 0; i < particleCount; i++) particles.push(new Particle()); if (isSkillsActive) initConstellations(); }
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Cull dead extra particles
    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].fadeState === 'out' && particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update & draw shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.update();
        star.draw();
        if (star.life <= 0) shootingStars.splice(i, 1);
    }

    // Cooldown ticks and drift for constellations
    for (let c of constellations) {
        if (c.cooldown > 0) c.cooldown--;
        if (isSkillsActive) {
            c.x += c.vx;
            c.y += c.vy;

            // Bounce constellations off edges slowly
            if (c.x < 100 || c.x > canvas.width - 100) c.vx *= -1;
            if (c.y < 100 || c.y > canvas.height - 100) c.vy *= -1;

            // Update text position if following drifting constellation (optional, we mostly reveal during star)
        }
    }

    let currentHoverTarget = null;

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDistance) {
                let opacity = (1 - dist / connectionDistance) * 0.5;
                // Dim connections between different clusters to keep them distinct looking
                if (isSkillsActive && particles[i].targetConstellation !== particles[j].targetConstellation && dist > 30) {
                    opacity *= 0.1;
                }

                const combinedAlpha = Math.min(particles[i].alpha, particles[j].alpha);
                opacity *= combinedAlpha;

                ctx.beginPath();
                ctx.strokeStyle = `rgba(216, 67, 57, ${opacity})`;
                ctx.lineWidth = 1.0;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
        if (mouse.x != undefined) {
            const dx = particles[i].x - mouse.x;
            const dy = particles[i].y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
                ctx.beginPath();
                let mOpacity = (1 - dist / mouse.radius) * 0.5 * particles[i].alpha;
                ctx.strokeStyle = `rgba(216, 67, 57, ${mOpacity})`;
                ctx.lineWidth = 1;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }
    }

    if (isSkillsActive && mouse.x != undefined) {
        // Find if near any constellation
        for (let c of constellations) {
            const dx = c.x - mouse.x;
            const dy = c.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) { // Hover radius
                currentHoverTarget = c;
                break;
            }
        }
    }

    // Trigger logic
    if (currentHoverTarget) {
        if (mouse.hoverTarget === currentHoverTarget) {
            mouse.hoverTime += 1;
            if (mouse.hoverTime > 20) { // Hover threshold (~1/3 second)
                triggerShootingStar(currentHoverTarget);
                // We do NOT reset hoverTime to 0 right away to prevent jittering targeting, cooldown manages the rate.
            }
        } else {
            mouse.hoverTarget = currentHoverTarget;
            mouse.hoverTime = 0;
        }
    } else {
        mouse.hoverTarget = null;
        mouse.hoverTime = 0;
    }

    requestAnimationFrame(animate);
}
init(); animate();

const textElement = document.getElementById('target-text');
const extruder = document.getElementById('extruder');
const hotend = document.getElementById('hotend');
const statusText = document.getElementById('status-text');

const printDuration = 5000;
let startTime = null;
let particleFrame = 0;

function spawnEffectParticle(type) {
    const p = document.createElement('div');
    p.className = type === 'spark' ? 'molten-spark' : 'heat-smoke';
    hotend.appendChild(p);
    const startX = 20 + (Math.random() - 0.5) * 10;
    const startY = 40;
    p.style.left = `${startX}px`; p.style.top = `${startY}px`;
    let opacity = 1; let top = startY; let left = startX;
    const speedY = type === 'spark' ? (Math.random() * 2 + 1) : (Math.random() * -1.5 - 0.5);
    const speedX = (Math.random() - 0.5) * 2;
    function animateParticle() { opacity -= 0.02; top += speedY; left += speedX; p.style.opacity = opacity; p.style.top = `${top}px`; p.style.left = `${left}px`; if (opacity > 0) requestAnimationFrame(animateParticle); else p.remove(); }
    animateParticle();
}

function triggerSleepingCat() { document.getElementById('sleepingCat').style.opacity = '1'; }

function animatePrint(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    const percentage = Math.min(progress / printDuration, 1);
    statusText.innerHTML = "SYSTEM: <span class='stat-highlight'>PRINTING...</span>";
    const textRect = textElement.getBoundingClientRect();
    const currentPrintWidth = textRect.width * percentage;
    const targetX = textRect.left + currentPrintWidth;
    const targetY = textRect.top + (textRect.height / 2);
    const jitterY = Math.sin(timestamp * 0.1) * 0.5;
    const jitterX = (Math.random() > 0.8) ? (Math.random() - 0.5) * 0.5 : 0;
    extruder.style.left = targetX + 'px'; extruder.style.top = targetY + 'px';
    textElement.style.clipPath = `polygon(0 0, ${percentage * 100}% 0, ${percentage * 100}% 100%, 0 100%)`;

    if (percentage < 1) {
        extruder.style.transform = `translate(-50%, -100%) translate(${jitterX}px, ${jitterY}px)`;
        particleFrame++;
        if (particleFrame % 5 === 0) spawnEffectParticle('smoke');
        if (particleFrame % 15 === 0) spawnEffectParticle('spark');
        requestAnimationFrame(animatePrint);
    } else {
        statusText.innerHTML = "SYSTEM: <span class='stat-highlight'>ONLINE</span>";
        document.getElementById('nozzleGlow').style.opacity = '0';
        document.querySelector('.fan-blades-spin').style.animation = 'none';
        document.querySelector('.drive-gear').style.animation = 'none';
        document.querySelector('.idler-gear').style.animation = 'none';
        extruder.style.transition = "top 1.5s ease-in-out, opacity 1.5s ease-in-out, transform 1.5s ease-in-out";
        extruder.style.top = "-250px"; extruder.style.opacity = "0"; extruder.style.transform = `translate(-50%, -100%)`;
        setTimeout(() => { triggerSleepingCat(); }, 1500);
    }
}
setTimeout(() => { requestAnimationFrame(animatePrint); }, 800);

const mainStage = document.getElementById('main-stage');
const uiLayer = document.getElementById('ui-layer');
const sceneOverlay = document.getElementById('scene-overlay');
const juteString = document.getElementById('jute-string');
let lightsOn = false; let hasScrolled = false;

const aboutLayer = document.querySelector('.about-content-layer');
const lampLeft = document.querySelector('.lamp-left');
const lampRight = document.querySelector('.lamp-right');
const juteContainer = document.querySelector('.jute-string-container');
const projectsSection = document.querySelector('.projects-section'); // Add direct reference

window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;
    const vh = window.innerHeight;

    // --- SNAP 1 (0vh) -> SNAP 2 (100vh): HERO TO ROOM ---

    // Toggle "Room Active" state when moving from Hero to Room
    // We want the room to "activate" (lamps/rope appear) as we leave the Hero section.
    if (scrollPos > vh * 0.5 && !hasScrolled) {
        hasScrolled = true;
        enterRoom();
    }
    else if (scrollPos < vh * 0.5 && hasScrolled) {
        hasScrolled = false;
        exitRoom();
    }

    // --- SNAP 2 (100vh) -> SNAP 3 (200vh): ROOM TO PROJECTS ---

    // 1. Fading out Room Elements (Lamps, Rope, About Card)
    // We are fully in the Room at 100vh.
    // As we scroll towards 200vh, fade them out.
    // Start fade at 1.2 * vh (early in the scroll) to be gone by 1.8 * vh.
    const startFade = vh * 1.2;
    const endFade = vh * 1.8;

    if (scrollPos > startFade) {
        let opacity = 1 - (scrollPos - startFade) / (endFade - startFade);
        opacity = Math.max(0, Math.min(1, opacity)); // Clamp between 0 and 1

        lampLeft.style.opacity = opacity;
        lampRight.style.opacity = opacity;
        juteContainer.style.opacity = opacity;

        // If lights are on, fade the card too. If off, it stays hidden (0).
        if (lightsOn) {
            aboutLayer.style.opacity = opacity;
        }

        // Disable pointer events when almost invisible
        if (opacity < 0.1) {
            aboutLayer.style.pointerEvents = 'none';
        } else if (lightsOn) {
            aboutLayer.style.pointerEvents = 'auto';
        }

    } else {
        // Reset to full opacity when back in the Room (or above)
        lampLeft.style.opacity = 1;
        lampRight.style.opacity = 1;
        juteContainer.style.opacity = 1;
        if (lightsOn) {
            aboutLayer.style.opacity = 1;
            aboutLayer.style.pointerEvents = 'auto';
        }
    }

    // 2. Projects Section Visibility
    // Snap 3 starts at 200vh. Trigger visibility as we approach it.
    // Using a class on body to manage global state triggers.
    if (scrollPos > vh * 1.5 && scrollPos < vh * 2.5) {
        document.body.classList.add('projects-visible');
    } else {
        document.body.classList.remove('projects-visible');
    }

    // --- SNAP 3 (200vh) -> SNAP 4 (300vh): PROJECTS TO SKILLS ---
    if (scrollPos > vh * 2.5 && scrollPos < vh * 3.5) {
        document.body.classList.add('skills-visible');
        if (!isSkillsActive) {
            isSkillsActive = true;
            initConstellations();
        }
    } else {
        document.body.classList.remove('skills-visible');
        if (isSkillsActive) {
            isSkillsActive = false;
            // Clear revealed text elements when leaving the section
            const overlay = document.getElementById('skills-overlay');
            if (overlay) overlay.innerHTML = '';

            // Clean up any pending text elements in memory
            constellations.forEach(c => {
                if (c.activeTextEl && c.activeTextEl.parentElement) c.activeTextEl.remove();
                c.activeTextEl = null;
            });

            // Smoothly release particles back to roaming freely
            particles.forEach(p => {
                if (p.targetConstellation) {
                    // Give clustered ones a slight burst outward so they scatter back into the background
                    p.baseVx = (Math.random() - 0.5) * 2;
                    p.baseVy = (Math.random() - 0.5) * 2;
                    p.vx = p.baseVx;
                    p.vy = p.baseVy;
                }
                p.targetConstellation = null;

                // Extra density particles smoothly fade out instead of abruptly disappearing
                if (p.isExtra) {
                    p.fadeState = 'out';
                }
            });
            connectionDistance = 120;
        }
    }

    // --- SNAP 4 (300vh) -> SNAP 5 (400vh): SKILLS TO EXPERIENCE ---
    if (scrollPos > vh * 3.5) {
        document.body.classList.add('exp-visible');
    } else {
        document.body.classList.remove('exp-visible');
    }
});

function enterRoom() { mainStage.classList.add('stage-recede'); uiLayer.classList.add('ui-hidden'); sceneOverlay.classList.add('scene-active'); }
function exitRoom() { mainStage.classList.remove('stage-recede'); uiLayer.classList.remove('ui-hidden'); sceneOverlay.classList.remove('scene-active'); }

juteString.addEventListener('click', () => {
    juteString.classList.remove('string-pulled'); void juteString.offsetWidth; juteString.classList.add('string-pulled');
    lightsOn = !lightsOn;
    if (lightsOn) { sceneOverlay.classList.add('lights-on'); } else { sceneOverlay.classList.remove('lights-on'); }
});

// Force Scroll to Top on Reload
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    // Reset internal state
    hasScrolled = false;
    document.body.classList.remove('projects-visible');
    exitRoom();
});

// --- Experience Section (Terminal) Interactivity ---

// --- Experience Option 3 (Terminal) Interactivity ---
const termLogs = {
    'cat max_planck.log': [
        "Reading log file /career/max_planck.log...",
        "Role: Research Assistant",
        "Company: Max Planck Institute for Human Development",
        "Date: Aug 2022 - Present",
        "Result: Engineered scalable AI workflows and automated large-scale LLM-driven research pipelines."
    ],
    'cat synergylabs.log': [
        "Reading log file /career/synergylabs.log...",
        "Role: Deep Learning Intern",
        "Company: SynergyLabs Technology",
        "Date: Nov 2021 - Mar 2022",
        "Result: Trained and deployed lightweight CV models on edge devices for intelligent traffic systems."
    ],
    'cat ineuron.log': [
        "Reading log file /career/ineuron.log...",
        "Role: Data Science Intern",
        "Company: iNeuron.ai",
        "Date: Jun 2021 - Aug 2021",
        "Result: Developed computer vision solutions for motion, face, and weapon detection in home security systems."
    ],
    'cat sabertooth.log': [
        "Reading log file /career/sabertooth.log...",
        "Role: Data Analyst Intern",
        "Company: Sabertooth Technologies",
        "Date: Oct 2020 - Mar 2021",
        "Result: Scraped and processed large-scale market data to build comparative e-commerce platforms."
    ]
};

function runTermCommand(cmd) {
    const history = document.getElementById('term-history');
    if (!history) return;

    // Echo command
    const cmdEl = document.createElement('p');
    cmdEl.className = 'term-line';
    cmdEl.innerHTML = `<span class="term-prompt">root@nipun:~#</span> ${cmd}`;
    history.appendChild(cmdEl);

    // Get response
    const lines = termLogs[cmd] || [`bash: ${cmd}: command not found`];

    // Simulate typing effect for response lines
    let delay = 100;
    lines.forEach(line => {
        setTimeout(() => {
            const outEl = document.createElement('p');
            outEl.className = 'term-line term-output';
            outEl.innerText = line;
            history.appendChild(outEl);

            // Auto scroll to bottom
            const body = document.querySelector('.term-body');
            body.scrollTop = body.scrollHeight;
        }, delay);
        delay += 300; // time between lines
    });
}

// --- Contact Section 3D Printer Animation ---
let scannerTimeouts = [];

function resetScannerSequence() {
    // Clear all pending timeouts to stop the current animation mid-flight
    scannerTimeouts.forEach(clearTimeout);
    scannerTimeouts = [];

    const gantry = document.getElementById('scanner-gantry');
    const bed = document.getElementById('scanner-bed');
    const links = document.querySelectorAll('.final-link');
    const projector = document.getElementById('laser-projector');

    if (bed) {
        bed.classList.remove('scanning', 'printing-burst', 'zoomed-in');
    }

    if (gantry) {
        gantry.style.opacity = '1';
        gantry.style.transition = 'none'; // Temporarily disable transition
        gantry.style.top = '-10%'; // Reset to start position
        void gantry.offsetWidth; // Force reflow to commit transition-none
        gantry.style.transition = 'top 4s linear, opacity 0.3s'; // Restore proper transitions
    }

    if (links) {
        links.forEach(link => link.classList.remove('printed'));
    }

    if (projector) {
        projector.innerHTML = '';
    }
}

const contactObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');

            // Trigger scanner animation when the section becomes visible
            if (entry.target.id === 'contact-final' && !entry.target.printTriggered) {
                entry.target.printTriggered = true;
                runScannerSequence();
            }
        } else {
            // When scrolling away, reset the animation state
            if (entry.target.id === 'contact-final') {
                entry.target.printTriggered = false;
                resetScannerSequence();
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.contact-section').forEach(sec => contactObserver.observe(sec));

function runScannerSequence() {
    const gantry = document.getElementById('scanner-gantry');
    const bed = document.getElementById('scanner-bed');
    const links = document.querySelectorAll('.final-link');
    const projector = document.getElementById('laser-projector');

    if (!gantry || !bed || !projector) return;

    // Flush any previous state just in case
    resetScannerSequence();

    // --- Generate Criss-Cross Lasers ---
    projector.innerHTML = ''; // Reset
    const numLasers = 40; // Dense enough to create the diamond criss-cross
    const color = '#3cff00ff'; // Only one color as requested

    for (let i = 0; i < numLasers; i++) {
        const laser = document.createElement('div');
        laser.className = 'dj-laser';

        // Single color beam
        laser.style.background = `linear-gradient(to bottom, ${color} 0%, transparent 100%)`;
        laser.style.boxShadow = `0 0 8px ${color}, 0 0 15px ${color}`;

        // Evenly space them along the bar
        laser.style.left = `${(i / numLasers) * 100}%`;

        projector.appendChild(laser);

        // Stagger the initial start times so they don't all sweep in perfect unison
        scannerTimeouts.push(setTimeout(() => {
            animateLaser(laser);
        }, Math.random() * 500));
    }

    // Function to recursively animate a single laser
    function animateLaser(laser) {
        if (!bed.classList.contains('scanning')) return;

        // Smooth wide sweeps (-45 to 45 degrees) for criss-cross effect
        const targetAngle = (Math.random() - 0.5) * 60;
        // Slower, smoother duration
        const duration = 400 + Math.random() * 400;

        // Keep opacity consistent to maintain the structure
        laser.style.opacity = '';

        // Ease-in-out makes it look mechanical and deliberate
        laser.style.transition = `transform ${duration}ms ease-in-out, opacity 200ms`;
        laser.style.transform = `rotateX(-80deg) rotateZ(${targetAngle}deg)`;

        scannerTimeouts.push(setTimeout(() => {
            if (bed.classList.contains('scanning')) animateLaser(laser);
        }, duration));
    }

    // --- Sequence Timing ---

    // 1. Activate scanning mode (turns lasers on)
    bed.classList.add('scanning');

    // 2. Start moving gantry across the bed
    scannerTimeouts.push(setTimeout(() => {
        gantry.style.top = '110%'; // Sweep down
    }, 500));

    // 3. First Row Hit (~25% down the bed)
    scannerTimeouts.push(setTimeout(() => {
        bed.classList.add('printing-burst'); // Flash ALL lasers brighter and thicker
        if (links[0]) links[0].classList.add('printed');
        if (links[1]) links[1].classList.add('printed');

        scannerTimeouts.push(setTimeout(() => { bed.classList.remove('printing-burst'); }, 200));
    }, 1700));

    // 4. Second Row Hit (~75% down the bed)
    scannerTimeouts.push(setTimeout(() => {
        bed.classList.add('printing-burst');
        if (links[2]) links[2].classList.add('printed');
        if (links[3]) links[3].classList.add('printed');

        scannerTimeouts.push(setTimeout(() => { bed.classList.remove('printing-burst'); }, 200));
    }, 3350));

    // 5. Cleanup and Zoom In
    scannerTimeouts.push(setTimeout(() => {
        bed.classList.remove('scanning'); // Turns lasers off
        gantry.style.opacity = '0'; // Hide the gantry cleanly
        projector.innerHTML = ''; // Delete lasers to save DOM

        scannerTimeouts.push(setTimeout(() => {
            bed.classList.add('zoomed-in');
        }, 500));
    }, 4500));
}
