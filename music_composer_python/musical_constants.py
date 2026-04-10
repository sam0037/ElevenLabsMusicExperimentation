# =========================================================
# MUSIC THEORY CONSTANTS
# =========================================================

NOTE_ORDER = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]

MODE_INTERVALS = {
    "Ionian":   [0, 2, 4, 5, 7, 9, 11],
    "Aeolian":  [0, 2, 3, 5, 7, 8, 10],
    "Phrygian": [0, 1, 3, 5, 7, 8, 10],
    "Dorian":   [0, 2, 3, 5, 7, 9, 10],
    "Lydian":   [0, 2, 4, 6, 7, 9, 11],
    "Mixolydian": [0, 2, 4, 5, 7, 9, 10],
}

DEGREE_MAP = {
    "i": 0, "I": 0,
    "II": 1, "ii": 1,
    "III": 2, "iii": 2,
    "IV": 3, "iv": 3,
    "V": 4, "v": 4,
    "VI": 5, "vi": 5,
    "VII": 6, "vii": 6,
}

EMOTIONAL_FEATURES = ("v", "a", "b", "t", "d", "m")

INSTRUMENT_CATEGORIES = ("ambient", "melodic", "percussion", "texture", "others")
