/**
 * BB - BLAST | Game Script
 * Fully self-contained — all logic under window._BBBlastGame namespace.
 */

/* =============================================
   SOUND MANAGER (Web Audio API - SFX)
   ============================================= */
class SoundManager {
    constructor() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.ctx = null;
        }
    }

    _play(freq, type = 'sine', duration = 0.1, gain = 0.18, freqEnd = null, delay = 0) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gn  = this.ctx.createGain();
            const t   = this.ctx.currentTime + delay;
            osc.type  = type;
            osc.frequency.setValueAtTime(freq, t);
            if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
            gn.gain.setValueAtTime(gain, t);
            gn.gain.exponentialRampToValueAtTime(0.001, t + duration);
            osc.connect(gn);
            gn.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + duration + 0.01);
        } catch (_) {}
    }

    playDrop()       { this._play(520, 'sine', 0.12, 0.15, 180); }

    playClear(count) {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        for (let i = 0; i < Math.min(count, 5); i++) {
            this._play(notes[i] || 1046.5, 'triangle', 0.28, 0.12, null, i * 0.09);
        }
    }

    playCombo(n) {
        const f = [392, 523.25, 659.25, 880, 1046.5];
        for (let i = 0; i < Math.min(n + 1, 5); i++) {
            this._play(f[i], 'sine', 0.2, 0.14, f[i] * 1.5, i * 0.07);
        }
    }

    playLevelUp() {
        [261.63, 329.63, 392, 523.25, 659.25].forEach((f, i) =>
            this._play(f, 'sine', 0.3, 0.1, null, i * 0.1));
    }

    playGameOver() {
        this._play(220, 'sawtooth', 0.4, 0.15, 80, 0);
        this._play(180, 'sawtooth', 0.4, 0.12, 60, 0.2);
    }
}

/* =============================================
   MUSIC MANAGER (Background Loop Audio)
   ============================================= */
class MusicManager {
    constructor() {
        this.tracks = {
            1: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            2: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
            3: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
        };

        this.currentLevel = 1;
        this.audio        = new Audio(this.tracks[1]);
        this.audio.loop   = true;
        this.audio.volume = 0; // Start at 0 for fade-in
        this.targetVolume = 0.35;
        this.playing      = false;
        this.isMuted      = false;

        this._btn         = document.getElementById('music-btn');
        this._btn.addEventListener('click', () => this.toggle());
    }

    toggle() {
        if (this.playing) {
            this.isMuted = true;
            this.fadeVolume(0, 400, () => {
                this.audio.pause();
                this.playing      = false;
                this._btn.textContent = '🔇';
                this._btn.classList.remove('playing');
            });
        } else {
            this.isMuted = false;
            this.audio.play().catch(() => {});
            this.playing      = true;
            this._btn.textContent = '🎵';
            this._btn.classList.add('playing');
            this.fadeVolume(this.targetVolume, 600);
        }
    }

    changeTrack(level) {
        const targetLevel = level >= 3 ? 3 : level;
        if (this.currentLevel === targetLevel) return;

        const oldAudio = this.audio;
        this.currentLevel = targetLevel;

        this.audio      = new Audio(this.tracks[targetLevel]);
        this.audio.loop = true;
        this.audio.volume = 0;

        if (this.playing && !this.isMuted) {
            // Fade out old track
            this.fadeVolumeOf(oldAudio, 0, 800, () => {
                oldAudio.pause();
            });

            // Play and fade in new track
            this.audio.play().catch(() => {});
            this.fadeVolume(this.targetVolume, 1000);
        } else {
            oldAudio.pause();
        }
    }

    fadeVolume(target, duration, onComplete) {
        this.fadeVolumeOf(this.audio, target, duration, onComplete);
    }

    fadeVolumeOf(audioEl, target, duration, onComplete) {
        const startVol = audioEl.volume;
        const diff     = target - startVol;
        const steps    = 20;
        const stepTime = duration / steps;
        let step       = 0;

        const interval = setInterval(() => {
            step++;
            audioEl.volume = startVol + (diff * (step / steps));
            if (step >= steps) {
                clearInterval(interval);
                audioEl.volume = target;
                if (onComplete) onComplete();
            }
        }, stepTime);
    }
}

/* =============================================
   CHANGELOG DATA
   ============================================= */

const CHANGELOG = [
    {
        version: 'v1.4',
        date: '2026-06',
        notes: [
            'DÜZELTME: Bloklar patlatıldığında tüm grid alanının tek renkle kaplanmasına',
            'neden olan satır/sütun temizleme render hatası tamamen çözüldü.',
            'DÜZELTME: Donmuş (❄️) hücre temizleme sıralaması stabilize edildi.',
            'DÜZELTME: Temizleme animasyonu artık yeni yerleştirilen blokları silmiyor.'
        ]
    },
    {
        version: 'v1.3',
        date: '2026-06',
        notes: [
            'Dinamik seviye sistemi (Level 1-3+) eklendi.',
            'Level 3\'te donmuş (❄️) hücreler ortaya çıkıyor.',
            'Müzik parçaları level geçişlerinde otomatik değişiyor.',
            'Ana menü tam ekran neon tasarımına dönüştürüldü.',
            'Sürüm notları dinamik olarak JS ile yükleniyor.'
        ]
    },
    {
        version: 'v1.2',
        date: '2026-05',
        notes: [
            'Ana Menü (başlangıç ekranı) eklendi.',
            'Blok döndürme özelliği (çift tıklama / çift dokunma).',
            'STREAK bonusu ve çoklu satır temizleme ödülleri.',
            'Yeni Rekor animasyonu ve altın rengi efekt.'
        ]
    },
    {
        version: 'v1.1',
        date: '2026-04',
        notes: [
            'Responsive düzen ve tam ekran düzeltmesi.',
            'Parçacık (particle) efekt sistemi.',
            'Web Audio API ile SFX sesleri.',
            'Arka plan müziği ve mute butonu.'
        ]
    }
];

class Game {
    constructor() {
        this.BOARD_SIZE       = 8;
        this.grid             = this._emptyGrid();
        this.score            = 0;
        this.highScore        = parseInt(localStorage.getItem('bb-blast-highscore') || '0', 10);
        this.level            = 1;
        this.isOver           = false;
        this.comboCount       = 0;
        this.streakCount      = 0;
        this.currentBlocks    = [null, null, null];
        this.draggedBlock     = null;
        this.dragOffset       = { x: 0, y: 0 };
        this.TOUCH_LIFT       = 65;
        this._eventsAttached  = false;  // Guard: prevent duplicate event listeners
        this._levelingUp      = false;  // Guard: prevent rapid duplicate level-ups

        this.sounds = new SoundManager();
        this.music  = new MusicManager();

        this.canvas    = document.getElementById('effect-canvas');
        this.canvasCtx = this.canvas.getContext('2d');
        this.particles = [];

        this.shapes = [
            { name: 'dot',    cells: [[0,0]],                                                                  color: '#fbbf24' },
            { name: 'i2h',    cells: [[0,0],[0,1]],                                                            color: '#38bdf8' },
            { name: 'i2v',    cells: [[0,0],[1,0]],                                                            color: '#38bdf8' },
            { name: 'i3h',    cells: [[0,0],[0,1],[0,2]],                                                      color: '#22d3ee' },
            { name: 'i3v',    cells: [[0,0],[1,0],[2,0]],                                                      color: '#22d3ee' },
            { name: 'i4h',    cells: [[0,0],[0,1],[0,2],[0,3]],                                                color: '#0ea5e9' },
            { name: 'i4v',    cells: [[0,0],[1,0],[2,0],[3,0]],                                                color: '#0ea5e9' },
            { name: 'l-a',    cells: [[0,0],[1,0],[1,1]],                                                      color: '#f472b6' },
            { name: 'l-b',    cells: [[0,0],[0,1],[1,0]],                                                      color: '#f472b6' },
            { name: 'l-c',    cells: [[0,0],[0,1],[1,1]],                                                      color: '#f472b6' },
            { name: 'l-d',    cells: [[0,1],[1,0],[1,1]],                                                      color: '#f472b6' },
            { name: 'o2x2',   cells: [[0,0],[0,1],[1,0],[1,1]],                                                color: '#818cf8' },
            { name: 't',      cells: [[0,0],[0,1],[0,2],[1,1]],                                                color: '#a78bfa' },
            { name: 't-rot',  cells: [[0,1],[1,0],[1,1],[1,2]],                                                color: '#a78bfa' },
            { name: 'l-long', cells: [[0,0],[1,0],[2,0],[2,1]],                                                color: '#fb923c' },
            { name: 'j-long', cells: [[0,1],[1,1],[2,0],[2,1]],                                                color: '#fb923c' },
            { name: 'z',      cells: [[0,0],[0,1],[1,1],[1,2]],                                                color: '#fb7185' },
            { name: 's',      cells: [[0,1],[0,2],[1,0],[1,1]],                                                color: '#fb7185' },
            { name: 'big-o',  cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]],                  color: '#c084fc' },
            { name: 'u',      cells: [[0,0],[0,2],[1,0],[1,1],[1,2]],                                          color: '#34d399' },
        ];

        this._init();
    }

    _emptyGrid() {
        return Array.from({ length: 8 }, () => Array(8).fill(null));
    }

    _init() {
        this._createBoard();
        this._updateScoreUI();
        this._generateNewBlocks();
        this._setupEvents();
        this._resizeCanvas();
        this._animateLoop();
        this._renderChangelog();

        document.getElementById('restart-btn').addEventListener('click', () => this._reset());
        window.addEventListener('resize', () => this._resizeCanvas());

        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                const mainMenu = document.getElementById('main-menu');
                if (mainMenu) {
                    mainMenu.classList.add('fade-out');
                    // Remove from DOM after transition ends to prevent ghost element
                    mainMenu.addEventListener('transitionend', () => {
                        mainMenu.remove();
                    }, { once: true });
                }
                document.querySelectorAll('.game-ui').forEach(el => el.classList.remove('hidden'));
                if (!this.music.playing) {
                    this.music.toggle();
                }
            });
        }
    }

    _renderChangelog() {
        const list = document.getElementById('changelog-list');
        if (!list) return;
        list.innerHTML = '';
        CHANGELOG.forEach((entry, idx) => {
            const header = document.createElement('li');
            header.style.cssText = `font-weight:700; color:#38bdf8; margin-bottom:2px; ${idx > 0 ? 'margin-top:8px;' : ''} font-size:0.75rem;`;
            header.textContent = `${entry.version}  (${entry.date})`;
            list.appendChild(header);

            entry.notes.forEach(note => {
                const li = document.createElement('li');
                li.style.paddingLeft = '10px';
                li.textContent = `• ${note}`;
                list.appendChild(li);
            });
        });
    }

    _createBoard() {
        const boardEl = document.getElementById('board');
        // Safety: only touch the #board element's children, never its layout CSS
        boardEl.innerHTML = '';
        for (let r = 0; r < this.BOARD_SIZE; r++) {
            for (let c = 0; c < this.BOARD_SIZE; c++) {
                const cell       = document.createElement('div');
                cell.className   = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                boardEl.appendChild(cell);
            }
        }
        // Spawn frozen cells for high levels
        if (this.level >= 3) {
            this._spawnLockedCells(Math.floor(Math.random() * 2) + 1);
        }
    }

    /**
     * CENTRAL CELL ACCESSOR — the ONLY way to get a board cell element.
     * Scoped strictly to #board children so the grid container (#board, #board-container)
     * is structurally unreachable from any animation or state-change path.
     *
     * @param {number} r  Row index 0-7
     * @param {number} c  Column index 0-7
     * @returns {HTMLElement|null}
     */
    _cellEl(r, c) {
        if (r < 0 || r >= this.BOARD_SIZE || c < 0 || c >= this.BOARD_SIZE) return null;
        // Query scoped inside #board so parent containers are unreachable
        return document.querySelector(`#board .cell[data-row="${r}"][data-col="${c}"]`);
    }

    _generateNewBlocks() {
        for (let i = 0; i < 3; i++) {
            let shapePool = [];
            if (this.level === 1) {
                // Level 1: Standard simple blocks (1x1, 2x2, straight lines)
                shapePool = this.shapes.filter(s => ['dot', 'o2x2', 'i2h', 'i2v', 'i3h', 'i3v', 'i4h', 'i4v'].includes(s.name));
            } else {
                // Level 2+: All shapes (T, L, Z, U, Big-O, etc.)
                shapePool = this.shapes;
            }
            if (shapePool.length === 0) shapePool = this.shapes;

            const shape = shapePool[Math.floor(Math.random() * shapePool.length)];
            this.currentBlocks[i] = { ...shape, id: Date.now() + i };
            this._renderBlock(i);
        }
        if (this._checkGameOver()) this._triggerGameOver();
    }

    _renderBlock(slotIndex) {
        const slot  = document.getElementById(`slot-${slotIndex}`);
        slot.innerHTML = '';
        const block = this.currentBlocks[slotIndex];
        if (!block) return;

        const blockEl = document.createElement('div');
        blockEl.className    = 'block';
        blockEl.dataset.slot = slotIndex;
        blockEl.style.setProperty('--block-color', block.color);

        let maxR = 0, maxC = 0;
        block.cells.forEach(([r, c]) => { maxR = Math.max(maxR, r); maxC = Math.max(maxC, c); });
        blockEl.style.gridTemplateRows    = `repeat(${maxR + 1}, 1fr)`;
        blockEl.style.gridTemplateColumns = `repeat(${maxC + 1}, 1fr)`;

        block.cells.forEach(([r, c]) => {
            const cell       = document.createElement('div');
            cell.className   = 'block-cell';
            cell.style.gridRow    = r + 1;
            cell.style.gridColumn = c + 1;
            blockEl.appendChild(cell);
        });

        // Double-click/tap rotation listeners
        blockEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.rotateBlock(slotIndex);
        });

        let lastTap = 0;
        blockEl.addEventListener('touchstart', (e) => {
            const now = Date.now();
            if (now - lastTap < 300) {
                e.preventDefault();
                e.stopPropagation();
                this.rotateBlock(slotIndex);
            }
            lastTap = now;
        }, { passive: false });

        slot.appendChild(blockEl);
    }

    _setupEvents() {
        // Guard: only attach global drag events once
        if (this._eventsAttached) return;
        this._eventsAttached = true;

        document.addEventListener('mousedown',  e => this._onDragStart(e));
        document.addEventListener('mousemove',  e => this._onDragMove(e));
        document.addEventListener('mouseup',    e => this._onDragEnd(e));
        document.addEventListener('touchstart', e => this._onDragStart(e), { passive: false });
        document.addEventListener('touchmove',  e => this._onDragMove(e),  { passive: false });
        document.addEventListener('touchend',   e => this._onDragEnd(e),   { passive: false });
    }

    _clientXY(e) {
        if (e.type.startsWith('touch')) {
            const t = e.touches[0] || e.changedTouches[0];
            return { x: t.clientX, y: t.clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    _onDragStart(e) {
        if (this.isOver) return;
        const target = e.target.closest('.block');
        if (!target || !target.dataset.slot) return;
        e.preventDefault();

        const slotIndex = parseInt(target.dataset.slot, 10);
        const { x, y } = this._clientXY(e);
        const rect      = target.getBoundingClientRect();
        const isTouch   = e.type.startsWith('touch');

        this.draggedBlock = { element: target, slotIndex, data: this.currentBlocks[slotIndex] };
        this.dragOffset   = { x: x - rect.left, y: y - rect.top + (isTouch ? this.TOUCH_LIFT : 0) };

        target.classList.add('dragging');
        target.style.transform       = 'scale(1)';
        target.style.transformOrigin = 'top left';
        document.body.appendChild(target);
        this._setDragPos(x, y);
    }

    _onDragMove(e) {
        if (!this.draggedBlock) return;
        e.preventDefault();
        const { x, y } = this._clientXY(e);
        this._setDragPos(x, y);
        this._highlightCells(x, y);
    }

    _onDragEnd(e) {
        if (!this.draggedBlock) return;
        const { x, y }  = this._clientXY(e);
        const placement  = this._getPlacement(x, y);

        if (placement && this._canPlace(placement.row, placement.col, this.draggedBlock.data)) {
            this._placeBlock(placement.row, placement.col, this.draggedBlock.data);
            this.currentBlocks[this.draggedBlock.slotIndex] = null;
            this.draggedBlock.element.remove();

            if (this.currentBlocks.every(b => b === null)) {
                this.comboCount = 0;
                this._generateNewBlocks();
            } else if (this._checkGameOver()) {
                this._triggerGameOver();
            }
        } else {
            const slot = document.getElementById(`slot-${this.draggedBlock.slotIndex}`);
            const el   = this.draggedBlock.element;
            el.classList.remove('dragging');
            el.style.left = el.style.top = '';
            el.style.transform = el.style.transformOrigin = '';
            slot.appendChild(el);
        }

        this._clearHighlights();
        this.draggedBlock = null;
    }

    _setDragPos(x, y) {
        this.draggedBlock.element.style.left = `${x - this.dragOffset.x}px`;
        this.draggedBlock.element.style.top  = `${y - this.dragOffset.y}px`;
    }

    _getPlacement(clientX, clientY) {
        const board     = document.getElementById('board');
        const boardRect = board.getBoundingClientRect();
        const cellSize  = boardRect.width / this.BOARD_SIZE;
        const relX = clientX - boardRect.left - this.dragOffset.x + cellSize / 2;
        const relY = clientY - boardRect.top  - this.dragOffset.y + cellSize / 2;
        const col  = Math.floor(relX / cellSize);
        const row  = Math.floor(relY / cellSize);
        if (row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE) return { row, col };
        return null;
    }

    _canPlace(row, col, blockData) {
        return blockData.cells.every(([dr, dc]) => {
            const nr = row + dr, nc = col + dc;
            return nr >= 0 && nr < this.BOARD_SIZE && nc >= 0 && nc < this.BOARD_SIZE && this.grid[nr][nc] === null;
        });
    }

    _placeBlock(row, col, blockData) {
        // Each call to _placeBlock increments the global clear-generation counter.
        // Any pending clear-animation callback that carries an older generation will
        // abort itself instead of wiping newly-placed cell state.
        this._clearGen = (this._clearGen || 0) + 1;
        const myGen = this._clearGen;

        blockData.cells.forEach(([dr, dc]) => {
            const nr = row + dr, nc = col + dc;
            // ---- Data model update ----
            this.grid[nr][nc] = blockData.color;  // only cell value; array structure untouched

            // ---- DOM update: strictly cell-level via _cellEl() ----
            const el = this._cellEl(nr, nc);
            if (!el) return;
            el.classList.add('occupied', 'placed-glow');
            el.style.setProperty('--block-color', blockData.color);
            el.dataset.gen = myGen;  // tag with generation for later guard checks
            this._spawnParticles(el.getBoundingClientRect(), blockData.color, 4);
            setTimeout(() => el.classList.remove('placed-glow'), 500);
        });

        this.sounds.playDrop();
        this.score += blockData.cells.length;

        const clearedLines = this._processLineClear();
        if (clearedLines > 0) {
            this.streakCount++;
            if (this.streakCount >= 2) {
                setTimeout(() => {
                    this.sounds.playCombo(this.streakCount);
                    this._showCombo(`STREAK x${this.streakCount}!`);
                }, 400);
            }
        } else {
            this.streakCount = 0;
        }

        // Score UI and level check — never touches grid container CSS
        this._updateScoreUI();
    }

    /**
     * _processLineClear — atomic, 4-phase line-clear pipeline.
     *
     * PHASE 1  Detect full rows and columns from data model only.
     * PHASE 2  Pre-clear LOCKED cells that are in the affected lines:
     *          remove locked-cell + occupied from their DOM nodes,
     *          set grid[][] = null, play unlock effect.
     * PHASE 3  Score calculation.
     * PHASE 4  Animate and reset remaining (non-LOCKED) filled cells;
     *          use clearGen snapshot to skip callbacks if a new block
     *          lands on the same cell before the 420 ms expires.
     *
     * The preview panel (currentBlocks / slot elements) is NEVER referenced here.
     * The grid container (#board / #board-container) is NEVER referenced here.
     * All DOM queries go through _cellEl(r, c) which is scoped to #board children.
     *
     * @returns {number}  Total lines cleared (rows + cols).
     */
    _processLineClear() {
        // ── PHASE 1: Detect ──────────────────────────────────────────────────────
        const rowsToClear = [];
        const colsToClear = [];

        for (let r = 0; r < this.BOARD_SIZE; r++) {
            // grid[r] must be a full 8-element array (structure is never modified)
            let full = true;
            for (let c = 0; c < this.BOARD_SIZE; c++) {
                if (this.grid[r][c] === null) { full = false; break; }
            }
            if (full) rowsToClear.push(r);
        }

        for (let c = 0; c < this.BOARD_SIZE; c++) {
            let full = true;
            for (let r = 0; r < this.BOARD_SIZE; r++) {
                if (this.grid[r][c] === null) { full = false; break; }
            }
            if (full) colsToClear.push(c);
        }

        const totalLines = rowsToClear.length + colsToClear.length;
        if (totalLines === 0) return 0;

        // ── PHASE 2: LOCKED-cell unlock (must run before grid is zeroed) ─────────
        const lockedCoords = new Set();  // key: "r,c"
        for (let r = 0; r < this.BOARD_SIZE; r++) {
            for (let c = 0; c < this.BOARD_SIZE; c++) {
                if (
                    this.grid[r][c] === 'LOCKED' &&
                    (rowsToClear.includes(r) || colsToClear.includes(c))
                ) {
                    lockedCoords.add(`${r},${c}`);

                    // Wipe data model value — array structure stays intact
                    this.grid[r][c] = null;

                    // DOM: only touch the individual cell via _cellEl()
                    const el = this._cellEl(r, c);
                    if (el) {
                        el.classList.remove('locked-cell', 'occupied', 'placed-glow', 'clearing');
                        el.style.removeProperty('--block-color');
                        el.removeAttribute('data-gen');
                        el.removeAttribute('data-clear-gen');
                        el.classList.add('unlocked-flash');
                        this._spawnParticles(el.getBoundingClientRect(), '#22d3ee', 12);
                        setTimeout(() => el.classList.remove('unlocked-flash'), 600);
                    }
                }
            }
        }
        if (lockedCoords.size > 0) {
            this.sounds._play(750, 'sine', 0.22, 0.14, 250);
        }

        // ── PHASE 3: Score and audio ──────────────────────────────────────────────
        this.comboCount = totalLines;
        this.sounds.playClear(totalLines * 2);

        const streakBonus = this.streakCount > 0 ? this.streakCount * 0.25 : 0;
        const comboMult   = totalLines >= 2 ? totalLines * 0.5 : 1;
        this.score       += Math.floor(totalLines * 100 * comboMult * (1 + streakBonus));

        let label = 'LINE CLEAR!';
        if      (totalLines === 2) label = 'DOUBLE CLEAR!';
        else if (totalLines === 3) label = 'TRIPLE CLEAR!';
        else if (totalLines >= 4)  label = 'MEGA CLEAR!';
        this._showCombo(label);

        // ── PHASE 4: Animate remaining cells and wipe data model ─────────────────
        // Collect unique (r,c) pairs — use a Set to deduplicate row+col intersections
        const toAnimate = new Set();
        rowsToClear.forEach(r => {
            for (let c = 0; c < this.BOARD_SIZE; c++) toAnimate.add(`${r},${c}`);
        });
        colsToClear.forEach(c => {
            for (let r = 0; r < this.BOARD_SIZE; r++) toAnimate.add(`${r},${c}`);
        });

        // Snapshot the generation counter at the moment this clear fires
        const clearGen = this._clearGen;

        toAnimate.forEach(key => {
            const [r, c] = key.split(',').map(Number);

            // Always zero out the data model (even if cell is in lockedCoords —
            // it was already null, so this is a safe no-op for those).
            this.grid[r][c] = null;  // value reset; array length/structure unchanged

            // Skip DOM animation for cells already handled by the LOCKED phase
            if (lockedCoords.has(key)) return;

            const el = this._cellEl(r, c);
            if (!el) return;

            // Tag cell with the clear generation for callback guard
            el.dataset.clearGen = clearGen;

            el.classList.add('clearing');
            this._spawnParticles(el.getBoundingClientRect(), '#ffffff', 8);

            setTimeout(() => {
                // Guard A: a newer _placeBlock call happened — a new block now
                //          occupies this cell. Do NOT wipe its state.
                if (parseInt(el.dataset.clearGen, 10) !== clearGen) return;

                // Guard B: the cell was re-placed in this same generation
                //          (edge-case: same gen, freshly occupied).
                if (el.dataset.gen && parseInt(el.dataset.gen, 10) > clearGen) return;

                // Safe to wipe — cell is genuinely empty in the data model
                el.classList.remove('occupied', 'clearing', 'placed-glow');
                el.style.removeProperty('--block-color');
                el.removeAttribute('data-gen');
                el.removeAttribute('data-clear-gen');
            }, 420);
        });

        if (this.level >= 3) this._triggerFireworks();

        return totalLines;
    }

    _highlightCells(x, y) {
        this._clearHighlights();
        const placement = this._getPlacement(x, y);
        if (!placement || !this.draggedBlock) return;
        const valid = this._canPlace(placement.row, placement.col, this.draggedBlock.data);
        this.draggedBlock.data.cells.forEach(([dr, dc]) => {
            const nr = placement.row + dr, nc = placement.col + dc;
            // _cellEl already bounds-checks, so no need for a manual check here
            const el = this._cellEl(nr, nc);
            if (!el) return;
            if (valid) {
                el.style.setProperty('--block-color', this.draggedBlock.data.color);
                el.classList.add('highlight-valid');
            } else {
                el.classList.add('highlight-invalid');
            }
        });
    }

    _clearHighlights() {
        document.querySelectorAll('.cell.highlight-valid, .cell.highlight-invalid').forEach(c =>
            c.classList.remove('highlight-valid', 'highlight-invalid'));
    }

    _checkGameOver() {
        const available = this.currentBlocks.filter(Boolean);
        if (!available.length) return false;
        for (const block of available) {
            for (let r = 0; r < this.BOARD_SIZE; r++) {
                for (let c = 0; c < this.BOARD_SIZE; c++) {
                    if (this._canPlace(r, c, block)) return false;
                }
            }
        }
        return true;
    }

    _triggerGameOver() {
        this.isOver = true;
        this.sounds.playGameOver();

        const isNewRecord = this.score > this.highScore;
        const titleEl = document.querySelector('.game-over-content h2');

        if (isNewRecord) {
            this.highScore = this.score;
            localStorage.setItem('bb-blast-highscore', this.highScore);
            if (titleEl) {
                titleEl.textContent = 'YENİ REKOR!';
                titleEl.classList.add('new-record-animation');
            }
            this.sounds._play(600, 'sine', 0.5, 0.25, 900);
        } else {
            if (titleEl) {
                titleEl.textContent = 'OYUN BİTTİ';
                titleEl.classList.remove('new-record-animation');
            }
        }

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-best').textContent  = this.highScore;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }

    _reset() {
        this.grid          = this._emptyGrid();
        this.score         = 0;
        this.level         = 1;
        this.isOver        = false;
        this.comboCount    = 0;
        this.streakCount   = 0;
        this._clearGen     = 0;  // Reset generation counter
        this.currentBlocks = [null, null, null];
        this.particles     = [];
        document.getElementById('game-over-overlay').classList.add('hidden');
        // Use classList (not className) so unrelated body classes aren't wiped
        ['level-1', 'level-2', 'level-3'].forEach(cls => document.body.classList.remove(cls));
        document.body.classList.add('level-1');
        this._createBoard();
        this._updateScoreUI();
        this._generateNewBlocks();
    }

    _updateScoreUI() {
        const scoreEl = document.getElementById('score');
        scoreEl.classList.remove('score-pop');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('score-pop');
        scoreEl.textContent = this.score.toString().padStart(4, '0');

        document.getElementById('high-score').textContent = Math.max(this.score, this.highScore);
        this.checkLevelUp();
    }

    checkLevelUp() {
        const targetLevel = Math.floor(this.score / 500) + 1;
        // Guard: prevent duplicate triggers if level hasn't actually changed or is already processing
        if (targetLevel === this.level || this._levelingUp) return;
        this._levelingUp = true;
        this.level = targetLevel;
        this.sounds.playLevelUp();
        this._applyLevelTheme();
        this.music.changeTrack(this.level);
        // Release guard after a short debounce
        setTimeout(() => { this._levelingUp = false; }, 600);
    }

    _applyLevelTheme() {
        const visualLevel = Math.min(this.level, 3);
        // Use classList instead of className so we never accidentally wipe
        // unrelated body classes (e.g. animation states set elsewhere).
        const newLevelClass = `level-${visualLevel}`;
        ['level-1', 'level-2', 'level-3'].forEach(cls => document.body.classList.remove(cls));
        document.body.classList.add(newLevelClass);
        
        const notification = document.getElementById('level-up-notification');
        document.getElementById('level-text').textContent = 'LEVEL UP!';
        notification.classList.remove('hidden');
        notification.style.animation = 'none';
        void notification.offsetHeight;
        notification.style.animation = '';
        setTimeout(() => notification.classList.add('hidden'), 1000);

        // Spawn 1 or 2 locked/frozen cells on transitioning to Level 3+
        if (this.level >= 3) {
            this._spawnLockedCells(Math.floor(Math.random() * 2) + 1);
        }
    }

    _spawnLockedCells(count) {
        let spawned = 0;
        for (let attempt = 0; attempt < 100 && spawned < count; attempt++) {
            const r = Math.floor(Math.random() * this.BOARD_SIZE);
            const c = Math.floor(Math.random() * this.BOARD_SIZE);
            if (this.grid[r][c] === null) {
                this.grid[r][c] = 'LOCKED';
                // Use _cellEl() — structurally prevents touching the grid container
                const el = this._cellEl(r, c);
                if (el) el.classList.add('locked-cell');
                spawned++;
            }
        }
    }

    _showCombo(text) {
        const el     = document.getElementById('combo-display');
        el.textContent = text;
        el.classList.remove('show');
        void el.offsetWidth;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 1300);
    }

    _resizeCanvas() {
        const rect = document.getElementById('board-container').getBoundingClientRect();
        this.canvas.width  = rect.width;
        this.canvas.height = rect.height;
    }

    _spawnParticles(rect, color, count) {
        const boardRect = document.getElementById('board-container').getBoundingClientRect();
        const x = rect.left - boardRect.left + rect.width  / 2;
        const y = rect.top  - boardRect.top  + rect.height / 2;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3.5 + 1.5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3.5 + 1.5,
                color,
                life: 1.0,
                decay: 0.025 + Math.random() * 0.025
            });
        }
    }

    rotateBlock(slotIndex) {
        const block = this.currentBlocks[slotIndex];
        if (!block) return;

        // Rotate cells clockwise: [r, c] -> [c, -r]
        let rotatedCells = block.cells.map(([r, c]) => [c, -r]);

        // Find min row and col to shift back to (0,0) origin
        const minR = Math.min(...rotatedCells.map(([r, c]) => r));
        const minC = Math.min(...rotatedCells.map(([r, c]) => c));

        block.cells = rotatedCells.map(([r, c]) => [r - minR, c - minC]);

        // Re-render the block in the slot
        this._renderBlock(slotIndex);

        // Play rotation sound
        this.sounds._play(400, 'triangle', 0.1, 0.12, 600);

        // Spawn small rotation particles around the slot
        const slot = document.getElementById(`slot-${slotIndex}`);
        if (slot) {
            this._spawnParticles(slot.getBoundingClientRect(), block.color, 5);
        }

        // Re-check game over state because rotation might make a block placeable!
        if (this.isOver) {
            if (!this._checkGameOver()) {
                this.isOver = false;
                document.getElementById('game-over-overlay').classList.add('hidden');
            }
        }
    }

    _triggerFireworks() {
        const w = this.canvas.width, h = this.canvas.height;
        [[0,0],[w,0],[0,h],[w,h]].forEach(([cx, cy]) => {
            for (let i = 0; i < 20; i++) {
                this.particles.push({
                    x: cx, y: cy,
                    vx: (cx === 0 ? 1 : -1) * (Math.random() * 9 + 1),
                    vy: (cy === 0 ? 1 : -1) * (Math.random() * 9 + 1),
                    size: Math.random() * 5 + 2,
                    color: `hsl(${Math.random() * 360}, 80%, 65%)`,
                    life: 1.0,
                    decay: 0.012
                });
            }
        });
    }

    _animateLoop() {
        const ctx = this.canvasCtx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.08; p.vx *= 0.98;
            p.life -= p.decay;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            ctx.globalAlpha = p.life;
            ctx.fillStyle   = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(() => this._animateLoop());
    }
}

/* =============================================
   BOOT
   ============================================= */
window.addEventListener('load', () => {
    window._BBBlastGame = new Game();
});
