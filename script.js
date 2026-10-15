const canvas = document.getElementById("game"); // HTML에서 게임 화면 캔버스를 가져옵니다.
const ctx = canvas.getContext("2d"); // 캔버스에 2D 그림을 그리는 도구를 가져옵니다.

// 캔버스 크기와 첫 화면에 놓을 돌, 스키 타는 사람의 위치와 크기입니다.
const scene = {
  width: 800,
  height: 600,
  rocks: [
    { x: 45, y: 180, radius: 20 },
    { x: 155, y: 290, radius: 20 },
    { x: 265, y: 400, radius: 20 },
  ],
  player: { x: 384, y: 470, width: 32, height: 32 },
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

// 돌 하나를 회색 원과 밝은 표면 무늬로 그립니다.
function drawRock(rock) {
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

// 첫 화면을 한 번 그립니다. 움직임이나 조작 기능은 없습니다.
drawBackground();
scene.rocks.forEach(drawRock);
drawPlayer(scene.player);
