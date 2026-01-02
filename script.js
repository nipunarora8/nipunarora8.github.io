const canvas = document.getElementById('particle-canvas'); const ctx = canvas.getContext('2d');
let particles = []; const particleCount = 80; const connectionDistance = 120;
let mouse = { x: null, y: null, radius: 200 };
window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
window.addEventListener('mouseout', () => { mouse.x = undefined; mouse.y = undefined; });
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();
class Particle { constructor() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.vx = (Math.random() - 0.5) * 0.6; this.vy = (Math.random() - 0.5) * 0.6; this.size = Math.random() * 2; } update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > canvas.width) this.vx *= -1; if (this.y < 0 || this.y > canvas.height) this.vy *= -1; } draw() { ctx.fillStyle = 'rgba(216, 67, 57, 0.8)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); } }
function init() { particles = []; for (let i = 0; i < particleCount; i++) particles.push(new Particle()); }
function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < particles.length; i++) { particles[i].update(); particles[i].draw(); for (let j = i; j < particles.length; j++) { const dx = particles[i].x - particles[j].x; const dy = particles[i].y - particles[j].y; const dist = Math.sqrt(dx * dx + dy * dy); if (dist < connectionDistance) { ctx.beginPath(); ctx.strokeStyle = `rgba(216, 67, 57, ${(1 - dist / connectionDistance) * 0.5})`; ctx.lineWidth = 1.0; ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); } } if (mouse.x != undefined) { const dx = particles[i].x - mouse.x; const dy = particles[i].y - mouse.y; const dist = Math.sqrt(dx * dx + dy * dy); if (dist < mouse.radius) { ctx.beginPath(); ctx.strokeStyle = `rgba(216, 67, 57, ${(1 - dist / mouse.radius) * 0.5})`; ctx.lineWidth = 1; ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); } } } requestAnimationFrame(animate); }
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
    if (scrollPos > vh * 1.5) {
        document.body.classList.add('projects-visible');
    } else {
        document.body.classList.remove('projects-visible');
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
