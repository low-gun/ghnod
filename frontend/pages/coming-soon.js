// frontend/pages/coming-soon.js
import { useState, useEffect, useRef } from "react";

export default function ComingSoon() {
  const [dinoY, setDinoY] = useState(0);
  const dinoYRef = useRef(0);
  useEffect(() => { dinoYRef.current = dinoY; }, [dinoY]);

  const [isJumping, setIsJumping] = useState(false);
  const [dinoFrame, setDinoFrame] = useState(0); // 걷기 프레임
  const lastObstacleRef = useRef(Date.now());
  const [obstacles, setObstacles] = useState([{ x: 400, type: "cactus_small" }]);
  const obstaclesRef = useRef([{ x: 400, type: "cactus_small" }]);
  const [clouds, setClouds] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(6);

  // 바닥 위치
  const [groundX, setGroundX] = useState(0);

  const jumpHeight = 100;
  const gameRef = useRef(null);

  // 최고 점수 로드
  useEffect(() => {
    const savedHigh = localStorage.getItem("dinoHighScore");
    if (savedHigh) setHighScore(Number(savedHigh));
  }, []);

  // 점프
  const doJump = () => {
    if (gameOver) return;
  
    if (isJumping) return;

setIsJumping(true);

let frame = 0;
const totalFrames = 30;
const jumpInterval = setInterval(() => {
  frame++;
  const progress = frame / totalFrames;
  const height = Math.sin(Math.PI * progress) * jumpHeight;

  setDinoY(height);
  
      // 점프 애니메이션 끝
      if (frame >= totalFrames) {
        clearInterval(jumpInterval);
  
        // 착지 처리 (바닥으로)
        if (dinoYRef.current <= 0) {
          setDinoY(0);
          setIsJumping(false);
        } else {
          // 아직 공중 → 중력 적용
          const fallInterval = setInterval(() => {
            setDinoY((y) => {
              if (y <= 0) {
                clearInterval(fallInterval);
                setIsJumping(false);
                return 0;
              }
              return y - 5; // 낙하 속도
            });
          }, 20);
        }
      }
    }, 20);
  };
  

  // 키보드 이벤트
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.code === "Space" || e.code === "ArrowUp") && !isJumping && !gameOver) {
        doJump();
      }
      if (e.code === "Escape") {
        restartGame();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isJumping, gameOver]);

  // 공룡 걷기 애니메이션
  useEffect(() => {
    if (gameOver) return;
    const walkInterval = setInterval(() => {
      setDinoFrame((f) => (f === 0 ? 1 : 0));
    }, 150);
    return () => clearInterval(walkInterval);
  }, [gameOver]);

  // 게임 루프
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      // 장애물 이동
      setObstacles((prev) => {
        let nextArr = prev
          .map((obs) => ({ ...obs, x: obs.x - speed }))
          .filter((obs) => obs.x > -50);

        // 랜덤 생성
        const now = Date.now();
        if (Math.random() < 0.8 && now - lastObstacleRef.current > 800) {
          const cactusTypes = [
            "cactus_small1", "cactus_small2", "cactus_small3",
            "cactus_big1", "cactus_big2", "cactus_big3"
          ];
          // 새 등장 확률도 조금 더 높이려면 배열에 2번 넣음
          const types = [...cactusTypes, "ptero", "ptero"];
          const type = types[Math.floor(Math.random() * types.length)];
          
          if (type === "ptero") {
            nextArr.push({ x: 600, type, frame: 0, y: 50 + Math.random() * 50 });
          } else {
            nextArr.push({ x: 600, type });
          }
        
          lastObstacleRef.current = now;
        }
        obstaclesRef.current = nextArr;

        // 충돌 체크
nextArr.forEach((obs) => {
  const spr = SPRITES[obs.type];
  if (!spr) return;

  // 공룡 hitbox (양쪽 여유)
const dinoLeft = 20 + 5;
const dinoRight = 20 + 44 - 5;
const dinoBottom = dinoYRef.current + 5;
const dinoTop = dinoBottom + 47 - 10;

// 장애물 hitbox (여유 적용)
const obsLeft = obs.x + 3;
const obsRight = obs.x + spr.w - 3;
const obsBottom = (obs.y || 0) + 3;
const obsTop = obsBottom + spr.h - 6;


  const xCollision = dinoRight > obsLeft && dinoLeft < obsRight;
  const yCollision = dinoTop > obsBottom && dinoBottom < obsTop;

  if (xCollision && yCollision) {
    setGameOver(true);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("dinoHighScore", score);
    }
  }
});
        return nextArr;
      });

      // 구름 이동
      setClouds((prev) => {
        let next = prev.map((c) => ({ ...c, x: c.x - 1.5 })).filter((c) => c.x > -50);
        if (Math.random() < 0.003) { // 덜 자주 나오게
          next.push({ x: 600, y: 30 + Math.random() * 50 }); // 조금 위쪽
        }       
        return next;
      });    

      // 점수, 속도
setScore((s) => s + 1);
setSpeed((sp) => Math.min(sp + 0.001, 12));

// 바닥 이동
setGroundX((x) => (x - speed) % SPRITES.ground.w);

    }, 30);
    return () => clearInterval(interval);
  }, [gameOver, score, speed, highScore]);

  // 게임 재시작
  const restartGame = () => {
    setDinoY(0);
    setObstacles([{ x: 400, type: "cactus_small" }]);
    obstaclesRef.current = [{ x: 400, type: "cactus_small" }];
    setClouds([]);
    setScore(0);
    setGameOver(false);
    setSpeed(6);
  };

  // 스프라이트 좌표
  const SPRITE = "/images/offline-sprite-1x.png";
  const SPRITES = {
    dino_run1: { x: -765, y: -2, w: 44, h: 47 },
    dino_run2: { x: -810, y: -2, w: 44, h: 47 },
    dino_dead: { x: -853, y: -2, w: 44, h: 47 },
    // 작은 선인장 (1,2,3개)
cactus_small1: { x: -228, y: -2, w: 17, h: 35 },
cactus_small2: { x: -245, y: -2, w: 34, h: 35 },
cactus_small3: { x: -279, y: -2, w: 51, h: 35 },

// 큰 선인장 (1,2,3개)
cactus_big1: { x: -332, y: -2, w: 25, h: 50 },
cactus_big2: { x: -357, y: -2, w: 50, h: 50 },
cactus_big3: { x: -407, y: -2, w: 75, h: 50 },
    cloud: { x: -86, y: -2, w: 46, h: 14 }, // sprite 시트 기준 좌표 맞춤
    ground: { x: 0, y: -54, w: 1200, h: 12 },  // 원본 시트의 전체 바닥
    gameover: { x: -484, y: -15, w: 191, h: 11 },
    restart: { x: -2, y: -2, w: 34, h: 30 },
    ptero1: { x: -134, y: -2, w: 46, h: 40 },
    ptero2: { x: -180, y: -2, w: 46, h: 40 },
  };
  

  const DinoSprite = gameOver
    ? SPRITES.dino_dead
    : isJumping
    ? SPRITES.dino_run1
    : dinoFrame === 0
    ? SPRITES.dino_run1
    : SPRITES.dino_run2;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 160px)",
        width: "100%",
        textAlign: "center",
        transition: "background-color 0.5s",
      }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "16px" }}>
        🚧 현재 준비중입니다. 🚧
      </h1>
      <p style={{ color: "#555", marginBottom: "24px" }}>
        Click / Space / ↑ 키로 점프
      </p>

      {/* 게임 영역 */}
      <div
        ref={gameRef}
        onClick={doJump}
        style={{
          position: "relative",
          width: "600px",
          height: "200px",
          background: "#fff",
          border: "2px solid #ccc",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {/* 점수 */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "12px",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {`점수: ${score}`} {highScore > 0 ? ` / 최고: ${highScore}` : ""}
        </div>

        {/* 구름 */}
        {clouds.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x + "px",
              top: c.y + "px",
              width: SPRITES.cloud.w,
height: SPRITES.cloud.h,
backgroundSize: "auto", // 잘린 부분 없이 그대로
              backgroundImage: `url(${SPRITE})`,
              backgroundPosition: `${SPRITES.cloud.x}px ${SPRITES.cloud.y}px`,
              imageRendering: "pixelated",
            }}
          ></div>
        ))}

        {/* 공룡 */}
        <div
          style={{
            position: "absolute",
            left: "20px",
            bottom: dinoY + "px",
            width: DinoSprite.w,
            height: DinoSprite.h,
            backgroundImage: `url(${SPRITE})`,
            backgroundPosition: `${DinoSprite.x}px ${DinoSprite.y}px`,
            imageRendering: "pixelated",
          }}
        ></div>

        {/* 장애물 */}
        {obstacles.map((obs, i) => {
  if (obs.type === "ptero") {
    const spr = dinoFrame === 0 ? SPRITES.ptero1 : SPRITES.ptero2;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: obs.x + "px",
          bottom: (obs.y || 30) + "px",
          width: spr.w,
          height: spr.h,
          backgroundImage: `url(${SPRITE})`,
          backgroundPosition: `${spr.x}px ${spr.y}px`,
          imageRendering: "pixelated",
        }}
      ></div>
    );
  }
  const spr = SPRITES[obs.type];
  if (!spr) return null;
  return (
    <div
      key={i}
      style={{
        position: "absolute",
        left: obs.x + "px",
        bottom: "0px",
        width: spr.w,
        height: spr.h,
        backgroundImage: `url(${SPRITE})`,
        backgroundPosition: `${spr.x}px ${spr.y}px`,
        imageRendering: "pixelated",
      }}
    ></div>
  );
})}

        {/* 바닥 두 장 이어 붙이기 */}
<div
  style={{
    position: "absolute",
    bottom: "0",
    left: groundX + "px",
    width: SPRITES.ground.w,
    height: SPRITES.ground.h,
    backgroundImage: `url(${SPRITE})`,
    backgroundPosition: `${SPRITES.ground.x}px ${SPRITES.ground.y}px`,
    imageRendering: "pixelated",
  }}
></div>
<div
  style={{
    position: "absolute",
    bottom: "0",
    left: groundX + SPRITES.ground.w + "px",
    width: SPRITES.ground.w,
    height: SPRITES.ground.h,
    backgroundImage: `url(${SPRITE})`,
    backgroundPosition: `${SPRITES.ground.x}px ${SPRITES.ground.y}px`,
    imageRendering: "pixelated",
  }}
></div>

      </div>

      {gameOver && (
  <div
  onClick={restartGame}
  style={{
    position: "absolute",
    top: "55%",               // 조금 더 아래
    left: "50%",
    transform: "translate(-50%, -50%)", // 정확히 중앙 기준
    cursor: "pointer",
    textAlign: "center",
    width: "100%",            // 짤림 방지
  }}
>
    {/* GAME OVER 텍스트 */}
    <div
      style={{
        width: SPRITES.gameover.w,
        height: SPRITES.gameover.h,
        backgroundImage: `url(${SPRITE})`,
        backgroundPosition: `${SPRITES.gameover.x}px ${SPRITES.gameover.y}px`,
        imageRendering: "pixelated",
        margin: "0 auto 20px",
      }}
    ></div>
    {/* 다시하기 아이콘 */}
    <div
      style={{
        width: SPRITES.restart.w,
        height: SPRITES.restart.h,
        backgroundImage: `url(${SPRITE})`,
        backgroundPosition: `${SPRITES.restart.x}px ${SPRITES.restart.y}px`,
        imageRendering: "pixelated",
        margin: "0 auto",
      }}
    ></div>
  </div>
)}

    </div>
  );
}
