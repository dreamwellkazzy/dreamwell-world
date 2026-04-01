import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@shared/store/useGameStore';
import { EventBus } from '@shared/events/EventBus';
import type { PhoneTab, InventoryItem, AccessoryType, QualityPreset } from '@shared/types';

/* ================================================================
   NPC_METADATA — default roster for the Characters tab.
   When @data/npcs.data is created by another agent, replace this
   import with: import { NPC_METADATA } from '@data/npcs.data';
   ================================================================ */

interface NPCMeta {
  id: string;
  name: string;
  title: string;
  description: string;
  color: string;
}

const NPC_METADATA: NPCMeta[] = [
  { id: 'gatekeeper', name: 'Gatekeeper', title: 'Sentinel', description: 'Guards the island entrance.', color: '#8B4513' },
  { id: 'professor', name: 'Professor Bolt', title: 'Einstein', description: 'The island\'s lead researcher.', color: '#4682B4' },
  { id: 'merchant', name: 'Clink', title: 'Treasurer', description: 'Runs the stock market exchange.', color: '#DAA520' },
  { id: 'postmaster', name: 'Zip', title: 'Postmaster', description: 'Delivers parcels across the island.', color: '#CD853F' },
  { id: 'oracle', name: 'Seer', title: 'Oracle', description: 'Whispers prophecies from the lighthouse.', color: '#9370DB' },
  { id: 'scout', name: 'Dash', title: 'Scout', description: 'Explores the outer junkyard perimeter.', color: '#FF8C00' },
];

/* ── Tab definitions ─────────────────────────────────────────── */

const TABS: { key: PhoneTab; label: string }[] = [
  { key: 'map', label: '\uD83D\uDDFA' },
  { key: 'quests', label: '\uD83D\uDCCB' },
  { key: 'inventory', label: '\uD83C\uDF92' },
  { key: 'characters', label: '\uD83E\uDD16' },
  { key: 'settings', label: '\u2699' },
];

/* ================================================================
   MAP TAB
   ================================================================ */

const MapTab: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerPosition = useGameStore((s) => s.playerPosition);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Water
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(0, 0, w, h);

    // Island shape
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.38, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3A3228';
    ctx.fill();
    ctx.strokeStyle = '#4A3F32';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Structure markers
    const structures = [
      { x: 0, z: 0, label: 'HQ', color: '#D4940A' },
      { x: 30, z: -20, label: 'Mkt', color: '#DAA520' },
      { x: -25, z: 15, label: 'Wrk', color: '#8B6914' },
      { x: 60, z: -40, label: 'Cin', color: '#CD5C5C' },
      { x: -40, z: -30, label: 'Dock', color: '#4682B4' },
      { x: 45, z: 20, label: 'Yard', color: '#6B5B3A' },
    ];

    const mapScale = 1.6;
    const ox = w / 2;
    const oy = h / 2;

    structures.forEach((s) => {
      const sx = ox + s.x * mapScale;
      const sy = oy + s.z * mapScale;
      ctx.fillStyle = s.color;
      ctx.fillRect(sx - 4, sy - 4, 8, 8);
      ctx.fillStyle = '#E8D5B7';
      ctx.font = '9px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(s.label, sx, sy + 14);
    });

    // Player dot
    const px = ox + playerPosition[0] * mapScale;
    const py = oy + playerPosition[2] * mapScale;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#D4940A';
    ctx.fill();
    ctx.strokeStyle = '#1A1612';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [playerPosition]);

  return (
    <div style={{ padding: 8, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ui-accent)', letterSpacing: 2, marginBottom: 6 }}>
        ISLAND MAP
      </p>
      <canvas
        ref={canvasRef}
        width={280}
        height={380}
        style={{ width: '100%', flex: 1, borderRadius: 8, border: '1px solid var(--ui-border)' }}
      />
    </div>
  );
};

/* ================================================================
   QUESTS TAB
   ================================================================ */

const QuestsTab: React.FC = () => {
  const quests = useGameStore((s) => s.quests);
  const activeQuestId = useGameStore((s) => s.activeQuestId);
  const completedQuestIds = useGameStore((s) => s.completedQuestIds);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeQuests = Object.values(quests).filter((q) => q.status !== 'completed');
  const completedQuests = completedQuestIds.map((id) => quests[id]).filter(Boolean);

  return (
    <div style={{ padding: 0 }}>
      <p style={{ padding: '12px 12px 8px', fontSize: 11, color: 'var(--ui-accent)', letterSpacing: 2 }}>
        QUESTS
      </p>

      {activeQuests.length === 0 && (
        <p style={{ padding: 24, fontSize: 13, color: 'var(--ui-text-dim)', textAlign: 'center' }}>
          No active quests
        </p>
      )}

      {activeQuests.map((q) => (
        <div
          key={q.questId}
          className={`quest-item${q.questId === activeQuestId ? ' active' : ''}`}
        >
          <p className="quest-name">{q.questId}</p>
          <p className="quest-giver">Status: {q.status}</p>
          {Object.entries(q.objectiveProgress).map(([objId, count]) => (
            <p
              key={objId}
              className={`quest-objective${count > 0 ? ' completed' : ''}`}
            >
              {count > 0 ? '\u2713' : '\u25CB'} {objId}
            </p>
          ))}
        </div>
      ))}

      {completedQuests.length > 0 && (
        <>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ui-text-dim)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'var(--ui-font)',
              padding: '8px 12px',
              textDecoration: 'underline',
            }}
          >
            {showCompleted ? 'Hide' : 'Show'} Completed ({completedQuests.length})
          </button>
          {showCompleted &&
            completedQuests.map((q) => (
              <div key={q.questId} className="quest-item" style={{ opacity: 0.5 }}>
                <p className="quest-name" style={{ color: 'var(--ui-text-dim)' }}>
                  {'\u2713'} {q.questId}
                </p>
              </div>
            ))}
        </>
      )}
    </div>
  );
};

/* ================================================================
   INVENTORY TAB
   ================================================================ */

const InventoryTab: React.FC = () => {
  const inventory = useGameStore((s) => s.inventory);
  const equippedAccessories = useGameStore((s) => s.equippedAccessories);
  const equipAccessory = useGameStore((s) => s.equipAccessory);
  const unequipAccessory = useGameStore((s) => s.unequipAccessory);

  const handleToggleEquip = useCallback(
    (item: InventoryItem) => {
      const accType = item.id as AccessoryType;
      if (equippedAccessories.includes(accType)) {
        unequipAccessory(accType);
      } else {
        equipAccessory(accType);
      }
    },
    [equippedAccessories, equipAccessory, unequipAccessory]
  );

  if (inventory.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ fontSize: 13, color: 'var(--ui-text-dim)' }}>No items yet</p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ padding: '12px 12px 8px', fontSize: 11, color: 'var(--ui-accent)', letterSpacing: 2 }}>
        INVENTORY
      </p>
      <div className="inventory-grid">
        {inventory.map((item) => {
          const isAccessory = item.type === 'accessory';
          const isEquipped = isAccessory && equippedAccessories.includes(item.id as AccessoryType);

          return (
            <div
              key={item.id}
              className="inventory-item"
              style={isEquipped ? { borderColor: 'var(--ui-accent)' } : undefined}
            >
              <span className="inventory-item-icon">{item.icon}</span>
              <span className="inventory-item-name">{item.name}</span>
              {item.quantity > 1 && (
                <span className="inventory-item-qty">x{item.quantity}</span>
              )}
              {isAccessory && (
                <button
                  className="btn"
                  onClick={() => handleToggleEquip(item)}
                  style={{
                    fontSize: 9,
                    padding: '2px 6px',
                    marginTop: 2,
                    borderRadius: 3,
                    color: isEquipped ? 'var(--ui-accent)' : 'var(--ui-text-dim)',
                  }}
                >
                  {isEquipped ? 'Unequip' : 'Equip'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================================================================
   CHARACTERS TAB
   ================================================================ */

const CharactersTab: React.FC = () => {
  const [metNpcs, setMetNpcs] = useState<Set<string>>(new Set());
  const npcs = useGameStore((s) => s.npcs);

  // Track met NPCs via dialogue end events
  useEffect(() => {
    const unsub = EventBus.on('NPC_DIALOGUE_ENDED', (event) => {
      setMetNpcs((prev) => {
        const next = new Set(prev);
        next.add(event.npcId);
        return next;
      });
    });
    return unsub;
  }, []);

  // Also mark currently-talking NPCs as met
  useEffect(() => {
    const talking = Object.values(npcs).filter((n) => n.isTalking);
    if (talking.length > 0) {
      setMetNpcs((prev) => {
        const next = new Set(prev);
        talking.forEach((n) => next.add(n.id));
        return next;
      });
    }
  }, [npcs]);

  return (
    <div>
      <p style={{ padding: '12px 12px 8px', fontSize: 11, color: 'var(--ui-accent)', letterSpacing: 2 }}>
        CHARACTERS
      </p>
      {NPC_METADATA.map((npc) => {
        const isMet = metNpcs.has(npc.id);
        return (
          <div key={npc.id} className={`character-card${isMet ? '' : ' locked'}`}>
            <div
              className="character-icon"
              style={{ background: isMet ? npc.color : 'var(--ui-border)' }}
            />
            <div className="character-info">
              <p className="character-name">{isMet ? npc.name : '???'}</p>
              {isMet && <p className="character-title">{npc.title}</p>}
              <p className="character-desc">
                {isMet ? npc.description : 'Not yet encountered'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ================================================================
   PHONE SETTINGS TAB (abbreviated)
   ================================================================ */

const PhoneSettingsTab: React.FC = () => {
  const masterVolume = useGameStore((s) => s.masterVolume);
  const setMasterVolume = useGameStore((s) => s.setMasterVolume);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const setMusicVolume = useGameStore((s) => s.setMusicVolume);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const setSfxVolume = useGameStore((s) => s.setSfxVolume);
  const qualityPreset = useGameStore((s) => s.qualityPreset);
  const setQualityPreset = useGameStore((s) => s.setQualityPreset);

  return (
    <div style={{ padding: 12 }}>
      <p style={{ fontSize: 11, color: 'var(--ui-accent)', letterSpacing: 2, marginBottom: 14 }}>
        SETTINGS
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="settings-row">
          <span className="settings-label" style={{ fontSize: 12 }}>Master</span>
          <div className="settings-slider-container">
            <input
              type="range"
              className="ui-slider"
              min={0}
              max={100}
              value={Math.round(masterVolume * 100)}
              onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
            />
            <span className="settings-slider-value">{Math.round(masterVolume * 100)}</span>
          </div>
        </div>

        <div className="settings-row">
          <span className="settings-label" style={{ fontSize: 12 }}>Music</span>
          <div className="settings-slider-container">
            <input
              type="range"
              className="ui-slider"
              min={0}
              max={100}
              value={Math.round(musicVolume * 100)}
              onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
            />
            <span className="settings-slider-value">{Math.round(musicVolume * 100)}</span>
          </div>
        </div>

        <div className="settings-row">
          <span className="settings-label" style={{ fontSize: 12 }}>SFX</span>
          <div className="settings-slider-container">
            <input
              type="range"
              className="ui-slider"
              min={0}
              max={100}
              value={Math.round(sfxVolume * 100)}
              onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
            />
            <span className="settings-slider-value">{Math.round(sfxVolume * 100)}</span>
          </div>
        </div>

        <div className="settings-row">
          <span className="settings-label" style={{ fontSize: 12 }}>Quality</span>
          <select
            className="ui-select"
            value={qualityPreset}
            onChange={(e) => setQualityPreset(e.target.value as QualityPreset)}
          >
            <option value="ultra">Ultra</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="very-low">Very Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   TAB CONTENT ROUTER
   ================================================================ */

const TabContent: React.FC<{ tab: PhoneTab }> = ({ tab }) => {
  switch (tab) {
    case 'map':
      return <MapTab />;
    case 'quests':
      return <QuestsTab />;
    case 'inventory':
      return <InventoryTab />;
    case 'characters':
      return <CharactersTab />;
    case 'settings':
      return <PhoneSettingsTab />;
    default:
      return null;
  }
};

/* ================================================================
   MAIN — VirtualPhone
   ================================================================ */

export const VirtualPhone: React.FC = () => {
  const isPhoneOpen = useGameStore((s) => s.isPhoneOpen);
  const setPhone = useGameStore((s) => s.setPhone);
  const activePhoneTab = useGameStore((s) => s.activePhoneTab);
  const setPhoneTab = useGameStore((s) => s.setPhoneTab);

  const handleClose = useCallback(() => {
    setPhone(false);
  }, [setPhone]);

  // P key to toggle phone
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        const state = useGameStore.getState();
        if (state.isDialogueOpen || state.isMainMenuOpen) return;
        state.setPhone(!state.isPhoneOpen);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!isPhoneOpen) return null;

  return (
    <div className="phone-overlay" onClick={handleClose}>
      <div className="phone scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Notch */}
        <div className="phone-notch" />

        {/* Screen */}
        <div className="phone-screen scanlines">
          <TabContent tab={activePhoneTab} />
        </div>

        {/* Tab bar */}
        <div className="phone-tabs">
          {TABS.map((t) => (
            <div
              key={t.key}
              className={`phone-tab${activePhoneTab === t.key ? ' active' : ''}`}
              onClick={() => setPhoneTab(t.key)}
              role="tab"
              aria-selected={activePhoneTab === t.key}
              aria-label={t.key}
            >
              {t.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
