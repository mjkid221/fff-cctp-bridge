"use client";

import { Gamepad2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { PongGameViewProps } from "./pong.types";

export function PongGameView({
  canvasRef,
  score,
  gameStarted,
  onStartGame,
}: PongGameViewProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-foreground flex items-center gap-8 text-lg font-bold">
        <span>You: {score.player}</span>
        <span>CPU: {score.computer}</span>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={250}
          className="border-border/50 rounded-lg border"
        />
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
            <Button onClick={onStartGame} className="gap-2">
              <Gamepad2 className="size-4" />
              Start Game
            </Button>
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        Move your mouse to control the left paddle
      </p>
    </div>
  );
}
