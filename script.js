const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const glitchEffect = document.querySelector('.glitch-effect');
const bgMusic = document.getElementById('bg-music');
const collectSound = document.getElementById('collect-sound');
const endsound = document.getElementById('end-sound');

const leaderboardEntries = document.getElementById('leaderboard-entries');
const gameOverScreen = document.getElementById('game-over-screen');
const backBtn = document.getElementById('back-btn');

const musicControl = document.getElementById('music-control');
const musicIcon = document.getElementById('music-icon');
const musicTitle = document.getElementById('music-title');
const musicTracks = [
    { title: "SPACE", file: "assets/music.mp3" },
    { title: "NIGHT TAPES", file: "assets/music2.mp3" },
    { title: "VERBATIM", file: "assets/music3.mp3" },
    { title: "ARCANE", file: "assets/music4.mp3" },
    { title: "WHY?", file: "assets/music5.mp3" },
    { title: "HOTLINE MIAMI", file: "assets/music6.mp3" }
];
let currentTrack = 0;

const playerFrames = [
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><rect fill="%2300FF00" x="3" y="3" width="9" height="9"/><rect fill="%2300FF00" x="5" y="2" width="5" height="1"/><rect fill="%2300FF00" x="2" y="6" width="1" height="3"/><rect fill="%2300FF00" x="12" y="6" width="1" height="3"/><rect fill="%2300FF00" x="4" y="12" width="2" height="3"/><rect fill="%2300FF00" x="9" y="12" width="2" height="3"/></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><rect fill="%2300FF00" x="3" y="3" width="9" height="9"/><rect fill="%2300FF00" x="5" y="2" width="5" height="1"/><rect fill="%2300FF00" x="2" y="6" width="1" height="3"/><rect fill="%2300FF00" x="12" y="6" width="" height="2"/><rect fill="%2300FF00" x="4" y="12" width="2" height="3"/><rect fill="%2300FF00" x="9" y="12" width="2" height="0"/></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><rect fill="%2300FF00" x="3" y="3" width="9" height="9"/><rect fill="%2300FF00" x="5" y="2" width="5" height="1"/><rect fill="%2300FF00" x="2" y="6" width="1" height="0"/><rect fill="%2300FF00" x="12" y="6" width="1" height="3"/><rect fill="%2300FF00" x="4" y="12" width="2" height="0"/><rect fill="%2300FF00" x="9" y="12" width="2" height="3"/></svg>',
];
let score = 0;
let isGameRunning = false;
let playerX = window.innerWidth / 2;
const playerRadius = 7.5;
const digitWidth = 24;
const digitHeight = 24;
let currentFrame = 0;
let animationInterval;
let activeDigits = [];

const SPAWN_INTERVAL_MS = 300;
let lastSpawnTime = 0;
const MAX_SPAWNS_PER_CALL = 3;
const thresholds = [50, 100];

function setupAudio() {
    bgMusic.volume = 0.3;
    collectSound.volume = 0.4;
    endsound.volume = 0.4;
}

function setupMusicControl() {
    musicControl.addEventListener('click', () => {
        currentTrack = (currentTrack + 1) % musicTracks.length;
        const track = musicTracks[currentTrack];

        if (!bgMusic.paused) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }

        bgMusic.src = track.file;
        musicTitle.textContent = track.title;

        if (isGameRunning) {
            bgMusic.play().catch(e => console.log("Auto-play prevented:", e));
        }
    });
}

function animatePlayer() {
    if (!isGameRunning) return;
    currentFrame = (currentFrame + 0.22) % playerFrames.length;
    player.style.backgroundImage = `url('${playerFrames[Math.floor(currentFrame)]}')`;
}

function Glitch() {
    gameContainer.classList.remove('screen-shake');
    void gameContainer.offsetWidth;
    gameContainer.classList.add('screen-shake');

    glitchEffect.style.animation = 'none';
    void glitchEffect.offsetWidth;
    glitchEffect.style.animation = 'glitch-bg 0.5s';

    const glitchText = glitchEffect.querySelector('.glitch-text');
    const messages = ["SAFE", "KIAN'S SALVATION", "ACCESS GRANTED", "01001011 01101001\n01100001 01101110", "رهایی کیان"];
    glitchText.textContent = messages[Math.floor(Math.random() * messages.length)];
    glitchText.style.animation = 'none';
    void glitchText.offsetWidth;
    glitchText.style.animation = 'glitch-text-fade 0.5s ease-out';

    collectSound.currentTime = 0;
    collectSound.play();
}

function setupControls() {
    let isDragging = false;
    let startX = 0;
    let initialPlayerX = 0;

    const startDrag = (clientX) => {
        if (!isGameRunning) return;
        isDragging = true;
        startX = clientX;
        initialPlayerX = playerX;
    };

    const moveDrag = (clientX) => {
        if (!isDragging || !isGameRunning) return;
        const diff = clientX - startX;
        playerX = Math.max(0, Math.min(window.innerWidth - 32, initialPlayerX + diff));
        player.style.transform = `translateX(${playerX}px)`;
    };

    const endDrag = () => { isDragging = false; };

    player.addEventListener('touchstart', (e) => {
        startDrag(e.touches[0].clientX);
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
        moveDrag(e.touches[0].clientX);
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', endDrag);

    player.addEventListener('mousedown', (e) => {
        startDrag(e.clientX);
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        moveDrag(e.clientX);
        e.preventDefault();
    });
    document.addEventListener('mouseup', endDrag);
}

function checkCollision(digitX, digitY) {
    const playerRect = player.getBoundingClientRect();
    const scale = playerRect.width / 15;
    const bodyX = playerRect.left + (3 * scale);
    const bodyY = playerRect.top + (3 * scale);
    const bodyWidth = 10 * scale;
    const bodyHeight = 10 * scale;

    const digitRight = digitX + digitWidth;
    const digitBottom = digitY + digitHeight;

    return (
        digitRight > bodyX &&
        digitX < bodyX + bodyWidth &&
        digitBottom > bodyY &&
        digitY < bodyY + bodyHeight
    );
}

function createDigit() {
    let spawnCount = 1;
    for (let t of thresholds) {
        if (score >= t) spawnCount++;
    }
    spawnCount = Math.min(spawnCount, MAX_SPAWNS_PER_CALL);
    for (let i = 0; i < spawnCount; i++) {
        spawnDigit();
    }
}

function spawnDigit() {
    const digit = document.createElement('div');
    digit.className = 'digit';
    const isZero = Math.random() > 0.5;
    digit.textContent = isZero ? '0' : '1';
    digit.classList.add(isZero ? 'zero' : 'one');

    const x = Math.random() * (window.innerWidth - digitWidth);
    digit.style.left = x + 'px';
    digit.style.top = `-${digitHeight}px`;
    digit.style.display = 'block';
    gameContainer.appendChild(digit);

    const digitObj = { element: digit, x: x, y: -digitHeight, isZero: isZero };
    activeDigits.push(digitObj);
}

function removeDigit(digitObj) {
    if (gameContainer.contains(digitObj.element)) {
        gameContainer.removeChild(digitObj.element);
    }
    activeDigits = activeDigits.filter(d => d !== digitObj);
}

function clearAllDigits() {
    activeDigits.forEach(d => {
        removeDigit(d)
    });
}

function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(animationInterval);
    clearAllDigits();

    gameOverScreen.style.display = 'flex';
    player.style.display = 'none';
    scoreDisplay.style.display = 'none';
    bgMusic.pause();
    endsound.play();
}

function gameLoop(timestamp) {
    if (!isGameRunning) return;
    if (!lastSpawnTime) lastSpawnTime = timestamp;

    if (timestamp - lastSpawnTime >= SPAWN_INTERVAL_MS) {
        createDigit();
        lastSpawnTime = timestamp;
    }

    for (let i = activeDigits.length - 1; i >= 0; i--) {
        const digitObj = activeDigits[i];

        if (score <= 10) { digitObj.y += 4; }
        else if (score <= 50) { digitObj.y += 5; }
        else if (score <= 100) { digitObj.y += 6; }
        else { digitObj.y += 7; }

        digitObj.element.style.top = digitObj.y + 'px';
        digitObj.element.style.left = digitObj.x + 'px';

        if (digitObj.y + digitHeight >= window.innerHeight - 82 && checkCollision(digitObj.x, digitObj.y)) {
            if (digitObj.isZero) {
                gameOver();
                break;
            } else {
                score++;
                scoreDisplay.textContent = score;
                Glitch();
            }
            removeDigit(digitObj);
            continue;
        }

        if (digitObj.y > window.innerHeight) {
            removeDigit(digitObj);
            continue;
        }
    }

    animatePlayer();
    animationInterval = requestAnimationFrame(gameLoop);
}

function startGame() {
    clearAllDigits();
    score = 0;
    scoreDisplay.textContent = score;

    playerX = window.innerWidth / 2;
    player.style.transform = `translateX(${playerX}px)`;
    startScreen.style.display = 'none';
    isGameRunning = true;
    player.style.display = 'block';
    scoreDisplay.style.display = 'block';

    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log("Auto-play prevented:", e));

    currentFrame = 0;
    player.style.backgroundImage = `url('${playerFrames[0]}')`;

    lastSpawnTime = 0;
    animationInterval = requestAnimationFrame(gameLoop);
}

setupAudio();
setupControls();
setupMusicControl();

startBtn.addEventListener('click', () => {
    startGame();
});


backBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

window.addEventListener('resize', () => {
    if (isGameRunning) {
        playerX = (window.innerWidth) / 2;
        player.style.transform = `translateX(${playerX}px)`;
    }
});
