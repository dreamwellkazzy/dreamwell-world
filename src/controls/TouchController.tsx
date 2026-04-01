import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@shared/store/useGameStore';

// ---- Shared touch input state (read by PlayerController) ----
export const touchInput = {
  moveX: 0,
  moveY: 0,
  jump: false,
  interact: false,
};

// ---- Constants ----
const OUTER_RADIUS = 35;
const INNER_RADIUS = 15;
const MAX_DRAG = OUTER_RADIUS - INNER_RADIUS;
const MOBILE_WIDTH_THRESHOLD = 768;

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const hasTouchCapability = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isNarrow = window.innerWidth < MOBILE_WIDTH_THRESHOLD;
  return hasTouchCapability && isNarrow;
}

export const TouchController: React.FC = () => {
  const controlScheme = useGameStore((s) => s.controlScheme);
  const setControlScheme = useGameStore((s) => s.setControlScheme);
  const [shouldRender, setShouldRender] = useState(false);

  // Joystick state
  const joystickRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const joystickOrigin = useRef({ x: 0, y: 0 });
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });

  // Auto-detect mobile on mount
  useEffect(() => {
    const mobile = isMobileDevice();
    if (mobile) {
      setControlScheme('touch');
    }
    setShouldRender(mobile || controlScheme === 'touch');
  }, [controlScheme, setControlScheme]);

  // ---- Joystick handlers ----
  const onJoystickTouchStart = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return; // already tracking a touch
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    const rect = joystickRef.current?.getBoundingClientRect();
    if (rect) {
      joystickOrigin.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  }, []);

  const onJoystickTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        let dx = touch.clientX - joystickOrigin.current.x;
        let dy = touch.clientY - joystickOrigin.current.y;

        // Clamp to max drag radius
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > MAX_DRAG) {
          dx = (dx / dist) * MAX_DRAG;
          dy = (dy / dist) * MAX_DRAG;
        }

        setKnobOffset({ x: dx, y: dy });

        // Normalize to -1..1
        touchInput.moveX = dx / MAX_DRAG;
        touchInput.moveY = dy / MAX_DRAG; // positive Y = forward (down on screen = forward in world)
        break;
      }
    }
  }, []);

  const onJoystickTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setKnobOffset({ x: 0, y: 0 });
        touchInput.moveX = 0;
        touchInput.moveY = 0;
        break;
      }
    }
  }, []);

  // ---- Button handlers ----
  const onJumpPress = useCallback(() => {
    touchInput.jump = true;
  }, []);

  const onInteractPress = useCallback(() => {
    touchInput.interact = true;
  }, []);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      touchInput.moveX = 0;
      touchInput.moveY = 0;
      touchInput.jump = false;
      touchInput.interact = false;
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
        touchAction: 'none',
      }}
    >
      {/* ---- Virtual Joystick (bottom-left) ---- */}
      <div
        ref={joystickRef}
        onTouchStart={onJoystickTouchStart}
        onTouchMove={onJoystickTouchMove}
        onTouchEnd={onJoystickTouchEnd}
        onTouchCancel={onJoystickTouchEnd}
        style={{
          position: 'absolute',
          bottom: 40,
          left: 40,
          width: OUTER_RADIUS * 2,
          height: OUTER_RADIUS * 2,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.12)',
          border: '2px solid rgba(255, 255, 255, 0.25)',
          pointerEvents: 'auto',
          touchAction: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Inner knob */}
        <div
          style={{
            width: INNER_RADIUS * 2,
            height: INNER_RADIUS * 2,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
            transition: touchIdRef.current !== null ? 'none' : 'transform 0.15s ease-out',
          }}
        />
      </div>

      {/* ---- Action buttons (bottom-right) ---- */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'center',
        }}
      >
        {/* Jump button */}
        <button
          onTouchStart={onJumpPress}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(100, 180, 255, 0.3)',
            border: '2px solid rgba(100, 180, 255, 0.6)',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 20,
            fontWeight: 'bold',
            pointerEvents: 'auto',
            touchAction: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
          }}
          aria-label="Jump"
        >
          ^
        </button>

        {/* Interact button */}
        <button
          onTouchStart={onInteractPress}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(255, 200, 50, 0.3)',
            border: '2px solid rgba(255, 200, 50, 0.6)',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 16,
            fontWeight: 'bold',
            pointerEvents: 'auto',
            touchAction: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
          }}
          aria-label="Interact"
        >
          E
        </button>
      </div>
    </div>
  );
};
