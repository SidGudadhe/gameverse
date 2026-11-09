'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function SandboxRunner({
  params,
}: {
  params: { gameId: string; versionId: string };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let currentScore = 0;
    let isJumping = false;
    let jumpVelocity = 0;
    let playerY = 240;
    const gravity = 0.6;
    let obstacles: { x: number; width: number; height: number; speed: number }[] = [];
    let frameCount = 0;
    let isDead = false;

    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 450;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameStarted) {
          setGameStarted(true);
        }
        if (!isJumping && !isDead) {
          isJumping = true;
          jumpVelocity = -12;
        }
        if (isDead) {
          // Restart
          isDead = false;
          setGameOver(false);
          playerY = 240;
          jumpVelocity = 0;
          obstacles = [];
          currentScore = 0;
          setScore(0);
        }
      }
    };

    const handleCanvasClick = () => {
      if (!gameStarted) {
        setGameStarted(true);
      }
      if (!isJumping && !isDead) {
        isJumping = true;
        jumpVelocity = -12;
      }
      if (isDead) {
        isDead = false;
        setGameOver(false);
        playerY = 240;
        jumpVelocity = 0;
        obstacles = [];
        currentScore = 0;
        setScore(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleCanvasClick);

    // Main Game Loop
    const render = () => {
      frameCount++;

      // Background Gradient (Cyber Synthwave)
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a051b');
      gradient.addColorStop(0.6, '#1a0b38');
      gradient.addColorStop(1, '#2b0938');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid Lines on floor
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 1;
      const groundY = 320;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 60, canvas.height);
        ctx.stroke();
      }

      if (gameStarted && !isDead) {
        currentScore++;
        setScore(Math.floor(currentScore / 10));

        // Physics for jump
        if (isJumping) {
          playerY += jumpVelocity;
          jumpVelocity += gravity;
          if (playerY >= 240) {
            playerY = 240;
            isJumping = false;
            jumpVelocity = 0;
          }
        }

        // Spawn obstacles
        if (frameCount % 90 === 0) {
          obstacles.push({
            x: canvas.width,
            width: 28,
            height: 40 + Math.random() * 20,
            speed: 6 + Math.min(6, currentScore / 500),
          });
        }

        // Update & Draw Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const obs = obstacles[i];
          obs.x -= obs.speed;

          // Draw Neon Barrier
          ctx.fillStyle = '#f43f5e';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 15;
          ctx.fillRect(obs.x, groundY - obs.height, obs.width, obs.height);
          ctx.shadowBlur = 0;

          // Collision Detection with Player (Player: x=100, y=playerY, w=35, h=50)
          const px = 100;
          const py = playerY;
          const pw = 35;
          const ph = 50;
          const oy = groundY - obs.height;

          if (
            px < obs.x + obs.width &&
            px + pw > obs.x &&
            py < oy + obs.height &&
            py + ph > oy
          ) {
            isDead = true;
            setGameOver(true);
          }

          if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
          }
        }
      }

      // Draw Player (Neon Cyber Ship / Runner)
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 20;
      ctx.fillRect(100, playerY, 35, 50);

      // Ship Cockpit
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(115, playerY + 10, 15, 15);
      ctx.shadowBlur = 0;

      // Draw HUD Score
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`SCORE: ${Math.floor(currentScore / 10)}`, 25, 40);

      if (!gameStarted) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS SPACE OR CLICK TO START', canvas.width / 2, canvas.height / 2);
        ctx.font = '14px monospace';
        ctx.fillStyle = '#a5b4fc';
        ctx.fillText('AVOID LASER BARRIERS • TIMED RUNNER', canvas.width / 2, canvas.height / 2 + 35);
        ctx.textAlign = 'start';
      }

      if (isDead) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '16px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PRESS SPACE OR CLICK TO RETRY', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'start';
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleCanvasClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted]);

  return (
    <div className="w-full h-full min-h-screen bg-black flex flex-col items-center justify-center select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-full max-h-screen object-contain cursor-pointer"
      />
    </div>
  );
}
