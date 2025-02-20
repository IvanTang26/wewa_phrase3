class WhackAMole {
    constructor() {
        this.screens = {
            mainMenu: document.getElementById('mainMenu'),
            rules: document.getElementById('rules'),
            waiting: document.getElementById('waiting'),
            game: document.getElementById('game'),
            end: document.getElementById('end'),
            finalScore: document.getElementById('finalScore')
        };
        
        this.score = 0;
        this.timer = 60000; // 60 seconds in milliseconds
        this.maxTime = 120000; // 120 seconds in milliseconds
        this.gameStartTime = null;
        this.activeMoles = new Set();
        this.orangeBallHits = {};
        this.lastRedBallTime = 0;
        this.gameInterval = null;
        this.isGameRunning = false;
        this.firstHitTime = null;
        this.totalHits = 0;
        this.successfulHits = 0;
        this.emptyHits = 0;
        this.usedPositions = new Set();

        this.sounds = {
            pop: document.getElementById('popSound'),
            countdown: document.getElementById('countdownSound'),
            gameStart: document.getElementById('gameStartSound'),
            backgroundMusic: document.getElementById('backgroundMusic'),
            gameOver: document.getElementById('gameOverSound'),
            hitColorChange: document.getElementById('hitColorChangeSound'),
            bubbleExplosion: document.getElementById('bubbleExplosionSound')
        };

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Keyboard input for game controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Background music initialization
        this.sounds.backgroundMusic.volume = 0.1;

        // Global keyboard handlers
        document.addEventListener('keydown', (e) => {
            // Backspace/R key functionality
            if (e.key === 'Backspace') this.handleBackspace();
            if (e.key.toLowerCase() === 'r') this.handleRestart();
            
            // Screen navigation
            const currentScreen = this.getCurrentScreen();
            switch(currentScreen) {
                case 'mainMenu':
                    this.switchScreen('mainMenu', 'rules');
                    break;
                case 'rules':
                    this.switchScreen('rules', 'waiting');
                    this.startCountdown();
                    break;
                case 'finalScore':
                    this.resetGame();
                    this.switchScreen('finalScore', 'mainMenu');
                    break;
            }
        });
    }

    getCurrentScreen() {
        for (const [screenName, screen] of Object.entries(this.screens)) {
            if (screen.classList.contains('active')) {
                return screenName;
            }
        }
        return 'mainMenu';
    }

    handleKeyPress(event) {
        if (!this.isGameRunning) return;
        
        const key = event.key;
        if (key >= '1' && key <= '7') {
            const holeIndex = parseInt(key) - 1;
            const hole = document.querySelector(`.hole[data-index="${holeIndex}"]`);
            if (hole) {
                this.handleHoleHit(hole);
            }
        }
    }

    handleHoleHit(hole) {
        const mole = hole.querySelector('.mole');
        
        if (!mole) {
            this.emptyHits++;
            return;
        }
        
        this.totalHits++;
        
        if (this.firstHitTime === null) {
            this.firstHitTime = (Date.now() - this.gameStartTime) / 1000;
        }
        
        const type = mole.dataset.type;
        
        if (type === 'yellow') {
            this.successfulHits++;
            this.score += 1;
            this.showExplosion(hole);
            this.showScorePopup(hole, '+1', 'points');
            this.sounds.bubbleExplosion.play();
            this.usedPositions.delete(parseInt(mole.dataset.position));
            hole.removeChild(mole);
            this.activeMoles.delete(parseInt(hole.dataset.index));
        } else if (type === 'orange') {
            const hits = (this.orangeBallHits[hole.dataset.index] || 0) + 1;
            this.orangeBallHits[hole.dataset.index] = hits;
            
            if (hits === 1) {
                this.successfulHits++;
                mole.src = '6.ball_character/orange_02/orange_02_a1.gif';
                this.sounds.hitColorChange.play();
                
                setTimeout(() => {
                    if (mole.parentNode === hole) {
                        mole.src = '6.ball_character/orange_02/orange_02b.png';
                    }
                }, 500);
            } else if (hits === 2) {
                this.successfulHits++;
                mole.src = '6.ball_character/orange_02/orange_02_b1.gif';
                this.sounds.hitColorChange.play();
            
                setTimeout(() => {
                    if (mole.parentNode === hole) {
                        mole.src = '6.ball_character/orange_02/orange_02c.png';
                        
                    }
                }, 500);
            } else if (hits === 3) {
                this.successfulHits++;
                this.score += 5;
                this.showExplosion(hole);
                this.showScorePopup(hole, '+5', 'points');
                this.sounds.bubbleExplosion.play();
                this.usedPositions.delete(parseInt(mole.dataset.position));
                hole.removeChild(mole);
                this.activeMoles.delete(parseInt(hole.dataset.index));
                delete this.orangeBallHits[hole.dataset.index];
            }
        } else if (type === 'red') {
            this.successfulHits++;
            this.timer = Math.min(this.timer + 5000, this.maxTime);
            this.showExplosion(hole);
            this.showScorePopup(hole, '+5秒', 'time');
            this.sounds.bubbleExplosion.play();
            this.usedPositions.delete(parseInt(mole.dataset.position));
            hole.removeChild(mole);
            this.activeMoles.delete(parseInt(hole.dataset.index));
        }
        
        this.updateScore();
    }

    switchScreen(from, to) {
        this.screens[from].classList.remove('active');
        this.screens[to].classList.add('active');
    }

    async startCountdown() {
        const waitingScreen = this.screens.waiting;
        const countdownGif = waitingScreen.querySelector('.countdown-gif');
        const button = waitingScreen.querySelector('button');
        
        button.style.display = 'none';
        countdownGif.classList.remove('hidden');
        
        this.sounds.countdown.play();
        
        await new Promise(resolve => setTimeout(resolve, 3000)); // Duration of countdown321.gif
        
        this.sounds.gameStart.play();
        this.switchScreen('waiting', 'game');
        this.startGame();
    }

    startGame() {
        this.isGameRunning = true;
        this.score = 0;
        this.timer = 60000;
        this.gameStartTime = Date.now();
        this.updateScore();
        this.updateTimer();
        
        // Start background music
        this.sounds.backgroundMusic.currentTime = 0;
        this.sounds.backgroundMusic.play();
        
        this.gameInterval = setInterval(() => {
            if (this.timer > 0) {
                this.timer -= 100; // Decrease by 100ms
                this.updateTimer();
                this.spawnMoles();
            } else {
                this.endGame();
            }
        }, 100); // Update every 100ms
    }

    spawnMoles() {
        // Get all empty holes
        const holes = document.querySelectorAll('.hole');
        const emptyHoles = Array.from(holes).filter(hole => 
            !this.activeMoles.has(parseInt(hole.dataset.index))
        );
        
        // If no empty holes available, return
        if (emptyHoles.length === 0) return;
        
        // Get a random empty hole
        const randomHole = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
        
        // Get current active moles count
        const currentMoles = this.activeMoles.size;
        
        // First 10 seconds: only yellow balls, max 2
        if (this.timer > 50000) {
            if (currentMoles < 2) {
                this.spawnMole(randomHole, 'yellow');
            }
            return;
        }
        
        // 10-20 seconds: yellow and orange balls, max 3
        if (this.timer > 40000) {
            if (currentMoles < 3) {
                const type = Math.random() < 0.7 ? 'yellow' : 'orange';
                this.spawnMole(randomHole, type);
            }
            return;
        }
        
        // Last 15 seconds: red ball every 5 seconds, max 4 balls
        if (this.timer <= 15000) {
            if (Date.now() - this.lastRedBallTime > 5000) {
                this.spawnRedBall();
                this.lastRedBallTime = Date.now();
            }
            
            if (currentMoles < 4) {
                const type = Math.random() < 0.7 ? 'yellow' : 'orange';
                this.spawnMole(randomHole, type);
            }
        } else {
            // Regular gameplay (20-45 seconds)
            if (currentMoles < 3) {
                const type = Math.random() < 0.7 ? 'yellow' : 'orange';
                this.spawnMole(randomHole, type);
            }
        }
    }

    getAvailablePosition() {
        const allPositions = [1, 2, 3, 4, 5, 6, 7];
        const availablePositions = allPositions.filter(pos => !this.usedPositions.has(pos));
        
        if (availablePositions.length === 0) {
            // If all positions are used, clear and start over
            this.usedPositions.clear();
            return Math.floor(Math.random() * 7) + 1;
        }
        
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        const position = availablePositions[randomIndex];
        this.usedPositions.add(position);
        return position;
    }

    spawnMole(hole, type) {
        const mole = document.createElement('img');
        mole.className = 'mole';
        mole.dataset.type = type;
        
        // Get a unique position
        const position = this.getAvailablePosition();
        mole.classList.add(`position-${position}`);
        mole.dataset.position = position;
        
        if (type === 'yellow') {
            mole.src = '6.ball_character/yellow_01/yellow_01_rise1.gif';
            
            setTimeout(() => {
                if (mole.parentNode === hole) {
                    mole.src = '6.ball_character/yellow_01/yellow_01.png';
                    
                }
            }, 500);
        } else if (type === 'orange') {
            mole.src = '6.ball_character/orange_02/orange_02_rise1.gif';
            
            this.orangeBallHits[hole.dataset.index] = 0;
            
            setTimeout(() => {
                if (mole.parentNode === hole) {
                    mole.src = '6.ball_character/orange_02/orange_02a.png';
                    
                }
            }, 500);
        }
        
        hole.appendChild(mole);
        this.activeMoles.add(parseInt(hole.dataset.index));
        
        // Play pop sound when ball appears
        this.sounds.pop.currentTime = 0;
        this.sounds.pop.play();
        
        // Set longer duration for yellow and orange balls
        setTimeout(() => {
            if (mole.parentNode === hole) {
                // Remove position from used positions when mole disappears
                this.usedPositions.delete(parseInt(mole.dataset.position));
                hole.removeChild(mole);
                this.activeMoles.delete(parseInt(hole.dataset.index));
                if (type === 'orange') {
                    delete this.orangeBallHits[hole.dataset.index];
                }
            }
        }, type === 'red' ? 3000 : 15000);
    }

    spawnRedBall() {
        const holes = document.querySelectorAll('.hole');
        const availableHoles = Array.from(holes).filter(hole => 
            !this.activeMoles.has(parseInt(hole.dataset.index))
        );
        
        if (availableHoles.length === 0) return;
        
        const randomHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
        const mole = document.createElement('img');
        mole.className = 'mole';
        mole.dataset.type = 'red';
        
        
        // Get a unique position
        const position = this.getAvailablePosition();
        mole.classList.add(`position-${position}`);
        mole.dataset.position = position;
        
        mole.src = '6.ball_character/red_01/red_01_rise.gif';
        
        setTimeout(() => {
            if (mole.parentNode === randomHole) {
                mole.src = '6.ball_character/red_01/red_01.png';
                
            }
        }, 500);
        
        randomHole.appendChild(mole);
        this.activeMoles.add(parseInt(randomHole.dataset.index));
        
        // Play pop sound when ball appears
        this.sounds.pop.currentTime = 0;
        this.sounds.pop.play();
        
        setTimeout(() => {
            if (mole.parentNode === randomHole) {
                // Remove position from used positions when mole disappears
                this.usedPositions.delete(parseInt(mole.dataset.position));
                randomHole.removeChild(mole);
                this.activeMoles.delete(parseInt(randomHole.dataset.index));
            }
        }, 3000);
    }

    showExplosion(hole) {
        const explosion = document.createElement('img');
        explosion.src = 'images/explosion.gif';
        explosion.className = 'explosion';
        
        // Get the hole's position relative to the viewport
        const holeRect = hole.getBoundingClientRect();
        
        // Position explosion at the center of the hole
        explosion.style.left = `${holeRect.left + (holeRect.width / 2)}px`;
        explosion.style.top = `${holeRect.top + (holeRect.height / 2)}px`;
        
        // Append to body instead of hole
        document.body.appendChild(explosion);
        
        setTimeout(() => {
            if (explosion.parentNode === document.body) {
                document.body.removeChild(explosion);
            }
        }, 500);
    }

    showScorePopup(hole, text, type) {
        const popup = document.createElement('div');
        popup.className = `score-popup ${type}`;
        popup.textContent = text;
        popup.style.left = `${hole.offsetLeft + hole.offsetWidth / 2}px`;
        popup.style.top = `${hole.offsetTop}px`;
        this.screens.game.appendChild(popup);
        
        setTimeout(() => {
            if (popup.parentNode === this.screens.game) {
                this.screens.game.removeChild(popup);
            }
        }, 500);
    }

    padScore(score) {
        return score.toString().padStart(5, '0');
    }

    updateScore() {
        document.getElementById('scoreValue').textContent = this.padScore(this.score);
    }

    updateTimer() {
        const seconds = Math.ceil(this.timer / 1000);
        document.getElementById('timerValue').textContent = seconds;
    }

    async endGame() {
        this.isGameRunning = false;
        clearInterval(this.gameInterval);
        
        // Play game over sound
        this.sounds.gameOver.play();
        
        // Stop background music
        this.sounds.backgroundMusic.pause();
        
        // Show end overlay in game screen
        const endOverlay = this.screens.game.querySelector('.end-overlay');
        endOverlay.classList.add('show');
        
        // Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Hide end overlay
        endOverlay.classList.remove('show');
        
        // Switch to final score screen and restart background music
        this.switchScreen('game', 'finalScore');
        this.sounds.backgroundMusic.play();
        
        // Update final score display
        const scoreText = this.screens.finalScore.querySelector('.score-text');
        scoreText.textContent = this.padScore(this.score);
        
        // Update accuracy with new formula
        const accuracy = this.screens.finalScore.querySelector('.accuracy');
        const totalAttempts = this.successfulHits + this.emptyHits;
        const accuracyPercentage = totalAttempts > 0 
            ? Math.round((this.successfulHits / totalAttempts) * 100) 
            : 0;
        accuracy.textContent = `${accuracyPercentage}%`;

        // Calculate real time played (in seconds)
        const realTime = (60000 - this.timer) / 1000;
        
        // Send data to server
        try {
            await fetch('./save_score.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    score: this.score,
                    realTime: realTime.toFixed(2),
                    startTime: this.firstHitTime || 0,
                    accuracy: accuracyPercentage
                })
            });
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }

    resetGame() {
        this.score = 0;
        this.timer = 60000;
        this.gameStartTime = null;
        this.firstHitTime = null;
        this.activeMoles = new Set();
        this.orangeBallHits = {};
        this.lastRedBallTime = 0;
        clearInterval(this.gameInterval);
        this.isGameRunning = false;
        this.totalHits = 0;
        this.successfulHits = 0;
        this.emptyHits = 0;
        this.usedPositions.clear();
        
        // Stop background music
        this.sounds.backgroundMusic.pause();
        this.sounds.backgroundMusic.currentTime = 0;
        
        // Hide end overlay if visible
        const endOverlay = this.screens.game.querySelector('.end-overlay');
        endOverlay.classList.remove('show');
        
        // Reset waiting screen button
        const waitingButton = this.screens.waiting.querySelector('.invisible-button');
        waitingButton.style.display = 'block';
        const countdownGif = this.screens.waiting.querySelector('.countdown-gif');
        countdownGif.classList.add('hidden');
        
        // Clear any remaining moles
        document.querySelectorAll('.mole').forEach(mole => mole.remove());
        document.querySelectorAll('.explosion').forEach(explosion => explosion.remove());
        document.querySelectorAll('.score-popup').forEach(popup => popup.remove());
        
        this.updateScore();
        this.updateTimer();
    }

    handleBackspace() {
        const currentScreen = this.getCurrentScreen();
        const screenMap = {
            'rules': 'mainMenu',
            'waiting': 'rules',
            'game': 'waiting',
            'finalScore': 'mainMenu'
        };
        
        if (screenMap[currentScreen]) {
            this.switchScreen(currentScreen, screenMap[currentScreen]);
        }
    }

    handleRestart() {
        this.resetGame();
        this.switchScreen(this.getCurrentScreen(), 'mainMenu');
    }
}

// Initialize the game
window.addEventListener('load', () => {
    new WhackAMole();
}); 