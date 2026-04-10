from emotional_state import EmotionalState

# =========================================================
# GENERATION
# =========================================================

def interpolate(min_val, max_val, position):
    return min_val + (max_val - min_val) * position


def generate_trajectory(region):
    return [
        EmotionalState(*[interpolate(*region[k], p) for k, p in zip(region, [0.3,0.2,0.3,0.4,0.3,0.2])]),
        EmotionalState(*[interpolate(*region[k], p) for k, p in zip(region, [0.5,0.4,0.2,0.6,0.5,0.4])]),
        EmotionalState(*[interpolate(*region[k], p) for k, p in zip(region, [0.8,0.6,0.1,0.9,0.8,0.6])]),
        EmotionalState(*[interpolate(*region[k], p) for k, p in zip(region, [0.4,0.2,0.3,0.5,0.4,0.2])]),
    ]


def get_mode_color(v, t):
    if v < -0.4 and t > 0.6:
        return "Phrygian"
    return "Aeolian"


def get_chord_quality(state):
    q = []
    if state.t > 0.6:
        q.append("sus2")
    if state.b > 0.6:
        q.append("add9")
    if state.v < -0.4:
        q.append("minor")
    return q


def get_percussion(a):
    return "none" if a < 0.15 else "sparse" if a < 0.3 else "groove"


def get_layers(d):
    return ["drone"] if d < 0.25 else ["drone", "pad"] if d < 0.4 else ["drone", "pad", "texture"]


def map_expression(state):
    return {
        "filterCutoffHz": int(200 + state.b * 7800),
        "noteDensity": int(1 + state.m * 8),
        "layersCount": int(1 + state.d * 4),
        "lfoRateHz": round(0.05 + state.m * 5, 2),
        "register": "low" if state.b < 0.3 else "mid" if state.b < 0.6 else "high"
    }
