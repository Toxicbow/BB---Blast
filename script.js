 * Core Logic & Effects
 */

class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playDrop() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playClear(count) {
        for (let i = 0; i < count; i++) {
            const time = this.ctx.currentTime + i * 0.1;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(523.25 * (1 + i * 0.2), time);
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + 0.3);
        }
    }

    playLevelUp() {
        this.playClear(5);
    }
}

class Game {
    constructor() {
        this.boardSize = 8;
        this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.score = 0;
        this.highScore = localStorage.getItem('bb-blast-highscore') || 0;
        this.level = 1;
        this.gameOver = false;
        
        this.shapes = [
            { name: 'dot', cells: [[0, 0]], color: '#fbbf24' },
            { name: 'i2', cells: [[0, 0], [0, 1]], color: '#38bdf8' },
            { name: 'i3', cells: [[0, 0], [0, 1], [0, 2]], color: '#38bdf8' },
            { name: 'i4', cells: [[0, 0], [0, 1], [0, 2], [0, 3]], color: '#38bdf8' },
            { name: 'l3', cells: [[0, 0], [1, 0], [1, 1]], color: '#f472b6' },
            { name: 'o', cells: [[0, 0], [0, 1], [1, 0], [1, 1]], color: '#818cf8' },
            { name: 't', cells: [[0, 0], [0, 1], [0, 2], [1, 1]], color: '#a78bfa' },
            { name: 'l-long', cells: [[0, 0], [1, 0], [2, 0], [2, 1]], color: '#f472b6' },
            { name: 'z', cells: [[0, 0], [0, 1], [1, 1], [1, 2]], color: '#fb7185' },
            { name: 'big-o', cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], color: '#818cf8' }
        ];

        this.currentBlocks = [null, null, null];
        this.draggedBlock = null;
        this.dragOffset = { x: 0, y: 0 };
        
        this.canvas = document.getElementById('effect-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];

        this.init();
    }

    init() {
        this.createBoard();
        this.updateScore();
        this.generateNewBlocks();
        this.setupEventListeners();
        this.resizeCanvas();
        this.animate();
        
        document.getElementById('restart-btn').addEventListener('click', () => this.reset());
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.updateCellPositions();
        });
    }

    createBoard() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                boardEl.appendChild(cell);
            }
        }
    }

    generateNewBlocks() {
        const slots = [0, 1, 2];
        slots.forEach(i => {
            const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
            this.currentBlocks[i] = { ...shape, id: Date.now() + i };
            this.renderBlock(i);
        });
        
        if (this.checkGameOver()) {
            this.triggerGameOver();
        }
    }

    renderBlock(slotIndex) {
        const slot = document.getElementById(`slot-${slotIndex}`);
        slot.innerHTML = '';
        const block = this.currentBlocks[slotIndex];
        if (!block) return;

        const blockEl = document.createElement('div');
        blockEl.className = 'block';
        blockEl.dataset.slot = slotIndex;
        
        // Calculate dimensions
        let maxR = 0, maxC = 0;
        block.cells.forEach(([r, c]) => {
            maxR = Math.max(maxR, r);
            maxC = Math.max(maxC, c);
        });

        blockEl.style.gridTemplateRows = `repeat(${maxR + 1}, 1fr)`;
        blockEl.style.gridTemplateColumns = `repeat(${maxC + 1}, 1fr)`;
        blockEl.style.setProperty('--block-color', block.color);

        block.cells.forEach(([r, c]) => {
            const cell = document.createElement('div');
            cell.className = 'block-cell';
            cell.style.gridRow = r + 1;
            cell.style.gridColumn = c + 1;
            blockEl.appendChild(cell);
        });

        slot.appendChild(blockEl);
    }

    setupEventListeners() {
        document.addEventListener('mousedown', (e) => this.handleDragStart(e));
        document.addEventListener('mousemove', (e) => this.handleDragMove(e));
        document.addEventListener('mouseup', (e) => this.handleDragEnd(e));

        document.addEventListener('touchstart', (e) => this.handleDragStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleDragEnd(e), { passive: false });
    }

    handleDragStart(e) {
        if (this.gameOver) return;
        const target = e.target.closest('.block');
        if (!target) return;

        e.preventDefault();
        const slotIndex = parseInt(target.dataset.slot);
        this.draggedBlock = {
            element: target,
            slotIndex: slotIndex,
            data: this.currentBlocks[slotIndex]
        };

        const rect = target.getBoundingClientRect();
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        this.dragOffset = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };

        target.classList.add('dragging');
        // Move to body to avoid clipping
        document.body.appendChild(target);
        this.updateDragPosition(clientX, clientY);
    }

    handleDragMove(e) {
        if (!this.draggedBlock) return;
        e.preventDefault();

        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        this.updateDragPosition(clientX, clientY);
        this.highlightPotentialCells(clientX, clientY);
    }

    handleDragEnd(e) {
        if (!this.draggedBlock) return;

        const clientX = e.type.startsWith('touch') ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.changedTouches[0].clientY : e.clientY;

        const placement = this.getPlacement(clientX, clientY);
        
        if (placement && this.canPlace(placement.row, placement.col, this.draggedBlock.data)) {
            this.placeBlock(placement.row, placement.col, this.draggedBlock.data);
            this.currentBlocks[this.draggedBlock.slotIndex] = null;
            this.draggedBlock.element.remove();
            
            // Check if all blocks used
            if (this.currentBlocks.every(b => b === null)) {
                this.generateNewBlocks();
            } else if (this.checkGameOver()) {
                this.triggerGameOver();
            }
        } else {
            // Return to slot
            const slot = document.getElementById(`slot-${this.draggedBlock.slotIndex}`);
            this.draggedBlock.element.classList.remove('dragging');
            this.draggedBlock.element.style.left = '';
            this.draggedBlock.element.style.top = '';
            slot.appendChild(this.draggedBlock.element);
        }

        this.clearHighlights();
        this.draggedBlock = null;
    }

    updateDragPosition(x, y) {
        this.draggedBlock.element.style.left = `${x - this.dragOffset.x}px`;
        this.draggedBlock.element.style.top = `${y - this.dragOffset.y}px`;
    }

    getPlacement(clientX, clientY) {
        // Adjust for the fact that the drag starts from the first cell of the block
        // In mobile, we often want to offset the block so it's visible above the finger
        const board = document.getElementById('board');
        const boardRect = board.getBoundingClientRect();
        
        const cellSize = boardRect.width / this.boardSize;
        
        const relativeX = clientX - boardRect.left - this.dragOffset.x + (cellSize / 2);
        const relativeY = clientY - boardRect.top - this.dragOffset.y + (cellSize / 2);

        const col = Math.floor(relativeX / cellSize);
        const row = Math.floor(relativeY / cellSize);

        if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
            return { row, col };
        }
        return null;
    }

    canPlace(row, col, blockData) {
        return blockData.cells.every(([dr, dc]) => {
            const nr = row + dr;
            const nc = col + dc;
            return nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize && this.grid[nr][nc] === null;
        });
    }

    placeBlock(row, col, blockData) {
        blockData.cells.forEach(([dr, dc]) => {
            const nr = row + dr;
            const nc = col + dc;
            this.grid[nr][nc] = blockData.color;
            
            const cellEl = document.querySelector(`.cell[data-row="${nr}"][data-col="${nc}"]`);
            cellEl.classList.add('occupied', 'placed-glow');
            cellEl.style.setProperty('--block-color', blockData.color);
            
            // Visual feedback
            this.createParticles(cellEl.getBoundingClientRect(), blockData.color, 5);
            
            setTimeout(() => cellEl.classList.remove('placed-glow'), 500);
        });

        this.sounds.playDrop();
        this.score += blockData.cells.length;
        this.checkLines();
        this.updateScore();
    }

    checkLines() {
        let rowsToClear = [];
        let colsToClear = [];

        // Check rows
        for (let r = 0; r < this.boardSize; r++) {
            if (this.grid[r].every(cell => cell !== null)) {
                rowsToClear.push(r);
            }
        }

        // Check columns
        for (let c = 0; c < this.boardSize; c++) {
            let full = true;
            for (let r = 0; r < this.boardSize; r++) {
                if (this.grid[r][c] === null) {
                    full = false;
                    break;
                }
            }
            if (full) colsToClear.push(c);
        }

        if (rowsToClear.length > 0 || colsToClear.length > 0) {
            const count = rowsToClear.length + colsToClear.length;
            this.sounds.playClear(count * 2);
            this.clearLines(rowsToClear, colsToClear);
        }
    }

    clearLines(rows, cols) {
        const totalLines = rows.length + cols.length;
        // Multiplier logic: lines * 100 * multiplier
        const basePoints = totalLines * 100;
        const multiplier = totalLines >= 2 ? totalLines * 0.5 : 1;
        this.score += Math.floor(basePoints * multiplier);

        const cellsToAnimate = new Set();
        
        rows.forEach(r => {
            for (let c = 0; c < this.boardSize; c++) {
                cellsToAnimate.add(`${r},${c}`);
                this.grid[r][c] = null;
            }
        });

        cols.forEach(c => {
            for (let r = 0; r < this.boardSize; r++) {
                cellsToAnimate.add(`${r},${c}`);
                this.grid[r][c] = null;
            }
        });

        cellsToAnimate.forEach(pos => {
            const [r, c] = pos.split(',').map(Number);
            const cellEl = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            cellEl.classList.add('clearing');
            
            // Particles for each cleared cell
            const rect = cellEl.getBoundingClientRect();
            this.createParticles(rect, '#ffffff', 10);
            
            setTimeout(() => {
                cellEl.classList.remove('occupied', 'clearing');
                cellEl.style.removeProperty('--block-color');
            }, 400);
        });

        // Level 3 Firework effect
        if (this.level >= 3) {
            this.triggerFireworks();
        }
    }

    highlightPotentialCells(x, y) {
        this.clearHighlights();
        const placement = this.getPlacement(x, y);
        if (placement && this.canPlace(placement.row, placement.col, this.draggedBlock.data)) {
            this.draggedBlock.data.cells.forEach(([dr, dc]) => {
                const nr = placement.row + dr;
                const nc = placement.col + dc;
                const cellEl = document.querySelector(`.cell[data-row="${nr}"][data-col="${nc}"]`);
                if (cellEl) cellEl.style.background = 'rgba(255,255,255,0.3)';
            });
        }
    }

    clearHighlights() {
        document.querySelectorAll('.cell').forEach(c => {
            if (!c.classList.contains('occupied')) {
                c.style.background = '';
            }
        });
    }

    checkGameOver() {
        // Game is over if NONE of the current blocks can be placed anywhere
        const availableBlocks = this.currentBlocks.filter(b => b !== null);
        if (availableBlocks.length === 0) return false;

        for (const block of availableBlocks) {
            for (let r = 0; r < this.boardSize; r++) {
                for (let c = 0; c < this.boardSize; c++) {
                    if (this.canPlace(r, c, block)) {
                        return false; // Found a spot
                    }
                }
            }
        }
        return true;
    }

    updateScore() {
        const scoreEl = document.getElementById('score');
        const highScoreEl = document.getElementById('high-score');
        
        scoreEl.innerText = this.score.toString().padStart(4, '0');
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('bb-blast-highscore', this.highScore);
        }
        highScoreEl.innerText = this.highScore;

        this.checkLevel();
    }

    checkLevel() {
        let newLevel = 1;
        if (this.score >= 5000) newLevel = 3;
        else if (this.score >= 1500) newLevel = 2;
        else if (this.score >= 500) newLevel = 1.5; // Intermediate step or just stay 1

        // Strict mapping as requested: 500, 1500, 5000
        if (this.score >= 5000) newLevel = 3;
        else if (this.score >= 1500) newLevel = 2;
        else if (this.score >= 500) newLevel = 2; // Level 2 starts at 500 actually based on user prompt "Orta Seviye"
        
        // Correcting based on prompt: 500, 1500, 5000
        if (this.score >= 5000) newLevel = 3;
        else if (this.score >= 1500) newLevel = 2;
        else if (this.score >= 500) newLevel = 1.5; // Let's use 1.5 internally to represent "getting there"

        // Actual Prompt Levels:
        // Level 1: < 500
        // Level 2: 500 - 5000 (Glowing, particles)
        // Level 3: > 5000 (Hyper-Mode)
        
        let targetLevel = 1;
        if (this.score >= 5000) targetLevel = 3;
        else if (this.score >= 500) targetLevel = 2;
        else targetLevel = 1;

        if (targetLevel !== this.level) {
            this.level = targetLevel;
            this.sounds.playLevelUp();
            this.applyLevelEffects();
        }
    }

    applyLevelEffects() {
        document.body.className = `level-${this.level}`;
        const notification = document.getElementById('level-up-notification');
        const levelText = document.getElementById('level-text');
        
        notification.classList.remove('hidden');
        levelText.innerText = this.level === 3 ? "HYPER MODE!" : "LEVEL UP!";
        
        // Re-trigger animation
        notification.style.animation = 'none';
        notification.offsetHeight; // trigger reflow
        notification.style.animation = null;

        setTimeout(() => notification.classList.add('hidden'), 2000);
    }

    triggerGameOver() {
        this.gameOver = true;
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }

    reset() {
        this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.currentBlocks = [null, null, null];
        
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.body.className = 'level-1';
        this.createBoard();
        this.updateScore();
        this.generateNewBlocks();
    }

    // --- Particle System ---

    resizeCanvas() {
        const board = document.getElementById('board-container');
        const rect = board.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    createParticles(rect, color, count) {
        const boardRect = document.getElementById('board-container').getBoundingClientRect();
        const x = rect.left - boardRect.left + rect.width / 2;
        const y = rect.top - boardRect.top + rect.height / 2;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                size: Math.random() * 4 + 2,
                color: color,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02
            });
        }
    }

    triggerFireworks() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        // Corner fireworks
        const corners = [[0,0], [w,0], [0,h], [w,h]];
        corners.forEach(([x, y]) => {
            for (let i = 0; i < 20; i++) {
                this.particles.push({
                    x, y,
                    vx: (x === 0 ? 1 : -1) * (Math.random() * 10),
                    vy: (y === 0 ? 1 : -1) * (Math.random() * 10),
                    size: Math.random() * 5 + 3,
                    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                    life: 1.0,
                    decay: 0.01
                });
            }
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        requestAnimationFrame(() => this.animate());
    }

    updateCellPositions() {
        // Used to sync drag logic if window resized
    }
}

// Start Game
window.onload = () => {
    new Game();
};
