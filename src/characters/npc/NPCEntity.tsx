import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';
import { CHARACTER } from '@shared/constants';
import { buildRobot } from '@characters/robot/RobotBuilder';
import { updateExpression } from '@characters/robot/RobotExpressions';
import type { NPCDef } from '@shared/types';
import type { Expression } from '@characters/robot/RobotExpressions';
import { updateNPCBehavior } from './NPCBehavior';
import { updateNPCAnimation } from './NPCAnimations';
import type { AnimationState, IdleAnimationType } from '@shared/types';

// ---------------------------------------------------------------------------
// Terrain height query (fallback if Stream 1 terrain not loaded)
// ---------------------------------------------------------------------------

function getTerrainHeight(x: number, z: number): number {
  const terrain = (window as any).__dreamwellTerrain;
  if (terrain?.getHeightAtPosition) return terrain.getHeightAtPosition(x, z);
  return 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NPCEntityProps {
  def: NPCDef;
}

export const NPCEntity: React.FC<NPCEntityProps> = ({ def }) => {
  const groupRef = useRef<THREE.Group>(null);
  const robotRef = useRef<THREE.Group | null>(null);

  const { camera } = useThree();

  // Build the robot mesh once
  const robotGroup = useMemo(() => {
    const group = buildRobot(def.robotConfig);
    robotRef.current = group;
    return group;
  }, [def.robotConfig]);

  // Compute initial Y from terrain
  const initialY = useMemo(
    () => getTerrainHeight(def.position[0], def.position[2]) + CHARACTER.BODY_HEIGHT,
    [def.position],
  );

  useFrame((state, delta) => {
    if (!groupRef.current || !robotRef.current) return;

    // Clamp delta to avoid huge jumps on tab-switch
    const dt = Math.min(delta, 0.1);
    const time = state.clock.elapsedTime;

    // Read store values (non-reactive selectors for perf)
    const store = useGameStore.getState();
    const playerPos = store.playerPosition;
    const npcState = store.npcs[def.id];
    if (!npcState) return;

    // Camera distance for LOD decisions
    const cameraPos = camera.position;
    const npcWorldPos = groupRef.current.position;
    const cameraDist = cameraPos.distanceTo(npcWorldPos);

    // Quality settings for render distance
    const npcRenderDistance =
      store.qualitySettings?.npcRenderDistance ?? CHARACTER.NPC_RENDER_DISTANCE;

    // Visibility culling: hide if beyond render distance
    if (cameraDist > npcRenderDistance) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    // Shadow only if close to camera
    robotRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = cameraDist < 20;
      }
    });

    // Skip animation updates if too far from camera
    if (cameraDist > CHARACTER.NPC_ANIMATION_DISTANCE) return;

    // --- Behavior update ---
    const stateUpdate = updateNPCBehavior(npcState, def, playerPos, dt);
    if (stateUpdate && Object.keys(stateUpdate).length > 0) {
      store.setNPCState(def.id, stateUpdate);
    }

    // Re-read after potential update for freshest values
    const updatedNpc = useGameStore.getState().npcs[def.id];
    if (!updatedNpc) return;

    // --- Apply position/rotation to the group ---
    const terrainY = getTerrainHeight(updatedNpc.position[0], updatedNpc.position[2]);
    groupRef.current.position.set(
      updatedNpc.position[0],
      terrainY + CHARACTER.BODY_HEIGHT,
      updatedNpc.position[2],
    );
    groupRef.current.rotation.y = updatedNpc.rotation;

    // --- Procedural animation ---
    const walkSpeed = def.robotConfig.personality.walkSpeed ?? 2.0;
    const idleType = def.robotConfig.personality.idleAnimation ?? 'fidget';
    const animState = (updatedNpc.currentAnimation || 'idle') as AnimationState;

    updateNPCAnimation(
      robotRef.current,
      animState,
      idleType as IdleAnimationType,
      dt,
      time,
      walkSpeed,
    );

    // --- Expression update ---
    const playerDist = Math.sqrt(
      (playerPos[0] - updatedNpc.position[0]) ** 2 +
      (playerPos[2] - updatedNpc.position[2]) ** 2,
    );

    let expression: Expression = 'neutral';
    if (updatedNpc.isTalking) {
      expression = 'talking';
    } else if (playerDist <= def.interactionRadius) {
      expression = 'happy';
    }

    updateExpression(robotRef.current, expression, dt);
  });

  return (
    <group
      ref={groupRef}
      position={[def.position[0], initialY, def.position[2]]}
      rotation={[0, def.rotation, 0]}
    >
      <primitive object={robotGroup} />
    </group>
  );
};
