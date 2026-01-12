"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export function usePongGameState() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ player: 0, computer: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paddleHeight = 60;
    const paddleWidth = 8;
    const ballSize = 8;

    let playerY = canvas.height / 2 - paddleHeight / 2;
    let computerY = canvas.height / 2 - paddleHeight / 2;
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballSpeedX = 4;
    let ballSpeedY = 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      playerY = e.clientY - rect.top - paddleHeight / 2;
      playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles
      ctx.fillStyle = "#fff";
      ctx.fillRect(10, playerY, paddleWidth, paddleHeight);
      ctx.fillRect(canvas.width - 18, computerY, paddleWidth, paddleHeight);

      // Draw ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
      ctx.fill();

      // Move ball
      ballX += ballSpeedX;
      ballY += ballSpeedY;

      // Ball collision with top/bottom
      if (ballY <= ballSize || ballY >= canvas.height - ballSize) {
        ballSpeedY = -ballSpeedY;
      }

      // Ball collision with player paddle
      if (
        ballX <= 18 + ballSize &&
        ballY >= playerY &&
        ballY <= playerY + paddleHeight
      ) {
        ballSpeedX = Math.abs(ballSpeedX) * 1.05;
        ballSpeedY += (ballY - (playerY + paddleHeight / 2)) * 0.1;
      }

      // Ball collision with computer paddle
      if (
        ballX >= canvas.width - 26 &&
        ballY >= computerY &&
        ballY <= computerY + paddleHeight
      ) {
        ballSpeedX = -Math.abs(ballSpeedX) * 1.05;
        ballSpeedY += (ballY - (computerY + paddleHeight / 2)) * 0.1;
      }

      // Computer AI
      const computerCenter = computerY + paddleHeight / 2;
      if (computerCenter < ballY - 20) computerY += 3;
      if (computerCenter > ballY + 20) computerY -= 3;
      computerY = Math.max(
        0,
        Math.min(canvas.height - paddleHeight, computerY),
      );

      // Score
      if (ballX <= 0) {
        setScore((s) => ({ ...s, computer: s.computer + 1 }));
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = 4;
        ballSpeedY = 2;
      }
      if (ballX >= canvas.width) {
        setScore((s) => ({ ...s, player: s.player + 1 }));
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -4;
        ballSpeedY = 2;
      }

      // Limit ball speed
      ballSpeedX = Math.max(-12, Math.min(12, ballSpeedX));
      ballSpeedY = Math.max(-8, Math.min(8, ballSpeedY));

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameStarted]);

  const handleStartGame = useCallback(() => {
    setGameStarted(true);
  }, []);

  return {
    canvasRef,
    score,
    gameStarted,
    onStartGame: handleStartGame,
  };
}
