export {
  createBodyMaterial,
  createChromeMaterial,
  createScreenMaterial,
  createEyeMaterial,
  createAccessoryMaterial,
} from './RobotMaterials';

export {
  createBody,
  createHead,
  createScreen,
  createEyes,
  createArm,
  createLeg,
  createAccessory,
} from './RobotParts';

export {
  updateExpression,
  useRobotExpression,
} from './RobotExpressions';
export type { Expression } from './RobotExpressions';

export {
  ROBOT_CONFIGS,
  PLAYER_DEFAULT_CONFIG,
} from './RobotConfigs';

export { buildRobot } from './RobotBuilder';
