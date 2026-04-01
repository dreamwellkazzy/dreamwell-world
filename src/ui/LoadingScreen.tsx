import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@shared/store/useGameStore';

const ASCII_ROBOT = `    ┌───────┐
    │ ◉   ◉ │
    │   ▽   │
    │ ╰───╯ │
    └───┬───┘
        │
   ┌────┴────┐
   │ LOADING │
   └─────────┘`;

export const LoadingScreen = () => {
  const loading = useGameStore((s) => s.loading);
  const isLoaded = useGameStore((s) => s.isLoaded);
  const setMainMenu = useGameStore((s) => s.setMainMenu);

  const [dismissing, setDismissing] = useState(false);

  const handleDismiss = useCallback(() => {
    if (loading.phase !== 'ready' || dismissing) return;
    setDismissing(true);
    setTimeout(() => {
      setMainMenu(true);
    }, 500);
  }, [loading.phase, dismissing, setMainMenu]);

  useEffect(() => {
    if (loading.phase !== 'ready') return;

    const onKey = () => handleDismiss();
    const onClick = () => handleDismiss();

    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
    };
  }, [loading.phase, handleDismiss]);

  return (
    <div className={`loading-screen${dismissing ? ' dismissing' : ''}`}>
      {/* Scanline overlay */}
      <div className="scanlines" />

      {/* Title */}
      <h1 className="loading-title">DREAMWELL WORLD</h1>

      {/* Subtitle / loading message */}
      <p className="loading-subtitle">{loading.message}</p>

      {/* Progress bar */}
      <div className="loading-progress-container">
        <div
          className="loading-progress-fill"
          style={{ width: `${loading.progress}%` }}
        />
      </div>

      {/* Phase text */}
      <p className="loading-phase">{loading.phase.toUpperCase()}</p>

      {/* ASCII robot */}
      <pre className="loading-robot">{ASCII_ROBOT}</pre>

      {/* Press any key prompt (only when ready) */}
      {loading.phase === 'ready' && (
        <p className="loading-start blink">PRESS ANY KEY TO START</p>
      )}
    </div>
  );
};
