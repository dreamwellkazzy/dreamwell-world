import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@shared/store/useGameStore';

/* ============================================================
   Minimap — Canvas-rendered 2D top-down view
   180x180 circular mask, top-right corner.
   ============================================================ */

const SIZE = 180;
const HALF = SIZE / 2;

// Colors
const BG_COLOR = '#0F0D0A';
const ISLAND_COLOR = '#2A241E';
const PLAYER_COLOR = '#D4940A';
const NPC_COLOR = '#5DADE2';
const STRUCTURE_COLOR = '#8E7B5F';
const QUEST_COLOR = '#F5B731';
const WATER_COLOR = '#162028';

export const Minimap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const playerPosition = useGameStore((s) => s.playerPosition);
  const playerRotation = useGameStore((s) => s.playerRotation);
  const npcs = useGameStore((s) => s.npcs);
  const activeQuestId = useGameStore((s) => s.activeQuestId);
  const showMinimap = useGameStore((s) => s.showMinimap);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    // -- Clear & background (water) --
    ctx.fillStyle = WATER_COLOR;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // -- Draw island silhouette (rounded landmass centered) --
    ctx.save();
    ctx.fillStyle = ISLAND_COLOR;
    ctx.beginPath();
    // Organic island shape using bezier curves
    ctx.moveTo(HALF - 55, HALF - 20);
    ctx.bezierCurveTo(HALF - 60, HALF - 60, HALF - 20, HALF - 70, HALF + 5, HALF - 65);
    ctx.bezierCurveTo(HALF + 30, HALF - 60, HALF + 65, HALF - 50, HALF + 60, HALF - 15);
    ctx.bezierCurveTo(HALF + 68, HALF + 10, HALF + 55, HALF + 45, HALF + 35, HALF + 55);
    ctx.bezierCurveTo(HALF + 10, HALF + 65, HALF - 25, HALF + 60, HALF - 45, HALF + 45);
    ctx.bezierCurveTo(HALF - 65, HALF + 30, HALF - 70, HALF - 5, HALF - 55, HALF - 20);
    ctx.closePath();
    ctx.fill();

    // Subtle inner detail — lighter patch
    ctx.fillStyle = '#332B23';
    ctx.beginPath();
    ctx.ellipse(HALF + 10, HALF - 10, 28, 22, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -- Map coordinate transform --
    // Map world coords to minimap pixel coords.
    // Assume the island is ~200 units across, centered at origin.
    const scale = SIZE / 200;
    const toMapX = (wx: number) => HALF + wx * scale;
    const toMapY = (wz: number) => HALF + wz * scale;

    // -- Draw structures as small rectangles --
    const structurePositions: [number, number][] = [
      [20, -30], [-40, 10], [10, 40], [-25, -40], [45, 15],
    ];
    ctx.fillStyle = STRUCTURE_COLOR;
    for (const [sx, sz] of structurePositions) {
      const mx = toMapX(sx);
      const my = toMapY(sz);
      ctx.fillRect(mx - 3, my - 3, 6, 6);
    }

    // -- Draw NPC dots --
    ctx.fillStyle = NPC_COLOR;
    const npcEntries = Object.values(npcs);
    for (const npc of npcEntries) {
      if (!npc.isActive) continue;
      const mx = toMapX(npc.position[0]);
      const my = toMapY(npc.position[2]);
      ctx.beginPath();
      ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // -- Draw quest marker (gold diamond) --
    if (activeQuestId) {
      ctx.fillStyle = QUEST_COLOR;
      // Place a generic quest marker offset from player
      const qx = toMapX(playerPosition[0] + 15);
      const qy = toMapY(playerPosition[2] - 12);
      ctx.save();
      ctx.translate(qx, qy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }

    // -- Draw player dot and direction indicator --
    const px = toMapX(playerPosition[0]);
    const py = toMapY(playerPosition[2]);

    // Direction triangle
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(playerRotation);
    ctx.fillStyle = PLAYER_COLOR;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(-4, 3);
    ctx.lineTo(4, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Player center dot
    ctx.fillStyle = PLAYER_COLOR;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    // Glow ring around player
    ctx.strokeStyle = 'rgba(212, 148, 10, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.stroke();
  }, [playerPosition, playerRotation, npcs, activeQuestId]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Also redraw on an interval to stay fresh
  useEffect(() => {
    const id = setInterval(draw, 250);
    return () => clearInterval(id);
  }, [draw]);

  if (!showMinimap) return null;

  return (
    <div
      className="minimap-show"
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid #4A3F32',
        boxShadow: '0 0 16px rgba(0, 0, 0, 0.5), inset 0 0 8px rgba(0, 0, 0, 0.3)',
        pointerEvents: 'auto',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: SIZE,
          height: SIZE,
          display: 'block',
        }}
      />
      {/* Subtle border overlay for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1px solid rgba(232, 213, 183, 0.08)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
