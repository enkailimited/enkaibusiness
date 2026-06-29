export enum VoiceState {
  BOOTING = "BOOTING",
  INITIALIZING = "INITIALIZING",
  READY = "READY",
  SLEEPING = "SLEEPING",
  WAKE_DETECTED = "WAKE_DETECTED",
  LISTENING = "LISTENING",
  UNDERSTANDING = "UNDERSTANDING",
  EXECUTING = "EXECUTING",
  RESPONDING = "RESPONDING",
  ERROR = "ERROR",
  DISCONNECTED = "DISCONNECTED",
  SUSPENDED = "SUSPENDED",
}

export function isStandby(state: VoiceState): boolean {
  return state === VoiceState.READY || state === VoiceState.SUSPENDED;
}

export function isActive(state: VoiceState): boolean {
  return state !== VoiceState.BOOTING
    && state !== VoiceState.INITIALIZING
    && state !== VoiceState.ERROR
    && state !== VoiceState.DISCONNECTED
    && state !== VoiceState.SUSPENDED;
}

export function getStatusLabel(state: VoiceState): string {
  const labels: Record<VoiceState, string> = {
    [VoiceState.BOOTING]: "Inawasha...",
    [VoiceState.INITIALIZING]: "Inaandaa...",
    [VoiceState.READY]: "Tayari",
    [VoiceState.SLEEPING]: "Imezimwa",
    [VoiceState.WAKE_DETECTED]: "Imeamshwa",
    [VoiceState.LISTENING]: "Inasikiliza...",
    [VoiceState.UNDERSTANDING]: "Inaelewa...",
    [VoiceState.EXECUTING]: "Inafanya...",
    [VoiceState.RESPONDING]: "Inazungumza...",
    [VoiceState.ERROR]: "Hitilafu",
    [VoiceState.DISCONNECTED]: "Imekatika",
    [VoiceState.SUSPENDED]: "Imesitishwa",
  };
  return labels[state];
}

export type VoiceStateTransition =
  | { from: VoiceState.BOOTING; to: VoiceState.INITIALIZING; reason: "start_init" }
  | { from: VoiceState.INITIALIZING; to: VoiceState.READY; reason: "initialized" }
  | { from: VoiceState.INITIALIZING; to: VoiceState.ERROR; reason: "init_failed" }
  | { from: VoiceState.READY; to: VoiceState.WAKE_DETECTED; reason: "wake_word_detected" }
  | { from: VoiceState.READY; to: VoiceState.SUSPENDED; reason: "user_disabled" }
  | { from: VoiceState.READY; to: VoiceState.DISCONNECTED; reason: "mic_disconnected" }
  | { from: VoiceState.SLEEPING; to: VoiceState.WAKE_DETECTED; reason: "wake_word_detected" }
  | { from: VoiceState.SLEEPING; to: VoiceState.READY; reason: "user_woke" }
  | { from: VoiceState.SLEEPING; to: VoiceState.SLEEPING; reason: "sleep" }
  | { from: VoiceState.WAKE_DETECTED; to: VoiceState.LISTENING; reason: "start_listening" }
  | { from: VoiceState.WAKE_DETECTED; to: VoiceState.UNDERSTANDING; reason: "speech_detected" }
  | { from: VoiceState.WAKE_DETECTED; to: VoiceState.READY; reason: "false_wake" }
  | { from: VoiceState.LISTENING; to: VoiceState.UNDERSTANDING; reason: "speech_detected" }
  | { from: VoiceState.LISTENING; to: VoiceState.READY; reason: "timeout" }
  | { from: VoiceState.LISTENING; to: VoiceState.WAKE_DETECTED; reason: "wake_during_listen" }
  | { from: VoiceState.UNDERSTANDING; to: VoiceState.EXECUTING; reason: "intent_resolved" }
  | { from: VoiceState.UNDERSTANDING; to: VoiceState.LISTENING; reason: "need_more_info" }
  | { from: VoiceState.UNDERSTANDING; to: VoiceState.READY; reason: "no_intent" }
  | { from: VoiceState.UNDERSTANDING; to: VoiceState.RESPONDING; reason: "action_complete" }
  | { from: VoiceState.EXECUTING; to: VoiceState.RESPONDING; reason: "action_complete" }
  | { from: VoiceState.EXECUTING; to: VoiceState.READY; reason: "action_failed" }
  | { from: VoiceState.RESPONDING; to: VoiceState.READY; reason: "response_complete" }
  | { from: VoiceState.RESPONDING; to: VoiceState.LISTENING; reason: "follow_up_needed" }
  | { from: VoiceState.RESPONDING; to: VoiceState.SLEEPING; reason: "user_slept" }
  | { from: VoiceState.ERROR; to: VoiceState.INITIALIZING; reason: "recover" }
  | { from: VoiceState.DISCONNECTED; to: VoiceState.INITIALIZING; reason: "reconnect" }
  | { from: VoiceState.SUSPENDED; to: VoiceState.READY; reason: "user_enabled" };

const TRANSITION_MAP: Record<VoiceState, Record<string, VoiceState>> = {
  [VoiceState.BOOTING]: { start_init: VoiceState.INITIALIZING },
  [VoiceState.INITIALIZING]: { initialized: VoiceState.READY, init_failed: VoiceState.ERROR },
  [VoiceState.READY]: { wake_word_detected: VoiceState.WAKE_DETECTED, user_disabled: VoiceState.SUSPENDED, mic_disconnected: VoiceState.DISCONNECTED },
  [VoiceState.SLEEPING]: { wake_word_detected: VoiceState.WAKE_DETECTED, user_woke: VoiceState.READY, sleep: VoiceState.SLEEPING },
  [VoiceState.WAKE_DETECTED]: { start_listening: VoiceState.LISTENING, speech_detected: VoiceState.UNDERSTANDING, false_wake: VoiceState.READY },
  [VoiceState.LISTENING]: { speech_detected: VoiceState.UNDERSTANDING, timeout: VoiceState.READY, wake_during_listen: VoiceState.WAKE_DETECTED },
  [VoiceState.UNDERSTANDING]: { intent_resolved: VoiceState.EXECUTING, need_more_info: VoiceState.LISTENING, no_intent: VoiceState.READY, action_complete: VoiceState.RESPONDING },
  [VoiceState.EXECUTING]: { action_complete: VoiceState.RESPONDING, action_failed: VoiceState.READY },
  [VoiceState.RESPONDING]: { response_complete: VoiceState.READY, follow_up_needed: VoiceState.LISTENING, user_slept: VoiceState.SLEEPING },
  [VoiceState.ERROR]: { recover: VoiceState.INITIALIZING },
  [VoiceState.DISCONNECTED]: { reconnect: VoiceState.INITIALIZING },
  [VoiceState.SUSPENDED]: { user_enabled: VoiceState.READY },
};

let globalInstance: VoiceStateMachine | null = null;

export class VoiceStateMachine {
  private _state: VoiceState = VoiceState.BOOTING;
  private _lastTransition: VoiceStateTransition | null = null;
  private _transitionTime: number = Date.now();
  private _listeners: Array<(state: VoiceState, transition: VoiceStateTransition) => void> = [];
  private _sessionId: string;

  constructor(sessionId?: string) {
    this._sessionId = sessionId || "default";
  }

  get state(): VoiceState { return this._state; }
  get lastTransition(): VoiceStateTransition | null { return this._lastTransition; }
  get sessionId(): string { return this._sessionId; }

  get isAwake(): boolean {
    return this._state !== VoiceState.SLEEPING
      && this._state !== VoiceState.SUSPENDED
      && this._state !== VoiceState.ERROR
      && this._state !== VoiceState.DISCONNECTED;
  }

  get isListening(): boolean {
    return this._state === VoiceState.LISTENING || this._state === VoiceState.WAKE_DETECTED;
  }

  get isProcessing(): boolean {
    return this._state === VoiceState.UNDERSTANDING || this._state === VoiceState.EXECUTING;
  }

  get isResponding(): boolean {
    return this._state === VoiceState.RESPONDING;
  }

  get isOperational(): boolean {
    return this._state !== VoiceState.ERROR
      && this._state !== VoiceState.DISCONNECTED
      && this._state !== VoiceState.SUSPENDED;
  }

  transition(transition: VoiceStateTransition): boolean {
    const allowed = TRANSITION_MAP[transition.from]?.[transition.reason];
    if (this._state !== transition.from) {
      console.warn(
        `[Firdaus VoiceSM] Invalid from: expected ${transition.from}, current ${this._state}`
      );
      return false;
    }
    if (allowed !== transition.to) {
      console.warn(
        `[Firdaus VoiceSM] Invalid transition for reason: ${transition.reason} (expected ${allowed}, got ${transition.to})`
      );
      return false;
    }

    const prev = this._state;
    this._state = transition.to;
    this._lastTransition = transition;
    this._transitionTime = Date.now();

    console.log(`[Firdaus VoiceSM] ${prev} → ${transition.to} (${transition.reason})`);

    for (const listener of this._listeners) {
      listener(this._state, transition);
    }

    return true;
  }

  onTransition(listener: (state: VoiceState, transition: VoiceStateTransition) => void): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }

  reset(): void {
    this._state = VoiceState.BOOTING;
    this._lastTransition = null;
    this._transitionTime = Date.now();
  }

  getStateDuration(): number {
    return Date.now() - this._transitionTime;
  }
}

export function getVoiceStateMachine(sessionId?: string): VoiceStateMachine {
  if (!globalInstance || (sessionId && globalInstance.sessionId !== sessionId)) {
    globalInstance = new VoiceStateMachine(sessionId);
  }
  return globalInstance;
}
