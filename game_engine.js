// Super Mario Bros - 60 FPS Canvas Game Engine with Hand Tracking & Full 4 Worlds

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const GROUND_Y = 500;
const GAME_W = 900;
const GAME_H = 520;
const TOTAL_WORLDS = 4;

// NES Palette Colors
const COLORS = {
  NES_SKY: '#5c94fc',
  UNDERGROUND_BG: '#000000',
  ATHLETIC_SKY: '#6090e8',
  CASTLE_BG: '#000000',
  GROUND_RUST: '#c84400',
  GROUND_PEACH: '#fc9838',
  BLUE_BRICK: '#0078f8',
  BLUE_HIGHLIGHT: '#6888fc',
  CASTLE_STONE: '#5c5c5c',
  CASTLE_HIGHLIGHT: '#8c8c8c',
  PIPE_GREEN: '#00a800',
  PIPE_HIGHLIGHT: '#5cf45c',
  PIPE_SHADOW: '#004000',
  BRICK_RED: '#b83400',
  BRICK_MORTAR: '#000000',
  Q_GOLD: '#fcd116',
  Q_USED: '#805000',
  LAVA_RED: '#e52521',
  LAVA_GOLD: '#fcd116',
  HILL_GREEN: '#00a800',
  BUSH_LIME: '#5cf45c',
  CLOUD_WHITE: '#ffffff',
  CLOUD_OUTLINE: '#4068c8',
  MARIO_RED: '#e52521',
  MARIO_SKIN: '#f8b888',
  MARIO_BROWN: '#6b4400',
  GOOMBA_BROWN: '#a84000',
  GOOMBA_STEM: '#fcb890',
  GOOMBA_BLUE: '#0058f8',
  GOOMBA_GRAY: '#606060'
};

// Game State
let currentLevel = 1;
let LEVEL_END_X = 3600;
let checkpoint_x = 1820;
let checkpoint_reached = false;

let ground_sections = [];
let pipes = [];
let bricks = [];
let q_blocks = [];
let moving_platforms = [];
let springs = [];
let stairs = [];
let coins = [];
let goombas = [];
let floating_popups = [];
let hills = [];
let bushes = [];
let clouds = [];

// Mario Physics State
let mario = { x: 80, y: GROUND_Y - 38, w: 24, h: 38 };
let mario_fx = 80.0;
let mario_fy = (GROUND_Y - 38);
let mario_vx = 0.0;
let mario_vy = 0.0;
let mario_facing = 1;
let on_ground = true;
let coyote_frames = 0;
let jump_buffer_frames = 0;
let invincible_frames = 0;
let camera_fx = 0.0;
let camera_x = 0;
let lives = 3;
let score = 0;
let coin_count = 0;
let world_timer = 400.0;
let banner_frames = 0;
let banner_text = "";

// Game Modes: 'REGISTER' or 'PLAYING'
let gameMode = 'REGISTER';
let playerName = 'MARIO';
let playerPhotoB64 = '';
let allowCloudSync = true;

// Active Keys
const keysDown = {};

// FPS Meter
let lastTime = performance.now();
let frameCount = 0;
let currentFPS = 60;
let tickCount = 0;

function buildLevel(levelNum, respawnAtCheckpoint = false) {
  currentLevel = levelNum;
  if (!respawnAtCheckpoint) {
    checkpoint_reached = false;
  }

  const tier1_y = GROUND_Y - 96;
  const tier2_y = GROUND_Y - 180;
  const tier3_y = GROUND_Y - 260;

  if (levelNum === 1) {
    // WORLD 1-1: Classic Overworld
    LEVEL_END_X = 3600;
    checkpoint_x = 1820;
    ground_sections = [
      { x: 0, y: GROUND_Y, w: 1320, h: 100 },
      { x: 1388, y: GROUND_Y, w: 1080, h: 100 },
      { x: 2536, y: GROUND_Y, w: 1250, h: 100 }
    ];
    pipes = [
      { x: 460, y: GROUND_Y - 56, w: 56, h: 56 },
      { x: 760, y: GROUND_Y - 72, w: 56, h: 72 },
      { x: 1080, y: GROUND_Y - 84, w: 56, h: 84 },
      { x: 1980, y: GROUND_Y - 64, w: 56, h: 64 },
      { x: 2760, y: GROUND_Y - 72, w: 56, h: 72 }
    ];
    const brick_coords = [
      [260, tier1_y], [324, tier1_y], [388, tier1_y],
      [880, tier1_y], [912, tier1_y], [944, tier1_y],
      [1520, tier1_y], [1584, tier1_y], [1616, tier1_y],
      [1648, tier2_y], [1680, tier2_y], [1712, tier2_y],
      [2140, tier1_y], [2204, tier1_y], [2268, tier1_y],
      [2204, tier2_y], [2236, tier2_y],
      [2920, tier1_y], [2984, tier1_y], [3016, tier1_y]
    ];
    bricks = brick_coords.map(([x, y]) => ({ x, y, w: 32, h: 32 }));

    const q_coords = [
      [196, tier1_y], [292, tier1_y], [356, tier1_y], [324, tier2_y],
      [912, tier2_y], [1552, tier1_y], [1680, tier1_y],
      [2172, tier1_y], [2236, tier1_y], [2952, tier1_y], [2984, tier2_y]
    ];
    q_blocks = q_coords.map(([x, y]) => ({ x, y, w: 32, h: 32, used: false, bounce: 0 }));

    moving_platforms = [
      { x: 1328, y: GROUND_Y - 40, w: 56, h: 16, vx: 0, vy: -1.2, min_y: GROUND_Y - 120, max_y: GROUND_Y - 24 },
      { x: 2472, y: GROUND_Y - 48, w: 56, h: 16, vx: 1.4, vy: 0, min_x: 2448, max_x: 2520 }
    ];
    springs = [
      { x: 1220, y: GROUND_Y - 28, w: 28, h: 28 },
      { x: 2660, y: GROUND_Y - 28, w: 28, h: 28 }
    ];
    stairs = [];
    for (let s = 0; s < 6; s++) {
      stairs.push({ x: 3180 + s * 32, y: GROUND_Y - (s + 1) * 28, w: 32, h: (s + 1) * 28 });
    }
    const coin_coords = [
      [203, tier1_y - 40], [299, tier1_y - 40], [363, tier1_y - 40], [331, tier2_y - 40],
      [480, GROUND_Y - 96], [780, GROUND_Y - 112], [919, tier2_y - 40],
      [1225, tier2_y - 30], [1655, tier2_y - 40], [1687, tier2_y - 40], [1719, tier2_y - 40],
      [2000, GROUND_Y - 104], [2211, tier2_y - 40], [2243, tier2_y - 40],
      [2780, GROUND_Y - 112], [2959, tier1_y - 40], [2991, tier2_y - 40]
    ];
    coins = coin_coords.map(([x, y]) => ({ x, y, w: 18, h: 24 }));

    goombas = [
      { x: 400, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.2, min_x: 180, max_x: 445, state: 'walk', timer: 0 },
      { x: 680, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.2, min_x: 530, max_x: 745, state: 'walk', timer: 0 },
      { x: 990, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.2, min_x: 830, max_x: 1065, state: 'walk', timer: 0 },
      { x: 1760, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.3, min_x: 1440, max_x: 1950, state: 'walk', timer: 0 },
      { x: 2320, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.3, min_x: 2050, max_x: 2440, state: 'walk', timer: 0 },
      { x: 3060, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.4, min_x: 2830, max_x: 3150, state: 'walk', timer: 0 }
    ];

    hills = [[40, 160, 80], [580, 110, 56], [1160, 160, 80], [1780, 120, 60], [2340, 150, 75], [2980, 140, 70]];
    bushes = [[220, 96], [660, 72], [1260, 96], [1860, 72], [2240, 96], [2860, 84]];
    clouds = [[100, 70, 96], [380, 52, 72], [720, 78, 112], [1120, 58, 88], [1560, 70, 96], [2040, 56, 84], [2500, 68, 96], [3050, 58, 92]];

  } else if (levelNum === 2) {
    // WORLD 1-2: Underground Blue-Brick Caverns
    LEVEL_END_X = 3700;
    checkpoint_x = 1860;
    ground_sections = [
      { x: 0, y: GROUND_Y, w: 1180, h: 100 },
      { x: 1260, y: GROUND_Y, w: 1060, h: 100 },
      { x: 2400, y: GROUND_Y, w: 1450, h: 100 }
    ];
    pipes = [
      { x: 520, y: GROUND_Y - 64, w: 56, h: 64 },
      { x: 980, y: GROUND_Y - 80, w: 56, h: 80 },
      { x: 1680, y: GROUND_Y - 72, w: 56, h: 72 },
      { x: 2620, y: GROUND_Y - 64, w: 56, h: 64 }
    ];
    const brick_coords = [
      [240, tier1_y], [272, tier1_y], [304, tier1_y],
      [368, tier2_y], [400, tier2_y], [432, tier2_y],
      [700, tier1_y], [732, tier1_y], [764, tier1_y],
      [1360, tier1_y], [1392, tier1_y], [1424, tier1_y],
      [1456, tier2_y], [1488, tier2_y], [1520, tier2_y],
      [1920, tier1_y], [1952, tier1_y], [1984, tier1_y],
      [2016, tier2_y], [2048, tier2_y],
      [2780, tier1_y], [2812, tier1_y], [2876, tier1_y], [2908, tier2_y]
    ];
    bricks = brick_coords.map(([x, y]) => ({ x, y, w: 32, h: 32 }));

    const q_coords = [
      [208, tier1_y], [336, tier1_y], [400, tier1_y],
      [732, tier2_y], [1392, tier2_y], [1952, tier2_y],
      [2480, tier1_y], [2844, tier1_y], [2876, tier2_y]
    ];
    q_blocks = q_coords.map(([x, y]) => ({ x, y, w: 32, h: 32, used: false, bounce: 0 }));

    moving_platforms = [
      { x: 1188, y: GROUND_Y - 60, w: 64, h: 16, vx: 0, vy: -1.4, min_y: tier2_y, max_y: GROUND_Y - 20 },
      { x: 2328, y: GROUND_Y - 70, w: 64, h: 16, vx: 0, vy: 1.4, min_y: tier2_y, max_y: GROUND_Y - 20 }
    ];
    springs = [
      { x: 880, y: GROUND_Y - 28, w: 28, h: 28 },
      { x: 2160, y: GROUND_Y - 28, w: 28, h: 28 }
    ];
    stairs = [];
    for (let s = 0; s < 6; s++) {
      stairs.push({ x: 3260 + s * 32, y: GROUND_Y - (s + 1) * 28, w: 32, h: (s + 1) * 28 });
    }
    const coin_coords = [
      [248, tier1_y - 40], [280, tier1_y - 40], [376, tier2_y - 40], [408, tier2_y - 40],
      [540, GROUND_Y - 104], [739, tier2_y - 40], [1000, GROUND_Y - 118],
      [1464, tier2_y - 40], [1496, tier2_y - 40], [1528, tier2_y - 40],
      [1700, GROUND_Y - 110], [1959, tier2_y - 40], [2024, tier2_y - 40],
      [2640, GROUND_Y - 104], [2851, tier1_y - 40], [2883, tier2_y - 40]
    ];
    coins = coin_coords.map(([x, y]) => ({ x, y, w: 18, h: 24 }));

    goombas = [
      { x: 430, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.3, min_x: 180, max_x: 500, state: 'walk', timer: 0 },
      { x: 820, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.3, min_x: 590, max_x: 960, state: 'walk', timer: 0 },
      { x: 1560, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.4, min_x: 1280, max_x: 1660, state: 'walk', timer: 0 },
      { x: 2040, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.4, min_x: 1750, max_x: 2280, state: 'walk', timer: 0 },
      { x: 3020, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.5, min_x: 2700, max_x: 3220, state: 'walk', timer: 0 }
    ];
    hills = []; bushes = []; clouds = [];

  } else if (levelNum === 3) {
    // WORLD 1-3: Athletic Sky Treetops
    LEVEL_END_X = 3700;
    checkpoint_x = 1820;
    ground_sections = [
      { x: 0, y: GROUND_Y, w: 920, h: 100 },
      { x: 1020, y: GROUND_Y, w: 740, h: 100 },
      { x: 1860, y: GROUND_Y, w: 760, h: 100 },
      { x: 2720, y: GROUND_Y, w: 1150, h: 100 }
    ];
    pipes = [
      { x: 440, y: GROUND_Y - 64, w: 56, h: 64 },
      { x: 1420, y: GROUND_Y - 72, w: 56, h: 72 },
      { x: 2280, y: GROUND_Y - 64, w: 56, h: 64 }
    ];
    const brick_coords = [
      [220, tier1_y], [252, tier1_y], [284, tier1_y],
      [580, tier2_y], [612, tier2_y], [644, tier2_y], [676, tier2_y],
      [1160, tier1_y], [1192, tier1_y], [1224, tier1_y],
      [1256, tier2_y], [1288, tier2_y], [1320, tier2_y],
      [1980, tier1_y], [2012, tier1_y], [2044, tier1_y],
      [2076, tier2_y], [2108, tier2_y], [2140, tier3_y], [2172, tier3_y],
      [2880, tier1_y], [2912, tier1_y], [2944, tier2_y], [2976, tier2_y]
    ];
    bricks = brick_coords.map(([x, y]) => ({ x, y, w: 32, h: 32 }));

    const q_coords = [
      [252, tier2_y], [612, tier1_y], [1192, tier2_y],
      [1600, tier1_y], [2012, tier2_y], [2140, tier2_y],
      [2912, tier2_y], [3040, tier1_y]
    ];
    q_blocks = q_coords.map(([x, y]) => ({ x, y, w: 32, h: 32, used: false, bounce: 0 }));

    moving_platforms = [
      { x: 928, y: GROUND_Y - 44, w: 84, h: 16, vx: 1.3, vy: 0, min_x: 916, max_x: 1016 },
      { x: 1768, y: GROUND_Y - 52, w: 84, h: 16, vx: 1.5, vy: 0, min_x: 1756, max_x: 1856 },
      { x: 2628, y: GROUND_Y - 60, w: 84, h: 16, vx: 0, vy: -1.5, min_y: tier2_y, max_y: GROUND_Y - 24 }
    ];
    springs = [
      { x: 520, y: GROUND_Y - 28, w: 28, h: 28 },
      { x: 1520, y: GROUND_Y - 28, w: 28, h: 28 },
      { x: 2420, y: GROUND_Y - 28, w: 28, h: 28 }
    ];
    stairs = [];
    for (let s = 0; s < 6; s++) {
      stairs.push({ x: 3260 + s * 32, y: GROUND_Y - (s + 1) * 28, w: 32, h: (s + 1) * 28 });
    }
    const coin_coords = [
      [259, tier2_y - 40], [588, tier2_y - 40], [620, tier2_y - 40], [652, tier2_y - 40],
      [955, GROUND_Y - 90], [1264, tier2_y - 40], [1296, tier2_y - 40],
      [1795, GROUND_Y - 96], [2148, tier3_y - 40], [2180, tier3_y - 40],
      [2655, tier2_y - 40], [2952, tier2_y - 40], [2984, tier2_y - 40]
    ];
    coins = coin_coords.map(([x, y]) => ({ x, y, w: 18, h: 24 }));

    goombas = [
      { x: 360, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.3, min_x: 160, max_x: 420, state: 'walk', timer: 0 },
      { x: 780, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.4, min_x: 560, max_x: 890, state: 'walk', timer: 0 },
      { x: 1320, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.4, min_x: 1060, max_x: 1400, state: 'walk', timer: 0 },
      { x: 2160, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.5, min_x: 1900, max_x: 2260, state: 'walk', timer: 0 },
      { x: 3100, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.5, min_x: 2760, max_x: 3220, state: 'walk', timer: 0 }
    ];
    hills = [[60, 140, 70], [1100, 150, 75], [1950, 140, 70], [2820, 150, 75]];
    bushes = [[280, 96], [1240, 84], [2080, 96], [2960, 84]];
    clouds = [[80, 60, 110], [320, 48, 88], [620, 64, 112], [960, 50, 96], [1340, 62, 108], [1720, 48, 92], [2120, 60, 110], [2560, 52, 96], [3020, 60, 108]];

  } else {
    // WORLD 1-4: Bowser's Stone Fortress
    LEVEL_END_X = 3800;
    checkpoint_x = 1880;
    ground_sections = [
      { x: 0, y: GROUND_Y, w: 1040, h: 100 },
      { x: 1140, y: GROUND_Y, w: 820, h: 100 },
      { x: 2060, y: GROUND_Y, w: 820, h: 100 },
      { x: 2980, y: GROUND_Y, w: 1000, h: 100 }
    ];
    pipes = [
      { x: 500, y: GROUND_Y - 64, w: 56, h: 64 },
      { x: 1540, y: GROUND_Y - 72, w: 56, h: 72 },
      { x: 2520, y: GROUND_Y - 64, w: 56, h: 64 }
    ];
    const brick_coords = [
      [240, tier1_y], [272, tier1_y], [304, tier1_y], [336, tier1_y],
      [660, tier1_y], [692, tier1_y], [724, tier2_y], [756, tier2_y],
      [1260, tier1_y], [1292, tier1_y], [1324, tier2_y], [1356, tier2_y],
      [1680, tier1_y], [1712, tier1_y], [1744, tier1_y],
      [2200, tier1_y], [2232, tier1_y], [2264, tier2_y], [2296, tier2_y],
      [2660, tier1_y], [2692, tier1_y], [2724, tier2_y],
      [3100, tier1_y], [3132, tier1_y], [3164, tier2_y]
    ];
    bricks = brick_coords.map(([x, y]) => ({ x, y, w: 32, h: 32 }));

    const q_coords = [
      [272, tier2_y], [724, tier1_y], [1324, tier1_y],
      [1712, tier2_y], [2264, tier1_y], [2724, tier1_y]
    ];
    q_blocks = q_coords.map(([x, y]) => ({ x, y, w: 32, h: 32, used: false, bounce: 0 }));

    moving_platforms = [
      { x: 1048, y: GROUND_Y - 48, w: 84, h: 16, vx: 1.4, vy: 0, min_x: 1040, max_x: 1130 },
      { x: 1968, y: GROUND_Y - 48, w: 84, h: 16, vx: 1.4, vy: 0, min_x: 1960, max_x: 2050 },
      { x: 2888, y: GROUND_Y - 56, w: 84, h: 16, vx: 0, vy: -1.4, min_y: tier2_y, max_y: GROUND_Y - 24 }
    ];
    springs = [
      { x: 800, y: GROUND_Y - 28, w: 28, h: 28 },
      { x: 1840, y: GROUND_Y - 28, w: 28, h: 28 },
      { x: 2760, y: GROUND_Y - 28, w: 28, h: 28 }
    ];
    stairs = [];
    for (let s = 0; s < 6; s++) {
      stairs.push({ x: 3340 + s * 32, y: GROUND_Y - (s + 1) * 28, w: 32, h: (s + 1) * 28 });
    }
    const coin_coords = [
      [250, tier1_y - 40], [310, tier1_y - 40], [670, tier1_y - 40], [730, tier2_y - 40],
      [1080, GROUND_Y - 96], [1270, tier1_y - 40], [1330, tier2_y - 40],
      [2000, GROUND_Y - 96], [2210, tier1_y - 40], [2270, tier2_y - 40],
      [2670, tier1_y - 40], [3110, tier1_y - 40], [3140, tier2_y - 40]
    ];
    coins = coin_coords.map(([x, y]) => ({ x, y, w: 18, h: 24 }));

    goombas = [
      { x: 420, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.4, min_x: 180, max_x: 480, state: 'walk', timer: 0 },
      { x: 860, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.4, min_x: 620, max_x: 1020, state: 'walk', timer: 0 },
      { x: 1420, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.5, min_x: 1200, max_x: 1520, state: 'walk', timer: 0 },
      { x: 2360, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.5, min_x: 2120, max_x: 2500, state: 'walk', timer: 0 },
      { x: 3200, y: GROUND_Y - 32, w: 32, h: 32, vx: -1.6, min_x: 3020, max_x: 3320, state: 'walk', timer: 0 }
    ];
    hills = []; bushes = []; clouds = [];
  }

  // Respawn Mario
  if (respawnAtCheckpoint && checkpoint_reached) {
    mario_fx = checkpoint_x;
  } else {
    mario_fx = 80.0;
  }
  mario_fy = GROUND_Y - 38;
  mario.x = Math.round(mario_fx);
  mario.y = Math.round(mario_fy);
  mario_vx = 0.0;
  mario_vy = 0.0;
  on_ground = true;
  coyote_frames = 0;
  jump_buffer_frames = 0;
  camera_fx = Math.max(0, mario_fx - 200);
  camera_x = Math.round(camera_fx);
  world_timer = 400.0;
}

function rectsIntersect(r1, r2) {
  return r1.x < r2.x + r2.w &&
         r1.x + r1.w > r2.x &&
         r1.y < r2.y + r2.h &&
         r1.y + r1.h > r2.y;
}

// 8-bit Mario Drawing
function drawMarioSprite(sx, sy, facing, jumping, walkStep) {
  ctx.fillStyle = COLORS.MARIO_RED;
  ctx.fillRect(sx + 4, sy, 18, 5);

  if (facing >= 0) {
    ctx.fillRect(sx + 2, sy + 4, 24, 4);
    ctx.fillStyle = COLORS.MARIO_SKIN;
    ctx.fillRect(sx + 6, sy + 8, 18, 10);
    ctx.fillStyle = COLORS.MARIO_BROWN;
    ctx.fillRect(sx + 3, sy + 8, 6, 8);
    ctx.fillStyle = '#000000';
    ctx.fillRect(sx + 18, sy + 10, 3, 4);
    ctx.fillStyle = COLORS.MARIO_BROWN;
    ctx.fillRect(sx + 14, sy + 15, 11, 3);
  } else {
    ctx.fillRect(sx + 2, sy + 4, 24, 4);
    ctx.fillStyle = COLORS.MARIO_SKIN;
    ctx.fillRect(sx + 4, sy + 8, 18, 10);
    ctx.fillStyle = COLORS.MARIO_BROWN;
    ctx.fillRect(sx + 19, sy + 8, 6, 8);
    ctx.fillStyle = '#000000';
    ctx.fillRect(sx + 7, sy + 10, 3, 4);
    ctx.fillStyle = COLORS.MARIO_BROWN;
    ctx.fillRect(sx + 3, sy + 15, 11, 3);
  }

  ctx.fillStyle = COLORS.MARIO_BROWN;
  ctx.fillRect(sx + 2, sy + 18, 24, 14);
  ctx.fillStyle = COLORS.MARIO_RED;
  ctx.fillRect(sx + 6, sy + 18, 16, 16);
  ctx.fillStyle = COLORS.Q_GOLD;
  ctx.fillRect(sx + 8, sy + 24, 3, 3);
  ctx.fillRect(sx + 17, sy + 24, 3, 3);
  ctx.fillStyle = COLORS.MARIO_SKIN;
  ctx.fillRect(sx, sy + 21, 4, 6);
  ctx.fillRect(sx + 24, sy + 21, 4, 6);

  ctx.fillStyle = COLORS.MARIO_BROWN;
  if (jumping || Math.floor(walkStep / 5) % 2 === 1) {
    ctx.fillRect(sx, sy + 32, 11, 6);
    ctx.fillRect(sx + 15, sy + 30, 11, 6);
  } else {
    ctx.fillRect(sx + 2, sy + 32, 10, 6);
    ctx.fillRect(sx + 14, sy + 32, 10, 6);
  }
}

// 8-bit Goomba Drawing
function drawGoombaSprite(sx, sy, state, tick, levelNum) {
  let capColor = COLORS.GOOMBA_BROWN;
  if (levelNum === 2) capColor = COLORS.GOOMBA_BLUE;
  if (levelNum === 4) capColor = COLORS.GOOMBA_GRAY;

  if (state === 'squished') {
    ctx.fillStyle = capColor;
    ctx.fillRect(sx + 2, sy + 20, 28, 8);
    ctx.fillStyle = COLORS.GOOMBA_STEM;
    ctx.fillRect(sx + 8, sy + 28, 16, 4);
    return;
  }

  // Cap
  ctx.fillStyle = capColor;
  ctx.beginPath();
  ctx.moveTo(sx + 16, sy);
  ctx.lineTo(sx + 31, sy + 14);
  ctx.lineTo(sx + 28, sy + 22);
  ctx.lineTo(sx + 4, sy + 22);
  ctx.lineTo(sx + 1, sy + 14);
  ctx.closePath();
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#000000';
  ctx.fillRect(sx + 7, sy + 10, 4, 7);
  ctx.fillRect(sx + 21, sy + 10, 4, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx + 9, sy + 12, 2, 4);
  ctx.fillRect(sx + 21, sy + 12, 2, 4);

  // Stem & feet
  ctx.fillStyle = COLORS.GOOMBA_STEM;
  ctx.fillRect(sx + 10, sy + 22, 12, 6);

  ctx.fillStyle = '#000000';
  if (Math.floor(tick / 10) % 2 === 0) {
    ctx.fillRect(sx + 3, sy + 26, 10, 6);
    ctx.fillRect(sx + 19, sy + 28, 10, 4);
  } else {
    ctx.fillRect(sx + 3, sy + 28, 10, 4);
    ctx.fillRect(sx + 19, sy + 26, 10, 6);
  }
}

// Update Mario Physics and Game State
function updateGame(dt) {
  const dt_scale = Math.min(2.2, Math.max(0.5, dt * 60.0));
  world_timer = Math.max(0, world_timer - dt);
  tickCount++;

  if (banner_frames > 0) banner_frames--;
  if (invincible_frames > 0) invincible_frames--;

  // Update Moving Platforms
  for (const plat of moving_platforms) {
    const oldPx = plat.x;
    const oldPy = plat.y;
    plat.x += plat.vx * dt_scale;
    plat.y += plat.vy * dt_scale;

    if (plat.vx !== 0 && (plat.x < plat.min_x || plat.x > plat.max_x)) {
      plat.vx = -plat.vx;
    }
    if (plat.vy !== 0 && (plat.y < plat.min_y || plat.y > plat.max_y)) {
      plat.vy = -plat.vy;
    }

    const dxP = plat.x - oldPx;
    const dyP = plat.y - oldPy;
    if (on_ground && Math.abs((mario.y + mario.h) - oldPy) <= 4 &&
        (mario.x + mario.w) > plat.x && mario.x < (plat.x + plat.w)) {
      mario_fx += dxP;
      mario_fy += dyP;
      mario.x = Math.round(mario_fx);
      mario.y = Math.round(mario_fy);
    }
  }

  // Combined Controls: Keyboard + MediaPipe Hand Gestures
  const kbRight = keysDown['ArrowRight'] || keysDown['KeyD'];
  const kbLeft = keysDown['ArrowLeft'] || keysDown['KeyA'];
  const kbJump = keysDown['Space'] || keysDown['ArrowUp'] || keysDown['KeyW'];

  const aiRight = (handTracker.currentGesture === "RUN RIGHT" || handTracker.currentGesture === "JUMP + RIGHT");
  const aiLeft = (handTracker.currentGesture === "RUN LEFT");
  const aiJump = (handTracker.currentGesture === "JUMP" || handTracker.currentGesture === "JUMP + RIGHT");

  const moveRight = kbRight || aiRight;
  const moveLeft = kbLeft || aiLeft;
  const wantJump = kbJump || aiJump;

  // Horizontal acceleration & momentum
  const max_run_speed = 4.2;
  const accel = 0.55 * dt_scale;
  if (moveRight) {
    mario_vx = Math.min(max_run_speed, mario_vx + accel);
    mario_facing = 1;
  } else if (moveLeft) {
    mario_vx = Math.max(-max_run_speed, mario_vx - accel);
    mario_facing = -1;
  } else {
    const decay = Math.pow((on_ground ? 0.82 : 0.96), dt_scale);
    mario_vx *= decay;
    if (Math.abs(mario_vx) < 0.15) mario_vx = 0.0;
  }

  // Coyote time & Jump buffer
  if (on_ground) {
    coyote_frames = 10;
  } else if (coyote_frames > 0) {
    coyote_frames--;
  }

  if (wantJump) {
    jump_buffer_frames = 10;
  } else if (jump_buffer_frames > 0) {
    jump_buffer_frames--;
  }

  if (jump_buffer_frames > 0 && coyote_frames > 0) {
    mario_vy = -9.8;
    on_ground = false;
    coyote_frames = 0;
    jump_buffer_frames = 0;
    audio.playJump();
    if (Math.abs(mario_vx) > 0.8) {
      mario_vx = max_run_speed * mario_facing;
    }
  }

  const solidRects = [
    ...ground_sections,
    ...pipes,
    ...bricks,
    ...q_blocks,
    ...stairs,
    ...moving_platforms
  ];

  // Horizontal collision
  mario_fx += mario_vx * dt_scale;
  if (mario_fx < camera_fx) mario_fx = camera_fx;
  mario.x = Math.round(mario_fx);

  for (const block of solidRects) {
    if (rectsIntersect(mario, block)) {
      if (block.y < (mario.y + mario.h) && (mario.y + mario.h) <= block.y + 6 && mario_vy >= 0) {
        mario.y = block.y - mario.h;
        mario_fy = mario.y;
        on_ground = true;
      } else if (mario_vx > 0) {
        mario.x = block.x - mario.w;
        mario_fx = mario.x;
        mario_vx = 0.0;
      } else if (mario_vx < 0) {
        mario.x = block.x + block.w;
        mario_fx = mario.x;
        mario_vx = 0.0;
      }
    }
  }

  // Vertical collision & variable jump gravity
  const grav = (mario_vy < 0 && wantJump) ? 0.36 : 0.48;
  mario_vy = Math.min(8.5, mario_vy + grav * dt_scale);
  mario_fy += mario_vy * dt_scale;
  mario.y = Math.round(mario_fy);

  on_ground = false;
  for (const block of solidRects) {
    if (rectsIntersect(mario, block)) {
      if (mario_vy > 0) {
        mario.y = block.y - mario.h;
        mario_fy = mario.y;
        mario_vy = 0.0;
        on_ground = true;
      } else if (mario_vy < 0) {
        // Corner-rounding assist
        if ((mario.x + mario.w) - block.x <= 6) {
          mario.x = block.x - mario.w;
          mario_fx = mario.x;
          continue;
        }
        if ((block.x + block.w) - mario.x <= 6) {
          mario.x = block.x + block.w;
          mario_fx = mario.x;
          continue;
        }

        mario.y = block.y + block.h;
        mario_fy = mario.y;
        mario_vy = 0.0;

        // Question block hits
        for (const q of q_blocks) {
          if (q.x === block.x && q.y === block.y && !q.used) {
            q.used = true;
            q.bounce = 10;
            score += 200;
            coin_count += 1;
            audio.playCoin();
            floating_popups.push({ x: block.x, y: block.y - 16, text: '+200', timer: 35 });
          }
        }
      }
    }
  }

  // Springs
  for (const sp of springs) {
    if (rectsIntersect(mario, sp)) {
      mario.y = sp.y - mario.h;
      mario_fy = mario.y;
      mario_vy = -13.2;
      on_ground = false;
      audio.playSpring();
      floating_popups.push({ x: sp.x, y: sp.y - 12, text: 'BOING!', timer: 28 });
    }
  }

  // Checkpoints
  if (!checkpoint_reached && (mario.x + mario.w) >= checkpoint_x) {
    checkpoint_reached = true;
    score += 500;
    audio.playCoin();
    banner_text = 'CHECKPOINT SAVED! +500';
    banner_frames = 75;
  }

  for (const q of q_blocks) {
    if (q.bounce > 0) q.bounce--;
  }

  // Camera Follow
  const target_cam = Math.min(LEVEL_END_X - GAME_W, Math.max(camera_fx, mario_fx - 300.0));
  camera_fx += (target_cam - camera_fx) * Math.min(1.0, 0.18 * dt_scale);
  camera_x = Math.round(camera_fx);

  // Pit fall
  if (mario.y > GAME_H + 20) {
    audio.playHurt();
    lives--;
    if (lives <= 0) {
      leaderboard.recordScore(playerName, score, coin_count, currentLevel, playerPhotoB64);
      score = 0;
      coin_count = 0;
      lives = 3;
      buildLevel(1, false);
      banner_text = 'SCORE SAVED! NEW RUN';
      banner_frames = 90;
    } else {
      buildLevel(currentLevel, true);
      banner_text = `LIVES LEFT: ${lives}`;
      banner_frames = 70;
    }
  }

  // Coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    if (rectsIntersect(mario, coin)) {
      coins.splice(i, 1);
      score += 200;
      coin_count++;
      audio.playCoin();
      floating_popups.push({ x: coin.x, y: coin.y, text: '+200', timer: 35 });
    }
  }

  // Goombas
  for (const g of goombas) {
    if (g.state === 'dead') continue;
    if (g.state === 'squished') {
      g.timer--;
      if (g.timer <= 0) g.state = 'dead';
      continue;
    }

    g.x += g.vx * dt_scale;
    if (g.x < g.min_x || (g.x + g.w) > g.max_x) {
      g.vx = -g.vx;
    }

    // Core hit box
    const gCore = { x: g.x + 3, y: g.y + 1, w: g.w - 6, h: g.h - 2 };
    if (rectsIntersect(mario, gCore)) {
      if (mario_vy > 0 || (mario.y + mario.h) <= g.y + 20) {
        g.state = 'squished';
        g.timer = 25;
        mario_vy = -7.8;
        score += 100;
        audio.playStomp();
        floating_popups.push({ x: g.x, y: g.y - 10, text: '+100', timer: 35 });
      } else if (invincible_frames === 0) {
        audio.playHurt();
        lives--;
        invincible_frames = 75;
        if (lives <= 0) {
          leaderboard.recordScore(playerName, score, coin_count, currentLevel, playerPhotoB64);
          score = 0;
          coin_count = 0;
          lives = 3;
          buildLevel(1, false);
          banner_text = 'GAME OVER! RECORD SAVED';
          banner_frames = 95;
          break;
        } else {
          mario_vy = -6.0;
          banner_text = `OUCH! ${lives} LIVES LEFT`;
          banner_frames = 60;
        }
      }
    }
  }

  // Level Clear Flagpole
  if (mario.x + mario.w >= LEVEL_END_X - 150) {
    audio.playClear();
    score += 1000;
    if (currentLevel < TOTAL_WORLDS) {
      const nextLevel = currentLevel + 1;
      buildLevel(nextLevel, false);
      const levelNames = {
        2: "WORLD 1-2 UNDERGROUND!",
        3: "WORLD 1-3 SKY BRIDGES!",
        4: "WORLD 1-4 BOWSER CASTLE!"
      };
      banner_text = levelNames[nextLevel] || `WORLD 1-${nextLevel}!`;
      banner_frames = 100;
    } else {
      leaderboard.recordScore(playerName, score, coin_count, 4, playerPhotoB64);
      banner_text = `ALL 4 WORLDS CLEAR! ${score} PTS`;
      banner_frames = 120;
      score = 0;
      coin_count = 0;
      lives = 3;
      buildLevel(1, false);
    }
  }
}

// Render the 900x520 Game Viewport
function renderGame() {
  ctx.save();
  ctx.clearRect(0, 0, GAME_W, GAME_H);

  // Background by World
  let bgCol = COLORS.NES_SKY;
  if (currentLevel === 2) bgCol = COLORS.UNDERGROUND_BG;
  if (currentLevel === 3) bgCol = COLORS.ATHLETIC_SKY;
  if (currentLevel === 4) bgCol = COLORS.CASTLE_BG;
  ctx.fillStyle = bgCol;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Ceiling bricks in underground & castle
  if (currentLevel === 2 || currentLevel === 4) {
    const ceilCol = (currentLevel === 2) ? COLORS.BLUE_BRICK : COLORS.CASTLE_STONE;
    ctx.fillStyle = ceilCol;
    for (let tx = 0; tx < GAME_W; tx += 32) {
      ctx.fillRect(tx, 52, 32, 20);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx, 52, 32, 20);
    }
  }

  // Lava Pits in World 1-4 Castle
  if (currentLevel === 4) {
    ctx.fillStyle = COLORS.LAVA_RED;
    ctx.fillRect(0, GROUND_Y + 6, GAME_W, 20);
    ctx.fillStyle = COLORS.LAVA_GOLD;
    ctx.fillRect(0, GROUND_Y + 6, GAME_W, 4);
  }

  // Clouds
  for (const [cx, cy, cw] of clouds) {
    const sx = cx - Math.round(camera_x * 0.5);
    if (sx >= -140 && sx <= GAME_W + 20) {
      ctx.fillStyle = COLORS.CLOUD_WHITE;
      ctx.strokeStyle = COLORS.CLOUD_OUTLINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx + cw / 2, cy + 15, cw / 2, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Hills
  for (const [hx, hw, hh] of hills) {
    const sx = hx - camera_x;
    if (sx >= -180 && sx <= GAME_W + 20) {
      ctx.fillStyle = COLORS.HILL_GREEN;
      ctx.beginPath();
      ctx.moveTo(sx, GROUND_Y);
      ctx.lineTo(sx + hw / 2, GROUND_Y - hh);
      ctx.lineTo(sx + hw, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Bushes
  for (const [bx, bw] of bushes) {
    const sx = bx - camera_x;
    if (sx >= -120 && sx <= GAME_W + 20) {
      ctx.fillStyle = COLORS.BUSH_LIME;
      ctx.beginPath();
      ctx.ellipse(sx + bw / 2, GROUND_Y - 12, bw / 2, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.PIPE_SHADOW;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Ground blocks
  let g_main = COLORS.GROUND_RUST;
  let g_top = COLORS.GROUND_PEACH;
  if (currentLevel === 2) {
    g_main = COLORS.BLUE_BRICK;
    g_top = COLORS.BLUE_HIGHLIGHT;
  } else if (currentLevel === 4) {
    g_main = COLORS.CASTLE_STONE;
    g_top = COLORS.CASTLE_HIGHLIGHT;
  }

  for (const g_rect of ground_sections) {
    const firstTile = Math.max(g_rect.x, Math.floor(camera_x / 32) * 32);
    const lastTile = Math.min(g_rect.x + g_rect.w, camera_x + GAME_W + 32);
    for (let tx = firstTile; tx < lastTile; tx += 32) {
      const sx = tx - camera_x;
      ctx.fillStyle = g_main;
      ctx.fillRect(sx, g_rect.y, 32, 32);
      ctx.fillStyle = g_top;
      ctx.fillRect(sx, g_rect.y, 32, 4);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, g_rect.y, 32, 32);
    }
  }

  // Bricks
  ctx.fillStyle = (currentLevel === 2) ? COLORS.BLUE_BRICK : ((currentLevel === 4) ? COLORS.CASTLE_STONE : COLORS.BRICK_RED);
  for (const b of bricks) {
    const sx = b.x - camera_x;
    if (sx >= -40 && sx <= GAME_W + 20) {
      ctx.fillRect(sx, b.y, b.w, b.h);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, b.y, b.w, b.h);
      ctx.strokeRect(sx, b.y + 16, b.w, 1);
    }
  }

  // Question Blocks
  for (const q of q_blocks) {
    const sx = q.x - camera_x;
    const sy = q.y - q.bounce;
    if (sx >= -40 && sx <= GAME_W + 20) {
      ctx.fillStyle = q.used ? COLORS.Q_USED : COLORS.Q_GOLD;
      ctx.fillRect(sx, sy, q.w, q.h);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, q.w, q.h);

      if (!q.used) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText('?', sx + 8, sy + 24);
      }
    }
  }

  // Moving Platforms
  for (const mp of moving_platforms) {
    const sx = mp.x - camera_x;
    if (sx >= -100 && sx <= GAME_W + 20) {
      ctx.fillStyle = COLORS.CASTLE_STONE;
      ctx.fillRect(sx, mp.y, mp.w, mp.h);
      ctx.strokeStyle = COLORS.CASTLE_HIGHLIGHT;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, mp.y, mp.w, mp.h);
    }
  }

  // Springs
  for (const sp of springs) {
    const sx = sp.x - camera_x;
    if (sx >= -40 && sx <= GAME_W + 20) {
      ctx.fillStyle = COLORS.MARIO_RED;
      ctx.fillRect(sx, sp.y, sp.w, sp.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + 4, sp.y + 6, sp.w - 8, 4);
    }
  }

  // Mid-level Checkpoint Flag
  const cp_sx = checkpoint_x - camera_x;
  if (cp_sx >= -40 && cp_sx <= GAME_W + 20) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cp_sx, GROUND_Y - 72, 4, 72);
    ctx.fillStyle = checkpoint_reached ? COLORS.PIPE_HIGHLIGHT : COLORS.MARIO_RED;
    ctx.beginPath();
    ctx.moveTo(cp_sx + 4, GROUND_Y - 72);
    ctx.lineTo(cp_sx + 34, GROUND_Y - 58);
    ctx.lineTo(cp_sx + 4, GROUND_Y - 44);
    ctx.closePath();
    ctx.fill();
  }

  // End Stairs
  for (const s_rect of stairs) {
    const sx = s_rect.x - camera_x;
    if (sx >= -40 && sx <= GAME_W + 20) {
      ctx.fillStyle = g_main;
      ctx.fillRect(sx, s_rect.y, s_rect.w, s_rect.h);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, s_rect.y, s_rect.w, s_rect.h);
    }
  }

  // Warp Pipes
  for (const p of pipes) {
    const sx = p.x - camera_x;
    if (sx >= -70 && sx <= GAME_W + 20) {
      // Pipe stem
      ctx.fillStyle = COLORS.PIPE_GREEN;
      ctx.fillRect(sx + 4, p.y + 22, 48, p.h - 22);
      ctx.fillStyle = COLORS.PIPE_HIGHLIGHT;
      ctx.fillRect(sx + 10, p.y + 22, 9, p.h - 22);
      ctx.strokeStyle = COLORS.PIPE_SHADOW;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 4, p.y + 22, 48, p.h - 22);

      // Pipe top rim
      ctx.fillStyle = COLORS.PIPE_GREEN;
      ctx.fillRect(sx, p.y, 56, 22);
      ctx.fillStyle = COLORS.PIPE_HIGHLIGHT;
      ctx.fillRect(sx + 8, p.y + 2, 10, 18);
      ctx.strokeRect(sx, p.y, 56, 22);
    }
  }

  // Flagpole and Castle
  const pole_sx = (LEVEL_END_X - 150) - camera_x;
  if (pole_sx >= -200 && pole_sx <= GAME_W + 40) {
    ctx.fillStyle = g_main;
    ctx.fillRect(pole_sx - 12, GROUND_Y - 28, 32, 28);
    ctx.fillStyle = COLORS.PIPE_HIGHLIGHT;
    ctx.fillRect(pole_sx + 2, GROUND_Y - 270, 4, 242);
    ctx.fillStyle = COLORS.PIPE_GREEN;
    ctx.beginPath();
    ctx.arc(pole_sx + 4, GROUND_Y - 274, 8, 0, Math.PI * 2);
    ctx.fill();

    // Flag
    ctx.beginPath();
    ctx.moveTo(pole_sx + 2, GROUND_Y - 264);
    ctx.lineTo(pole_sx - 38, GROUND_Y - 246);
    ctx.lineTo(pole_sx + 2, GROUND_Y - 228);
    ctx.closePath();
    ctx.fill();

    // Castle
    const castle_sx = pole_sx + 54;
    ctx.fillStyle = (currentLevel !== 4) ? COLORS.BRICK_RED : COLORS.CASTLE_STONE;
    ctx.fillRect(castle_sx, GROUND_Y - 96, 92, 96);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(castle_sx, GROUND_Y - 96, 92, 96);
    ctx.fillStyle = '#000000';
    ctx.fillRect(castle_sx + 32, GROUND_Y - 46, 28, 46);
  }

  // Coins
  for (const c of coins) {
    const sx = c.x - camera_x;
    if (sx >= -30 && sx <= GAME_W + 20) {
      ctx.fillStyle = COLORS.Q_GOLD;
      ctx.beginPath();
      ctx.ellipse(sx + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.Q_USED;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Goombas
  for (const g of goombas) {
    if (g.state !== 'dead') {
      const sx = g.x - camera_x;
      if (sx >= -40 && sx <= GAME_W + 20) {
        drawGoombaSprite(sx, g.y, g.state, tickCount, currentLevel);
      }
    }
  }

  // Mario
  if (invincible_frames % 2 === 0) {
    drawMarioSprite(mario.x - camera_x - 2, mario.y, mario_facing, !on_ground, Math.round(mario_fx));
  }

  // Floating popups (+100, +200, BOING)
  for (let i = floating_popups.length - 1; i >= 0; i--) {
    const pop = floating_popups[i];
    pop.y -= 1.2;
    pop.timer--;
    ctx.fillStyle = COLORS.Q_GOLD;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText(pop.text, pop.x - camera_x, pop.y);
    if (pop.timer <= 0) floating_popups.splice(i, 1);
  }

  // Authentic Top NES HUD
  ctx.fillStyle = 'rgba(12, 16, 23, 0.85)';
  ctx.fillRect(0, 0, GAME_W, 48);
  ctx.strokeStyle = '#2d3b50';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, GAME_W, 48);

  // Player Name & Score — adaptive font size for longer names
  const nameFontSize = playerName.length <= 6 ? 10 : playerName.length <= 9 ? 8 : 7;
  ctx.font = `${nameFontSize}px "Press Start 2P", monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(playerName, 20, playerName.length <= 6 ? 20 : 22);
  ctx.fillStyle = COLORS.Q_GOLD;
  ctx.fillText(String(score).padStart(6, '0'), 20, 38);

  // Coins
  ctx.fillStyle = '#ffffff';
  ctx.fillText('COINS', 220, 20);
  ctx.fillStyle = COLORS.Q_GOLD;
  ctx.fillText(`X${String(coin_count).padStart(2, '0')}`, 220, 38);

  // World
  ctx.fillStyle = '#ffffff';
  ctx.fillText('WORLD', 400, 20);
  ctx.fillStyle = COLORS.Q_GOLD;
  ctx.fillText(`1-${currentLevel}/${TOTAL_WORLDS}`, 400, 38);

  // Lives
  ctx.fillStyle = '#ffffff';
  ctx.fillText('LIVES', 580, 20);
  ctx.fillStyle = COLORS.PIPE_HIGHLIGHT;
  ctx.fillText(`X${lives}`, 590, 38);

  // Time
  ctx.fillStyle = '#ffffff';
  ctx.fillText('TIME', 740, 20);
  ctx.fillStyle = COLORS.Q_GOLD;
  ctx.fillText(String(Math.floor(world_timer)).padStart(3, '0'), 745, 38);

  // Banner announcements
  if (banner_frames > 0) {
    ctx.fillStyle = '#0c1017';
    ctx.fillRect(180, 190, 540, 48);
    ctx.strokeStyle = COLORS.Q_GOLD;
    ctx.lineWidth = 3;
    ctx.strokeRect(180, 190, 540, 48);
    ctx.fillStyle = COLORS.Q_GOLD;
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(banner_text, 450, 220);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

// Main 60 FPS Game Loop
function gameLoop(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  // FPS calculation
  frameCount++;
  if (frameCount % 30 === 0) {
    currentFPS = Math.round(1 / dt);
    const fpsEl = document.getElementById('fps-display');
    if (fpsEl) fpsEl.textContent = `${currentFPS} FPS`;
  }

  if (gameMode === 'PLAYING') {
    updateGame(dt);
  }
  renderGame();

  requestAnimationFrame(gameLoop);
}

// Keyboard Event Handlers
window.addEventListener('keydown', (e) => {
  keysDown[e.code] = true;

  if (e.code === 'KeyM') {
    audio.toggleMute();
  } else if (e.code === 'KeyC') {
    handTracker.toggleCamera();
  } else if (e.code === 'KeyR') {
    buildLevel(currentLevel, false);
  } else if (e.code === 'KeyN') {
    openRegisterModal();
  } else if (e.code === 'Digit1') {
    buildLevel(1, false);
  } else if (e.code === 'Digit2') {
    buildLevel(2, false);
  } else if (e.code === 'Digit3') {
    buildLevel(3, false);
  } else if (e.code === 'Digit4') {
    buildLevel(4, false);
  } else if (e.code === 'Space' && gameMode === 'REGISTER') {
    handTracker.captureSnapshot();
  } else if (e.code === 'Enter' && gameMode === 'REGISTER') {
    startGameSession();
  }
});

window.addEventListener('keyup', (e) => {
  keysDown[e.code] = false;
});

// UI Event Wireup
function openRegisterModal() {
  gameMode = 'REGISTER';
  const modal = document.getElementById('register-modal');
  if (modal) modal.classList.remove('hidden');
}

function startGameSession() {
  const nameInput = document.getElementById('player-name-input');
  playerName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim().toUpperCase().slice(0, 16) : 'MARIO';

  const consentCheck = document.getElementById('cloud-consent-check');
  allowCloudSync = consentCheck ? consentCheck.checked : true;

  playerPhotoB64 = handTracker.capturedPhotoB64 || "";

  const modal = document.getElementById('register-modal');
  if (modal) modal.classList.add('hidden');

  audio.startBGM();
  gameMode = 'PLAYING';
  buildLevel(1, false);
}

// Button listeners
document.getElementById('btn-take-photo')?.addEventListener('click', () => {
  handTracker.captureSnapshot();
});

document.getElementById('btn-start-game')?.addEventListener('click', () => {
  startGameSession();
});

document.getElementById('btn-audio-toggle')?.addEventListener('click', () => {
  audio.toggleMute();
});

document.getElementById('btn-cam-toggle')?.addEventListener('click', () => {
  handTracker.toggleCamera();
});

document.getElementById('btn-cloud-config')?.addEventListener('click', () => {
  const modal = document.getElementById('cloud-modal');
  const urlInp = document.getElementById('cfg-webhook-url');
  const tokInp = document.getElementById('cfg-webhook-token');
  if (urlInp) urlInp.value = leaderboard.webhookUrl;
  if (tokInp) tokInp.value = leaderboard.webhookToken;
  if (modal) modal.classList.remove('hidden');
});

document.getElementById('btn-close-cloud')?.addEventListener('click', () => {
  const modal = document.getElementById('cloud-modal');
  if (modal) modal.classList.add('hidden');
});

document.getElementById('btn-save-cloud')?.addEventListener('click', () => {
  const urlInp = document.getElementById('cfg-webhook-url');
  const tokInp = document.getElementById('cfg-webhook-token');
  if (urlInp && tokInp) {
    leaderboard.saveConfig(urlInp.value.trim(), tokInp.value.trim());
  }
  const modal = document.getElementById('cloud-modal');
  if (modal) modal.classList.add('hidden');
});

document.getElementById('btn-clear-lb')?.addEventListener('click', () => {
  leaderboard.clearLeaderboard();
});

document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Initialize
buildLevel(1, false);
requestAnimationFrame(gameLoop);

