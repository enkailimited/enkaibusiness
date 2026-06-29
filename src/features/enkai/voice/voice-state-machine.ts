export enum VoiceState {
  SLEEPING = "SLEEPING",
  WAKE_DETECTED = "WAKE_DETECTED",
  LISTENING = "LISTENING",
  UNDERSTANDING = "UNDERSTANDING",
  EXECUTING = "EXECUTING",
  RESPONDING = "RESPONDING",
}

export type VoiceStateTransition =
  | { from: VoiceState.SLEEPING; to: VoiceState.WAKE_DETECTED; reason: "wake_word_detected" }
  | { from: VoiceState.SLEEPING; to: VoiceState.SLEEPING; reason: "sleep" }
  | { from: VoiceState.WAKE_DETECTED; to: VoiceState.LISTENING; reason: "start_listening" }
  | { from: VoiceState.WAKE_DETECTED; to: VoiceState.UNDERSTANDING; reason: "speech_detected" }
  | { from: VoiceState.WAKE_DETECTED; to: VoiceState.SLEEPING; reason: "false_wake" }
  | { from: VoiceState.LISTENING; to: VoiceState.UNDERSTANDING; reason: "speech_detected" }
  | { from: VoiceState.LISTENING; to: VoiceState.RESPONDING; reason: "action_complete" }
  | { from: VoiceState.LISTENING; to: VoiceState.SLEEPING; reason: "timeout" }
  | { from: VoiceState.LISTENING; to: VoiceState.WAKE_DETECTED; reason: "wake_during_listen" }
  | { from: VoiceState.UNDERSTANDING; to: VoiceState.EXECUTING; reason: "intent_resolved" }
  | { from: VoiceState.UNDERSTANDING; to: VoiceState.LISTENING; reason: "need_more_info" }
  | { from: VoiceState.UNDERSTANDING; to: VoiceState.SLEEPING; reason: "no_intent" }
  | { from: VoiceState.UNDERSTANDING; to: VoiceState.RESPONDING; reason: "action_complete" }
  | { from: VoiceState.EXECUTING; to: VoiceState.RESPONDING; reason: "action_complete" }
  | { from: VoiceState.EXECUTING; to: VoiceState.SLEEPING; reason: "action_failed" }
  | { from: VoiceState.RESPONDING; to: VoiceState.SLEEPING; reason: "response_complete" }
  | { from: VoiceState.RESPONDING; to: VoiceState.LISTENING; reason: "follow_up_needed" }
  | { from: VoiceState.RESPONDING; to: VoiceState.SLEEPING; reason: "response_complete_standby" };

export class VoiceStateMachine {
  private _state: VoiceState = VoiceState.SLEEPING;
  private _lastTransition: VoiceStateTransition | null = null;
  private _transitionTime: number = Date.now();
  private _listeners: Array<(state: VoiceState, transition: VoiceStateTransition) => void> = [];

  get state(): VoiceState {
    return this._state;
  }

  get lastTransition(): VoiceStateTransition | null {
    return this._lastTransition;
  }

  get isAwake(): boolean {
    return this._state !== VoiceState.SLEEPING;
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

  transition(transition: VoiceStateTransition): boolean {
    if (this._state !== transition.from) {
      console.warn(`[Firdaus VoiceSM] Invalid transition: ${transition.from} → ${transition.to} (current: ${this._state})`);
      return false;
    }

    const prev = this._state;
    this._state = transition.to;
    this._lastTransition = transition;
    this._transitionTime = Date.now();

    console.log(
      `[Firdaus VoiceSM] ${prev} → ${transition.to} (${transition.reason})`
    );

    for (const listener of this._listeners) {
      listener(this._state, transition);
    }

    return true;
  }

  canTransitionTo(target: VoiceState): boolean {
    const validTransitions: Record<VoiceState, VoiceState[]> = {
      [VoiceState.SLEEPING]: [VoiceState.WAKE_DETECTED],
      [VoiceState.WAKE_DETECTED]: [VoiceState.LISTENING, VoiceState.UNDERSTANDING, VoiceState.SLEEPING],
      [VoiceState.LISTENING]: [VoiceState.UNDERSTANDING, VoiceState.RESPONDING, VoiceState.SLEEPING, VoiceState.WAKE_DETECTED],
      [VoiceState.UNDERSTANDING]: [VoiceState.EXECUTING, VoiceState.RESPONDING, VoiceState.LISTENING, VoiceState.SLEEPING],
      [VoiceState.EXECUTING]: [VoiceState.RESPONDING, VoiceState.SLEEPING],
      [VoiceState.RESPONDING]: [VoiceState.SLEEPING, VoiceState.LISTENING],
    };

    return validTransitions[this._state]?.includes(target) ?? false;
  }

  onTransition(listener: (state: VoiceState, transition: VoiceStateTransition) => void): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }

  reset(): void {
    this._state = VoiceState.SLEEPING;
    this._lastTransition = null;
    this._transitionTime = Date.now();
  }

  getStateDuration(): number {
    return Date.now() - this._transitionTime;
  }
}

export const voiceStateMachine = new VoiceStateMachine();
