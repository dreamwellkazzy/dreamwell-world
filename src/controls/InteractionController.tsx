import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@shared/store/useGameStore';
import { CHARACTER } from '@shared/constants';
import { EventBus } from '@shared/events';

const INTERACTION_DIST_SQ = CHARACTER.INTERACTION_DISTANCE * CHARACTER.INTERACTION_DISTANCE;

export const InteractionController: React.FC = () => {
  const getState = useGameStore.getState;

  // Track last prompted target to avoid redundant store updates
  const lastPromptTargetId = useRef<string | null>(null);
  // Track when interact was last processed to avoid repeat fires
  const interactProcessed = useRef(false);

  useFrame(() => {
    const state = getState();
    const [px, py, pz] = state.playerPosition;
    const npcs = state.npcs;
    const blocked = state.isPaused || state.isDialogueOpen || state.isPhoneOpen;

    if (blocked) {
      // Clear prompt when blocked, but don't clear dialogue target
      if (lastPromptTargetId.current !== null) {
        state.setInteractionPrompt(null);
        lastPromptTargetId.current = null;
      }
      interactProcessed.current = false;
      return;
    }

    // ---- Find closest NPC within interaction range ----
    let closestId: string | null = null;
    let closestDistSq = INTERACTION_DIST_SQ;

    const npcIds = Object.keys(npcs);
    for (let i = 0; i < npcIds.length; i++) {
      const npc = npcs[npcIds[i]];
      if (!npc.isActive) continue;

      const dx = npc.position[0] - px;
      const dy = npc.position[1] - py;
      const dz = npc.position[2] - pz;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closestId = npc.id;
      }
    }

    // ---- Update interaction prompt only when nearest changes ----
    if (closestId !== null) {
      if (lastPromptTargetId.current !== closestId) {
        // Format NPC id into display name: replace underscores/hyphens with spaces, title-case
        const displayName = closestId
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        state.setInteractionPrompt({
          visible: true,
          text: `Press E to talk to ${displayName}`,
          targetId: closestId,
        });
        lastPromptTargetId.current = closestId;
      }
    } else {
      if (lastPromptTargetId.current !== null) {
        state.setInteractionPrompt(null);
        lastPromptTargetId.current = null;
      }
    }

    // ---- Handle interaction trigger ----
    if (state.isInteracting && closestId !== null && !interactProcessed.current) {
      interactProcessed.current = true;

      // Fire interaction event
      EventBus.emit({
        type: 'PLAYER_INTERACTED',
        targetId: closestId,
        targetType: 'npc',
      });

      // Start NPC dialogue
      const npc = npcs[closestId];
      if (npc) {
        state.setActiveDialogueNpc(closestId);
        state.setDialogue(true);

        EventBus.emit({
          type: 'NPC_DIALOGUE_STARTED',
          npcId: closestId,
          dialogueId: closestId, // dialogue tree ID defaults to NPC id
        });
      }
    }

    // Reset interact processed flag when player releases E
    if (!state.isInteracting) {
      interactProcessed.current = false;
    }
  });

  return null;
};
