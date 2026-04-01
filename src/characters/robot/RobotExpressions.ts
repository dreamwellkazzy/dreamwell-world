import * as THREE from 'three';
import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Expression =
  | 'neutral'
  | 'happy'
  | 'surprised'
  | 'sad'
  | 'angry'
  | 'thinking'
  | 'talking'
  | 'blink';

interface ExpressionPreset {
  eyeScaleX: number;
  eyeScaleY: number;
  eyeOffsetY: number;
  /** Distance between eyes relative to default (1 = default). */
  eyeSpacingMul: number;
}

// ---------------------------------------------------------------------------
// Expression presets
// ---------------------------------------------------------------------------

const EXPRESSION_PRESETS: Record<Expression, ExpressionPreset> = {
  neutral:   { eyeScaleX: 1.0,  eyeScaleY: 1.0,  eyeOffsetY: 0,      eyeSpacingMul: 1.0 },
  happy:     { eyeScaleX: 1.1,  eyeScaleY: 0.5,  eyeOffsetY: 0.005,  eyeSpacingMul: 1.0 },
  surprised: { eyeScaleX: 1.4,  eyeScaleY: 1.4,  eyeOffsetY: 0.01,   eyeSpacingMul: 1.15 },
  sad:       { eyeScaleX: 0.9,  eyeScaleY: 0.7,  eyeOffsetY: -0.008, eyeSpacingMul: 0.9 },
  angry:     { eyeScaleX: 1.1,  eyeScaleY: 0.6,  eyeOffsetY: -0.005, eyeSpacingMul: 0.95 },
  thinking:  { eyeScaleX: 0.8,  eyeScaleY: 0.9,  eyeOffsetY: 0.008,  eyeSpacingMul: 0.85 },
  talking:   { eyeScaleX: 1.0,  eyeScaleY: 0.85, eyeOffsetY: 0,      eyeSpacingMul: 1.0 },
  blink:     { eyeScaleX: 1.0,  eyeScaleY: 0.05, eyeOffsetY: 0,      eyeSpacingMul: 1.0 },
};

/** Default eye spacing from createEyes (X offset per eye). */
const BASE_EYE_SPACING = 0.09;
/** Default eye Y offset from createEyes. */
const BASE_EYE_OFFSET_Y = 0.02;

// ---------------------------------------------------------------------------
// Blink state (per-robot, keyed by group uuid)
// ---------------------------------------------------------------------------

interface BlinkState {
  nextBlinkTime: number;
  isBlinking: boolean;
  blinkTimer: number;
}

const blinkStates = new Map<string, BlinkState>();

const BLINK_DURATION = 0.15; // seconds
const BLINK_MIN_INTERVAL = 2.0;
const BLINK_MAX_INTERVAL = 6.0;

function randomBlinkInterval(): number {
  return BLINK_MIN_INTERVAL + Math.random() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL);
}

function getBlinkState(id: string): BlinkState {
  let state = blinkStates.get(id);
  if (!state) {
    state = {
      nextBlinkTime: randomBlinkInterval(),
      isBlinking: false,
      blinkTimer: 0,
    };
    blinkStates.set(id, state);
  }
  return state;
}

// ---------------------------------------------------------------------------
// Lerp helper
// ---------------------------------------------------------------------------

function lerpScalar(current: number, target: number, speed: number, delta: number): number {
  const t = 1 - Math.pow(1 - speed, delta * 60);
  return current + (target - current) * t;
}

// ---------------------------------------------------------------------------
// updateExpression (imperative, works on raw THREE.Group)
// ---------------------------------------------------------------------------

/**
 * Updates the eye expression on a robot group each frame.
 * Call this from a useFrame or animation loop with the robot's root group.
 *
 * @param group  - The robot root group (contains eyes via hierarchy search)
 * @param expression - Target expression to lerp towards
 * @param delta  - Frame delta time in seconds
 */
export function updateExpression(
  group: THREE.Group,
  expression: Expression,
  delta: number,
): void {
  const eyeL = group.getObjectByName('eye_left') as THREE.Mesh | undefined;
  const eyeR = group.getObjectByName('eye_right') as THREE.Mesh | undefined;
  if (!eyeL || !eyeR) return;

  // Handle blink system
  const blink = getBlinkState(group.uuid);
  let activeExpression = expression;

  blink.nextBlinkTime -= delta;
  if (blink.isBlinking) {
    blink.blinkTimer -= delta;
    if (blink.blinkTimer <= 0) {
      blink.isBlinking = false;
      blink.nextBlinkTime = randomBlinkInterval();
    } else {
      activeExpression = 'blink';
    }
  } else if (blink.nextBlinkTime <= 0 && expression !== 'blink') {
    blink.isBlinking = true;
    blink.blinkTimer = BLINK_DURATION;
    activeExpression = 'blink';
  }

  const preset = EXPRESSION_PRESETS[activeExpression];
  const lerpSpeed = activeExpression === 'blink' ? 0.5 : 0.15;

  // Scale
  const targetSx = preset.eyeScaleX;
  const targetSy = preset.eyeScaleY;

  eyeL.scale.x = lerpScalar(eyeL.scale.x, targetSx, lerpSpeed, delta);
  eyeL.scale.y = lerpScalar(eyeL.scale.y, targetSy, lerpSpeed, delta);
  eyeR.scale.x = lerpScalar(eyeR.scale.x, targetSx, lerpSpeed, delta);
  eyeR.scale.y = lerpScalar(eyeR.scale.y, targetSy, lerpSpeed, delta);

  // Position (Y offset + spacing)
  const targetY = BASE_EYE_OFFSET_Y + preset.eyeOffsetY;
  const targetSpacing = BASE_EYE_SPACING * preset.eyeSpacingMul;

  eyeL.position.y = lerpScalar(eyeL.position.y, targetY, lerpSpeed, delta);
  eyeR.position.y = lerpScalar(eyeR.position.y, targetY, lerpSpeed, delta);
  eyeL.position.x = lerpScalar(eyeL.position.x, -targetSpacing, lerpSpeed, delta);
  eyeR.position.x = lerpScalar(eyeR.position.x, targetSpacing, lerpSpeed, delta);
}

// ---------------------------------------------------------------------------
// useRobotExpression (React hook for R3F components)
// ---------------------------------------------------------------------------

interface ExpressionValues {
  eyeScaleL: THREE.Vector2;
  eyeScaleR: THREE.Vector2;
  eyeOffsetY: number;
}

/**
 * React hook that returns smoothly animated expression values.
 * Use inside a React Three Fiber component with useFrame.
 */
export function useRobotExpression(expression: Expression): ExpressionValues {
  const eyeScaleLRef = useRef(new THREE.Vector2(1, 1));
  const eyeScaleRRef = useRef(new THREE.Vector2(1, 1));
  const eyeOffsetYRef = useRef(0);

  const blinkStateRef = useRef<BlinkState>({
    nextBlinkTime: randomBlinkInterval(),
    isBlinking: false,
    blinkTimer: 0,
  });

  const valuesRef = useRef<ExpressionValues>({
    eyeScaleL: eyeScaleLRef.current,
    eyeScaleR: eyeScaleRRef.current,
    eyeOffsetY: 0,
  });

  const update = useCallback((delta: number) => {
    const blink = blinkStateRef.current;
    let activeExpr = expression;

    blink.nextBlinkTime -= delta;
    if (blink.isBlinking) {
      blink.blinkTimer -= delta;
      if (blink.blinkTimer <= 0) {
        blink.isBlinking = false;
        blink.nextBlinkTime = randomBlinkInterval();
      } else {
        activeExpr = 'blink';
      }
    } else if (blink.nextBlinkTime <= 0 && expression !== 'blink') {
      blink.isBlinking = true;
      blink.blinkTimer = BLINK_DURATION;
      activeExpr = 'blink';
    }

    const preset = EXPRESSION_PRESETS[activeExpr];
    const speed = activeExpr === 'blink' ? 0.5 : 0.15;

    eyeScaleLRef.current.x = lerpScalar(eyeScaleLRef.current.x, preset.eyeScaleX, speed, delta);
    eyeScaleLRef.current.y = lerpScalar(eyeScaleLRef.current.y, preset.eyeScaleY, speed, delta);
    eyeScaleRRef.current.x = lerpScalar(eyeScaleRRef.current.x, preset.eyeScaleX, speed, delta);
    eyeScaleRRef.current.y = lerpScalar(eyeScaleRRef.current.y, preset.eyeScaleY, speed, delta);
    eyeOffsetYRef.current = lerpScalar(eyeOffsetYRef.current, preset.eyeOffsetY, speed, delta);

    valuesRef.current.eyeOffsetY = eyeOffsetYRef.current;
  }, [expression]);

  useFrame((_state, delta) => {
    update(delta);
  });

  return valuesRef.current;
}
