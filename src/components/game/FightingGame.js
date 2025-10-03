"use client";
import { useEffect, useState } from "react";
import Scene3D from "./Scene3D";
import HUD from "./HUD";

export default function FightingGame() {
  const [p1Health, setP1Health] = useState(100);
  const [p2Health, setP2Health] = useState(100);
  const [winner, setWinner] = useState(null);
  const [resetToken, setResetToken] = useState(0);
  const [bgm, setBgm] = useState(null);
  const [bgmMuted, setBgmMuted] = useState(false);

  const handleRestart = () => {
    setP1Health(100);
    setP2Health(100);
    setWinner(null);
    setResetToken((x) => x + 1);
  };

  const handleToggleBgm = () => {
    if (bgm) {
      if (bgmMuted) {
        bgm.setVolume(0.2); // back to quiet normal
        setBgmMuted(false);
      } else {
        bgm.setVolume(0.0); // mute
        setBgmMuted(true);
      }
    }
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <Scene3D
        enabled={!winner}
        resetToken={resetToken}
        onP1Hit={() => setP1Health((h) => Math.max(0, h - 1))}
        onP2Hit={() => setP2Health((h) => Math.max(0, h - 1))}
        onBgmReady={setBgm}   // ✅ get bgm reference from Scene3D
      />
      <HUD
        p1Health={p1Health}
        p2Health={p2Health}
        winner={winner}
        onRestart={handleRestart}
        onToggleBgm={handleToggleBgm}
        bgmMuted={bgmMuted}
      />
    </div>
  );
}
