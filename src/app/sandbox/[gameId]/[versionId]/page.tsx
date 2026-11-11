'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function SandboxRunner({
  params,
}: {
  params: { gameId: string; versionId: string };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = useRef(false);
  const isMutedRef = useRef(false);

  // Web Audio Context Synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSynthSound = useCallback((frequency: number, type: OscillatorType, duration: number) => {
    if (isMutedRef.current) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      osc.start();
      osc.stop(audioCtxRef.current.currentTime + duration);
    } catch {
      // AudioContext not allowed before user gesture
    }
  }, []);

  // PostMessage protocol with parent HUD overlay
  useEffect(() => {
    const handleParentMessage = (event: MessageEvent) => {
      const { type } = event.data || {};
      if (type === 'GV_MUTE') {
        setIsMuted(true);
        isMutedRef.current = true;
      } else if (type === 'GV_UNMUTE') {
        setIsMuted(false);
        isMutedRef.current = false;
      } else if (type === 'GV_PAUSE') {
        setIsPaused(true);
        isPausedRef.current = true;
      } else if (type === 'GV_RESUME') {
        setIsPaused(false);
        isPausedRef.current = false;
      } else if (type === 'GV_RESTART') {
        setGameStarted(true);
        setGameOver(false);
        playSynthSound(520, 'triangle', 0.2);
      }
    };

    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  }, [playSynthSound]);

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

    const triggerJump = () => {
      if (!gameStarted) {
        setGameStarted(true);
        playSynthSound(440, 'square', 0.15);
      }
      if (!isJumping && !isDead && !isPausedRef.current) {
        isJumping = true;
        jumpVelocity = -12;
        playSynthSound(600, 'square', 0.1);
      }
      if (isDead) {
        // Restart on jump input
        isDead = false;
        setGameOver(false);
        playerY = 240;
        jumpVelocity = 0;
        obstacles = [];
        currentScore = 0;
        setScore(0);
        playSynthSound(520, 'triangle', 0.2);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        triggerJump();
      }
    };

    const handleCanvasClick = () => {
      triggerJump();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleCanvasClick);

    // Main 60fps Game Loop
    const render = () => {
      if (!isPausedRef.current) {
        frameCount++;

        // Background Gradient (Cyber Synthwave)
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#090518');
        gradient.addColorStop(0.6, '#170b32');
        gradient.addColorStop(1, '#2c0836');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid floor
        const groundY = 320;
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(canvas.width, groundY);
        ctx.stroke();

        // Animated floor perspective lines
        const offset = (frameCount * 2) % 40;
        for (let x = -offset; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, groundY);
          ctx.lineTo(x - 60, canvas.height);
          ctx.stroke();
        }

        if (gameStarted && !isDead) {
          currentScore++;
          setScore(Math.floor(currentScore / 10));

          // Score Milestone Sound
          if (currentScore > 0 && currentScore % 500 === 0) {
            playSynthSound(880, 'sine', 0.2);
          }

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
          if (frameCount % 85 === 0) {
            obstacles.push({
              x: canvas.width,
              width: 26,
              height: 42 + Math.random() * 22,
              speed: 6.5 + Math.min(6, currentScore / 500),
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

            // Collision Detection with Player (x=100, y=playerY, w=35, h=50)
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
              playSynthSound(160, 'sawtooth', 0.4);
            }

            if (obs.x + obs.width < 0) {
              obstacles.splice(i, 1);
            }
          }
        }

        // Draw Player Avatar
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 20;
        ctx.fillRect(100, playerY, 35, 50);

        // Cockpit
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(115, playerY + 10, 15, 15);
        ctx.shadowBlur = 0;

        // Draw HUD Score
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`SCORE: ${Math.floor(currentScore / 10)}`, 25, 40);

        if (!gameStarted) {
          ctx.fillStyle = 'rgba(0,0,0,0.65)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#6366f1';
          ctx.font = 'bold 26px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('PRESS SPACE OR CLICK TO START', canvas.width / 2, canvas.height / 2);
          ctx.font = '14px monospace';
          ctx.fillStyle = '#a5b4fc';
          ctx.fillText('AVOID LASER BARRIERS • 60 FPS RUNNER', canvas.width / 2, canvas.height / 2 + 35);
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
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleCanvasClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, playSynthSound]);

  return (
    <div className="w-full h-full min-h-screen bg-black flex flex-col items-center justify-center select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-full max-h-screen object-contain cursor-pointer"
      />
    </div>
  );
}
