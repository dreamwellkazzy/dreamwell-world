import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@shared/store/useGameStore';
import type { AccessoryType, RobotConfig } from '@shared/types';
import { CHARACTER } from '@shared/constants';
import { createAccessory } from '@characters/robot/RobotParts';

// ---------------------------------------------------------------------------
// Head-mounted accessory set (used for placement decisions)
// ---------------------------------------------------------------------------

const HEAD_ACCESSORIES = new Set<AccessoryType>([
  'antenna_single',
  'antenna_double',
  'antenna_dish',
  'wire_hair',
  'goggles',
  'monocle',
  'top_hat',
  'headphones',
]);

const TOP_MOUNTED = new Set<AccessoryType>([
  'antenna_single',
  'antenna_double',
  'antenna_dish',
  'wire_hair',
  'top_hat',
]);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook that synchronises the store's `equippedAccessories` list
 * with actual THREE.Group children on the robot.
 *
 * Call this once inside the PlayerEntity component, passing the robot group ref.
 */
export function usePlayerAccessories(robotGroup: THREE.Group | null): void {
  const attachedRef = useRef<Map<AccessoryType, THREE.Group>>(new Map());

  useEffect(() => {
    if (!robotGroup) return;

    let prevAccessories: AccessoryType[] = useGameStore.getState().equippedAccessories;

    // Perform initial sync
    syncAccessories(prevAccessories, robotGroup, attachedRef.current);

    const unsubscribe = useGameStore.subscribe((state) => {
      const equippedAccessories = state.equippedAccessories;

      // Shallow compare to avoid unnecessary work
      if (equippedAccessories === prevAccessories) return;
      prevAccessories = equippedAccessories;

      syncAccessories(equippedAccessories, robotGroup, attachedRef.current);
    });

    return () => {
      unsubscribe();
      // Cleanup: remove all attached accessories
      for (const [, accGroup] of attachedRef.current) {
        accGroup.removeFromParent();
      }
      attachedRef.current.clear();
    };
  }, [robotGroup]);
}

// ---------------------------------------------------------------------------
// Sync logic — adds / removes THREE groups to match store state
// ---------------------------------------------------------------------------

function syncAccessories(
  equippedAccessories: AccessoryType[],
  robotGroup: THREE.Group,
  attached: Map<AccessoryType, THREE.Group>,
): void {
  const config = useGameStore.getState().playerRobotConfig;
  const head = robotGroup.userData.head as THREE.Group | undefined;
  const body = robotGroup.userData.body as THREE.Group | undefined;

  if (!head || !body) return;

  const headShapeScale = getHeadShapeHY(config);
  const headH = CHARACTER.HEAD_HEIGHT * headShapeScale;

  // Determine what needs to be added and removed
  const equippedSet = new Set<AccessoryType>(equippedAccessories);

  // Remove accessories no longer equipped
  for (const [accType, accGroup] of attached) {
    if (!equippedSet.has(accType)) {
      accGroup.removeFromParent();
      attached.delete(accType);
    }
  }

  // Add newly equipped accessories
  for (const accType of equippedAccessories) {
    if (!attached.has(accType)) {
      const accGroup = createAccessory(accType, config);

      if (HEAD_ACCESSORIES.has(accType)) {
        if (TOP_MOUNTED.has(accType)) {
          accGroup.position.y = headH / 2;
        }
        head.add(accGroup);
      } else {
        body.add(accGroup);
      }

      attached.set(accType, accGroup);
    }
  }
}

// ---------------------------------------------------------------------------
// Helper — derive head height scale from config
// ---------------------------------------------------------------------------

function getHeadShapeHY(config: RobotConfig): number {
  switch (config.headShape) {
    // All current head shapes use hY = 1.0
    default:
      return 1.0;
  }
}
