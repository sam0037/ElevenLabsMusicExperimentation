# Analysis frame hop size in milliseconds
ANALYSIS_HOP_MS: int = 100

# Minimum phrases required in a track
MIN_PHRASES: int = 2

# Default BPM if not provided
DEFAULT_BPM: int = 80

# Default target length in seconds
DEFAULT_TARGET_LENGTH_SECS: float = 180.0

# Equal-power crossfade overlap peak safety threshold before local attenuation
CROSSFADE_PEAK_THRESHOLD: float = 1.5

# Target peak for final peak normalization
PEAK_NORMALIZE_TARGET: float = 0.99

# Phrase score weights
PHRASE_SCORE_WEIGHT_RMS: float = 0.4
PHRASE_SCORE_WEIGHT_FLUX: float = 0.4
PHRASE_SCORE_WEIGHT_CENTROID: float = 0.2

# Seam score weights
SEAM_SCORE_WEIGHT_RMS: float = 0.4
SEAM_SCORE_WEIGHT_FLUX: float = 0.4
SEAM_SCORE_WEIGHT_CENTROID: float = 0.2

# Exit selection window: look this many phrases past target before falling back
EXIT_WINDOW_PHRASES: int = 2

# Seam quality thresholds
SEAM_QUALITY_EXCELLENT: float = 0.10
SEAM_QUALITY_GOOD: float = 0.20
SEAM_QUALITY_ACCEPTABLE: float = 0.35
