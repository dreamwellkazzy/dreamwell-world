/**
 * Touch input state consumed by PlayerController each frame.
 * Mobile joystick / button UI writes to these values;
 * PlayerController reads and resets one-shot flags (jump, interact).
 */
export const touchInput = {
  moveX: 0,
  moveY: 0,
  jump: false,
  interact: false,
};

/**
 * Placeholder touch controller component.
 * On mobile, this will render virtual joystick + action buttons
 * that write into `touchInput`. Returns null on desktop.
 */
export const TouchController: React.FC = () => null;
