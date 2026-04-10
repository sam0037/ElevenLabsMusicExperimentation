from typing import Dict, List, Tuple, Optional
from instrument_profile import InstrumentProfile

# =========================================================
# INSTRUMENT LIBRARY
# The profiles below are intentionally broad so the selector
# works from vectors rather than hard-coded emotion labels.
# =========================================================

def P(
    name: str,
    category: str,
    tags: Tuple[str, ...],
    base_weight: float = 1.0,
    targets: Optional[Dict[str, float]] = None,
    weights: Optional[Dict[str, float]] = None,
) -> InstrumentProfile:
    return InstrumentProfile(
        name=name,
        category=category,
        tags=tags,
        base_weight=base_weight,
        targets=targets or {},
        weights=weights or {},
    )


INSTRUMENT_LIBRARY: List[InstrumentProfile] = [
    # ----------------------------
    # Ambient / sustained bed
    # ----------------------------
    P(
        "tanpura",
        "ambient",
        ("drone", "organic", "warm", "stable", "sustained"),
        1.40,
        {"v": -0.20, "a": 0.08, "b": 0.14, "t": 0.45, "d": 0.30, "m": 0.05},
        {"v": 0.8, "a": 0.8, "b": 0.8, "t": 1.0, "d": 0.8, "m": 1.0},
    ),
    P(
        "shruti_box",
        "ambient",
        ("drone", "supportive", "warm", "stable", "sustained"),
        1.35,
        {"v": -0.10, "a": 0.08, "b": 0.18, "t": 0.40, "d": 0.32, "m": 0.06},
        {"v": 0.8, "a": 0.8, "b": 0.8, "t": 1.0, "d": 0.8, "m": 1.0},
    ),
    P(
        "harmonium_drone",
        "ambient",
        ("drone", "reed", "devotional", "warm", "sustained"),
        1.20,
        {"v": -0.05, "a": 0.10, "b": 0.22, "t": 0.35, "d": 0.35, "m": 0.08},
        {"v": 0.7, "a": 0.8, "b": 0.7, "t": 0.8, "d": 0.9, "m": 1.0},
    ),
    P(
        "drone_synth",
        "ambient",
        ("drone", "synthetic", "stable", "wide", "soft"),
        1.00,
        {"v": 0.00, "a": 0.08, "b": 0.28, "t": 0.35, "d": 0.45, "m": 0.10},
        {"v": 0.6, "a": 0.7, "b": 0.8, "t": 0.8, "d": 0.9, "m": 0.8},
    ),
    P(
        "string_pad",
        "ambient",
        ("lush", "wide", "sustained", "emotional", "cinematic"),
        1.00,
        {"v": 0.05, "a": 0.10, "b": 0.50, "t": 0.25, "d": 0.55, "m": 0.10},
        {"v": 0.7, "a": 0.7, "b": 0.8, "t": 0.8, "d": 0.8, "m": 0.8},
    ),
    P(
        "singing_bowl",
        "ambient",
        ("resonant", "meditative", "sustained", "bright", "harmonic"),
        1.10,
        {"v": 0.00, "a": 0.10, "b": 0.72, "t": 0.20, "d": 0.35, "m": 0.08},
        {"v": 0.6, "a": 0.7, "b": 1.0, "t": 0.8, "d": 0.8, "m": 1.0},
    ),
    P(
        "bowed_cymbal",
        "ambient",
        ("shimmer", "ethereal", "sustained", "airy", "wash"),
        0.90,
        {"v": 0.10, "a": 0.08, "b": 0.78, "t": 0.15, "d": 0.30, "m": 0.10},
        {"v": 0.5, "a": 0.7, "b": 1.0, "t": 0.8, "d": 0.8, "m": 1.0},
    ),

    # ----------------------------
    # Melodic / lead instruments
    # ----------------------------
    P(
        "bansuri",
        "melodic",
        ("breathy", "airy", "spiritual", "lyrical", "woodwind"),
        1.30,
        {"v": 0.25, "a": 0.18, "b": 0.72, "t": 0.20, "d": 0.35, "m": 0.35},
        {"v": 1.0, "a": 0.8, "b": 0.8, "t": 0.6, "d": 0.5, "m": 1.0},
    ),
    P(
        "duduk",
        "melodic",
        ("breathy", "mournful", "warm", "dark", "meditative"),
        1.35,
        {"v": -0.55, "a": 0.18, "b": 0.15, "t": 0.55, "d": 0.30, "m": 0.20},
        {"v": 1.0, "a": 0.8, "b": 0.8, "t": 0.6, "d": 0.6, "m": 0.8},
    ),
    P(
        "cello",
        "melodic",
        ("warm", "low", "lyrical", "emotional", "human"),
        1.20,
        {"v": -0.25, "a": 0.20, "b": 0.25, "t": 0.35, "d": 0.40, "m": 0.25},
        {"v": 0.8, "a": 0.7, "b": 0.7, "t": 0.6, "d": 0.7, "m": 0.8},
    ),
    P(
        "lyre",
        "melodic",
        ("gentle", "plucked", "ancient", "clear", "lyrical"),
        1.00,
        {"v": 0.20, "a": 0.14, "b": 0.55, "t": 0.20, "d": 0.30, "m": 0.30},
        {"v": 0.8, "a": 0.7, "b": 0.8, "t": 0.6, "d": 0.6, "m": 1.0},
    ),
    P(
        "celesta",
        "melodic",
        ("bell_like", "delicate", "bright", "celestial", "sparkle"),
        1.20,
        {"v": 0.60, "a": 0.12, "b": 0.90, "t": 0.10, "d": 0.25, "m": 0.25},
        {"v": 0.7, "a": 0.8, "b": 1.0, "t": 0.8, "d": 0.7, "m": 0.8},
    ),
    P(
        "soft_piano",
        "melodic",
        ("intimate", "reflective", "clear", "soft", "keyboard"),
        1.00,
        {"v": 0.10, "a": 0.18, "b": 0.45, "t": 0.20, "d": 0.35, "m": 0.30},
        {"v": 0.8, "a": 0.7, "b": 0.7, "t": 0.6, "d": 0.7, "m": 0.9},
    ),

    # ----------------------------
    # Percussion / pulse
    # ----------------------------
    P(
        "frame_drum",
        "percussion",
        ("organic", "pulse", "ritual", "earthy", "hand_drum"),
        1.15,
        {"v": 0.00, "a": 0.45, "b": 0.25, "t": 0.50, "d": 0.45, "m": 0.55},
        {"v": 0.4, "a": 1.0, "b": 0.3, "t": 0.7, "d": 0.6, "m": 1.0},
    ),
    P(
        "tabla",
        "percussion",
        ("articulated", "rhythmic", "tonal", "intricate", "pulse"),
        1.25,
        {"v": 0.05, "a": 0.65, "b": 0.30, "t": 0.45, "d": 0.55, "m": 0.70},
        {"v": 0.4, "a": 1.0, "b": 0.3, "t": 0.6, "d": 0.6, "m": 1.0},
    ),
    P(
        "shaker",
        "percussion",
        ("light", "airy", "motion", "subtle", "small_percussion"),
        0.95,
        {"v": 0.10, "a": 0.35, "b": 0.50, "t": 0.20, "d": 0.30, "m": 0.70},
        {"v": 0.3, "a": 1.0, "b": 0.5, "t": 0.4, "d": 0.5, "m": 1.0},
    ),
    P(
        "finger_cymbals",
        "percussion",
        ("sparkle", "accent", "bright", "delicate", "high"),
        0.80,
        {"v": 0.45, "a": 0.22, "b": 0.85, "t": 0.15, "d": 0.20, "m": 0.30},
        {"v": 0.3, "a": 0.8, "b": 1.0, "t": 0.5, "d": 0.3, "m": 0.6},
    ),
    P(
        "low_tom",
        "percussion",
        ("earthy", "grounding", "deep", "pulse", "tribal"),
        1.00,
        {"v": -0.25, "a": 0.50, "b": 0.10, "t": 0.55, "d": 0.45, "m": 0.60},
        {"v": 0.5, "a": 1.0, "b": 0.4, "t": 0.7, "d": 0.5, "m": 1.0},
    ),

    # ----------------------------
    # Texture / FX
    # ----------------------------
    P(
        "wind_chimes",
        "texture",
        ("sparkle", "airy", "random", "bright", "chance"),
        0.90,
        {"v": 0.35, "a": 0.12, "b": 0.85, "t": 0.10, "d": 0.20, "m": 0.10},
        {"v": 0.5, "a": 0.8, "b": 1.0, "t": 0.8, "d": 0.6, "m": 0.7},
    ),
    P(
        "granular_air",
        "texture",
        ("atmospheric", "evolving", "diffuse", "wash", "soft"),
        1.00,
        {"v": 0.00, "a": 0.08, "b": 0.60, "t": 0.30, "d": 0.70, "m": 0.40},
        {"v": 0.4, "a": 0.6, "b": 0.8, "t": 0.8, "d": 1.0, "m": 0.8},
    ),
    P(
        "reverse_swell",
        "texture",
        ("transition", "tension_release", "motion", "cinematic", "wash"),
        0.95,
        {"v": -0.20, "a": 0.15, "b": 0.35, "t": 0.70, "d": 0.40, "m": 0.45},
        {"v": 0.6, "a": 0.7, "b": 0.7, "t": 1.0, "d": 0.6, "m": 0.8},
    ),
    P(
        "field_recording",
        "texture",
        ("nature", "organic", "space", "background", "environment"),
        0.75,
        {"v": 0.00, "a": 0.08, "b": 0.35, "t": 0.20, "d": 0.50, "m": 0.15},
        {"v": 0.4, "a": 0.7, "b": 0.7, "t": 0.5, "d": 0.8, "m": 0.5},
    ),
    P(
        "noise_bed",
        "texture",
        ("subtle", "diffuse", "haze", "background", "soft"),
        0.70,
        {"v": 0.00, "a": 0.08, "b": 0.30, "t": 0.40, "d": 0.55, "m": 0.25},
        {"v": 0.4, "a": 0.6, "b": 0.7, "t": 0.8, "d": 0.8, "m": 0.6},
    ),

    # ----------------------------
    # Others / support
    # ----------------------------
    P(
        "sub_drone",
        "others",
        ("low_end", "support", "stable", "deep", "foundation"),
        1.10,
        {"v": -0.30, "a": 0.05, "b": 0.10, "t": 0.35, "d": 0.45, "m": 0.05},
        {"v": 0.8, "a": 0.8, "b": 0.8, "t": 0.8, "d": 0.8, "m": 1.0},
    ),
    P(
        "bass_harmonics",
        "others",
        ("low_end", "resonant", "support", "warm", "foundation"),
        0.95,
        {"v": -0.15, "a": 0.08, "b": 0.25, "t": 0.25, "d": 0.40, "m": 0.10},
        {"v": 0.7, "a": 0.7, "b": 0.7, "t": 0.8, "d": 0.8, "m": 0.8},
    ),
    P(
        "vocal_pad",
        "others",
        ("human", "devotional", "sustained", "soft", "choir_like"),
        0.85,
        {"v": 0.15, "a": 0.12, "b": 0.45, "t": 0.15, "d": 0.45, "m": 0.20},
        {"v": 0.8, "a": 0.8, "b": 0.7, "t": 0.7, "d": 0.8, "m": 0.8},
    ),
]

