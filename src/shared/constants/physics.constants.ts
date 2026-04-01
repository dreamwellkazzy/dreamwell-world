export const PHYSICS = {
  GRAVITY: [0, -20, 0] as [number, number, number],
  FIXED_TIMESTEP: 1 / 60,
  MAX_SUBSTEPS: 4,
  GROUND_FRICTION: 0.8,
  AIR_FRICTION: 0.02,
  SLOPE_LIMIT: 45,
  STEP_HEIGHT: 0.3,
} as const;
