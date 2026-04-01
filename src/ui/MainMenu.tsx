import React, { useState, useCallback } from 'react';
import { useGameStore } from '@shared/store/useGameStore';

export const MainMenu: React.FC = () => {
  const isMainMenuOpen = useGameStore((s) => s.isMainMenuOpen);
  const setMainMenu = useGameStore((s) => s.setMainMenu);
  const setSettings = useGameStore((s) => s.setSettings);

  const [showCredits, setShowCredits] = useState(false);

  const handleStart = useCallback(() => {
    setMainMenu(false);
  }, [setMainMenu]);

  const handleSettings = useCallback(() => {
    setSettings(true);
  }, [setSettings]);

  const handleCredits = useCallback(() => {
    setShowCredits((prev) => !prev);
  }, []);

  if (!isMainMenuOpen) return null;

  return (
    <div className="main-menu gradient-shift scanlines">
      {/* Title */}
      <h1 className="main-menu-title text-glow-pulse">DREAMWELL WORLD</h1>

      {/* Subtitle */}
      <p className="main-menu-subtitle">A retro-futuristic adventure</p>

      {/* Menu Options */}
      <nav className="main-menu-options">
        <button className="btn btn-primary main-menu-option" onClick={handleStart}>
          START GAME
        </button>
        <button className="btn main-menu-option" onClick={handleSettings}>
          SETTINGS
        </button>
        <button className="btn main-menu-option" onClick={handleCredits}>
          CREDITS
        </button>
      </nav>

      {/* Version number */}
      <span className="main-menu-version">v0.1.0</span>

      {/* Credits Overlay */}
      {showCredits && (
        <div className="credits-overlay fade-in">
          <div className="panel credits-panel">
            <h2 className="credits-title">CREDITS</h2>

            <div className="credits-text">
              <p style={{ marginBottom: 16 }}>
                Dreamwell World
                <br />
                <span style={{ opacity: 0.6, fontSize: '0.85em' }}>
                  Built with React Three Fiber
                </span>
              </p>

              <p>Game Design ............ Creative Team</p>
              <p>Programming ............ Engineering</p>
              <p>3D Art &amp; Shaders ....... Art Team</p>
              <p>Audio &amp; Music .......... Sound Design</p>
              <p>Narrative .............. Writing Team</p>
              <p>QA &amp; Testing ........... QA Team</p>
            </div>

            <button
              className="btn credits-close"
              onClick={handleCredits}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
