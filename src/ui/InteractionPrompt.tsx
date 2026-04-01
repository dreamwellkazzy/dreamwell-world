import React from 'react';
import { useGameStore } from '@shared/store/useGameStore';

/* ============================================================
   InteractionPrompt — "Press E to interact" floating prompt
   Bottom-center, above dialogue area. Auto-hides when dialogue
   is open.
   ============================================================ */

export const InteractionPrompt: React.FC = () => {
  const interactionPrompt = useGameStore((s) => s.interactionPrompt);
  const isDialogueOpen = useGameStore((s) => s.isDialogueOpen);

  // Hide when dialogue is open or prompt is null / not visible
  if (!interactionPrompt || !interactionPrompt.visible || isDialogueOpen) {
    return null;
  }

  return (
    <div
      className="float fade-in"
      style={{
        position: 'absolute',
        bottom: '30%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 120,
        pointerEvents: 'none',
      }}
    >
      <div
        className="panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 20px',
          fontSize: 13,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Keyboard key icon */}
        <span
          className="key"
          style={{
            width: 28,
            height: 28,
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          E
        </span>

        {/* Prompt text */}
        <span style={{ color: '#E8D5B7' }}>
          {interactionPrompt.text}
        </span>
      </div>
    </div>
  );
};
