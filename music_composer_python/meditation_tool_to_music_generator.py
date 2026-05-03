import random
from typing import Dict
from emotional_state import EmotionalState
from emotional_space import FEELINGS, FEELING_BIASES
from meditation_tool import MeditationTool
from artist import ArtistProfile
from music_composer_python.artist_functions import apply_persona_to_state

# =========================================================
# MEDITATION TOOL → STATE MAPPING
# =========================================================

def tool_to_state(tool: Dict) -> EmotionalState:
    direction = tool["nervous_system_direction"]
    tempo_range = tool["tempo_range_bpm"]
    density = tool["texture_density"]

    # Base mapping from nervous system direction
    if direction == "strong_down":
        state = EmotionalState(v=0.1, a=0.05, b=0.35, t=0.05, d=0.15, m=0.05)

    elif direction == "down":
        state = EmotionalState(v=0.2, a=0.1, b=0.45, t=0.1, d=0.25, m=0.1)

    elif direction == "neutral":
        state = EmotionalState(v=0.1, a=0.25, b=0.5, t=0.2, d=0.3, m=0.3)

    elif direction == "up":
        state = EmotionalState(v=0.3, a=0.6, b=0.6, t=0.4, d=0.5, m=0.6)

    elif direction == "strong_up":
        state = EmotionalState(v=0.3, a=0.75, b=0.65, t=0.6, d=0.6, m=0.75)

    else:
        raise ValueError(f"Unknown nervous_system_direction: {direction}")

    # Refine arousal using tempo
    tempo_mid = sum(tempo_range) / 2
    state.a = min(1.0, max(0.0, tempo_mid / 100))

    # Refine density
    density_map = {
        "very_low": 0.1,
        "low": 0.25,
        "medium": 0.5,
        "high": 0.75
    }
    state.d = density_map.get(density, state.d)

    return state


# =========================================================
# DISTANCE METRIC
# =========================================================

WEIGHTS = {
    "v": 2.0,
    "a": 1.5,
    "b": 1.0,
    "t": 2.0,
    "d": 1.0,
    "m": 1.0,
}


def emotional_distance(s1: EmotionalState, s2: EmotionalState) -> float:
    return sum(
        WEIGHTS[k] * (getattr(s1, k) - getattr(s2, k)) ** 2
        for k in WEIGHTS
    ) ** 0.5


# =========================================================
# SELECT FEELING
# =========================================================

def select_feeling(target: EmotionalState) -> str:
    best_name = None
    best_score = float("inf")

    for name, bias in FEELING_BIASES.items():
        score = emotional_distance(target, bias)
        if score < best_score:
            best_score = score
            best_name = name

    return best_name


# =========================================================
# KEY SELECTION
# =========================================================

LOW_KEYS = ["D", "Eb", "F"]
MID_KEYS = ["C", "G", "A"]
HIGH_KEYS = ["D", "E", "B"]


def select_key(state: EmotionalState) -> str:
    if state.b < 0.3:
        pool = LOW_KEYS
    elif state.b < 0.7:
        pool = MID_KEYS
    else:
        pool = HIGH_KEYS

    tonic = random.choice(pool)
    return tonic


# =========================================================
# TEMPO + DURATION (NEW ADDITION)
# =========================================================

# Valid BPMs (divisors of 960 → guarantees clean 4-bar durations)
VALID_BPM = [40, 48, 60, 64, 80, 96, 120]


def quantized_tempo(target_bpm: float, allowed_bpms):
    return min(allowed_bpms, key=lambda x: abs(x - target_bpm))


def suggest_quantized_tempo(state: EmotionalState, tempo_range):
    min_bpm, max_bpm = tempo_range

    # continuous estimate from arousal
    raw_tempo = min_bpm + (max_bpm - min_bpm) * state.a

    # filter valid BPMs within tool range
    candidates = [b for b in VALID_BPM if min_bpm <= b <= max_bpm]

    if not candidates:
        candidates = VALID_BPM  # fallback

    return quantized_tempo(raw_tempo, candidates)


def compute_4bar_duration_ms(bpm: float) -> int:
    """
    4 bars in 4/4 = 16 beats
    duration = 960000 / BPM
    Always integer for VALID_BPM
    """
    if bpm <= 0:
        raise ValueError("BPM must be positive")
    duration_ms = 960000 / bpm
    if not duration_ms.is_integer():
        raise ValueError(f"Computed duration {duration_ms} ms is not an integer for BPM {bpm}")
    if duration_ms <= 0:
        raise ValueError(f"Computed duration {duration_ms} ms must be positive for BPM {bpm}")
    if duration_ms < 20000:
        duration_ms = 2*duration_ms
    return duration_ms


# =========================================================
# MAIN ENGINE
# =========================================================

def meditation_tool_to_music_v2(
    meditation_tool: MeditationTool,
    artist_profile: ArtistProfile
):
    """
    Input:
        meditation_tool (dict):
            {
                "id": "...",
                "nervous_system_direction": "...",
                "tempo_range_bpm": [min, max],
                "texture_density": "low|medium|..."
            }

    Output:
        {
            "feeling": str,
            "key": str,
            "tempo_bpm": int,
            "duration_4bar_ms": int
        }
    """

    # Step 1: Tool → Emotional State
    state = tool_to_state(meditation_tool.to_dict())

    # Step 2: Apply artist persona to state
    state = apply_persona_to_state(state, artist_profile.persona)

    # Step 3: State → Feeling
    feeling = select_feeling(state)

    # Step 4: Feeling → Mode
    mode = FEELINGS[feeling]["base_mode"]

    # Step 5: State → Key
    key = select_key(state)

    # Step 6: Tempo (quantized)
    tempo = suggest_quantized_tempo(state, meditation_tool.tempo_range_bpm)

    # Step 7: Duration (4-bar loop)
    duration_4bar_ms = compute_4bar_duration_ms(tempo)

    return {
        "feeling": feeling,
        "key": key,
        "mode": mode,
        "tempo_bpm": tempo,
        "duration_4bar_ms": duration_4bar_ms
    }

def meditation_tool_to_music(
    meditation_tool: MeditationTool
):
    """
    Input:
        meditation_tool (dict):
            {
                "id": "...",
                "nervous_system_direction": "...",
                "tempo_range_bpm": [min, max],
                "texture_density": "low|medium|..."
            }

    Output:
        {
            "feeling": str,
            "key": str,
            "tempo_bpm": int,
            "duration_4bar_ms": int
        }
    """

    # Step 1: Tool → Emotional State
    state = tool_to_state(meditation_tool.to_dict())

    # Step 2: State → Feeling
    feeling = select_feeling(state)

    # Step 3: Feeling → Mode
    mode = FEELINGS[feeling]["base_mode"]

    # Step 4: State → Key
    key = select_key(state)

    # Step 5: Tempo (quantized)
    tempo = suggest_quantized_tempo(state, meditation_tool.tempo_range_bpm)

    # Step 6: Duration (4-bar loop)
    duration_4bar_ms = compute_4bar_duration_ms(tempo)

    return {
        "feeling": feeling,
        "key": key,
        "mode": mode,
        "tempo_bpm": tempo,
        "duration_4bar_ms": duration_4bar_ms
    }