const canvas = document.getElementById("game"); // id가 "game"인 캔버스를 가져옵니다.
const ctx = canvas.getContext("2d"); // 캔버스에 그림을 그리는 2D 도구를 가져옵니다.

// 화면 크기와 색을 위쪽에 모아 두어 장면을 쉽게 바꿀 수 있게 합니다.
const scene = {
  width: 800,
  height: 600,
  skyColor: "#87ceeb",
  snowColor: "#ffffff",
  slopeStart: { x: 0, y: 100 },
  slopeEnd: { x: 500, y: 600 },
};

// 돌과 스키 타는 사람의 위치와 크기를 이곳에서 조정합니다.
const rocks = [
  { x: 100, y: 180, radius: 20 },
  { x: 350, y: 240, radius: 20 },
  { x: 650, y: 160, radius: 20 },
];
const player = { x: 384, y: 530, width: 32, height: 32 };

// 하늘색으로 캔버스 전체를 채워 위쪽 하늘을 그립니다.
ctx.fillStyle = scene.skyColor;
ctx.fillRect(0, 0, scene.width, scene.height);

// 왼쪽 위에서 오른쪽 아래로 약 45도 기울어진 눈 덮인 산비탈을 그립니다.
ctx.beginPath();
ctx.moveTo(scene.slopeStart.x, scene.slopeStart.y);
ctx.lineTo(scene.slopeEnd.x, scene.slopeEnd.y);
ctx.lineTo(scene.width, scene.height);
ctx.lineTo(0, scene.height);
ctx.closePath();
ctx.fillStyle = scene.snowColor;
ctx.fill();

// 위쪽 산비탈에 서로 떨어져 있는 회색 돌 세 개를 그립니다.
rocks.forEach((rock) => {
  ctx.beginPath();
  ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#686868";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    rock.x - rock.radius * 0.3,
    rock.y - rock.radius * 0.3,
    rock.radius * 0.25,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "#999999";
  ctx.fill();
});

// 플레이어 영역을 32×32 크기로 옮겨 스키, 몸, 팔, 머리를 그립니다.
ctx.save();
ctx.translate(player.x, player.y);
ctx.scale(player.width / 32, player.height / 32);

// 두 개의 길쭉한 스키를 그립니다.
ctx.lineWidth = 2;
ctx.lineCap = "round";
ctx.strokeStyle = "#263b66";
ctx.beginPath();
ctx.moveTo(3, 29);
ctx.lineTo(29, 27);
ctx.moveTo(5, 32);
ctx.lineTo(31, 30);
ctx.stroke();

// 몸통과 양팔을 그려 스키를 타는 자세를 표현합니다.
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

// 고개와 다리를 그려 사람 모양을 완성합니다.
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
