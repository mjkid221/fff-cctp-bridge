"use client";

import { usePongGameState } from "./pong-game.hooks";
import { PongGameView } from "./pong-game.view";

export function PongGame() {
  const state = usePongGameState();
  return <PongGameView {...state} />;
}
