import * as THREE from 'three';
import { CHARACTER } from '@shared/constants';
import type { RobotConfig } from '@shared/types';
import {
  createBody,
  createHead,
  createScreen,
  createEyes,
  createArm,
  createLeg,
  createAccessory,
} from './RobotParts';

/**
 * Builds a complete robot from a RobotConfig.
 *
 * The returned group has the following hierarchy:
 *   robot (Group)
 *   ├── body (Group)
 *   ├── head (Group)
 *   │   ├── screen (Group)
 *   │   ├── eyes (Group)
 *   │   └── accessories mounted on head
 *   ├── arm_left (Group)
 *   ├── arm_right (Group)
 *   ├── leg_left (Group)
 *   ├── leg_right (Group)
 *   └── accessories mounted on body
 *
 * References to key parts are stored in `robot.userData` for animation access.
 */
export function buildRobot(config: RobotConfig): THREE.Group {
  const robot = new THREE.Group();
  robot.name = `robot_${config.id}`;

  // -----------------------------------------------------------------------
  // Compute scaled dimensions for positioning
  // -----------------------------------------------------------------------
  const bodyScaleMap: Record<string, { wX: number; hY: number; dZ: number }> = {
    standard: { wX: 1.0, hY: 1.0, dZ: 1.0 },
    stocky:   { wX: 1.2, hY: 0.85, dZ: 1.0 },
    slim:     { wX: 0.85, hY: 1.1, dZ: 1.0 },
    round:    { wX: 1.1, hY: 1.1, dZ: 1.1 },
    tall:     { wX: 0.9, hY: 1.3, dZ: 1.0 },
  };

  const headScaleMap: Record<string, { wX: number; hY: number; dZ: number }> = {
    box:         { wX: 1.0, hY: 1.0, dZ: 1.0 },
    rounded_box: { wX: 1.0, hY: 1.0, dZ: 1.0 },
    cylinder:    { wX: 1.0, hY: 1.0, dZ: 1.0 },
    dome:        { wX: 1.0, hY: 1.0, dZ: 1.0 },
    wide:        { wX: 1.3, hY: 1.0, dZ: 1.0 },
  };

  const bs = bodyScaleMap[config.bodyShape] ?? bodyScaleMap.standard;
  const hs = headScaleMap[config.headShape] ?? headScaleMap.box;

  const bodyW = CHARACTER.BODY_WIDTH * bs.wX;
  const bodyH = CHARACTER.BODY_HEIGHT * bs.hY;
  const headH = CHARACTER.HEAD_HEIGHT * hs.hY;
  const headD = CHARACTER.HEAD_DEPTH * hs.dZ;

  // -----------------------------------------------------------------------
  // Build parts
  // -----------------------------------------------------------------------
  const body = createBody(config);
  const head = createHead(config);
  const screen = createScreen(config);
  const eyes = createEyes(config);
  const leftArm = createArm(config, 'left');
  const rightArm = createArm(config, 'right');
  const leftLeg = createLeg(config, 'left');
  const rightLeg = createLeg(config, 'right');

  // -----------------------------------------------------------------------
  // Position parts relative to body center (body at origin)
  // -----------------------------------------------------------------------

  // Head on top of body
  head.position.y = bodyH / 2 + headH / 2 + 0.02;

  // Screen flush with head front face
  screen.position.z = headD / 2 + 0.001;
  head.add(screen);

  // Eyes on screen
  eyes.position.z = headD / 2 + 0.002;
  head.add(eyes);

  // Arms at body sides
  leftArm.position.set(-(bodyW / 2 + CHARACTER.ARM_RADIUS), bodyH / 4, 0);
  rightArm.position.set(bodyW / 2 + CHARACTER.ARM_RADIUS, bodyH / 4, 0);

  // Legs under body
  leftLeg.position.set(-bodyW / 4, -bodyH / 2, 0);
  rightLeg.position.set(bodyW / 4, -bodyH / 2, 0);

  // -----------------------------------------------------------------------
  // Assemble hierarchy
  // -----------------------------------------------------------------------
  robot.add(body);
  robot.add(head);
  robot.add(leftArm);
  robot.add(rightArm);
  robot.add(leftLeg);
  robot.add(rightLeg);

  // -----------------------------------------------------------------------
  // Accessories
  // -----------------------------------------------------------------------
  // Determine which accessories mount on the head vs the body
  const headAccessories = new Set([
    'antenna_single',
    'antenna_double',
    'antenna_dish',
    'wire_hair',
    'goggles',
    'monocle',
    'top_hat',
    'headphones',
  ]);

  for (const accType of config.accessories) {
    const accGroup = createAccessory(accType, config);

    if (headAccessories.has(accType)) {
      // Mount on top of head using the antenna_mount point for top accessories
      const topMounted = new Set([
        'antenna_single',
        'antenna_double',
        'antenna_dish',
        'wire_hair',
        'top_hat',
      ]);

      if (topMounted.has(accType)) {
        accGroup.position.y = headH / 2;
      }
      // Goggles, monocle, headphones position relative to head center (already set in createAccessory)
      head.add(accGroup);
    } else {
      // Mount on body (lab_coat, backpack, jetpack, tool_belt, scarf, cape)
      body.add(accGroup);
    }
  }

  // -----------------------------------------------------------------------
  // Apply global scale
  // -----------------------------------------------------------------------
  robot.scale.setScalar(config.scale);

  // -----------------------------------------------------------------------
  // Store references in userData for animation
  // -----------------------------------------------------------------------
  robot.userData = {
    head,
    body,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    eyes,
    screen,
    config,
  };

  return robot;
}
