import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '@shared/store/useGameStore';
import { EventBus } from '@shared/events/EventBus';
import { DIALOGUE_TREES } from '@data/dialogues.data';
import type { DialogueNode, DialogueTree } from '@shared/types';

/* ============================================================
   DialogueBox — NPC conversation interface
   Bottom of screen, full width, ~25% height.
   Typewriter text, response selection, action execution.
   ============================================================ */

const CHAR_DELAY_MS = 30;

// Simple color map for NPC names
const NPC_COLORS: Record<string, string> = {
  rusty: '#E8A44A',
  bolt: '#5DADE2',
  gizmo: '#58D68D',
  default: '#E8D5B7',
};

function getNpcColor(npcId: string): string {
  return NPC_COLORS[npcId.toLowerCase()] ?? NPC_COLORS.default;
}

export const DialogueBox: React.FC = () => {
  const isDialogueOpen = useGameStore((s) => s.isDialogueOpen);
  const setDialogue = useGameStore((s) => s.setDialogue);
  const addCoins = useGameStore((s) => s.addCoins);
  const addItem = useGameStore((s) => s.addItem);
  const setActiveDialogueNpc = useGameStore((s) => s.setActiveDialogueNpc);

  // Local dialogue state
  const [currentTree, setCurrentTree] = useState<DialogueTree | null>(null);
  const [currentNode, setCurrentNode] = useState<DialogueNode | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visible, setVisible] = useState(false);

  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullTextRef = useRef('');
  const charIndexRef = useRef(0);

  // -- Clear typewriter --
  const clearTypewriter = useCallback(() => {
    if (typewriterRef.current !== null) {
      clearTimeout(typewriterRef.current);
      typewriterRef.current = null;
    }
  }, []);

  // -- Start typewriter for a node --
  const startTypewriter = useCallback(
    (text: string) => {
      clearTypewriter();
      fullTextRef.current = text;
      charIndexRef.current = 0;
      setDisplayedText('');
      setIsTyping(true);

      const tick = () => {
        charIndexRef.current += 1;
        const nextText = fullTextRef.current.slice(0, charIndexRef.current);
        setDisplayedText(nextText);

        if (charIndexRef.current < fullTextRef.current.length) {
          typewriterRef.current = setTimeout(tick, CHAR_DELAY_MS);
        } else {
          setIsTyping(false);
        }
      };

      typewriterRef.current = setTimeout(tick, CHAR_DELAY_MS);
    },
    [clearTypewriter],
  );

  // -- Skip to full text --
  const skipTypewriter = useCallback(() => {
    clearTypewriter();
    setDisplayedText(fullTextRef.current);
    setIsTyping(false);
  }, [clearTypewriter]);

  // -- Execute dialogue action --
  const executeAction = useCallback(
    (action: DialogueNode['action']) => {
      if (!action) return;
      const { type, payload } = action;

      switch (type) {
        case 'give_coins': {
          const amount = (payload as { amount?: number }).amount ?? 0;
          addCoins(amount);
          break;
        }
        case 'give_item': {
          const item = payload as { id: string; name: string; icon: string; quantity: number; type: 'collectible' | 'key_item' | 'accessory' | 'currency' };
          addItem(item);
          break;
        }
        case 'start_quest': {
          const questId = (payload as { questId?: string }).questId;
          if (questId) {
            EventBus.emit({ type: 'QUEST_STARTED', questId });
          }
          break;
        }
        default: {
          // Emit a generic event for other action types
          // These can be caught by relevant systems
          break;
        }
      }
    },
    [addCoins, addItem],
  );

  // -- Navigate to a node --
  const goToNode = useCallback(
    (nodeId: string) => {
      if (!currentTree) return;
      const node = currentTree.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      setCurrentNode(node);
      startTypewriter(node.text);
    },
    [currentTree, startTypewriter],
  );

  // -- Close dialogue --
  const closeDialogue = useCallback(() => {
    clearTypewriter();
    setVisible(false);
    // Allow slide-down animation before removing
    setTimeout(() => {
      const npcId = currentTree?.npcId;
      setCurrentTree(null);
      setCurrentNode(null);
      setDisplayedText('');
      setIsTyping(false);
      setDialogue(false);
      setActiveDialogueNpc(null);
      if (npcId) {
        EventBus.emit({ type: 'NPC_DIALOGUE_ENDED', npcId });
      }
    }, 250);
  }, [clearTypewriter, currentTree, setDialogue, setActiveDialogueNpc]);

  // -- Handle continue / advance --
  const handleContinue = useCallback(() => {
    if (!currentNode) return;

    if (isTyping) {
      skipTypewriter();
      return;
    }

    // Execute action on the current node if any
    if (currentNode.action) {
      executeAction(currentNode.action);
    }

    // If there are responses, user must pick one (don't auto-advance)
    if (currentNode.responses && currentNode.responses.length > 0) {
      return;
    }

    // If there's a next node, go to it
    if (currentNode.nextNodeId) {
      goToNode(currentNode.nextNodeId);
      return;
    }

    // Dialogue is finished
    closeDialogue();
  }, [currentNode, isTyping, skipTypewriter, executeAction, goToNode, closeDialogue]);

  // -- Select a response --
  const selectResponse = useCallback(
    (nextNodeId: string) => {
      if (isTyping) return;

      // Execute action on the current node before navigating
      if (currentNode?.action) {
        executeAction(currentNode.action);
      }

      goToNode(nextNodeId);
    },
    [isTyping, currentNode, executeAction, goToNode],
  );

  // -- Listen for dialogue events --
  useEffect(() => {
    const unsubStart = EventBus.on('NPC_DIALOGUE_STARTED', (event) => {
      const tree = DIALOGUE_TREES.find((t) => t.id === event.dialogueId || t.npcId === event.npcId);
      if (!tree) return;

      setCurrentTree(tree);
      setActiveDialogueNpc(event.npcId);
      setDialogue(true);
      setVisible(true);

      const startNode = tree.nodes.find((n) => n.id === tree.startNodeId);
      if (startNode) {
        setCurrentNode(startNode);
        // Slight delay so slide-up plays before text starts
        setTimeout(() => {
          fullTextRef.current = startNode.text;
          charIndexRef.current = 0;
          setDisplayedText('');
          setIsTyping(true);

          const tick = () => {
            charIndexRef.current += 1;
            const nextText = fullTextRef.current.slice(0, charIndexRef.current);
            setDisplayedText(nextText);
            if (charIndexRef.current < fullTextRef.current.length) {
              typewriterRef.current = setTimeout(tick, CHAR_DELAY_MS);
            } else {
              setIsTyping(false);
            }
          };
          typewriterRef.current = setTimeout(tick, CHAR_DELAY_MS);
        }, 100);
      }
    });

    const unsubEnd = EventBus.on('NPC_DIALOGUE_ENDED', () => {
      clearTypewriter();
      setVisible(false);
      setCurrentTree(null);
      setCurrentNode(null);
      setDisplayedText('');
      setIsTyping(false);
    });

    return () => {
      unsubStart();
      unsubEnd();
    };
  }, [setDialogue, setActiveDialogueNpc, clearTypewriter]);

  // -- Keyboard controls --
  useEffect(() => {
    if (!isDialogueOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        e.preventDefault();
        handleContinue();
      }

      // Number keys for response selection
      if (currentNode?.responses && !isTyping) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= currentNode.responses.length) {
          selectResponse(currentNode.responses[num - 1].nextNodeId);
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDialogueOpen, handleContinue, currentNode, isTyping, selectResponse]);

  // -- Cleanup typewriter on unmount --
  useEffect(() => {
    return () => clearTypewriter();
  }, [clearTypewriter]);

  if (!isDialogueOpen || !currentNode) return null;

  const npcColor = currentTree ? getNpcColor(currentTree.npcId) : '#E8D5B7';
  const showResponses = !isTyping && currentNode.responses && currentNode.responses.length > 0;
  const showContinue = !isTyping && !showResponses;
  const isEnd = !currentNode.nextNodeId && !currentNode.responses?.length;

  return (
    <div
      className={visible ? 'slide-up' : ''}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '25%',
        minHeight: 180,
        maxHeight: 280,
        background: 'rgba(26, 22, 18, 0.92)',
        borderTop: '2px solid #4A3F32',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        fontFamily: "'Courier New', Courier, monospace",
        zIndex: 150,
        pointerEvents: 'auto',
      }}
      onClick={handleContinue}
    >
      {/* ---- Left: NPC Portrait ---- */}
      <div
        style={{
          width: 140,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          borderRight: '1px solid #4A3F32',
        }}
      >
        {/* Simple CSS robot face */}
        <div
          style={{
            width: 64,
            height: 64,
            background: '#2A241E',
            borderRadius: 8,
            border: `2px solid ${npcColor}`,
            position: 'relative',
            marginBottom: 10,
          }}
        >
          {/* Eyes */}
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 15,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: npcColor,
              boxShadow: `0 0 6px ${npcColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 18,
              right: 15,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: npcColor,
              boxShadow: `0 0 6px ${npcColor}`,
            }}
          />
          {/* Mouth */}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 20,
              height: 2,
              background: npcColor,
              borderRadius: 1,
              opacity: 0.7,
            }}
          />
        </div>

        {/* NPC name */}
        <div
          style={{
            color: npcColor,
            fontWeight: 'bold',
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            textAlign: 'center',
          }}
        >
          {currentNode.speaker}
        </div>

        {/* Emotion tag */}
        {currentNode.emotion && (
          <div
            style={{
              color: '#6D6359',
              fontSize: 10,
              marginTop: 3,
              fontStyle: 'italic',
            }}
          >
            [{currentNode.emotion}]
          </div>
        )}
      </div>

      {/* ---- Right: Dialogue Content ---- */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px 16px',
          overflow: 'hidden',
        }}
      >
        {/* Dialogue text */}
        <div
          style={{
            flex: 1,
            fontSize: 14,
            lineHeight: 1.7,
            color: '#E8D5B7',
            overflow: 'hidden',
          }}
        >
          <span>{displayedText}</span>
          {isTyping && (
            <span
              style={{
                color: '#D4940A',
                marginLeft: 1,
                animation: 'dw-blink 0.7s step-end infinite',
              }}
            >
              |
            </span>
          )}
        </div>

        {/* Response options */}
        {showResponses && (
          <div
            className="fade-in"
            style={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {currentNode.responses!.map((response, idx) => (
              <div
                key={response.nextNodeId}
                className="dialogue-response"
                onClick={(e) => {
                  e.stopPropagation();
                  selectResponse(response.nextNodeId);
                }}
                style={{
                  fontSize: 13,
                  color: '#D4C4A8',
                }}
              >
                <span
                  style={{
                    color: '#D4940A',
                    marginRight: 8,
                    fontWeight: 'bold',
                  }}
                >
                  {idx + 1}.
                </span>
                {response.text}
              </div>
            ))}
          </div>
        )}

        {/* Continue prompt */}
        {showContinue && (
          <div
            className="fade-in"
            style={{
              marginTop: 8,
              fontSize: 12,
              color: '#D4940A',
              opacity: 0.8,
            }}
          >
            {isEnd ? (
              <span>&#9656; Press <span className="key" style={{ margin: '0 4px' }}>E</span> to close</span>
            ) : (
              <span>&#9656; Press <span className="key" style={{ margin: '0 4px' }}>E</span> to continue</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
