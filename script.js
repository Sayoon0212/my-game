const canvas = document.getElementById("game"); // HTML에서 게임 화면 캔버스를 가져옵니다.
const ctx = canvas.getContext("2d"); // 캔버스에 2D 그림을 그리는 도구를 가져옵니다.

// 캔버스 크기와 돌, 스키 타는 사람의 위치·크기·속도를 모아 둡니다.
const scene = {
  width: 800,
  height: 600,
  rocks: [],
  nextRockAtY: 530,
  rockSpawnMinDistance: 120,
  rockSpawnMaxDistance: 180,
  rockSpawnMinX: 30,
  rockSpawnMaxX: 450,
  rockStartSpeed: 1,
  rockAcceleration: 0.2,
  slopeStartY: 130,
  slopeEndX: 490,
  slopeEndY: 600,
  player: { x: 384, y: 470, width: 32, height: 32, speedX: 1.5, speedY: 1.4 },
  camera: { x: 0, y: 0, followX: 384, followY: 470 },
  snowTrails: [
    { x: 100, y: 550, length: 28 },
    { x: 235, y: 420, length: 20 },
    { x: 440, y: 570, length: 25 },
    { x: 650, y: 500, length: 18 },
    { x: 560, y: 350, length: 24 },
    { x: 300, y: 590, length: 16 },
  ],
  snowSpeedX: 1.5,
  snowSpeedY: 1.4,
};

// 하늘 그라데이션, 눈 덮인 비탈, 멀리 보이는 눈사태 산을 그립니다.
function drawBackground() {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, scene.height);
  skyGradient.addColorStop(0, "#78c9f5");
  skyGradient.addColorStop(0.58, "#b9def0");
  skyGradient.addColorStop(1, "#f7c9d5");
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
  ctx.fillStyle = "#b8d7e8";
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
  ctx.fillStyle = "#f9fdff";
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
  ctx.fillStyle = "#ffffff";
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
  ctx.fillStyle = "#f8fcff";
  ctx.fill();

  // 비탈의 경계에 옅은 파란색 선을 그립니다.
  ctx.beginPath();
  ctx.moveTo(0, 130);
  ctx.lineTo(490, scene.height);
  ctx.strokeStyle = "#d6f0ff";
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

// 화면 왼쪽 위에 첫 점수가 0점인 점수칸을 그립니다.
function drawScore() {
  ctx.fillStyle = "rgb(22 40 56 / 78%)";
  ctx.fillRect(18, 18, 150, 48);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("점수: 0", 32, 49);
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

// 스키어의 진행 거리에 맞춰 새 바위를 만들고, 떨어져 부딪힌 바위는 잠시 후 치웁니다.
function updateObjects() {
  scene.player.x += scene.player.speedX;
  scene.player.y += scene.player.speedY;
  scene.camera.x = Math.max(scene.camera.x, scene.player.x - scene.camera.followX);
  scene.camera.y = Math.max(scene.camera.y, scene.player.y - scene.camera.followY);

  if (scene.player.y >= scene.nextRockAtY) {
    const radius = 20;
    const x =
      scene.rockSpawnMinX +
      Math.random() * (scene.rockSpawnMaxX - scene.rockSpawnMinX);
    const slope = (scene.slopeEndY - scene.slopeStartY) / scene.slopeEndX;
    const slopeY = scene.slopeStartY + x * slope;
    scene.rocks.push({
      x,
      y: -20,
      radius,
      speedY: scene.rockStartSpeed,
      state: "falling",
      slopeY,
      landingY: slopeY - radius * Math.sqrt(1 + slope * slope),
      impactFrames: 0,
    });
    scene.nextRockAtY +=
      scene.rockSpawnMinDistance +
      Math.random() * (scene.rockSpawnMaxDistance - scene.rockSpawnMinDistance);
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

  // 바위는 비탈 경계선에 닿을 때까지 가속해 떨어지고, 부딪힌 자리에 충격을 남깁니다.
  scene.rocks = scene.rocks.filter((rock) => {
    if (rock.state === "falling") {
      rock.y += rock.speedY;
      rock.speedY += scene.rockAcceleration;
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
    return rock.state === "falling" || rock.landedFrames < 50;
  });
}

// 게임 루프는 매 프레임 화면 지우기, 위치 계산, 다시 그리기 순서로 실행합니다.
function gameLoop() {
  ctx.clearRect(0, 0, scene.width, scene.height);

  updateObjects();

  drawBackground();
  drawSnowTrails();
  scene.rocks.forEach(drawRock);
  drawPlayer({
    ...scene.player,
    x: scene.player.x - scene.camera.x,
    y: scene.player.y - scene.camera.y,
  });
  drawScore();

  requestAnimationFrame(gameLoop);
}

gameLoop();
