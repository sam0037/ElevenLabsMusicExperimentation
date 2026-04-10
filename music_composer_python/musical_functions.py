from musical_constants import NOTE_ORDER, MODE_INTERVALS, DEGREE_MAP
import re

# =========================================================
# THEORY FUNCTIONS
# =========================================================

def build_scale(key, mode):
    root_idx = NOTE_ORDER.index(key)
    intervals = MODE_INTERVALS[mode]
    return [NOTE_ORDER[(root_idx + i) % 12] for i in intervals]


def get_degree_note(scale, degree):
    """
    Extracts roman numeral and returns corresponding scale note + index
    """

    # Extract only roman numeral part (I, ii, V, etc.)
    match = re.match(r"[ivIV]+", degree)
    if not match:
        raise ValueError(f"Invalid degree: {degree}")

    roman = match.group(0)

    idx = DEGREE_MAP[roman]
    return scale[idx], idx


def build_chord(scale, degree, quality):
    root, idx = get_degree_note(scale, degree)

    second = scale[(idx + 1) % 7]
    third = scale[(idx + 2) % 7]
    fifth = scale[(idx + 4) % 7]

    notes = [root]

    if "sus2" in quality:
        notes.append(second)
    else:
        notes.append(third)

    notes.append(fifth)

    if "add9" in quality:
        notes.append(second)

    name = root
    if "minor" in quality:
        name += "m"
    if "sus2" in quality:
        name += "(sus2)"
    if "add9" in quality:
        name += "(add9)"

    return {
        "name": name,
        "notes": list(dict.fromkeys(notes))
    }

def apply_mode_color_to_chord(chord_notes, degree_idx, base_scale, color_scale):
    base_second = base_scale[(degree_idx + 1) % 7]
    color_second = color_scale[(degree_idx + 1) % 7]

    new_notes = []

    for note in chord_notes:
        if note == base_second:
            new_notes.append(color_second)
        else:
            new_notes.append(note)

    # If second not present, inject modal tone
    if base_second not in chord_notes and color_second not in new_notes:
        new_notes.append(color_second)

    return list(dict.fromkeys(new_notes))


def resolve_drone(scale, degree, drone_type):
    root, idx = get_degree_note(scale, degree)
    fifth = scale[(idx + 4) % 7]

    if drone_type == "root":
        return [root]
    elif drone_type == "root+fifth":
        return [root, fifth]
    elif drone_type == "root+fifth+octave":
        return [root, fifth, root]

    return [root]

