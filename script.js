const canvas = document.getElementById("game"); // HTML에서 게임 화면 캔버스를 가져옵니다.
const ctx = canvas.getContext("2d"); // 캔버스에 2D 그림을 그리는 도구를 가져옵니다.

// 방향키와 스페이스바의 현재 눌림 상태, 플레이어의 조작 속도입니다.
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  Space: false,
};
const playerMoveSpeed = 4;
const rockSpawnMinDelay = 700;
const rockSpawnMaxDelay = 2600;
const rockSpeedIncreasePerSecond = 0.02;
const rockMaxSpeedMultiplier = 3;
const screenShakeDuration = 220;
const screenShakeIntensity = 7;
// 적의 개수와 크기를 한곳에서 관리합니다.
const enemyCount = 3;
const enemySize = 24;
const itemSize = 14;
// 충돌 판정 영역을 화면에 표시할지 설정합니다.
let showHitbox = true;
let gameState = "playing";
let gameStartTime = Date.now();
let gameEndTime = null;
let scoreBonus = 0;
let screenShakeRemaining = 0;
const initialPlayerPosition = { x: 384, y: 470 };
const initialEnemyPositions = [
  { x: 120, y: -enemySize, speed: 2 },
  { x: 260, y: -180, speed: 3 },
  { x: 400, y: -340, speed: 4 },
];
const initialSnowTrails = [
  { x: 100, y: 550, length: 28 },
  { x: 235, y: 420, length: 20 },
  { x: 440, y: 570, length: 25 },
  { x: 650, y: 500, length: 18 },
  { x: 560, y: 350, length: 24 },
  { x: 300, y: 590, length: 16 },
];

// 캔버스 크기와 돌, 스키 타는 사람의 위치·크기·속도를 모아 둡니다.
const scene = {
  width: 800,
  height: 600,
  rocks: [],
  rockSpawnMinX: 30,
  rockSpawnMaxX: 450,
  rockAcceleration: 0.2,
  slopeStartY: 130,
  slopeEndX: 490,
  slopeEndY: 600,
  backgroundThemes: [
    {
      sky: ["#78c9f5", "#b9def0", "#f7c9d5"],
      mountain: "#b8d7e8",
      mountainSnow: "#f9fdff",
      avalanche: "#ffffff",
      slope: "#f8fcff",
      slopeEdge: "#d6f0ff",
    },
    {
      sky: ["#f5a66f", "#f5d0a8", "#f8e6d0"],
      mountain: "#b6c4d2",
      mountainSnow: "#fff8ec",
      avalanche: "#fffdf8",
      slope: "#fffaf2",
      slopeEdge: "#f3d9c2",
    },
    {
      sky: ["#263858", "#627d9f", "#b7c8d8"],
      mountain: "#71879a",
      mountainSnow: "#e5eef5",
      avalanche: "#f3f8fc",
      slope: "#edf5fb",
      slopeEdge: "#c5d9e8",
    },
  ],
  backgroundIndex: 0,
  backgroundChangeInterval: 30000,
  lastBackgroundChangeAt: 0,
  snowParticles: [],
  snowParticleTimer: 0,
  snowParticleInterval: 45,
  snowParticleLifetime: 650,
  lastFrameTimestamp: null,
  nextRockInMs:
    rockSpawnMinDelay + Math.random() * (rockSpawnMaxDelay - rockSpawnMinDelay),
  player: { x: 384, y: 470, width: 32, height: 32 },
  snowTrails: initialSnowTrails.map((trail) => ({ ...trail })),
  snowSpeedX: 1.5,
  snowSpeedY: 1.4,
};

// 서로 다른 위치와 속도로 시작하는 적 세 명입니다.
const enemies = [
  ...initialEnemyPositions.map((enemy) => ({ ...enemy, size: enemySize })),
];
// 아이템은 한 번에 하나씩 화면 위쪽에 배치합니다.
const items = [createItem()];

// 절벽 쪽을 피해 비탈 위쪽의 무작위 위치에 아이템을 만듭니다.
function createItem() {
  const y =
    scene.slopeStartY +
    itemSize +
    Math.random() * (scene.height * 0.4 - scene.slopeStartY - itemSize);
  const minX = getSlopeEdgeX(y + itemSize) + itemSize;
  return {
    x: minX + Math.random() * (scene.width - itemSize - minX),
    y,
    size: itemSize,
  };
}

// 하늘 그라데이션, 눈 덮인 비탈, 멀리 보이는 눈사태 산을 그립니다.
function drawBackground() {
  const theme = scene.backgroundThemes[scene.backgroundIndex];
  const skyGradient = ctx.createLinearGradient(0, 0, 0, scene.height);
  skyGradient.addColorStop(0, theme.sky[0]);
  skyGradient.addColorStop(0.58, theme.sky[1]);
  skyGradient.addColorStop(1, theme.sky[2]);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, scene.width, scene.height);

  // 멀리 있는 산의 바탕을 그립니다.
  ctx.beginPath();
  ctx.moveTo(430, 235);
  ctx.lineTo(590, 65);
  ctx.lineTo(800, 230);
  ctx.lineTo(800, 320);
  ctx.lineTo(430, 320);
  ctx.closePath();
  ctx.fillStyle = theme.mountain;
  ctx.fill();

  // 산꼭대기와 비탈에 쌓인 눈을 그립니다.
  ctx.beginPath();
  ctx.moveTo(555, 102);
  ctx.lineTo(590, 65);
  ctx.lineTo(800, 230);
  ctx.lineTo(800, 260);
  ctx.lineTo(735, 235);
  ctx.lineTo(690, 253);
  ctx.lineTo(645, 213);
  ctx.lineTo(610, 225);
  ctx.closePath();
  ctx.fillStyle = theme.mountainSnow;
  ctx.fill();

  // 산비탈에서 흘러내리는 눈사태를 흰색 곡선으로 표현합니다.
  ctx.beginPath();
  ctx.moveTo(667, 175);
  ctx.bezierCurveTo(700, 190, 685, 230, 735, 240);
  ctx.bezierCurveTo(765, 247, 760, 280, 800, 294);
  ctx.lineTo(800, 325);
  ctx.bezierCurveTo(755, 315, 745, 285, 710, 277);
  ctx.bezierCurveTo(675, 268, 672, 230, 640, 220);
  ctx.closePath();
  ctx.fillStyle = theme.avalanche;
  ctx.fill();

  // 눈사태 주변에 흩날리는 눈 덩어리를 그립니다.
  ctx.fillStyle = "rgb(255 255 255 / 85%)";
  [
    [704, 211, 10],
    [744, 258, 13],
    [778, 286, 9],
    [675, 243, 7],
  ].forEach(([x, y, radius]) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // 화면 아래쪽에 45도 정도 기울어진 흰 눈 비탈을 그립니다.
  ctx.beginPath();
  ctx.moveTo(0, 130);
  ctx.lineTo(490, scene.height);
  ctx.lineTo(scene.width, scene.height);
  ctx.lineTo(0, scene.height);
  ctx.closePath();
  ctx.fillStyle = theme.slope;
  ctx.fill();

  // 비탈의 경계에 옅은 파란색 선을 그립니다.
  ctx.beginPath();
  ctx.moveTo(0, 130);
  ctx.lineTo(490, scene.height);
  ctx.strokeStyle = theme.slopeEdge;
  ctx.lineWidth = 8;
  ctx.stroke();
}

// 돌 하나를 회색 원과 밝은 표면 무늬를 그립니다.
function drawRock(rock) {
  if (rock.state === "landed" && rock.impactFrames > 0) {
    const impactSize = (18 - rock.impactFrames) * 2;
    ctx.beginPath();
    ctx.ellipse(rock.x, rock.slopeY, impactSize, impactSize / 3, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgb(255 255 255 / ${rock.impactFrames * 4}%)`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#656b73";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(
    rock.x - rock.radius * 0.3,
    rock.y - rock.radius * 0.3,
    rock.radius * 0.25,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "#aeb7c0";
  ctx.fill();
}

// 적 하나를 각진 붉은 바위 모양으로 그립니다.
function drawEnemy(enemy) {
  const rockPoints = [
    [0.72, -0.5],
    [0.3, -0.95],
    [-0.28, -0.82],
    [-0.86, -0.38],
    [-0.78, 0.28],
    [-0.35, 0.82],
    [0.32, 0.9],
    [0.84, 0.42],
  ];

  ctx.beginPath();
  rockPoints.forEach(([scaleX, scaleY], index) => {
    const x = enemy.x + scaleX * enemy.size;
    const y = enemy.y + scaleY * enemy.size;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
  ctx.fillStyle = "#a83232";
  ctx.fill();
  ctx.strokeStyle = "#702626";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 바위 표면에 밝고 어두운 면을 더해 입체감을 줍니다.
  ctx.beginPath();
  ctx.moveTo(enemy.x - enemy.size * 0.28, enemy.y - enemy.size * 0.78);
  ctx.lineTo(enemy.x + enemy.size * 0.3, enemy.y - enemy.size * 0.48);
  ctx.lineTo(enemy.x + enemy.size * 0.02, enemy.y + enemy.size * 0.02);
  ctx.lineTo(enemy.x - enemy.size * 0.62, enemy.y - enemy.size * 0.25);
  ctx.closePath();
  ctx.fillStyle = "#d65b50";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(enemy.x + enemy.size * 0.02, enemy.y + enemy.size * 0.02);
  ctx.lineTo(enemy.x + enemy.size * 0.3, enemy.y - enemy.size * 0.48);
  ctx.lineTo(enemy.x + enemy.size * 0.72, enemy.y - enemy.size * 0.5);
  ctx.lineTo(enemy.x + enemy.size * 0.84, enemy.y + enemy.size * 0.42);
  ctx.lineTo(enemy.x + enemy.size * 0.32, enemy.y + enemy.size * 0.9);
  ctx.closePath();
  ctx.fillStyle = "#812929";
  ctx.fill();
}

// 원형 오브젝트를 감싸는 사각형 충돌 영역을 구합니다.
function getObjectHitbox(object) {
  return {
    x: object.x - object.size,
    y: object.y - object.size,
    width: object.size * 2,
    height: object.size * 2,
  };
}

// 플레이어와 오브젝트의 사각형 영역이 가로와 세로로 모두 겹치는지 확인합니다.
function checkCollision(player, object) {
  const objectHitbox = getObjectHitbox(object);
  return (
    player.x < objectHitbox.x + objectHitbox.width &&
    player.x + player.width > objectHitbox.x &&
    player.y < objectHitbox.y + objectHitbox.height &&
    player.y + player.height > objectHitbox.y
  );
}

// 충돌 판정에 사용하는 플레이어와 오브젝트의 영역을 빨간 테두리로 표시합니다.
function drawHitboxes(player, object) {
  const objectHitbox = getObjectHitbox(object);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.strokeRect(player.x, player.y, player.width, player.height);
  ctx.strokeRect(
    objectHitbox.x,
    objectHitbox.y,
    objectHitbox.width,
    objectHitbox.height,
  );
}

// 획득할 수 있는 아이템을 빛나는 별 모양으로 그립니다.
function drawItem(item) {
  const rayCount = 8;
  const innerRadius = item.size * 0.3;
  const gradient = ctx.createRadialGradient(
    item.x,
    item.y,
    0,
    item.x,
    item.y,
    item.size,
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.35, "#fff7a8");
  gradient.addColorStop(1, "#ffb300");

  ctx.save();
  ctx.shadowColor = "#ffe45c";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  for (let i = 0; i < rayCount * 2; i += 1) {
    const angle = (i * Math.PI) / rayCount - Math.PI / 2;
    const radius = i % 2 === 0 ? item.size : innerRadius;
    const x = item.x + Math.cos(angle) * radius;
    const y = item.y + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

// 스키와 몸, 팔, 머리, 다리로 32×32 크기의 사람을 그립니다.
function drawPlayer(player) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(player.width / 32, player.height / 32);

  // 나란히 놓인 스키 두 개를 그립니다.
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#263b66";
  ctx.beginPath();
  ctx.moveTo(3, 29);
  ctx.lineTo(29, 27);
  ctx.moveTo(5, 32);
  ctx.lineTo(31, 30);
  ctx.stroke();

  // 몸통과 양팔을 그립니다.
  ctx.strokeStyle = "#d94343";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(16, 13);
  ctx.lineTo(19, 23);
  ctx.moveTo(17, 15);
  ctx.lineTo(9, 20);
  ctx.moveTo(17, 15);
  ctx.lineTo(25, 18);
  ctx.stroke();

  // 머리와 다리를 그려 스키 타는 사람 모양을 완성합니다.
  ctx.fillStyle = "#27364b";
  ctx.beginPath();
  ctx.arc(17, 8, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#263b66";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(19, 22);
  ctx.lineTo(13, 28);
  ctx.moveTo(19, 22);
  ctx.lineTo(24, 27);
  ctx.stroke();
  ctx.restore();
}

// 새 게임을 시작할 때 점수와 플레이어, 적, 아이템의 상태를 초기화합니다.
function resetGame() {
  gameState = "playing";
  gameStartTime = Date.now();
  gameEndTime = null;
  scoreBonus = 0;
  screenShakeRemaining = 0;
  scene.player.x = initialPlayerPosition.x;
  scene.player.y = initialPlayerPosition.y;
  scene.rocks.length = 0;
  scene.snowParticles.length = 0;
  scene.snowParticleTimer = 0;
  scene.snowTrails = initialSnowTrails.map((trail) => ({ ...trail }));
  scene.nextRockInMs =
    rockSpawnMinDelay + Math.random() * (rockSpawnMaxDelay - rockSpawnMinDelay);
  scene.backgroundIndex = 0;
  scene.lastBackgroundChangeAt = scene.lastFrameTimestamp ?? 0;
  scene.lastFrameTimestamp = null;
  for (let i = 0; i < enemies.length; i += 1) {
    enemies[i].x = initialEnemyPositions[i].x;
    enemies[i].y = initialEnemyPositions[i].y;
    enemies[i].speed = initialEnemyPositions[i].speed;
  }
  items.length = 0;
  items.push(createItem());
  for (const key of Object.keys(keys)) {
    keys[key] = false;
  }
}

// 충돌 순간 짧은 화면 흔들림을 시작합니다.
function triggerScreenShake() {
  screenShakeRemaining = screenShakeDuration;
}

// 생존 시간과 아이템 보너스를 합산해 현재 점수를 계산합니다.
function getScore() {
  const endTime = gameEndTime ?? Date.now();
  return Math.floor((endTime - gameStartTime) / 1000) + scoreBonus;
}

// 왼쪽 위에 버틴 시간을 초 단위 점수로 표시합니다.
function drawScore() {
  ctx.fillStyle = "rgb(22 40 56 / 78%)";
  ctx.fillRect(18, 18, 150, 48);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(`점수: ${getScore()}`, 32, 49);
}

// 게임 오버 상태와 최종 점수, 재시작 안내를 화면 가운데에 표시합니다.
function drawGameOver() {
  if (gameState !== "gameover") {
    return;
  }

  ctx.fillStyle = "rgb(18 28 40 / 72%)";
  ctx.fillRect(0, 0, scene.width, scene.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 48px sans-serif";
  ctx.fillText("GAME OVER", scene.width / 2, scene.height / 2 - 35);
  ctx.font = "24px sans-serif";
  ctx.fillText(`최종 점수: ${getScore()}`, scene.width / 2, scene.height / 2 + 10);
  ctx.font = "18px sans-serif";
  ctx.fillText("R 키를 눌러 다시 시작", scene.width / 2, scene.height / 2 + 50);
  ctx.textAlign = "start";
}

// 비탈 위의 눈 자국을 거슬러 흘려 스키어가 계속 내려가는 느낌을 냅니다.
function drawSnowTrails() {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 130);
  ctx.lineTo(490, scene.height);
  ctx.lineTo(scene.width, scene.height);
  ctx.lineTo(scene.width, 130);
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = "rgb(165 205 225 / 55%)";
  ctx.lineWidth = 2;
  scene.snowTrails.forEach((trail) => {
    ctx.beginPath();
    ctx.moveTo(trail.x, trail.y);
    ctx.lineTo(trail.x - trail.length, trail.y - trail.length * 0.9);
    ctx.stroke();
  });
  ctx.restore();
}

// 스키 뒤에서 튀어 오른 눈 입자를 그립니다.
function drawSnowParticles() {
  scene.snowParticles.forEach((particle) => {
    ctx.beginPath();
    ctx.arc(
      particle.x,
      particle.y,
      particle.radius,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = `rgb(255 255 255 / ${Math.round(
      (particle.lifeMs / scene.snowParticleLifetime) * 90,
    )}%)`;
    ctx.fill();
  });
}

// 비탈 경계선에서 해당 높이의 눈길 시작 x 좌표를 구합니다.
function getSlopeEdgeX(y) {
  return ((y - scene.slopeStartY) / (scene.slopeEndY - scene.slopeStartY)) * scene.slopeEndX;
}

// 키보드 입력으로 스키어를 움직이고, 불규칙하게 나타나는 바위와 충돌을 처리합니다.
function updateObjects(elapsedMs) {
  if (gameState !== "playing") {
    return;
  }

  const frameScale = elapsedMs / (1000 / 60);
  // 생존 시간이 길수록 바위 낙하 속도를 높이되 최대 3배로 제한합니다.
  const survivalSeconds = (Date.now() - gameStartTime) / 1000;
  const rockSpeedMultiplier = Math.min(
    1 + survivalSeconds * rockSpeedIncreasePerSecond,
    rockMaxSpeedMultiplier,
  );

  // 적을 아래로 이동시키고 화면을 벗어나면 위쪽의 무작위 위치로 보냅니다.
  for (let i = 0; i < enemyCount; i += 1) {
    const enemy = enemies[i];
    enemy.y += enemy.speed * frameScale;
    if (enemy.y - enemy.size > scene.height) {
      enemy.x = enemy.size + Math.random() * (scene.width - enemy.size * 2);
      enemy.y = -enemy.size;
    }
  }

  let moveX = Number(keys.ArrowRight) - Number(keys.ArrowLeft);
  let moveY = Number(keys.ArrowDown) - Number(keys.ArrowUp);
  if (moveX !== 0 && moveY !== 0) {
    moveX *= Math.SQRT1_2;
    moveY *= Math.SQRT1_2;
  }

  // 방향키 입력에 따라 다음 위치를 계산합니다.
  let nextX = scene.player.x + moveX * playerMoveSpeed * frameScale;
  let nextY = scene.player.y + moveY * playerMoveSpeed * frameScale;

  // 플레이어의 몸 전체가 화면 안에 있도록 네 벽에서 막습니다.
  nextX = Math.max(0, Math.min(nextX, scene.width - scene.player.width));
  nextY = Math.max(0, Math.min(nextY, scene.height - scene.player.height));

  // 비탈 경계에 닿으면 멈추게 해 아래쪽이나 왼쪽으로 뚫고 나가지 못하게 합니다.
  const skiContactY = nextY + scene.player.height;
  if (skiContactY >= scene.slopeStartY) {
    const minX = getSlopeEdgeX(skiContactY) - scene.player.width / 2;
    nextX = Math.max(nextX, minX);
  }

  scene.player.x = nextX;
  scene.player.y = nextY;

  // 플레이어가 적에 닿으면 게임을 종료하고 최종 점수 시각을 기록합니다.
  for (const enemy of enemies) {
    if (checkCollision(scene.player, enemy)) {
      gameState = "gameover";
      gameEndTime = Date.now();
      triggerScreenShake();
      return;
    }
  }

  // 플레이어가 아이템에 닿으면 10점을 받고, 새 아이템을 위쪽에 배치합니다.
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (checkCollision(scene.player, items[i])) {
      items.splice(i, 1);
      scoreBonus += 10;
      items.push(createItem());
    }
  }

  // 일정한 시간 간격으로 스키 뒤쪽에서 눈을 튀깁니다.
  scene.snowParticleTimer += elapsedMs;
  while (scene.snowParticleTimer >= scene.snowParticleInterval) {
    scene.snowParticleTimer -= scene.snowParticleInterval;
    for (let i = 0; i < 2; i += 1) {
      scene.snowParticles.push({
        x: scene.player.x + 5,
        y: scene.player.y + 27,
        speedX: -0.5 - Math.random() * 1.5,
        speedY: -0.5 - Math.random() * 1.5,
        radius: 1.5 + Math.random() * 2,
        lifeMs: scene.snowParticleLifetime,
      });
    }
  }

  scene.snowParticles = scene.snowParticles.filter((particle) => {
    particle.x += particle.speedX * frameScale;
    particle.y += particle.speedY * frameScale;
    particle.lifeMs -= elapsedMs;
    return particle.lifeMs > 0;
  });

  // 일정하지 않은 시간 간격과 속도로 바위가 갑자기 떨어집니다.
  scene.nextRockInMs -= elapsedMs;
  if (scene.nextRockInMs <= 0) {
    const radius = 16 + Math.random() * 12;
    const x = scene.rockSpawnMinX + Math.random() * (scene.rockSpawnMaxX - scene.rockSpawnMinX);
    const slope = (scene.slopeEndY - scene.slopeStartY) / scene.slopeEndX;
    const slopeY = scene.slopeStartY + x * slope;
    scene.rocks.push({
      x,
      y: -radius,
      radius,
      speedY: 2 + Math.random() * 5,
      state: "falling",
      slopeY,
      landingY: slopeY - radius * Math.sqrt(1 + slope * slope),
      impactFrames: 0,
    });
    scene.nextRockInMs =
      rockSpawnMinDelay + Math.random() * (rockSpawnMaxDelay - rockSpawnMinDelay);
  }

  // 눈 자국은 스키 진행 방향과 반대로 흘러가게 합니다.
  scene.snowTrails.forEach((trail) => {
    trail.x -= scene.snowSpeedX;
    trail.y -= scene.snowSpeedY;
    if (trail.x + trail.length < 0 || trail.y + trail.length < 130) {
      trail.x = scene.width;
      trail.y = 570 + Math.random() * 30;
    }
  });

  // 바위가 비탈에 떨어지는지, 스키어와 부딪혔는지 확인합니다.
  scene.rocks = scene.rocks.filter((rock) => {
    if (rock.state === "falling") {
      rock.y += rock.speedY * rockSpeedMultiplier * frameScale;
      rock.speedY += scene.rockAcceleration * rockSpeedMultiplier * frameScale;
      if (rock.y >= rock.landingY) {
        rock.y = rock.landingY;
        rock.speedY = 0;
        rock.state = "landed";
        rock.impactFrames = 18;
        rock.landedFrames = 0;
      }
    } else {
      rock.impactFrames = Math.max(0, rock.impactFrames - 1);
      rock.landedFrames += 1;
    }

    const playerScreenX = scene.player.x;
    const playerScreenY = scene.player.y;
    const nearestX = Math.max(
      playerScreenX,
      Math.min(rock.x, playerScreenX + scene.player.width),
    );
    const nearestY = Math.max(
      playerScreenY,
      Math.min(rock.y, playerScreenY + scene.player.height),
    );
    if (
      gameState === "playing" &&
      Math.hypot(rock.x - nearestX, rock.y - nearestY) < rock.radius
    ) {
      gameState = "gameover";
      gameEndTime = Date.now();
      triggerScreenShake();
    }

    return rock.state === "falling" || rock.landedFrames < 50;
  });
}

// 게임 루프는 매 프레임 화면 지우기, 계산, 그리기 순서로 실행합니다.
function gameLoop(timestamp) {
  ctx.clearRect(0, 0, scene.width, scene.height);

  const frameElapsedMs =
    scene.lastFrameTimestamp === null
      ? 0
      : Math.min(timestamp - scene.lastFrameTimestamp, 50);
  scene.lastFrameTimestamp = timestamp;
  const elapsedMs = gameState === "playing" ? frameElapsedMs : 0;
  screenShakeRemaining = Math.max(0, screenShakeRemaining - frameElapsedMs);

  if (gameState === "playing") {
    // 실제 경과 시간이 30초가 될 때마다 다음 배경 테마로 바꿉니다.
    const backgroundChanges = Math.floor(
      (timestamp - scene.lastBackgroundChangeAt) / scene.backgroundChangeInterval,
    );
    if (backgroundChanges > 0) {
      scene.backgroundIndex =
        (scene.backgroundIndex + backgroundChanges) % scene.backgroundThemes.length;
      scene.lastBackgroundChangeAt +=
        backgroundChanges * scene.backgroundChangeInterval;
    }
  }

  updateObjects(elapsedMs);

  drawBackground();
  ctx.save();
  if (screenShakeRemaining > 0) {
    const intensity =
      screenShakeIntensity * (screenShakeRemaining / screenShakeDuration);
    ctx.translate(
      (Math.random() * 2 - 1) * intensity,
      (Math.random() * 2 - 1) * intensity,
    );
  }
  drawSnowTrails();
  drawSnowParticles();
  scene.rocks.forEach(drawRock);
  // 배열에 있는 모든 적을 그립니다.
  for (let i = 0; i < enemies.length; i += 1) {
    drawEnemy(enemies[i]);
  }
  for (const item of items) {
    drawItem(item);
  }
  drawPlayer(scene.player);
  if (showHitbox) {
    for (const enemy of enemies) {
      drawHitboxes(scene.player, enemy);
    }
    for (const item of items) {
      drawHitboxes(scene.player, item);
    }
  }
  drawScore();
  drawGameOver();
  ctx.restore();

  requestAnimationFrame(gameLoop);
}

// 키를 누르고 있는 동안 입력 상태를 저장하고 페이지 스크롤을 막습니다.
resetGame();
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r" && gameState === "gameover") {
    resetGame();
    return;
  }
  if (event.key in keys) {
    keys[event.key] = true;
  }
  if (event.code === "Space") {
    keys.Space = true;
  }
  if (event.key.startsWith("Arrow") || event.code === "Space") {
    event.preventDefault();
  }
});

// 키를 놓으면 해당 입력 상태를 해제합니다.
window.addEventListener("keyup", (event) => {
  if (event.key in keys) {
    keys[event.key] = false;
  }
  if (event.code === "Space") {
    keys.Space = false;
  }
  if (event.key.startsWith("Arrow") || event.code === "Space") {
    event.preventDefault();
  }
});

requestAnimationFrame(gameLoop);
