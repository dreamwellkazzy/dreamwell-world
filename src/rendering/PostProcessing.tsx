import { useGameStore } from '@shared/store/useGameStore';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

/**
 * Post-processing effects pipeline.
 * Renders only when the quality preset enables post-processing.
 * CSS-based grain and vignette are handled elsewhere.
 */
export const PostProcessing = () => {
  const quality = useGameStore((s) => s.qualitySettings);

  // Disable entirely on low-end presets
  if (!quality.enablePostProcessing) return null;
  if (quality.preset === 'low' || quality.preset === 'very-low') return null;

  return (
    <EffectComposer>
      <Bloom
        intensity={0.3}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.5}
      />
    </EffectComposer>
  );
};
