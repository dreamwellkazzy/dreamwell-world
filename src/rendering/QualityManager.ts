import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@shared/store/useGameStore';
import { EventBus } from '@shared/events';
import type { QualityPreset, QualitySettings } from '@shared/types';

const PRESET_ORDER: QualityPreset[] = ['very-low', 'low', 'medium', 'high', 'ultra'];

const PRESET_SETTINGS: Record<QualityPreset, QualitySettings> = {
  'very-low': {
    preset: 'very-low',
    renderScale: 0.5,
    shadowMapSize: 512,
    grassDensity: 0,
    grassRenderDistance: 0,
    npcRenderDistance: 30,
    enablePostProcessing: false,
    enableParticles: false,
    maxChunksLoaded: 4,
  },
  low: {
    preset: 'low',
    renderScale: 0.75,
    shadowMapSize: 1024,
    grassDensity: 0.3,
    grassRenderDistance: 20,
    npcRenderDistance: 40,
    enablePostProcessing: false,
    enableParticles: false,
    maxChunksLoaded: 8,
  },
  medium: {
    preset: 'medium',
    renderScale: 1.0,
    shadowMapSize: 2048,
    grassDensity: 0.5,
    grassRenderDistance: 30,
    npcRenderDistance: 50,
    enablePostProcessing: true,
    enableParticles: true,
    maxChunksLoaded: 12,
  },
  high: {
    preset: 'high',
    renderScale: 1.0,
    shadowMapSize: 2048,
    grassDensity: 0.7,
    grassRenderDistance: 40,
    npcRenderDistance: 60,
    enablePostProcessing: true,
    enableParticles: true,
    maxChunksLoaded: 16,
  },
  ultra: {
    preset: 'ultra',
    renderScale: 1.5,
    shadowMapSize: 4096,
    grassDensity: 1.0,
    grassRenderDistance: 50,
    npcRenderDistance: 80,
    enablePostProcessing: true,
    enableParticles: true,
    maxChunksLoaded: 16,
  },
};

// Thresholds and timing
const LOW_FPS_THRESHOLD = 30;
const HIGH_FPS_THRESHOLD = 55;
const LOW_FPS_DURATION = 3; // seconds below threshold before downgrade
const HIGH_FPS_DURATION = 10; // seconds above threshold before upgrade
const FRAME_WINDOW = 60; // rolling window size

/**
 * Hook that monitors FPS and auto-adjusts quality settings.
 * Call once inside a component rendered within <Canvas>.
 */
export function useQualityManager(): void {
  const frameTimes = useRef<number[]>([]);
  const lowFpsStart = useRef<number | null>(null);
  const highFpsStart = useRef<number | null>(null);
  const lastAdjustTime = useRef(0);

  const applyPreset = useCallback((preset: QualityPreset) => {
    const settings = PRESET_SETTINGS[preset];
    if (!settings) return;

    const store = useGameStore.getState();
    store.setQualityPreset(preset);

    // Also push the full quality settings into the store
    useGameStore.setState({ qualitySettings: settings });

    EventBus.emit({ type: 'QUALITY_CHANGED', preset });
  }, []);

  useFrame((_state, delta) => {
    // Clamp delta to avoid spikes from tab-unfocus etc.
    const clampedDelta = Math.min(delta, 0.1);
    const fps = clampedDelta > 0 ? 1 / clampedDelta : 60;

    const times = frameTimes.current;
    times.push(fps);
    if (times.length > FRAME_WINDOW) {
      times.shift();
    }

    // Need a full window before making decisions
    if (times.length < FRAME_WINDOW) return;

    // Don't adjust more than once per second
    const now = performance.now() / 1000;
    if (now - lastAdjustTime.current < 1) return;

    const avgFps = times.reduce((sum, v) => sum + v, 0) / times.length;
    const currentPreset = useGameStore.getState().qualityPreset;
    const currentIndex = PRESET_ORDER.indexOf(currentPreset);

    // Low FPS: step down
    if (avgFps < LOW_FPS_THRESHOLD) {
      if (lowFpsStart.current === null) {
        lowFpsStart.current = now;
      } else if (now - lowFpsStart.current >= LOW_FPS_DURATION) {
        if (currentIndex > 0) {
          const newPreset = PRESET_ORDER[currentIndex - 1];
          applyPreset(newPreset);
          lastAdjustTime.current = now;
          // Reset tracking
          frameTimes.current = [];
          lowFpsStart.current = null;
          highFpsStart.current = null;
        }
      }
      // Reset high counter when FPS is low
      highFpsStart.current = null;
    }
    // High FPS: step up
    else if (avgFps > HIGH_FPS_THRESHOLD) {
      if (highFpsStart.current === null) {
        highFpsStart.current = now;
      } else if (now - highFpsStart.current >= HIGH_FPS_DURATION) {
        if (currentIndex < PRESET_ORDER.length - 1) {
          const newPreset = PRESET_ORDER[currentIndex + 1];
          applyPreset(newPreset);
          lastAdjustTime.current = now;
          frameTimes.current = [];
          highFpsStart.current = null;
          lowFpsStart.current = null;
        }
      }
      // Reset low counter when FPS is high
      lowFpsStart.current = null;
    }
    // Mid-range FPS: reset both timers
    else {
      lowFpsStart.current = null;
      highFpsStart.current = null;
    }
  });
}

export { PRESET_SETTINGS, PRESET_ORDER };
