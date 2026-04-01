import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '@shared/store/useGameStore';
import { QUEST_DEFINITIONS } from '@data/quests.data';
import { Minimap } from './Minimap';
import { Notifications } from './Notifications';
import { InteractionPrompt } from './InteractionPrompt';
import { DialogueBox } from './DialogueBox';

/* ============================================================
   HUD — Always-visible in-game overlay
   Visible when world is loaded and main menu is closed.
   ============================================================ */

export const HUD: React.FC = () => {
  const isLoaded = useGameStore((s) => s.isLoaded);
  const isMainMenuOpen = useGameStore((s) => s.isMainMenuOpen);
  const coins = useGameStore((s) => s.coins);
  const showMinimap = useGameStore((s) => s.showMinimap);
  const setShowMinimap = useGameStore((s) => s.setShowMinimap);
  const setPhone = useGameStore((s) => s.setPhone);
  const isPhoneOpen = useGameStore((s) => s.isPhoneOpen);
  const setSettings = useGameStore((s) => s.setSettings);
  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen);
  const activeQuestId = useGameStore((s) => s.activeQuestId);
  const quests = useGameStore((s) => s.quests);

  // -- Coin bounce animation --
  const [coinBounce, setCoinBounce] = useState(false);
  const prevCoinsRef = useRef(coins);

  useEffect(() => {
    if (coins !== prevCoinsRef.current) {
      setCoinBounce(true);
      prevCoinsRef.current = coins;
      const timer = setTimeout(() => setCoinBounce(false), 400);
      return () => clearTimeout(timer);
    }
  }, [coins]);

  // -- Control hints fade --
  const [showHints, setShowHints] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowHints(false), 30000);
    return () => clearTimeout(timer);
  }, []);

  // -- Keyboard shortcuts --
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Do not capture keys when typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        setShowMinimap(!showMinimap);
      }
      if (e.key === 'p' || e.key === 'P') {
        setPhone(!isPhoneOpen);
      }
    },
    [showMinimap, setShowMinimap, isPhoneOpen, setPhone],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // -- Don't render when not in-game --
  if (!isLoaded || isMainMenuOpen) return null;

  // -- Derive active quest info --
  const activeQuest = activeQuestId ? quests[activeQuestId] : null;

  return (
    <div className="hud-container fade-in">
      {/* ---- Top-left: Location Indicator ---- */}
      <LocationIndicator />

      {/* ---- Top-right: Coins Counter ---- */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: showMinimap ? 210 : 16,
          transition: 'right 0.3s ease',
        }}
      >
        <CoinCounter coins={coins} bounce={coinBounce} />
      </div>

      {/* ---- Top-center: Quest Tracker ---- */}
      {activeQuest && activeQuestId && (
        <QuestTracker questId={activeQuestId} quest={activeQuest} />
      )}

      {/* ---- Bottom-right: Quick Access Buttons ---- */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <QuickButton
          icon="M"
          label="Minimap (M)"
          active={showMinimap}
          onClick={() => setShowMinimap(!showMinimap)}
        />
        <QuickButton
          icon="P"
          label="Phone (P)"
          active={isPhoneOpen}
          onClick={() => setPhone(!isPhoneOpen)}
        />
        <QuickButton
          icon="⚙"
          label="Settings"
          active={isSettingsOpen}
          onClick={() => setSettings(!isSettingsOpen)}
        />
      </div>

      {/* ---- Bottom-left: Control Hints ---- */}
      {showHints && <ControlHints />}

      {/* ---- Minimap ---- */}
      {showMinimap && <Minimap />}

      {/* ---- Notifications ---- */}
      <Notifications />

      {/* ---- Interaction Prompt ---- */}
      <InteractionPrompt />

      {/* ---- Dialogue Box ---- */}
      <DialogueBox />
    </div>
  );
};

/* ---------------------------------------------------------
   Sub-components
   --------------------------------------------------------- */

const LocationIndicator: React.FC = () => {
  // Derive zone name from player position in the future;
  // static default for now.
  const [area] = useState('The Junkyard');

  return (
    <div
      className="fade-in"
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        fontSize: 13,
        letterSpacing: '0.06em',
        opacity: 0.8,
        textTransform: 'uppercase',
      }}
    >
      <span style={{ color: '#D4940A', marginRight: 6 }}>&#9656;</span>
      {area}
    </div>
  );
};

interface CoinCounterProps {
  coins: number;
  bounce: boolean;
}

const CoinCounter: React.FC<CoinCounterProps> = ({ coins, bounce }) => (
  <div
    className="panel"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      fontSize: 14,
      fontWeight: 'bold',
    }}
  >
    <span
      className={bounce ? 'coin-bounce' : ''}
      style={{
        color: '#D4940A',
        fontSize: 16,
        display: 'inline-block',
      }}
    >
      &#x2B21;
    </span>
    <span>{coins}</span>
  </div>
);

interface QuestTrackerProps {
  questId: string;
  quest: { questId: string; status: string; objectiveProgress: Record<string, number> };
}

const QuestTracker: React.FC<QuestTrackerProps> = ({ questId, quest }) => {
  // Look up the quest definition for the display name and objectives
  const questDef = QUEST_DEFINITIONS.find((q) => q.id === questId);
  const displayName = questDef?.name ?? questId.replace(/_/g, ' ');

  // Compute progress from objectiveProgress and the quest definition
  const objectiveEntries = Object.entries(quest.objectiveProgress);
  const totalObjectives = questDef?.objectives.length ?? (objectiveEntries.length || 1);
  const completedCount = objectiveEntries.filter(([, v]) => v >= 1).length;

  // Find the first incomplete objective for display
  const currentObjective = questDef?.objectives.find((obj) => {
    const progress = quest.objectiveProgress[obj.id] ?? 0;
    return progress < obj.requiredCount;
  });

  return (
    <div
      className="panel quest-pulse fade-in"
      style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 18px',
        textAlign: 'center',
        maxWidth: 320,
        fontSize: 12,
      }}
    >
      <div
        style={{
          color: '#D4940A',
          fontWeight: 'bold',
          fontSize: 13,
          marginBottom: 3,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {displayName}
      </div>
      {currentObjective ? (
        <div style={{ color: '#D4C4A8', fontSize: 11 }}>
          {currentObjective.description}
          {currentObjective.requiredCount > 1 && (
            <span style={{ marginLeft: 6, color: '#D4940A' }}>
              ({quest.objectiveProgress[currentObjective.id] ?? 0}/{currentObjective.requiredCount})
            </span>
          )}
        </div>
      ) : (
        <div style={{ color: '#D4C4A8', fontSize: 11 }}>
          {completedCount}/{totalObjectives} objectives complete
        </div>
      )}
    </div>
  );
};

interface QuickButtonProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

const QuickButton: React.FC<QuickButtonProps> = ({ icon, label, active, onClick }) => (
  <div className="tooltip-wrapper">
    <button
      className="btn"
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        fontSize: 15,
        borderColor: active ? '#D4940A' : undefined,
        background: active ? 'rgba(212, 148, 10, 0.15)' : undefined,
      }}
      aria-label={label}
    >
      {icon}
    </button>
    <span className="tooltip-text">{label}</span>
  </div>
);

const ControlHints: React.FC = () => (
  <div
    className="fade-out-delayed"
    style={{
      position: 'absolute',
      bottom: 20,
      left: 16,
      fontSize: 11,
      opacity: 0.5,
      letterSpacing: '0.03em',
      color: '#D4C4A8',
      maxWidth: 420,
      lineHeight: 1.6,
    }}
  >
    <span className="key" style={{ marginRight: 4 }}>WASD</span> Move{' '}
    <span style={{ margin: '0 6px', opacity: 0.3 }}>|</span>
    <span className="key" style={{ marginRight: 4 }}>Shift</span> Run{' '}
    <span style={{ margin: '0 6px', opacity: 0.3 }}>|</span>
    <span className="key" style={{ marginRight: 4 }}>E</span> Interact{' '}
    <span style={{ margin: '0 6px', opacity: 0.3 }}>|</span>
    <span className="key" style={{ marginRight: 4 }}>Space</span> Jump
  </div>
);
