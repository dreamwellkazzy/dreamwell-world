import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@shared/store/useGameStore';
import { EventBus } from '@shared/events/EventBus';

const CINEMA_POSITION: [number, number, number] = [60, 0, -40];
const CINEMA_RANGE = 15;

export const CinemaScreen: React.FC = () => {
  const playerPosition = useGameStore((s) => s.playerPosition);
  const isMainMenuOpen = useGameStore((s) => s.isMainMenuOpen);
  const [isOpen, setIsOpen] = useState(false);

  // Calculate distance to cinema
  const dx = playerPosition[0] - CINEMA_POSITION[0];
  const dz = playerPosition[2] - CINEMA_POSITION[2];
  const distSq = dx * dx + dz * dz;
  const isNearCinema = distSq <= CINEMA_RANGE * CINEMA_RANGE;

  // Listen for STRUCTURE_ENTERED / STRUCTURE_EXITED events
  useEffect(() => {
    const unsubEnter = EventBus.on('STRUCTURE_ENTERED', (event) => {
      if (event.structureId === 'drivein_cinema') {
        setIsOpen(true);
        EventBus.emit({ type: 'CINEMA_PLAY' });
      }
    });
    const unsubExit = EventBus.on('STRUCTURE_EXITED', (event) => {
      if (event.structureId === 'drivein_cinema') {
        setIsOpen(false);
        EventBus.emit({ type: 'CINEMA_STOP' });
      }
    });
    return () => {
      unsubEnter();
      unsubExit();
    };
  }, []);

  // Auto-open when player walks near the cinema
  useEffect(() => {
    if (isMainMenuOpen) return;
    if (isNearCinema && !isOpen) {
      setIsOpen(true);
      EventBus.emit({ type: 'CINEMA_PLAY' });
    }
  }, [isNearCinema, isOpen, isMainMenuOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    EventBus.emit({ type: 'CINEMA_STOP' });
  }, []);

  // Q key to close
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="cinema-overlay fade-in">
      {/* Movie screen frame */}
      <div className="cinema-frame scanlines">
        <p className="cinema-title text-glow-pulse">DREAMWELL PRESENTS</p>
        <p className="cinema-subtitle">Coming Soon...</p>
        <p className="cinema-close-hint">
          Press <span className="key">Q</span> to close
        </p>
      </div>
    </div>
  );
};
