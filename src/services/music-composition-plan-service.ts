import { FEELINGS, FEELING_BIASES, type EmotionalState, type MusicTrackParameters } from "./meditation-music-parameter-service";

export type MusicCompositionSection = {
  section: string;
  instrumental: boolean;
  lines: string[];
  degree: string;
  modeColor: string;
  chord: {
    name: string;
    notes: string[];
  };
  drone: string[];
  bass: string;
  layers: string[];
  percussion: string;
  brightness: number;
  density: number;
  movement: number;
  expression: {
    filterCutoffHz: number;
    noteDensity: number;
    layersCount: number;
    lfoRateHz: number;
    register: string;
  };
  instruments: Record<string, string[]>;
  duration_ms: number;
};

export type MusicCompositionPlan = {
  name: string;
  instrumental_only: boolean;
  loopable: boolean;
  feeling: string;
  key: string;
  bpm: number;
  timeSignature: string;
  harmony: {
    modeBase: string;
    scale: string[];
    progression: string[];
  };
  sections: MusicCompositionSection[];
};

type InstrumentProfile = {
  name: string;
  category: "ambient" | "melodic" | "percussion" | "texture" | "others";
  tags: string[];
  baseWeight: number;
  targets: Partial<Record<keyof EmotionalState, number>>;
  weights: Partial<Record<keyof EmotionalState, number>>;
};

const NOTE_ORDER = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

const MODE_INTERVALS: Record<string, number[]> = {
  Ionian: [0, 2, 4, 5, 7, 9, 11],
  Aeolian: [0, 2, 3, 5, 7, 8, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

const DEGREE_MAP: Record<string, number> = {
  i: 0,
  I: 0,
  II: 1,
  ii: 1,
  III: 2,
  iii: 2,
  IV: 3,
  iv: 3,
  V: 4,
  v: 4,
  VI: 5,
  vi: 5,
  VII: 6,
  vii: 6,
};

const INSTRUMENT_LIBRARY: InstrumentProfile[] = [
  { name: "tanpura", category: "ambient", tags: ["drone", "organic", "warm", "stable", "sustained"], baseWeight: 1.4, targets: { v: -0.2, a: 0.08, b: 0.14, t: 0.45, d: 0.3, m: 0.05 }, weights: { v: 0.8, a: 0.8, b: 0.8, t: 1, d: 0.8, m: 1 } },
  { name: "shruti_box", category: "ambient", tags: ["drone", "supportive", "warm", "stable", "sustained"], baseWeight: 1.35, targets: { v: -0.1, a: 0.08, b: 0.18, t: 0.4, d: 0.32, m: 0.06 }, weights: { v: 0.8, a: 0.8, b: 0.8, t: 1, d: 0.8, m: 1 } },
  { name: "harmonium_drone", category: "ambient", tags: ["drone", "reed", "devotional", "warm", "sustained"], baseWeight: 1.2, targets: { v: -0.05, a: 0.1, b: 0.22, t: 0.35, d: 0.35, m: 0.08 }, weights: { v: 0.7, a: 0.8, b: 0.7, t: 0.8, d: 0.9, m: 1 } },
  { name: "drone_synth", category: "ambient", tags: ["drone", "synthetic", "stable", "wide", "soft"], baseWeight: 1, targets: { v: 0, a: 0.08, b: 0.28, t: 0.35, d: 0.45, m: 0.1 }, weights: { v: 0.6, a: 0.7, b: 0.8, t: 0.8, d: 0.9, m: 0.8 } },
  { name: "string_pad", category: "ambient", tags: ["lush", "wide", "sustained", "emotional", "cinematic"], baseWeight: 1, targets: { v: 0.05, a: 0.1, b: 0.5, t: 0.25, d: 0.55, m: 0.1 }, weights: { v: 0.7, a: 0.7, b: 0.8, t: 0.8, d: 0.8, m: 0.8 } },
  { name: "singing_bowl", category: "ambient", tags: ["resonant", "meditative", "sustained", "bright", "harmonic"], baseWeight: 1.1, targets: { v: 0, a: 0.1, b: 0.72, t: 0.2, d: 0.35, m: 0.08 }, weights: { v: 0.6, a: 0.7, b: 1, t: 0.8, d: 0.8, m: 1 } },
  { name: "bowed_cymbal", category: "ambient", tags: ["shimmer", "ethereal", "sustained", "airy", "wash"], baseWeight: 0.9, targets: { v: 0.1, a: 0.08, b: 0.78, t: 0.15, d: 0.3, m: 0.1 }, weights: { v: 0.5, a: 0.7, b: 1, t: 0.8, d: 0.8, m: 1 } },
  { name: "bansuri", category: "melodic", tags: ["breathy", "airy", "spiritual", "lyrical", "woodwind"], baseWeight: 1.3, targets: { v: 0.25, a: 0.18, b: 0.72, t: 0.2, d: 0.35, m: 0.35 }, weights: { v: 1, a: 0.8, b: 0.8, t: 0.6, d: 0.5, m: 1 } },
  { name: "duduk", category: "melodic", tags: ["breathy", "mournful", "warm", "dark", "meditative"], baseWeight: 1.35, targets: { v: -0.55, a: 0.18, b: 0.15, t: 0.55, d: 0.3, m: 0.2 }, weights: { v: 1, a: 0.8, b: 0.8, t: 0.6, d: 0.6, m: 0.8 } },
  { name: "cello", category: "melodic", tags: ["warm", "low", "lyrical", "emotional", "human"], baseWeight: 1.2, targets: { v: -0.25, a: 0.2, b: 0.25, t: 0.35, d: 0.4, m: 0.25 }, weights: { v: 0.8, a: 0.7, b: 0.7, t: 0.6, d: 0.7, m: 0.8 } },
  { name: "lyre", category: "melodic", tags: ["gentle", "plucked", "ancient", "clear", "lyrical"], baseWeight: 1, targets: { v: 0.2, a: 0.14, b: 0.55, t: 0.2, d: 0.3, m: 0.3 }, weights: { v: 0.8, a: 0.7, b: 0.8, t: 0.6, d: 0.6, m: 1 } },
  { name: "celesta", category: "melodic", tags: ["bell_like", "delicate", "bright", "celestial", "sparkle"], baseWeight: 1.2, targets: { v: 0.6, a: 0.12, b: 0.9, t: 0.1, d: 0.25, m: 0.25 }, weights: { v: 0.7, a: 0.8, b: 1, t: 0.8, d: 0.7, m: 0.8 } },
  { name: "soft_piano", category: "melodic", tags: ["intimate", "reflective", "clear", "soft", "keyboard"], baseWeight: 1, targets: { v: 0.1, a: 0.18, b: 0.45, t: 0.2, d: 0.35, m: 0.3 }, weights: { v: 0.8, a: 0.7, b: 0.7, t: 0.6, d: 0.7, m: 0.9 } },
  { name: "frame_drum", category: "percussion", tags: ["organic", "pulse", "ritual", "earthy", "hand_drum"], baseWeight: 1.15, targets: { v: 0, a: 0.45, b: 0.25, t: 0.5, d: 0.45, m: 0.55 }, weights: { v: 0.4, a: 1, b: 0.3, t: 0.7, d: 0.6, m: 1 } },
  { name: "tabla", category: "percussion", tags: ["articulated", "rhythmic", "tonal", "intricate", "pulse"], baseWeight: 1.25, targets: { v: 0.05, a: 0.65, b: 0.3, t: 0.45, d: 0.55, m: 0.7 }, weights: { v: 0.4, a: 1, b: 0.3, t: 0.6, d: 0.6, m: 1 } },
  { name: "shaker", category: "percussion", tags: ["light", "airy", "motion", "subtle", "small_percussion"], baseWeight: 0.95, targets: { v: 0.1, a: 0.35, b: 0.5, t: 0.2, d: 0.3, m: 0.7 }, weights: { v: 0.3, a: 1, b: 0.5, t: 0.4, d: 0.5, m: 1 } },
  { name: "finger_cymbals", category: "percussion", tags: ["sparkle", "accent", "bright", "delicate", "high"], baseWeight: 0.8, targets: { v: 0.45, a: 0.22, b: 0.85, t: 0.15, d: 0.2, m: 0.3 }, weights: { v: 0.3, a: 0.8, b: 1, t: 0.5, d: 0.3, m: 0.6 } },
  { name: "low_tom", category: "percussion", tags: ["earthy", "grounding", "deep", "pulse", "tribal"], baseWeight: 1, targets: { v: -0.25, a: 0.5, b: 0.1, t: 0.55, d: 0.45, m: 0.6 }, weights: { v: 0.5, a: 1, b: 0.4, t: 0.7, d: 0.5, m: 1 } },
  { name: "wind_chimes", category: "texture", tags: ["sparkle", "airy", "random", "bright", "chance"], baseWeight: 0.9, targets: { v: 0.35, a: 0.12, b: 0.85, t: 0.1, d: 0.2, m: 0.1 }, weights: { v: 0.5, a: 0.8, b: 1, t: 0.8, d: 0.6, m: 0.7 } },
  { name: "granular_air", category: "texture", tags: ["atmospheric", "evolving", "diffuse", "wash", "soft"], baseWeight: 1, targets: { v: 0, a: 0.08, b: 0.6, t: 0.3, d: 0.7, m: 0.4 }, weights: { v: 0.4, a: 0.6, b: 0.8, t: 0.8, d: 1, m: 0.8 } },
  { name: "reverse_swell", category: "texture", tags: ["transition", "tension_release", "motion", "cinematic", "wash"], baseWeight: 0.95, targets: { v: -0.2, a: 0.15, b: 0.35, t: 0.7, d: 0.4, m: 0.45 }, weights: { v: 0.6, a: 0.7, b: 0.7, t: 1, d: 0.6, m: 0.8 } },
  { name: "field_recording", category: "texture", tags: ["nature", "organic", "space", "background", "environment"], baseWeight: 0.75, targets: { v: 0, a: 0.08, b: 0.35, t: 0.2, d: 0.5, m: 0.15 }, weights: { v: 0.4, a: 0.7, b: 0.7, t: 0.5, d: 0.8, m: 0.5 } },
  { name: "noise_bed", category: "texture", tags: ["subtle", "diffuse", "haze", "background", "soft"], baseWeight: 0.7, targets: { v: 0, a: 0.08, b: 0.3, t: 0.4, d: 0.55, m: 0.25 }, weights: { v: 0.4, a: 0.6, b: 0.7, t: 0.8, d: 0.8, m: 0.6 } },
  { name: "sub_drone", category: "others", tags: ["low_end", "support", "stable", "deep", "foundation"], baseWeight: 1.1, targets: { v: -0.3, a: 0.05, b: 0.1, t: 0.35, d: 0.45, m: 0.05 }, weights: { v: 0.8, a: 0.8, b: 0.8, t: 0.8, d: 0.8, m: 1 } },
  { name: "bass_harmonics", category: "others", tags: ["low_end", "resonant", "support", "warm", "foundation"], baseWeight: 0.95, targets: { v: -0.15, a: 0.08, b: 0.25, t: 0.25, d: 0.4, m: 0.1 }, weights: { v: 0.7, a: 0.7, b: 0.7, t: 0.8, d: 0.8, m: 0.8 } },
  { name: "vocal_pad", category: "others", tags: ["human", "devotional", "sustained", "soft", "choir_like"], baseWeight: 0.85, targets: { v: 0.15, a: 0.12, b: 0.45, t: 0.15, d: 0.45, m: 0.2 }, weights: { v: 0.8, a: 0.8, b: 0.7, t: 0.7, d: 0.8, m: 0.8 } },
];

function interpolate(minValue: number, maxValue: number, position: number) {
  return minValue + (maxValue - minValue) * position;
}

function generateTrajectory(region: Record<keyof EmotionalState, [number, number]>): EmotionalState[] {
  const positions = [
    [0.3, 0.2, 0.3, 0.4, 0.3, 0.2],
    [0.5, 0.4, 0.2, 0.6, 0.5, 0.4],
    [0.8, 0.6, 0.1, 0.9, 0.8, 0.6],
    [0.4, 0.2, 0.3, 0.5, 0.4, 0.2],
  ] as const;
  const keys: (keyof EmotionalState)[] = ["v", "a", "b", "t", "d", "m"];
  return positions.map((positionSet) =>
    Object.fromEntries(
      keys.map((key, index) => [key, interpolate(region[key][0], region[key][1], positionSet[index])]),
    ) as EmotionalState,
  );
}

function getModeColor(v: number, t: number) {
  if (v < -0.4 && t > 0.6) {
    return "Phrygian";
  }
  return "Aeolian";
}

function getChordQuality(state: EmotionalState) {
  const quality: string[] = [];
  if (state.t > 0.6) quality.push("sus2");
  if (state.b > 0.6) quality.push("add9");
  if (state.v < -0.4) quality.push("minor");
  return quality;
}

function getPercussion(a: number) {
  return a < 0.15 ? "none" : a < 0.3 ? "sparse" : "groove";
}

function getLayers(d: number) {
  return d < 0.25 ? ["drone"] : d < 0.4 ? ["drone", "pad"] : ["drone", "pad", "texture"];
}

function mapExpression(state: EmotionalState) {
  return {
    filterCutoffHz: Math.trunc(200 + state.b * 7800),
    noteDensity: Math.trunc(1 + state.m * 8),
    layersCount: Math.trunc(1 + state.d * 4),
    lfoRateHz: Number((0.05 + state.m * 5).toFixed(2)),
    register: state.b < 0.3 ? "low" : state.b < 0.6 ? "mid" : "high",
  };
}

function buildScale(key: string, mode: string) {
  const rootIndex = NOTE_ORDER.indexOf(key);
  return MODE_INTERVALS[mode].map((interval) => NOTE_ORDER[(rootIndex + interval) % 12]);
}

function getDegreeNote(scale: string[], degree: string): [string, number] {
  const roman = degree.match(/[ivIV]+/)?.[0];
  if (!roman) throw new Error(`Invalid degree: ${degree}`);
  const index = DEGREE_MAP[roman];
  return [scale[index], index];
}

function buildChord(scale: string[], degree: string, quality: string[]) {
  const [root, index] = getDegreeNote(scale, degree);
  const second = scale[(index + 1) % 7];
  const third = scale[(index + 2) % 7];
  const fifth = scale[(index + 4) % 7];
  const notes = [root, quality.includes("sus2") ? second : third, fifth];
  if (quality.includes("add9")) notes.push(second);

  let name = root;
  if (quality.includes("minor")) name += "m";
  if (quality.includes("sus2")) name += "(sus2)";
  if (quality.includes("add9")) name += "(add9)";

  return { name, notes: [...new Set(notes)] };
}

function applyModeColorToChord(chordNotes: string[], degreeIndex: number, baseScale: string[], colorScale: string[]) {
  const baseSecond = baseScale[(degreeIndex + 1) % 7];
  const colorSecond = colorScale[(degreeIndex + 1) % 7];
  const newNotes = chordNotes.map((note) => (note === baseSecond ? colorSecond : note));
  if (!chordNotes.includes(baseSecond) && !newNotes.includes(colorSecond)) newNotes.push(colorSecond);
  return [...new Set(newNotes)];
}

function resolveDrone(scale: string[], degree: string, droneType: string) {
  const [root, index] = getDegreeNote(scale, degree);
  const fifth = scale[(index + 4) % 7];
  if (droneType === "root") return [root];
  if (droneType === "root+fifth") return [root, fifth];
  if (droneType === "root+fifth+octave") return [root, fifth, root];
  return [root];
}

function clamp(x: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, x));
}

function gaussianSimilarity(x: number, target: number, sigma = 0.22) {
  const normalizedX = clamp(x);
  const normalizedTarget = clamp(target);
  return Math.exp(-((normalizedX - normalizedTarget) ** 2) / (2 * sigma * sigma));
}

function vectorSimilarity(state: EmotionalState, bias: EmotionalState, sigma = 0.25) {
  const sv = (state.v + 1) / 2;
  const bv = (bias.v + 1) / 2;
  const features: [number, number][] = [
    [sv, bv],
    [state.a, bias.a],
    [state.b, bias.b],
    [state.t, bias.t],
    [state.d, bias.d],
    [state.m, bias.m],
  ];
  return features.reduce((sum, [x, y]) => sum + gaussianSimilarity(x, y, sigma), 0) / features.length;
}

function tagBonus(state: EmotionalState, tags: string[]) {
  let bonus = 0;
  if (tags.includes("drone")) bonus += 0.8 * (1 - state.m) + 0.3 * (1 - state.a);
  if (tags.includes("sustained")) bonus += 0.55 * (1 - state.m);
  if (tags.includes("breathy")) bonus += 0.55 * (1 - Math.abs(state.a - 0.2) / 0.2);
  if (tags.includes("dark")) bonus += 0.95 * Math.max(0, -state.v);
  if (tags.includes("warm")) bonus += 0.35 * (1 - Math.abs(state.b - 0.3));
  if (tags.includes("bright")) bonus += 0.95 * state.b;
  if (tags.includes("mournful")) bonus += 0.8 * Math.max(0, -state.v) + 0.3 * (1 - state.b);
  if (tags.includes("sparkle")) bonus += 0.75 * state.b + 0.15 * (1 - state.t);
  if (tags.includes("pulse")) bonus += 0.85 * state.a + 0.35 * state.m;
  if (tags.includes("ritual")) bonus += 0.55 * state.t + 0.25 * state.a;
  if (tags.includes("organic")) bonus += 0.45 * (1 - Math.abs(state.m - 0.3));
  if (tags.includes("ethereal")) bonus += 0.6 * state.b + 0.35 * (1 - state.t);
  if (tags.includes("lyrical")) bonus += 0.4 * state.m + 0.2 * Math.max(0, state.v);
  if (tags.includes("deep")) bonus += 0.4 * (1 - state.b) + 0.2 * (1 - state.a);
  if (tags.includes("airy")) bonus += 0.45 * state.b + 0.2 * (1 - state.t);
  if (tags.includes("stable")) bonus += 0.35 * (1 - state.t) + 0.25 * (1 - state.a);
  return bonus;
}

function categoryBonus(state: EmotionalState, category: string) {
  if (category === "ambient") return 1.1 * (1 - state.a) + 1 * (1 - state.m) + 0.4 * (1 - Math.abs(state.d - 0.3));
  if (category === "melodic") return 0.75 * state.b + 0.85 * state.m + 0.25 * (1 - state.t);
  if (category === "percussion") return 1.05 * state.a + 0.75 * state.m + 0.2 * state.t;
  if (category === "texture") return 0.9 * state.b + 0.8 * state.d + 0.5 * state.t;
  if (category === "others") return 0.55 * (1 - state.a) + 0.35 * (1 - Math.abs(state.v));
  return 0;
}

function scoreProfile(profile: InstrumentProfile, state: EmotionalState, feelingBias?: EmotionalState) {
  let score = profile.baseWeight;
  (["v", "a", "b", "t", "d", "m"] as (keyof EmotionalState)[]).forEach((feature) => {
    const target = profile.targets[feature];
    if (target === undefined) return;
    const weight = profile.weights[feature] ?? 1;
    score += weight * gaussianSimilarity(state[feature], target);
  });
  score += tagBonus(state, profile.tags);
  score += categoryBonus(state, profile.category);
  if (feelingBias) score += 1.05 * vectorSimilarity(state, feelingBias, 0.26);
  return score;
}

function categoryQuota(state: EmotionalState, category: InstrumentProfile["category"], feelingHint?: string) {
  if (category === "ambient") return Math.min(4, Math.max(2, 2 + Number(state.d >= 0.55) + Number(state.t >= 0.6)));
  if (category === "melodic") {
    let q = state.d < 0.15 && state.a < 0.15 ? 0 : 1;
    q += Number(state.b >= 0.6 || state.m >= 0.45);
    if (feelingHint && ["dark", "sad", "despair", "stable"].includes(feelingHint)) q = Math.min(q, 1);
    return Math.min(2, Math.max(0, q));
  }
  if (category === "percussion") {
    let q = state.a < 0.15 ? 0 : state.a < 0.3 ? 1 : 2;
    if (feelingHint && ["dreamy", "romantic", "stable"].includes(feelingHint)) q = Math.min(q, 1);
    if (feelingHint === "tribal") q = Math.max(q, 2);
    return Math.min(3, Math.max(0, q));
  }
  if (category === "texture") {
    let q = state.b >= 0.2 || state.t >= 0.35 || state.m >= 0.3 ? 1 : 0;
    q += Number(state.b >= 0.6 || state.d >= 0.5);
    if (feelingHint && ["dreamy", "hopeful", "romantic"].includes(feelingHint)) q = Math.max(q, 2);
    return Math.min(3, Math.max(0, q));
  }
  let q = state.v < -0.35 || state.d >= 0.6 || state.m >= 0.6 || state.a < 0.12 ? 1 : 0;
  if (feelingHint && ["dark", "despair", "nostalgic"].includes(feelingHint)) q = Math.max(q, 1);
  return Math.min(2, Math.max(0, q));
}

function selectInstruments(state: EmotionalState, feelingHint?: string) {
  const categories: InstrumentProfile["category"][] = ["ambient", "melodic", "percussion", "texture", "others"];
  const bias = feelingHint ? FEELING_BIASES[feelingHint] : undefined;
  const output: Record<string, string[]> = { ambient: [], melodic: [], percussion: [], texture: [], others: [] };
  categories.forEach((category) => {
    let quota = categoryQuota(state, category, feelingHint);
    if (category === "percussion" && state.a < 0.12) quota = 0;
    if (quota <= 0) return;
    const picks = INSTRUMENT_LIBRARY
      .filter((profile) => profile.category === category)
      .map((profile) => ({ profile, score: scoreProfile(profile, state, bias) }))
      .sort((a, b) => b.score - a.score || a.profile.name.localeCompare(b.profile.name))
      .slice(0, quota)
      .map((item) => item.profile);

    if (category === "ambient" && !picks.some((pick) => pick.tags.includes("drone"))) {
      const dronePick = INSTRUMENT_LIBRARY
        .filter((profile) => profile.category === "ambient" && profile.tags.includes("drone"))
        .map((profile) => ({ profile, score: scoreProfile(profile, state, bias) }))
        .sort((a, b) => b.score - a.score || a.profile.name.localeCompare(b.profile.name))[0]?.profile;
      if (dronePick) {
        if (picks.length > 0) picks[picks.length - 1] = dronePick;
        else picks.push(dronePick);
      }
    }

    output[category] = picks.map((pick) => pick.name);
  });
  return output;
}

export function generateMusicCompositionPlan(parameters: MusicTrackParameters): MusicCompositionPlan {
  const config = FEELINGS[parameters.feeling];
  const states = generateTrajectory(config.region);

  let sectionDurationMs = parameters.duration_4bar_ms;
  const totalDurationMs = 4 * sectionDurationMs;
  if (totalDurationMs < 120000) {
    const multiplier = 120000 / totalDurationMs;
    sectionDurationMs = Math.trunc(sectionDurationMs * multiplier);
  }

  const baseMode = config.base_mode;
  const progression = config.progression;
  const baseScale = buildScale(parameters.key, baseMode);

  const sections = states.map((state, index) => {
    const degree = progression[index];
    const modeColor = getModeColor(state.v, state.t);
    const currentBaseScale = buildScale(parameters.key, baseMode);
    const colorScale = buildScale(parameters.key, modeColor);
    const quality = getChordQuality(state);
    const chordData = buildChord(currentBaseScale, degree, quality);
    const [, degreeIndex] = getDegreeNote(currentBaseScale, degree);
    const coloredNotes = applyModeColorToChord(chordData.notes, degreeIndex, currentBaseScale, colorScale);
    const droneType = index === 0 || index === 3 ? "root" : "root+fifth";
    const drone = resolveDrone(currentBaseScale, degree, droneType);
    const [bass] = getDegreeNote(currentBaseScale, degree);

    return {
      section: `s${index + 1}`,
      instrumental: true,
      lines: [],
      degree,
      modeColor,
      chord: { name: chordData.name, notes: coloredNotes },
      drone,
      bass,
      layers: getLayers(state.d),
      percussion: getPercussion(state.a),
      brightness: Number(state.b.toFixed(2)),
      density: Number(state.d.toFixed(2)),
      movement: Number(state.m.toFixed(2)),
      expression: mapExpression(state),
      instruments: selectInstruments(state, parameters.feeling),
      duration_ms: sectionDurationMs,
    };
  });

  return {
    name: `${parameters.feeling}_${parameters.key}_${parameters.tempo_bpm}_${sectionDurationMs}`,
    instrumental_only: true,
    loopable: true,
    feeling: parameters.feeling,
    key: parameters.key,
    bpm: parameters.tempo_bpm,
    timeSignature: "4/4",
    harmony: {
      modeBase: baseMode,
      scale: baseScale,
      progression,
    },
    sections,
  };
}
