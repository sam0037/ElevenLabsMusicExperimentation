from emotional_state import EmotionalState
from artist import ArtistPersona
from emotional_space import FEELINGS, FEELING_BIASES

# =========================================================

def apply_persona_to_state(
    state : EmotionalState,
    persona: ArtistPersona
):
    """
    Modifies emotional state based on persona constraints
    """

    # Density constraint
    if persona.density == "very_low":
        state.d = min(state.d, 0.15)
    elif persona.density == "low":
        state.d = min(state.d, 0.3)

    # Movement constraint
    if persona.melodic_grammar == "minimal_or_none":
        state.m = min(state.m, 0.1)

    # Harmonic constraint → reduces tension
    if persona.harmonic_system == "static_drone":
        state.t = min(state.t, 0.1)

    # Temporal constraint → reduce arousal
    if "no_pulse" in persona.temporal_system:
        state.a = min(state.a, 0.15)

    return state

# =========================================================

def resolve_mode(
    feeling: str, 
    persona: ArtistPersona
):
    harmonic_system = persona.harmonic_system

    if harmonic_system == "static_drone":
        return "Drone"

    if harmonic_system == "drone_modal_raga":
        return "Raga"

    if harmonic_system == "slow_functional_minimal":
        return FEELINGS[feeling]["base_mode"]

    return FEELINGS[feeling]["base_mode"]

# =========================================================