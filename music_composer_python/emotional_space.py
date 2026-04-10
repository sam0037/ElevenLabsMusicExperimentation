from emotional_state import EmotionalState
from typing import Dict, Any, Union, Optional

# =========================================================
# FEELINGS
# =========================================================

FEELINGS = {
    "dark": {
        "region": {
            "v": (-0.7, -0.3),
            "a": (0.1, 0.3),
            "b": (0.0, 0.3),
            "t": (0.4, 0.8),
            "d": (0.2, 0.4),
            "m": (0.1, 0.3),
        },
        "progression": ["i", "VI", "III", "VII"],
        "base_mode": "Aeolian"
    },

    "sad": {
        "region": {
            "v": (-0.9, -0.5),
            "a": (0.1, 0.3),
            "b": (0.1, 0.3),
            "t": (0.3, 0.6),
            "d": (0.25, 0.45),
            "m": (0.05, 0.2),
        },
        "progression": ["i", "iv", "v", "i"],
        "base_mode": "Aeolian"
    },

    "despair": {
        "region": {
            "v": (-1.0, -0.7),
            "a": (0.05, 0.2),
            "b": (0.0, 0.2),
            "t": (0.7, 1.0),
            "d": (0.15, 0.35),
            "m": (0.05, 0.15),
        },
        "progression": ["i", "bII", "i", "v"],
        "base_mode": "Phrygian"
    },

    "dreamy": {
        "region": {
            "v": (0.1, 0.4),
            "a": (0.05, 0.25),
            "b": (0.7, 1.0),
            "t": (0.05, 0.25),
            "d": (0.25, 0.45),
            "m": (0.05, 0.2),
        },
        "progression": ["I", "IV", "ii", "I"],
        "base_mode": "Lydian"
    },

    "hopeful": {
        "region": {
            "v": (0.3, 0.7),
            "a": (0.2, 0.5),
            "b": (0.6, 0.9),
            "t": (0.1, 0.4),
            "d": (0.3, 0.6),
            "m": (0.2, 0.5),
        },
        "progression": ["I", "V", "vi", "IV"],
        "base_mode": "Ionian"
    },

    "romantic": {
        "region": {
            "v": (0.2, 0.5),
            "a": (0.15, 0.35),
            "b": (0.4, 0.65),
            "t": (0.15, 0.35),
            "d": (0.3, 0.6),
            "m": (0.15, 0.35),
        },
        "progression": ["I", "vi", "IV", "V"],
        "base_mode": "Ionian"
    },

    "tribal": {
        "region": {
            "v": (-0.1, 0.2),
            "a": (0.6, 1.0),
            "b": (0.2, 0.4),
            "t": (0.4, 0.7),
            "d": (0.6, 0.9),
            "m": (0.7, 1.0),
        },
        "progression": ["i", "i", "VII", "i"],
        "base_mode": "Dorian"
    },

    "jazzy": {
        "region": {
            "v": (0.0, 0.4),
            "a": (0.4, 0.7),
            "b": (0.4, 0.7),
            "t": (0.5, 0.8),
            "d": (0.3, 0.6),
            "m": (0.4, 0.7),
        },
        "progression": ["ii7", "V7", "Imaj7", "VI7"],
        "base_mode": "Mixolydian"
    },

    "stable": {
        "region": {
            "v": (-0.1, 0.1),
            "a": (0.05, 0.2),
            "b": (0.3, 0.5),
            "t": (0.0, 0.2),
            "d": (0.15, 0.35),
            "m": (0.05, 0.15),
        },
        "progression": ["I", "I", "IV", "I"],
        "base_mode": "Ionian"
    },

    "unstable": {
        "region": {
            "v": (-0.3, 0.0),
            "a": (0.3, 0.6),
            "b": (0.25, 0.45),
            "t": (0.7, 1.0),
            "d": (0.25, 0.45),
            "m": (0.5, 0.8),
        },
        "progression": ["i", "bII", "V", "i"],
        "base_mode": "Phrygian"
    },

    "nostalgic": {
        "region": {
            "v": (-0.5, -0.2),
            "a": (0.1, 0.3),
            "b": (0.25, 0.45),
            "t": (0.2, 0.4),
            "d": (0.25, 0.45),
            "m": (0.1, 0.3),
        },
        "progression": ["I", "vi", "ii", "V"],
        "base_mode": "Ionian"
    },
}

FEELINGS.update({

    "grounded": {
        "region": {
            "v": (-0.05, 0.25),
            "a": (0.05, 0.25),
            "b": (0.15, 0.35),
            "t": (0.05, 0.25),
            "d": (0.2, 0.4),
            "m": (0.05, 0.2),
        },
        "progression": ["i", "i", "IV", "i"],
        "base_mode": "Dorian"
    },

    "safe": {
        "region": {
            "v": (0.1, 0.5),
            "a": (0.05, 0.2),
            "b": (0.3, 0.6),
            "t": (0.0, 0.1),
            "d": (0.15, 0.35),
            "m": (0.0, 0.1),
        },
        "progression": ["I", "I", "IV", "I"],
        "base_mode": "Ionian"
    },

    "calm": {
        "region": {
            "v": (0.1, 0.4),
            "a": (0.02, 0.15),
            "b": (0.4, 0.7),
            "t": (0.0, 0.1),
            "d": (0.1, 0.3),
            "m": (0.0, 0.1),
        },
        "progression": ["I", "IV", "I", "V"],
        "base_mode": "Ionian"
    },

    "flowing": {
        "region": {
            "v": (0.1, 0.4),
            "a": (0.2, 0.4),
            "b": (0.5, 0.8),
            "t": (0.1, 0.3),
            "d": (0.3, 0.5),
            "m": (0.3, 0.6),
        },
        "progression": ["I", "V", "ii", "IV"],
        "base_mode": "Ionian"
    },

    "balanced": {
        "region": {
            "v": (0.0, 0.3),
            "a": (0.15, 0.35),
            "b": (0.4, 0.6),
            "t": (0.1, 0.3),
            "d": (0.25, 0.45),
            "m": (0.2, 0.4),
        },
        "progression": ["I", "vi", "IV", "V"],
        "base_mode": "Ionian"
    },

    "introspective": {
        "region": {
            "v": (-0.3, 0.1),
            "a": (0.1, 0.3),
            "b": (0.2, 0.5),
            "t": (0.2, 0.4),
            "d": (0.2, 0.4),
            "m": (0.1, 0.25),
        },
        "progression": ["i", "iv", "VI", "i"],
        "base_mode": "Aeolian"
    },

    "meditative": {
        "region": {
            "v": (0.0, 0.2),
            "a": (0.05, 0.15),
            "b": (0.3, 0.5),
            "t": (0.0, 0.15),
            "d": (0.1, 0.25),
            "m": (0.0, 0.1),
        },
        "progression": ["i", "i", "i", "i"],
        "base_mode": "Dorian"
    },

    "expansive": {
        "region": {
            "v": (0.2, 0.6),
            "a": (0.2, 0.5),
            "b": (0.7, 1.0),
            "t": (0.1, 0.3),
            "d": (0.3, 0.6),
            "m": (0.2, 0.4),
        },
        "progression": ["I", "II", "V", "I"],
        "base_mode": "Lydian"
    },

    "transcendent": {
        "region": {
            "v": (0.3, 0.7),
            "a": (0.1, 0.3),
            "b": (0.8, 1.0),
            "t": (0.0, 0.2),
            "d": (0.2, 0.4),
            "m": (0.05, 0.2),
        },
        "progression": ["I", "IV", "I", "I"],
        "base_mode": "Lydian"
    },

    "sleepy": {
        "region": {
            "v": (-0.05, 0.2),
            "a": (0.0, 0.08),
            "b": (0.15, 0.4),
            "t": (0.0, 0.05),
            "d": (0.05, 0.2),
            "m": (0.0, 0.05),
        },
        "progression": ["i", "i", "i", "i"],
        "base_mode": "Aeolian"
    },

    "sedated": {
        "region": {
            "v": (-0.1, 0.1),
            "a": (0.0, 0.05),
            "b": (0.1, 0.3),
            "t": (0.0, 0.03),
            "d": (0.05, 0.15),
            "m": (0.0, 0.03),
        },
        "progression": ["i", "i", "i", "i"],
        "base_mode": "Aeolian"
    },

    "release": {
        "region": {
            "v": (-0.4, 0.0),
            "a": (0.3, 0.6),
            "b": (0.2, 0.5),
            "t": (0.4, 0.7),
            "d": (0.3, 0.6),
            "m": (0.3, 0.6),
        },
        "progression": ["i", "VI", "III", "VII"],
        "base_mode": "Aeolian"
    },

})

# =========================================================
# FEELING BIASES
# Optional: bias the selector toward a named emotional family.
# =========================================================

FEELING_BIASES: Dict[str, EmotionalState] = {
    "dark":      EmotionalState(v=-0.60, a=0.15, b=0.12, t=0.65, d=0.30, m=0.15),
    "sad":       EmotionalState(v=-0.75, a=0.20, b=0.18, t=0.50, d=0.35, m=0.12),
    "despair":   EmotionalState(v=-0.90, a=0.15, b=0.08, t=0.80, d=0.25, m=0.10),
    "dreamy":    EmotionalState(v=0.25,  a=0.15, b=0.85, t=0.15, d=0.35, m=0.12),
    "hopeful":   EmotionalState(v=0.55,  a=0.35, b=0.75, t=0.25, d=0.45, m=0.35),
    "romantic":  EmotionalState(v=0.35,  a=0.25, b=0.52, t=0.25, d=0.45, m=0.25),
    "tribal":    EmotionalState(v=0.05,  a=0.80, b=0.30, t=0.55, d=0.70, m=0.80),
    "jazzy":     EmotionalState(v=0.20,  a=0.55, b=0.55, t=0.60, d=0.45, m=0.55),
    "stable":    EmotionalState(v=0.00,  a=0.10, b=0.40, t=0.10, d=0.25, m=0.10),
    "unstable":  EmotionalState(v=-0.15, a=0.45, b=0.35, t=0.80, d=0.35, m=0.65),
    "nostalgic": EmotionalState(v=-0.35, a=0.20, b=0.35, t=0.30, d=0.35, m=0.20),
}

FEELING_BIASES.update({

    # --- Down-regulation / Safety ---
    "grounded": EmotionalState(v=0.10, a=0.15, b=0.25, t=0.15, d=0.30, m=0.10),
    "safe":     EmotionalState(v=0.30, a=0.10, b=0.45, t=0.05, d=0.25, m=0.05),
    "calm":     EmotionalState(v=0.20, a=0.08, b=0.50, t=0.05, d=0.20, m=0.05),

    # --- Breath / Flow regulation ---
    "flowing":  EmotionalState(v=0.25, a=0.30, b=0.60, t=0.20, d=0.40, m=0.45),
    "balanced": EmotionalState(v=0.15, a=0.25, b=0.50, t=0.20, d=0.35, m=0.30),

    # --- Deep internal states ---
    "introspective": EmotionalState(v=-0.10, a=0.20, b=0.35, t=0.25, d=0.30, m=0.15),
    "meditative":    EmotionalState(v=0.10, a=0.10, b=0.40, t=0.10, d=0.20, m=0.05),

    # --- Expansion / transcendence ---
    "expansive": EmotionalState(v=0.40, a=0.35, b=0.80, t=0.20, d=0.45, m=0.30),
    "transcendent": EmotionalState(v=0.50, a=0.20, b=0.90, t=0.10, d=0.35, m=0.10),

    # --- Sleep / deep rest ---
    "sleepy": EmotionalState(v=0.10, a=0.03, b=0.30, t=0.02, d=0.15, m=0.02),
    "sedated": EmotionalState(v=0.00, a=0.02, b=0.20, t=0.01, d=0.10, m=0.01),

    # --- Emotional processing ---
    "release": EmotionalState(v=-0.20, a=0.40, b=0.35, t=0.55, d=0.45, m=0.35),

})
