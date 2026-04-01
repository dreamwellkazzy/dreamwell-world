import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@shared/store/useGameStore';
import type { QualityPreset } from '@shared/types';

export const SettingsPanel: React.FC = () => {
  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen);
  const setSettings = useGameStore((s) => s.setSettings);

  // Graphics
  const qualityPreset = useGameStore((s) => s.qualityPreset);
  const setQualityPreset = useGameStore((s) => s.setQualityPreset);
  const showFPS = useGameStore((s) => s.showFPS);
  const setShowFPS = useGameStore((s) => s.setShowFPS);

  // Audio
  const masterVolume = useGameStore((s) => s.masterVolume);
  const setMasterVolume = useGameStore((s) => s.setMasterVolume);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const setMusicVolume = useGameStore((s) => s.setMusicVolume);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const setSfxVolume = useGameStore((s) => s.setSfxVolume);
  const ambientVolume = useGameStore((s) => s.ambientVolume);
  const setAmbientVolume = useGameStore((s) => s.setAmbientVolume);
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);

  // Controls
  const mouseSensitivity = useGameStore((s) => s.mouseSensitivity);
  const setMouseSensitivity = useGameStore((s) => s.setMouseSensitivity);
  const invertY = useGameStore((s) => s.invertY);
  const setInvertY = useGameStore((s) => s.setInvertY);

  // Accessibility
  const showMinimap = useGameStore((s) => s.showMinimap);
  const setShowMinimap = useGameStore((s) => s.setShowMinimap);

  // Local state
  const [showControlHints, setShowControlHints] = useState(true);

  const handleClose = useCallback(() => {
    setSettings(false);
  }, [setSettings]);

  // Close on Escape
  useEffect(() => {
    if (!isSettingsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSettingsOpen, handleClose]);

  if (!isSettingsOpen) return null;

  return (
    <div className="settings-overlay fade-in" onClick={handleClose}>
      <div
        className="panel settings-panel slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="settings-close" onClick={handleClose} aria-label="Close settings">
          x
        </button>

        <h2 className="settings-title">SETTINGS</h2>

        {/* Graphics */}
        <div className="settings-section">
          <h3 className="settings-section-title">Graphics</h3>

          <div className="settings-row">
            <span className="settings-label">Quality Preset</span>
            <select
              className="ui-select"
              value={qualityPreset}
              onChange={(e) => setQualityPreset(e.target.value as QualityPreset)}
            >
              <option value="ultra">Ultra</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="very-low">Very Low</option>
            </select>
          </div>

          <div className="settings-row">
            <span className="settings-label">Show FPS Counter</span>
            <div
              className={`toggle${showFPS ? ' active' : ''}`}
              onClick={() => setShowFPS(!showFPS)}
              role="switch"
              aria-checked={showFPS}
            />
          </div>
        </div>

        {/* Audio */}
        <div className="settings-section">
          <h3 className="settings-section-title">Audio</h3>

          <div className="settings-row">
            <span className="settings-label">Master</span>
            <div className="settings-slider-container">
              <input
                type="range"
                className="ui-slider"
                min={0}
                max={100}
                value={Math.round(masterVolume * 100)}
                onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
              />
              <span className="settings-slider-value">{Math.round(masterVolume * 100)}</span>
            </div>
          </div>

          <div className="settings-row">
            <span className="settings-label">Music</span>
            <div className="settings-slider-container">
              <input
                type="range"
                className="ui-slider"
                min={0}
                max={100}
                value={Math.round(musicVolume * 100)}
                onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
              />
              <span className="settings-slider-value">{Math.round(musicVolume * 100)}</span>
            </div>
          </div>

          <div className="settings-row">
            <span className="settings-label">SFX</span>
            <div className="settings-slider-container">
              <input
                type="range"
                className="ui-slider"
                min={0}
                max={100}
                value={Math.round(sfxVolume * 100)}
                onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
              />
              <span className="settings-slider-value">{Math.round(sfxVolume * 100)}</span>
            </div>
          </div>

          <div className="settings-row">
            <span className="settings-label">Ambient</span>
            <div className="settings-slider-container">
              <input
                type="range"
                className="ui-slider"
                min={0}
                max={100}
                value={Math.round(ambientVolume * 100)}
                onChange={(e) => setAmbientVolume(Number(e.target.value) / 100)}
              />
              <span className="settings-slider-value">{Math.round(ambientVolume * 100)}</span>
            </div>
          </div>

          <div className="settings-row">
            <span className="settings-label">Mute All</span>
            <div
              className={`toggle${isMuted ? ' active' : ''}`}
              onClick={toggleMute}
              role="switch"
              aria-checked={isMuted}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="settings-section">
          <h3 className="settings-section-title">Controls</h3>

          <div className="settings-row">
            <span className="settings-label">Mouse Sensitivity</span>
            <div className="settings-slider-container">
              <input
                type="range"
                className="ui-slider"
                min={1}
                max={100}
                value={Math.round(mouseSensitivity * 100)}
                onChange={(e) => setMouseSensitivity(Number(e.target.value) / 100)}
              />
              <span className="settings-slider-value">{Math.round(mouseSensitivity * 100)}</span>
            </div>
          </div>

          <div className="settings-row">
            <span className="settings-label">Invert Y Axis</span>
            <div
              className={`toggle${invertY ? ' active' : ''}`}
              onClick={() => setInvertY(!invertY)}
              role="switch"
              aria-checked={invertY}
            />
          </div>

          <div className="settings-row">
            <span className="settings-label">Show Control Hints</span>
            <div
              className={`toggle${showControlHints ? ' active' : ''}`}
              onClick={() => setShowControlHints(!showControlHints)}
              role="switch"
              aria-checked={showControlHints}
            />
          </div>
        </div>

        {/* Accessibility */}
        <div className="settings-section">
          <h3 className="settings-section-title">Accessibility</h3>

          <div className="settings-row">
            <span className="settings-label">Show Minimap</span>
            <div
              className={`toggle${showMinimap ? ' active' : ''}`}
              onClick={() => setShowMinimap(!showMinimap)}
              role="switch"
              aria-checked={showMinimap}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
