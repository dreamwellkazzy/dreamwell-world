import React, { useEffect, useCallback } from 'react';
import { useGameStore } from '@shared/store/useGameStore';

export const PauseMenu: React.FC = () => {
  const isPaused = useGameStore((s) => s.isPaused);
  const setPaused = useGameStore((s) => s.setPaused);
  const setSettings = useGameStore((s) => s.setSettings);
  const setMainMenu = useGameStore((s) => s.setMainMenu);
  const pushNotification = useGameStore((s) => s.pushNotification);

  const handleResume = useCallback(() => {
    setPaused(false);
  }, [setPaused]);

  const handleSettings = useCallback(() => {
    setSettings(true);
  }, [setSettings]);

  const handleSave = useCallback(() => {
    pushNotification({
      id: `save-${Date.now()}`,
      type: 'info',
      title: 'Game Saved!',
      message: 'Your progress has been saved.',
      duration: 3000,
    });
  }, [pushNotification]);

  const handleQuit = useCallback(() => {
    setPaused(false);
    setMainMenu(true);
  }, [setPaused, setMainMenu]);

  // Escape key listener to toggle pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const state = useGameStore.getState();
      if (state.isDialogueOpen || state.isMainMenuOpen) return;
      state.setPaused(!state.isPaused);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!isPaused) return null;

  return (
    <div className="pause-overlay fade-in">
      <div className="panel pause-panel slide-up">
        <h2 className="pause-title">PAUSED</h2>

        <div className="pause-options">
          <button className="btn pause-option" onClick={handleResume}>
            RESUME
          </button>
          <button className="btn pause-option" onClick={handleSettings}>
            SETTINGS
          </button>
          <button className="btn pause-option" onClick={handleSave}>
            SAVE PROGRESS
          </button>
          <button className="btn pause-option" onClick={handleQuit}>
            QUIT TO MENU
          </button>
        </div>
      </div>
    </div>
  );
};
