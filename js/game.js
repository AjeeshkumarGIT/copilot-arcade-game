/*  ======================================================
    Copilot Arcade — Snake Game Engine
    Pure-JS · HTML5 Canvas · Zero Dependencies
    ====================================================== */

(() => {
  'use strict';

  // ---- DOM refs -------------------------------------------------
  const canvas   = document.getElementById('gameCanvas');
  const ctx      = canvas.getContext('2d');
  const overlay  = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayMsg   = document.getElementById('overlayMsg');
  const scoreEl  = document.getElementById('score');
  const highEl   = document.getElementById('highScore');
  const speedEl  = document.getElementById('speed');

  // ---- Constants ------------------------------------------------
  const GRID      = 20;           // cell size in px
  const COLS      = canvas.width  / GRID;  // 20
  const ROWS      = canvas.height / GRID;  // 20
  const BASE_TICK = 150;          // ms per move at speed 1
  const SPEED_UP  = 8;            // ms faster per speed level
  const PTS_PER_LVL = 5;          // points before speed bump

  // ---- Colours --------------------------------------------------
  const CLR_BG        = '#0a0a12';
  const CLR_GRID      = '#111119';
  const CLR_SNAKE     = '#00ff7f';
  const CLR_SNAKE_HEAD = '#00cc66';
  const CLR_FOOD      = '#ff4081';
  const CLR_FOOD_GLOW = 'rgba(255,64,129,0.25)';

  // ---- Direction vectors ----------------------------------------
  const DIR = {
    UP:    { x:  0, y: -1 },
    DOWN:  { x:  0, y:  1 },
    LEFT:  { x: -1, y:  0 },
    RIGHT: { x:  1, y:  0 },
  };

  // ---- Game state ------------------------------------------------
  let snake, direction, nextDirection, food;
  let score, highScore, speedLevel;
  let running, paused, gameOver;
  let lastTick, tickInterval;

  // ---- Init / Reset ---------------------------------------------
  function init() {
    highScore = parseInt(localStorage.getItem('snake_high') || '0', 10);
    highEl.textContent = highScore;
    resetGame();
    showOverlay('🐍 SNAKE', 'Press <kbd>SPACE</kbd> to start');
    requestAnimationFrame(loop);
  }

  function resetGame() {
    const mid = Math.floor(COLS / 2);
    snake = [
      { x: mid, y: 10 },
      { x: mid - 1, y: 10 },
      { x: mid - 2, y: 10 },
    ];
    direction     = DIR.RIGHT;
    nextDirection = DIR.RIGHT;
    score      = 0;
    speedLevel = 1;
    running    = false;
    paused     = false;
    gameOver   = false;
    lastTick   = 0;
    tickInterval = BASE_TICK;
    updateUI();
    placeFood();
  }

  // ---- Food -----------------------------------------------------
  function placeFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  // ---- Update (tick) --------------------------------------------
  function update() {
    direction = nextDirection;

    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y,
    };

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      return endGame();
    }
    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      return endGame();
    }

    snake.unshift(head);

    // Eat food?
    if (head.x === food.x && head.y === food.y) {
      score++;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('snake_high', highScore);
      }
      // Speed increase
      if (score % PTS_PER_LVL === 0) {
        speedLevel++;
        tickInterval = Math.max(50, BASE_TICK - speedLevel * SPEED_UP);
      }
      updateUI();
      placeFood();
    } else {
      snake.pop();
    }
  }

  // ---- Rendering ------------------------------------------------
  function draw() {
    // Background
    ctx.fillStyle = CLR_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = CLR_GRID;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * GRID, 0); ctx.lineTo(x * GRID, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * GRID); ctx.lineTo(canvas.width, y * GRID); ctx.stroke();
    }

    // Food glow
    ctx.fillStyle = CLR_FOOD_GLOW;
    ctx.beginPath();
    ctx.arc(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID, 0, Math.PI * 2);
    ctx.fill();

    // Food
    ctx.fillStyle = CLR_FOOD;
    roundRect(food.x * GRID + 2, food.y * GRID + 2, GRID - 4, GRID - 4, 4);

    // Snake
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? CLR_SNAKE_HEAD : CLR_SNAKE;
      ctx.shadowColor = CLR_SNAKE;
      ctx.shadowBlur = i === 0 ? 10 : 4;
      roundRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2, 4);
      ctx.shadowBlur = 0;
    });
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();
  }

  // ---- Game loop ------------------------------------------------
  function loop(timestamp) {
    if (running && !paused && !gameOver) {
      if (timestamp - lastTick >= tickInterval) {
        lastTick = timestamp;
        update();
      }
    }
    draw();
    requestAnimationFrame(loop);
  }

  // ---- Overlay helpers ------------------------------------------
  function showOverlay(title, msg) {
    overlayTitle.textContent = title;
    overlayMsg.innerHTML = msg;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  // ---- End game -------------------------------------------------
  function endGame() {
    gameOver = true;
    running  = false;
    showOverlay(
      'GAME OVER',
      `Score: ${score}<br>Press <kbd>SPACE</kbd> to retry`
    );
  }

  // ---- UI sync --------------------------------------------------
  function updateUI() {
    scoreEl.textContent = score;
    highEl.textContent  = highScore;
    speedEl.textContent = speedLevel;
  }

  // ---- Input ----------------------------------------------------
  const keyMap = {
    ArrowUp:    DIR.UP,    KeyW: DIR.UP,
    ArrowDown:  DIR.DOWN,  KeyS: DIR.DOWN,
    ArrowLeft:  DIR.LEFT,  KeyA: DIR.LEFT,
    ArrowRight: DIR.RIGHT, KeyD: DIR.RIGHT,
  };

  function opposite(a, b) {
    return a.x + b.x === 0 && a.y + b.y === 0;
  }

  document.addEventListener('keydown', (e) => {
    // Start / Restart
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (!running || gameOver) {
        resetGame();
        running = true;
        hideOverlay();
      }
      return;
    }

    // Pause
    if (e.code === 'KeyP' && running && !gameOver) {
      paused = !paused;
      if (paused) {
        showOverlay('PAUSED', 'Press <kbd>P</kbd> to resume');
      } else {
        hideOverlay();
      }
      return;
    }

    // Direction
    const dir = keyMap[e.code];
    if (dir && !opposite(dir, direction)) {
      e.preventDefault();
      nextDirection = dir;
    }
  });

  // ---- Boot -----------------------------------------------------
  init();
})();
