from __future__ import annotations

from dataclasses import asdict
from typing import Dict, List, Tuple, Optional, Any, Union
import math
import json

from musical_constants import EMOTIONAL_FEATURES, INSTRUMENT_CATEGORIES
from emotional_state import EmotionalState
from instrument_profile import InstrumentProfile
from instrument_library import INSTRUMENT_LIBRARY
from emotional_space import FEELING_BIASES

# =========================================================
# UTILS
# =========================================================

def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def coerce_state(state: Union[EmotionalState, Dict[str, float], Any]) -> EmotionalState:
    if isinstance(state, EmotionalState):
        return state
    if isinstance(state, dict):
        return EmotionalState(**state)
    return EmotionalState(
        v=float(state.v),
        a=float(state.a),
        b=float(state.b),
        t=float(state.t),
        d=float(state.d),
        m=float(state.m),
    )


def gaussian_similarity(x: float, target: float, sigma: float = 0.22) -> float:
    x = clamp(x)
    target = clamp(target)
    return math.exp(-((x - target) ** 2) / (2.0 * sigma * sigma))


def vector_similarity(state: EmotionalState, bias: EmotionalState, sigma: float = 0.25) -> float:
    # v is normalized from [-1,1] to [0,1] for distance comparison
    sv = (state.v + 1.0) / 2.0
    bv = (bias.v + 1.0) / 2.0

    feats = {
        "v": (sv, bv),
        "a": (state.a, bias.a),
        "b": (state.b, bias.b),
        "t": (state.t, bias.t),
        "d": (state.d, bias.d),
        "m": (state.m, bias.m),
    }

    return sum(gaussian_similarity(x, y, sigma=sigma) for x, y in feats.values()) / len(feats)


def tag_bonus(state: EmotionalState, tags: Tuple[str, ...]) -> float:
    bonus = 0.0

    if "drone" in tags:
        bonus += 0.80 * (1.0 - state.m) + 0.30 * (1.0 - state.a)
    if "sustained" in tags:
        bonus += 0.55 * (1.0 - state.m)
    if "breathy" in tags:
        bonus += 0.55 * (1.0 - abs(state.a - 0.20) / 0.20)
    if "dark" in tags:
        bonus += 0.95 * max(0.0, -state.v)
    if "warm" in tags:
        bonus += 0.35 * (1.0 - abs(state.b - 0.30))
    if "bright" in tags:
        bonus += 0.95 * state.b
    if "mournful" in tags:
        bonus += 0.80 * max(0.0, -state.v) + 0.30 * (1.0 - state.b)
    if "sparkle" in tags:
        bonus += 0.75 * state.b + 0.15 * (1.0 - state.t)
    if "pulse" in tags:
        bonus += 0.85 * state.a + 0.35 * state.m
    if "ritual" in tags:
        bonus += 0.55 * state.t + 0.25 * state.a
    if "organic" in tags:
        bonus += 0.45 * (1.0 - abs(state.m - 0.30))
    if "ethereal" in tags:
        bonus += 0.60 * state.b + 0.35 * (1.0 - state.t)
    if "lyrical" in tags:
        bonus += 0.40 * state.m + 0.20 * max(0.0, state.v)
    if "deep" in tags:
        bonus += 0.40 * (1.0 - state.b) + 0.20 * (1.0 - state.a)
    if "airy" in tags:
        bonus += 0.45 * state.b + 0.20 * (1.0 - state.t)
    if "stable" in tags:
        bonus += 0.35 * (1.0 - state.t) + 0.25 * (1.0 - state.a)

    return bonus


def category_bonus(state: EmotionalState, category: str) -> float:
    if category == "ambient":
        return 1.10 * (1.0 - state.a) + 1.00 * (1.0 - state.m) + 0.40 * (1.0 - abs(state.d - 0.30))
    if category == "melodic":
        return 0.75 * state.b + 0.85 * state.m + 0.25 * (1.0 - state.t)
    if category == "percussion":
        return 1.05 * state.a + 0.75 * state.m + 0.20 * state.t
    if category == "texture":
        return 0.90 * state.b + 0.80 * state.d + 0.50 * state.t
    if category == "others":
        return 0.55 * (1.0 - state.a) + 0.35 * (1.0 - abs(state.v))
    return 0.0


def score_profile(
    profile: InstrumentProfile,
    state: EmotionalState,
    feeling_bias: Optional[EmotionalState] = None,
) -> float:
    score = profile.base_weight

    for feature in EMOTIONAL_FEATURES:
        target = profile.targets.get(feature)
        if target is None:
            continue
        weight = profile.weights.get(feature, 1.0)
        score += weight * gaussian_similarity(getattr(state, feature), target)

    score += tag_bonus(state, profile.tags)
    score += category_bonus(state, profile.category)

    if feeling_bias is not None:
        score += 1.05 * vector_similarity(state, feeling_bias, sigma=0.26)

    return score


def explain_profile(profile: InstrumentProfile, state: EmotionalState) -> str:
    notes: List[str] = []

    if "drone" in profile.tags:
        notes.append("supports sustained drone bed")
    if "breathy" in profile.tags and state.a <= 0.45:
        notes.append("fits calm breath-led phrasing")
    if "mournful" in profile.tags and state.v < 0:
        notes.append("matches low-valence color")
    if "bright" in profile.tags and state.b > 0.5:
        notes.append("matches brighter spectral space")
    if "pulse" in profile.tags and state.a >= 0.25:
        notes.append("matches rhythmic motion")
    if "sparkle" in profile.tags and state.b >= 0.45:
        notes.append("adds shimmer")
    if "ritual" in profile.tags and state.t >= 0.4:
        notes.append("supports spiritual tension/grounding")
    if "organic" in profile.tags and state.d >= 0.25:
        notes.append("fits organic meditative texture")

    if not notes:
        notes.append("best vector match")

    return "; ".join(notes[:3])


def category_quota(
    state: EmotionalState,
    category: str,
    feeling_hint: Optional[str] = None,
) -> int:
    if category == "ambient":
        q = 2 + int(state.d >= 0.55) + int(state.t >= 0.60)
        return min(4, max(2, q))

    if category == "melodic":
        q = 0 if state.d < 0.15 and state.a < 0.15 else 1
        q += int(state.b >= 0.60 or state.m >= 0.45)
        if feeling_hint in {"dark", "sad", "despair", "stable"}:
            q = min(q, 1)
        return min(2, max(0, q))

    if category == "percussion":
        if state.a < 0.15:
            q = 0
        elif state.a < 0.30:
            q = 1
        else:
            q = 2
        if feeling_hint in {"dreamy", "romantic", "stable"}:
            q = min(q, 1)
        if feeling_hint == "tribal":
            q = max(q, 2)
        return min(3, max(0, q))

    if category == "texture":
        q = 1 if (state.b >= 0.20 or state.t >= 0.35 or state.m >= 0.30) else 0
        q += int(state.b >= 0.60 or state.d >= 0.50)
        if feeling_hint in {"dreamy", "hopeful", "romantic"}:
            q = max(q, 2)
        return min(3, max(0, q))

    if category == "others":
        q = 1 if (state.v < -0.35 or state.d >= 0.60 or state.m >= 0.60 or state.a < 0.12) else 0
        if feeling_hint in {"dark", "despair", "nostalgic"}:
            q = max(q, 1)
        return min(2, max(0, q))

    return 0


def build_catalog() -> Dict[str, List[InstrumentProfile]]:
    catalog: Dict[str, List[InstrumentProfile]] = {c: [] for c in INSTRUMENT_CATEGORIES}
    for profile in INSTRUMENT_LIBRARY:
        catalog[profile.category].append(profile)
    return catalog


def pick_top_profiles(
    profiles: List[InstrumentProfile],
    state: EmotionalState,
    count: int,
    feeling_bias: Optional[EmotionalState] = None,
) -> List[Dict[str, Any]]:
    scored = []
    for p in profiles:
        score = score_profile(p, state, feeling_bias=feeling_bias)
        scored.append((score, p))

    scored.sort(key=lambda item: (-item[0], item[1].name))

    picks = []
    for score, p in scored[:count]:
        picks.append(
            {
                "name": p.name,
                "score": round(score, 3),
                "tags": list(p.tags),
                "category": p.category,
                "reason": explain_profile(p, state),
            }
        )
    return picks


def select_instruments(
    state: Union[EmotionalState, Dict[str, float], Any],
    feeling_hint: Optional[str] = None,
    dump_debug: bool = False
) -> Dict[str, Any]:
    """
    Returns a category-separated instrument plan.

    Example:
        select_instruments(EmotionalState(...), feeling_hint="dark")
    """
    s = coerce_state(state)
    catalog = build_catalog()
    bias = FEELING_BIASES.get(feeling_hint.lower()) if feeling_hint else None

    output: Dict[str, Any] = {
        "ambient": [],
        "melodic": [],
        "percussion": [],
        "texture": [],
        "others": [],
        "debug": {
            "state": asdict(s),
            "feeling_hint": feeling_hint,
            "quotas": {},
            "selected_details": {},
        },
    }

    for category in INSTRUMENT_CATEGORIES:
        q = category_quota(s, category, feeling_hint=feeling_hint)
        output["debug"]["quotas"][category] = q

        if q <= 0:
            output[category] = []
            output["debug"]["selected_details"][category] = []
            continue

        picks = pick_top_profiles(catalog[category], s, q, feeling_bias=bias)

        # Ensure a drone anchor exists in ambient when the music is meditative.
        if category == "ambient":
            has_drone = any("drone" in item["tags"] for item in picks)
            if not has_drone:
                drone_profiles = [p for p in catalog["ambient"] if "drone" in p.tags]
                if drone_profiles:
                    best_drone = pick_top_profiles(drone_profiles, s, 1, feeling_bias=bias)[0]
                    if picks:
                        picks[-1] = best_drone
                    else:
                        picks = [best_drone]

        output[category] = [p["name"] for p in picks]
        output["debug"]["selected_details"][category] = picks

    # A conservative meditative default:
    # no percussion when arousal is very low, regardless of quota.
    if s.a < 0.12:
        output["percussion"] = []
        output["debug"]["selected_details"]["percussion"] = []
        output["debug"]["quotas"]["percussion"] = 0

    if not dump_debug:
        del output["debug"]

    return output
