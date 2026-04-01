import type { PhonemeConfig } from '@shared/types';

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

// Pitch multipliers for vowels relative to base pitch
const VOWEL_PITCH: Record<string, number> = {
  a: 1.0,
  e: 1.15,
  i: 1.3,
  o: 0.9,
  u: 0.8,
};

let audioContext: AudioContext | null = null;
let currentAbortController: AbortController | null = null;
let speaking = false;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

async function ensureContextResumed(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      console.warn('[PhonemeEngine] AudioContext could not be resumed. User interaction may be required.');
    }
  }
}

function playPhoneme(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  startTime: number
): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);

  // Gain envelope: quick attack, sustain, short decay
  const attackTime = Math.min(0.01, duration / 1000 * 0.1);
  const decayTime = Math.min(0.02, duration / 1000 * 0.2);
  const durationSec = duration / 1000;

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.3, startTime + attackTime);
  gainNode.gain.setValueAtTime(0.3, startTime + durationSec - decayTime);
  gainNode.gain.linearRampToValueAtTime(0, startTime + durationSec);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + durationSec);
}

function playDescendingTone(
  ctx: AudioContext,
  baseFrequency: number,
  duration: number,
  startTime: number
): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(baseFrequency, startTime);
  oscillator.frequency.linearRampToValueAtTime(
    baseFrequency * 0.6,
    startTime + duration / 1000
  );

  const durationSec = duration / 1000;
  gainNode.gain.setValueAtTime(0.3, startTime);
  gainNode.gain.linearRampToValueAtTime(0, startTime + durationSec);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + durationSec);
}

function playAscendingTone(
  ctx: AudioContext,
  baseFrequency: number,
  duration: number,
  startTime: number
): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(baseFrequency, startTime);
  oscillator.frequency.linearRampToValueAtTime(
    baseFrequency * 1.5,
    startTime + duration / 1000
  );

  const durationSec = duration / 1000;
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.35, startTime + durationSec * 0.5);
  gainNode.gain.linearRampToValueAtTime(0, startTime + durationSec);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + durationSec);
}

function playSharpTone(
  ctx: AudioContext,
  baseFrequency: number,
  duration: number,
  startTime: number
): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(baseFrequency * 1.8, startTime);

  const durationSec = duration / 1000;
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.005);
  gainNode.gain.linearRampToValueAtTime(0, startTime + durationSec);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + durationSec);
}

function getPitchVariation(config: PhonemeConfig): number {
  return (Math.random() * 2 - 1) * config.pitchVariation * config.pitch;
}

export async function speakText(
  text: string,
  config: PhonemeConfig
): Promise<void> {
  // Stop any ongoing speech
  stopSpeaking();

  await ensureContextResumed();
  const ctx = getAudioContext();

  const abortController = new AbortController();
  currentAbortController = abortController;
  speaking = true;

  const lowerText = text.toLowerCase();
  let currentTime = ctx.currentTime + 0.05; // Small offset to avoid scheduling in the past

  // Track if we're at the end for question mark detection
  // We process all characters and schedule them, then await completion
  const scheduledEndTime = computeAndSchedule(
    ctx,
    lowerText,
    config,
    currentTime,
    abortController
  );

  // Wait for all phonemes to finish, or until aborted
  const waitDuration = (scheduledEndTime - ctx.currentTime) * 1000;

  if (waitDuration > 0) {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        resolve();
      }, waitDuration);

      // If aborted, resolve early
      abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  // Only clear state if this is still the active session
  if (currentAbortController === abortController) {
    speaking = false;
    currentAbortController = null;
  }
}

function computeAndSchedule(
  ctx: AudioContext,
  text: string,
  config: PhonemeConfig,
  startTime: number,
  abortController: AbortController
): number {
  let currentTime = startTime;
  const speedFactor = config.speed / 1000; // Convert ms per char to seconds

  for (let i = 0; i < text.length; i++) {
    if (abortController.signal.aborted) break;

    const char = text[i];

    if (char === ' ') {
      // Short silence
      currentTime += 0.05;
      continue;
    }

    if (char === '.') {
      // Descending pitch + longer pause
      const freq = config.pitch + getPitchVariation(config);
      playDescendingTone(ctx, freq, 80, currentTime);
      currentTime += 0.08 + 0.15; // tone + pause
      continue;
    }

    if (char === '?') {
      // Ascending pitch at end
      const freq = config.pitch + getPitchVariation(config);
      playAscendingTone(ctx, freq, 100, currentTime);
      currentTime += 0.1 + 0.1;
      continue;
    }

    if (char === '!') {
      // Sharp high tone
      const freq = config.pitch + getPitchVariation(config);
      playSharpTone(ctx, freq, 60, currentTime);
      currentTime += 0.06 + 0.1;
      continue;
    }

    if (char === ',') {
      // Medium pause
      currentTime += 0.08;
      continue;
    }

    // Skip non-alphabetic characters
    if (char < 'a' || char > 'z') {
      currentTime += speedFactor * 0.5;
      continue;
    }

    const variation = getPitchVariation(config);

    if (VOWELS.has(char)) {
      // Vowels: longer tone, higher pitch
      const pitchMul = VOWEL_PITCH[char] ?? 1.0;
      const freq = config.pitch * pitchMul + variation;
      const duration = config.vowelDuration;
      playPhoneme(ctx, Math.max(freq, 50), duration, currentTime);
      currentTime += duration / 1000;
    } else {
      // Consonants: shorter tone, lower pitch
      const freq = config.pitch * 0.7 + variation;
      const duration = config.consonantDuration;
      playPhoneme(ctx, Math.max(freq, 50), duration, currentTime);
      currentTime += duration / 1000;
    }
  }

  return currentTime;
}

export function stopSpeaking(): void {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  speaking = false;

  // Close and recreate context to immediately silence all scheduled tones
  if (audioContext) {
    audioContext.close().catch(() => {
      // Ignore close errors
    });
    audioContext = null;
  }
}

export function isSpeaking(): boolean {
  return speaking;
}
