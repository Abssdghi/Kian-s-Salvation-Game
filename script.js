        // گرفتن المنت‌ها از DOM
        const gameContainer = document.getElementById('game-container');
        const player = document.getElementById('player');
        const scoreDisplay = document.getElementById('score');
        const startScreen = document.getElementById('start-screen');
        const startBtn = document.getElementById('start-btn');
        const glitchEffect = document.querySelector('.glitch-effect');
        const bgMusic = document.getElementById('bg-music');
        const collectSound = document.getElementById('collect-sound');
        const endsound = document.getElementById('end-sound');

        const playerFrames = [
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><rect fill="%2300FF00" x="3" y="3" width="9" height="9"/><rect fill="%2300FF00" x="5" y="2" width="5" height="1"/><rect fill="%2300FF00" x="2" y="6" width="1" height="3"/><rect fill="%2300FF00" x="12" y="6" width="1" height="3"/><rect fill="%2300FF00" x="4" y="12" width="2" height="3"/><rect fill="%2300FF00" x="9" y="12" width="2" height="3"/></svg>',
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><rect fill="%2300FF00" x="3" y="3" width="9" height="9"/><rect fill="%2300FF00" x="5" y="2" width="5" height="1"/><rect fill="%2300FF00" x="2" y="6" width="1" height="3"/><rect fill="%2300FF00" x="12" y="6" width="" height="2"/><rect fill="%2300FF00" x="4" y="12" width="2" height="3"/><rect fill="%2300FF00" x="9" y="12" width="2" height="0"/></svg>',
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><rect fill="%2300FF00" x="3" y="3" width="9" height="9"/><rect fill="%2300FF00" x="5" y="2" width="5" height="1"/><rect fill="%2300FF00" x="2" y="6" width="1" height="0"/><rect fill="%2300FF00" x="12" y="6" width="1" height="3"/><rect fill="%2300FF00" x="4" y="12" width="2" height="0"/><rect fill="%2300FF00" x="9" y="12" width="2" height="3"/></svg>',
      ];

        let score = 0;
        let gameInterval;
        let digitInterval;
        let isGameRunning = false;
        let playerX = window.innerWidth / 2;
        const playerRadius = 12;
        const digitWidth = 24;
        const digitHeight = 24;
        let currentFrame = 0;
        let animationInterval;
        let activeDigits = [];

        function setupAudio() {
            bgMusic.volume = 0.3;
            collectSound.volume = 0.4;
            endsound.volume = 0.4;
        }

        function animatePlayer() {
            if (!isGameRunning) return;
            currentFrame = (currentFrame + 0.22) % playerFrames.length;
            player.style.backgroundImage = `url('${playerFrames[Math.floor(currentFrame)]}')`;
            requestAnimationFrame(animatePlayer);
        }

        function Glitch() {
            gameContainer.classList.remove('screen-shake');
            void gameContainer.offsetWidth;
            gameContainer.classList.add('screen-shake');
        
            glitchEffect.style.animation = 'none';
            void glitchEffect.offsetWidth;
            glitchEffect.style.animation = 'glitch-bg 0.5s';
        
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
                player.style.left = playerX + 'px';
            };

            const endDrag = () => { isDragging = false; };

            // رویدادهای لمسی
            player.addEventListener('touchstart', (e) => {
                startDrag(e.touches[0].clientX);
                e.preventDefault();
            }, { passive: false });
            document.addEventListener('touchmove', (e) => {
                moveDrag(e.touches[0].clientX);
                e.preventDefault();
            }, { passive: false });
            document.addEventListener('touchend', endDrag);

            // رویدادهای ماوس
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
            const playerCenterX = playerX + 16;
            const playerCenterY = window.innerHeight - 50 - 16;
            const digitCenterX = digitX + digitWidth / 2;
            const digitCenterY = digitY + digitHeight / 2;
            const distX = Math.abs(playerCenterX - digitCenterX);
            const distY = Math.abs(playerCenterY - digitCenterY);

            if (distX > (digitWidth / 2 + playerRadius)) return false;
            if (distY > (digitHeight / 2 + playerRadius)) return false;
            if (distX <= (digitWidth / 2)) return true;
            if (distY <= (digitHeight / 2)) return true;

            const cornerDist = Math.pow(distX - digitWidth / 2, 2) + Math.pow(distY - digitHeight / 2, 2);
            return cornerDist <= Math.pow(playerRadius, 2);
        }

        function createDigit() {
            const digit = document.createElement('div');
            digit.className = 'digit';
            const isZero = Math.random() > 0.5;
            digit.textContent = isZero ? '0' : '1';
            digit.classList.add(isZero ? 'zero' : 'one');
            const x = Math.random() * (window.innerWidth - digitWidth);
            digit.style.left = x + 'px';
            digit.style.top = '-24px';
            digit.style.display = 'block';
            gameContainer.appendChild(digit);

            const digitObj = { element: digit, x: x, y: -digitHeight, isZero: isZero, interval: null };
            activeDigits.push(digitObj);

            let lastTime = 0;
            const moveDigit = (timestamp) => {
                if (!isGameRunning) return;
                if (!lastTime) lastTime = timestamp;
                // const deltaTime = timestamp - lastTime;
                lastTime = timestamp;
                if (score <= 10) {
                    digitObj.y += 4;
                  } else if (score <= 50) {
                    digitObj.y += 5;
                  } else if (score <= 100) {
                    digitObj.y += 6;
                  } else {
                    digitObj.y += 7;
                  }
                  

                digit.style.top = digitObj.y + 'px';
                if (digitObj.y + digitHeight >= window.innerHeight - 82 && checkCollision(digitObj.x, digitObj.y)) {
                    if (digitObj.isZero) gameOver();
                    else {
                        score++;
                        scoreDisplay.textContent = score;
                        Glitch();
                    }
                    removeDigit(digitObj);
                    return;
                }
                if (digitObj.y > window.innerHeight) {
                    removeDigit(digitObj);
                    return;
                }
                digitObj.interval = requestAnimationFrame(moveDigit);
            };
            digitObj.interval = requestAnimationFrame(moveDigit);
        }

        function removeDigit(digitObj) {
            cancelAnimationFrame(digitObj.interval);
            gameContainer.removeChild(digitObj.element);
            activeDigits = activeDigits.filter(d => d !== digitObj);
        }

        function clearAllDigits() {
            activeDigits.forEach(d => {
                removeDigit(d)
            });
        }

        function gameOver() {
            isGameRunning = false;
            clearInterval(gameInterval);
            clearInterval(digitInterval);
            clearAllDigits();
            cancelAnimationFrame(animationInterval);
            startScreen.style.display = 'flex';
            player.style.display = 'none';
            scoreDisplay.style.display = 'none';
            endsound.play();
            bgMusic.pause();
        }

        function startGame() {
            clearAllDigits();
            score = 0;
            scoreDisplay.textContent = score;

            playerX = window.innerWidth / 2;
            player.style.left = playerX + 'px';
            startScreen.style.display = 'none';
            isGameRunning = true;
            player.style.display = 'block';
            scoreDisplay.style.display = 'block';

            bgMusic.currentTime = 0;
            bgMusic.play().catch(e => console.log("Music play error:", e));

            currentFrame = 0;
            player.style.backgroundImage = `url('${playerFrames[0]}')`;
            animationInterval = requestAnimationFrame(animatePlayer);

            digitInterval = setInterval(createDigit, 300);

            gameInterval = setInterval(() => {
                const newInterval = Math.max(50, 300 - Math.min(250, score * 10));
                clearInterval(digitInterval);
                digitInterval = setInterval(createDigit, newInterval);
            }, 1000);
        }

        setupAudio();
        setupControls();
        startBtn.addEventListener('click', startGame);
        window.addEventListener('resize', () => {
            if (isGameRunning) {
                playerX = (window.innerWidth) / 2;
                player.style.left = playerX + 'px';
            }
        });