export type MeditationTool = {
  id: string;
  nervous_system_direction: string;
  description: string;
  preferred_music_styles: string[];
  tempo_range_bpm: [number, number];
  texture_density: string;
};

export type EmotionalState = {
  v: number;
  a: number;
  b: number;
  t: number;
  d: number;
  m: number;
};

export type MusicTrackParameters = {
  feeling: string;
  key: string;
  mode: string;
  tempo_bpm: number;
  duration_4bar_ms: number;
  emotional_state: EmotionalState;
};

export const FEELINGS: Record<string, { base_mode: string; progression: string[]; region: Record<keyof EmotionalState, [number, number]> }> = {
  dark: { region: { v: [-0.7, -0.3], a: [0.1, 0.3], b: [0, 0.3], t: [0.4, 0.8], d: [0.2, 0.4], m: [0.1, 0.3] }, progression: ["i", "VI", "III", "VII"], base_mode: "Aeolian" },
  sad: { region: { v: [-0.9, -0.5], a: [0.1, 0.3], b: [0.1, 0.3], t: [0.3, 0.6], d: [0.25, 0.45], m: [0.05, 0.2] }, progression: ["i", "iv", "v", "i"], base_mode: "Aeolian" },
  despair: { region: { v: [-1, -0.7], a: [0.05, 0.2], b: [0, 0.2], t: [0.7, 1], d: [0.15, 0.35], m: [0.05, 0.15] }, progression: ["i", "bII", "i", "v"], base_mode: "Phrygian" },
  dreamy: { region: { v: [0.1, 0.4], a: [0.05, 0.25], b: [0.7, 1], t: [0.05, 0.25], d: [0.25, 0.45], m: [0.05, 0.2] }, progression: ["I", "IV", "ii", "I"], base_mode: "Lydian" },
  hopeful: { region: { v: [0.3, 0.7], a: [0.2, 0.5], b: [0.6, 0.9], t: [0.1, 0.4], d: [0.3, 0.6], m: [0.2, 0.5] }, progression: ["I", "V", "vi", "IV"], base_mode: "Ionian" },
  romantic: { region: { v: [0.2, 0.5], a: [0.15, 0.35], b: [0.4, 0.65], t: [0.15, 0.35], d: [0.3, 0.6], m: [0.15, 0.35] }, progression: ["I", "vi", "IV", "V"], base_mode: "Ionian" },
  tribal: { region: { v: [-0.1, 0.2], a: [0.6, 1], b: [0.2, 0.4], t: [0.4, 0.7], d: [0.6, 0.9], m: [0.7, 1] }, progression: ["i", "i", "VII", "i"], base_mode: "Dorian" },
  jazzy: { region: { v: [0, 0.4], a: [0.4, 0.7], b: [0.4, 0.7], t: [0.5, 0.8], d: [0.3, 0.6], m: [0.4, 0.7] }, progression: ["ii7", "V7", "Imaj7", "VI7"], base_mode: "Mixolydian" },
  stable: { region: { v: [-0.1, 0.1], a: [0.05, 0.2], b: [0.3, 0.5], t: [0, 0.2], d: [0.15, 0.35], m: [0.05, 0.15] }, progression: ["I", "I", "IV", "I"], base_mode: "Ionian" },
  unstable: { region: { v: [-0.3, 0], a: [0.3, 0.6], b: [0.25, 0.45], t: [0.7, 1], d: [0.25, 0.45], m: [0.5, 0.8] }, progression: ["i", "bII", "V", "i"], base_mode: "Phrygian" },
  nostalgic: { region: { v: [-0.5, -0.2], a: [0.1, 0.3], b: [0.25, 0.45], t: [0.2, 0.4], d: [0.25, 0.45], m: [0.1, 0.3] }, progression: ["I", "vi", "ii", "V"], base_mode: "Ionian" },
  grounded: { region: { v: [-0.05, 0.25], a: [0.05, 0.25], b: [0.15, 0.35], t: [0.05, 0.25], d: [0.2, 0.4], m: [0.05, 0.2] }, progression: ["i", "i", "IV", "i"], base_mode: "Dorian" },
  safe: { region: { v: [0.1, 0.5], a: [0.05, 0.2], b: [0.3, 0.6], t: [0, 0.1], d: [0.15, 0.35], m: [0, 0.1] }, progression: ["I", "I", "IV", "I"], base_mode: "Ionian" },
  calm: { region: { v: [0.1, 0.4], a: [0.02, 0.15], b: [0.4, 0.7], t: [0, 0.1], d: [0.1, 0.3], m: [0, 0.1] }, progression: ["I", "IV", "I", "V"], base_mode: "Ionian" },
  flowing: { region: { v: [0.1, 0.4], a: [0.2, 0.4], b: [0.5, 0.8], t: [0.1, 0.3], d: [0.3, 0.5], m: [0.3, 0.6] }, progression: ["I", "V", "ii", "IV"], base_mode: "Ionian" },
  balanced: { region: { v: [0, 0.3], a: [0.15, 0.35], b: [0.4, 0.6], t: [0.1, 0.3], d: [0.25, 0.45], m: [0.2, 0.4] }, progression: ["I", "vi", "IV", "V"], base_mode: "Ionian" },
  introspective: { region: { v: [-0.3, 0.1], a: [0.1, 0.3], b: [0.2, 0.5], t: [0.2, 0.4], d: [0.2, 0.4], m: [0.1, 0.25] }, progression: ["i", "iv", "VI", "i"], base_mode: "Aeolian" },
  meditative: { region: { v: [0, 0.2], a: [0.05, 0.15], b: [0.3, 0.5], t: [0, 0.15], d: [0.1, 0.25], m: [0, 0.1] }, progression: ["i", "i", "i", "i"], base_mode: "Dorian" },
  expansive: { region: { v: [0.2, 0.6], a: [0.2, 0.5], b: [0.7, 1], t: [0.1, 0.3], d: [0.3, 0.6], m: [0.2, 0.4] }, progression: ["I", "II", "V", "I"], base_mode: "Lydian" },
  transcendent: { region: { v: [0.3, 0.7], a: [0.1, 0.3], b: [0.8, 1], t: [0, 0.2], d: [0.2, 0.4], m: [0.05, 0.2] }, progression: ["I", "IV", "I", "I"], base_mode: "Lydian" },
  sleepy: { region: { v: [-0.05, 0.2], a: [0, 0.08], b: [0.15, 0.4], t: [0, 0.05], d: [0.05, 0.2], m: [0, 0.05] }, progression: ["i", "i", "i", "i"], base_mode: "Aeolian" },
  sedated: { region: { v: [-0.1, 0.1], a: [0, 0.05], b: [0.1, 0.3], t: [0, 0.03], d: [0.05, 0.15], m: [0, 0.03] }, progression: ["i", "i", "i", "i"], base_mode: "Aeolian" },
  release: { region: { v: [-0.4, 0], a: [0.3, 0.6], b: [0.2, 0.5], t: [0.4, 0.7], d: [0.3, 0.6], m: [0.3, 0.6] }, progression: ["i", "VI", "III", "VII"], base_mode: "Aeolian" },
};

export const FEELING_BIASES: Record<string, EmotionalState> = {
  dark: { v: -0.6, a: 0.15, b: 0.12, t: 0.65, d: 0.3, m: 0.15 },
  sad: { v: -0.75, a: 0.2, b: 0.18, t: 0.5, d: 0.35, m: 0.12 },
  despair: { v: -0.9, a: 0.15, b: 0.08, t: 0.8, d: 0.25, m: 0.1 },
  dreamy: { v: 0.25, a: 0.15, b: 0.85, t: 0.15, d: 0.35, m: 0.12 },
  hopeful: { v: 0.55, a: 0.35, b: 0.75, t: 0.25, d: 0.45, m: 0.35 },
  romantic: { v: 0.35, a: 0.25, b: 0.52, t: 0.25, d: 0.45, m: 0.25 },
  tribal: { v: 0.05, a: 0.8, b: 0.3, t: 0.55, d: 0.7, m: 0.8 },
  jazzy: { v: 0.2, a: 0.55, b: 0.55, t: 0.6, d: 0.45, m: 0.55 },
  stable: { v: 0, a: 0.1, b: 0.4, t: 0.1, d: 0.25, m: 0.1 },
  unstable: { v: -0.15, a: 0.45, b: 0.35, t: 0.8, d: 0.35, m: 0.65 },
  nostalgic: { v: -0.35, a: 0.2, b: 0.35, t: 0.3, d: 0.35, m: 0.2 },
  grounded: { v: 0.1, a: 0.15, b: 0.25, t: 0.15, d: 0.3, m: 0.1 },
  safe: { v: 0.3, a: 0.1, b: 0.45, t: 0.05, d: 0.25, m: 0.05 },
  calm: { v: 0.2, a: 0.08, b: 0.5, t: 0.05, d: 0.2, m: 0.05 },
  flowing: { v: 0.25, a: 0.3, b: 0.6, t: 0.2, d: 0.4, m: 0.45 },
  balanced: { v: 0.15, a: 0.25, b: 0.5, t: 0.2, d: 0.35, m: 0.3 },
  introspective: { v: -0.1, a: 0.2, b: 0.35, t: 0.25, d: 0.3, m: 0.15 },
  meditative: { v: 0.1, a: 0.1, b: 0.4, t: 0.1, d: 0.2, m: 0.05 },
  expansive: { v: 0.4, a: 0.35, b: 0.8, t: 0.2, d: 0.45, m: 0.3 },
  transcendent: { v: 0.5, a: 0.2, b: 0.9, t: 0.1, d: 0.35, m: 0.1 },
  sleepy: { v: 0.1, a: 0.03, b: 0.3, t: 0.02, d: 0.15, m: 0.02 },
  sedated: { v: 0, a: 0.02, b: 0.2, t: 0.01, d: 0.1, m: 0.01 },
  release: { v: -0.2, a: 0.4, b: 0.35, t: 0.55, d: 0.45, m: 0.35 },
};

const WEIGHTS: Record<keyof EmotionalState, number> = {
  v: 2,
  a: 1.5,
  b: 1,
  t: 2,
  d: 1,
  m: 1,
};

const VALID_BPM = [40, 48, 60, 64, 80, 96, 120];
const LOW_KEYS = ["D", "Eb", "F"];
const MID_KEYS = ["C", "G", "A"];
const HIGH_KEYS = ["D", "E", "B"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toolToState(tool: MeditationTool): EmotionalState {
  let state: EmotionalState;

  switch (tool.nervous_system_direction) {
    case "strong_down":
      state = { v: 0.1, a: 0.05, b: 0.35, t: 0.05, d: 0.15, m: 0.05 };
      break;
    case "down":
      state = { v: 0.2, a: 0.1, b: 0.45, t: 0.1, d: 0.25, m: 0.1 };
      break;
    case "neutral":
      state = { v: 0.1, a: 0.25, b: 0.5, t: 0.2, d: 0.3, m: 0.3 };
      break;
    case "up":
      state = { v: 0.3, a: 0.6, b: 0.6, t: 0.4, d: 0.5, m: 0.6 };
      break;
    case "strong_up":
      state = { v: 0.3, a: 0.75, b: 0.65, t: 0.6, d: 0.6, m: 0.75 };
      break;
    default:
      throw new Error(`Unknown nervous_system_direction: ${tool.nervous_system_direction}`);
  }

  const tempoMid = (tool.tempo_range_bpm[0] + tool.tempo_range_bpm[1]) / 2;
  state.a = clamp(tempoMid / 100, 0, 1);

  const densityMap: Record<string, number> = {
    very_low: 0.1,
    low: 0.25,
    medium: 0.5,
    high: 0.75,
  };

  state.d = densityMap[tool.texture_density] ?? state.d;
  return state;
}

function emotionalDistance(s1: EmotionalState, s2: EmotionalState) {
  return Math.sqrt(
    Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
      const dimension = key as keyof EmotionalState;
      return sum + weight * (s1[dimension] - s2[dimension]) ** 2;
    }, 0),
  );
}

function selectFeeling(target: EmotionalState) {
  let bestName = "";
  let bestScore = Number.POSITIVE_INFINITY;

  for (const [name, bias] of Object.entries(FEELING_BIASES)) {
    const score = emotionalDistance(target, bias);
    if (score < bestScore) {
      bestScore = score;
      bestName = name;
    }
  }

  return bestName;
}

function selectKey(state: EmotionalState) {
  const pool = state.b < 0.3 ? LOW_KEYS : state.b < 0.7 ? MID_KEYS : HIGH_KEYS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function quantizedTempo(targetBpm: number, allowedBpms: number[]) {
  return allowedBpms.reduce((closest, current) =>
    Math.abs(current - targetBpm) < Math.abs(closest - targetBpm) ? current : closest,
  );
}

function suggestQuantizedTempo(state: EmotionalState, tempoRange: [number, number]) {
  const [minBpm, maxBpm] = tempoRange;
  const rawTempo = minBpm + (maxBpm - minBpm) * state.a;
  const candidates = VALID_BPM.filter((bpm) => bpm >= minBpm && bpm <= maxBpm);
  return quantizedTempo(rawTempo, candidates.length > 0 ? candidates : VALID_BPM);
}

function compute4BarDurationMs(bpm: number) {
  if (bpm <= 0) {
    throw new Error("BPM must be positive");
  }

  let duration = 960000 / bpm;
  if (duration < 20000) {
    duration *= 2;
  }

  return duration;
}

export function generateMusicTrackParameters(tool: MeditationTool): MusicTrackParameters {
  const emotionalState = toolToState(tool);
  const feeling = selectFeeling(emotionalState);
  const mode = FEELINGS[feeling]?.base_mode ?? "Ionian";
  const key = selectKey(emotionalState);
  const tempo = suggestQuantizedTempo(emotionalState, tool.tempo_range_bpm);
  const duration = compute4BarDurationMs(tempo);

  return {
    feeling,
    key,
    mode,
    tempo_bpm: tempo,
    duration_4bar_ms: duration,
    emotional_state: emotionalState,
  };
}
