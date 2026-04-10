from dataclasses import dataclass

# =========================================================
# DATA MODEL
# =========================================================

'''
| Symbol | Dimension  | Range   |
| ------ | ---------- | ------- |
| v      | Valence    | [-1, 1] |
| a      | Arousal    | [0, 1]  |
| b      | Brightness | [0, 1]  |
| t      | Tension    | [0, 1]  |
| d      | Density    | [0, 1]  |
| m      | Movement   | [0, 1]  |
'''
@dataclass
class EmotionalState:
    v: float
    a: float
    b: float
    t: float
    d: float
    m: float