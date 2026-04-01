import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { StructureDef } from '@shared/types';
import { EventBus } from '@shared/events';
import { useGameStore } from '@shared/store/useGameStore';
import { getHeightAtPosition } from '@world/terrain/TerrainGenerator';

interface StructureBaseProps {
  def: StructureDef;
  children: React.ReactNode;
}

export const StructureBase = ({ def, children }: StructureBaseProps) => {
  const groupRef = useRef<Group>(null);
  const isInsideRef = useRef(false);

  const terrainY = getHeightAtPosition(def.position[0], def.position[2]);

  useFrame(() => {
    const playerPos = useGameStore.getState().playerPosition;

    const dx = playerPos[0] - def.position[0];
    const dz = playerPos[2] - def.position[2];
    const distSq = dx * dx + dz * dz;
    const radiusSq = def.interactionRadius * def.interactionRadius;

    if (distSq <= radiusSq && !isInsideRef.current) {
      isInsideRef.current = true;
      EventBus.emit({ type: 'STRUCTURE_ENTERED', structureId: def.id });
    } else if (distSq > radiusSq && isInsideRef.current) {
      isInsideRef.current = false;
      EventBus.emit({ type: 'STRUCTURE_EXITED', structureId: def.id });
    }
  });

  return (
    <group
      ref={groupRef}
      position={[def.position[0], terrainY + def.position[1], def.position[2]]}
      rotation={[def.rotation[0], def.rotation[1], def.rotation[2]]}
      scale={[def.scale[0], def.scale[1], def.scale[2]]}
    >
      {children}
    </group>
  );
};
