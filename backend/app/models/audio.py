from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

import numpy as np
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Internal dataclasses (used within the service layer only)
# ---------------------------------------------------------------------------

@dataclass
class AudioData:
    """Raw audio loaded from disk."""

    mono_audio: np.ndarray      # shape: (samples,) — used for analysis
    render_audio: np.ndarray    # shape: (channels, samples) — used for rendering
    sr: int
    duration: float


@dataclass
class TimingGrid:
    """Musical timing computed from BPM."""

    bpm: float
    beat_sec: float
    bar_sec: float
    phrase_sec: float


@dataclass
class FeatureEnvelope:
    """A time-aligned feature envelope sampled at fixed intervals."""

    times: np.ndarray   # shape: (frames,)
    values: np.ndarray  # shape: (frames,)


@dataclass
class AudioFeatures:
    """All extracted spectral/amplitude features for a track."""

    rms: FeatureEnvelope
    flux: FeatureEnvelope
    centroid: FeatureEnvelope


@dataclass
class PhraseScore:
    """Per-phrase analysis result."""

    phrase: int
    start: float
    end: float
    mean_rms: float
    mean_flux: float
    mean_centroid: float
    score: float


@dataclass
class AnalysisResult:
    """Complete analysis output from the analysis pipeline."""

    timing: TimingGrid
    audio: AudioData
    features: AudioFeatures
    phrase_scores: List[PhraseScore]
    ranked_exits: List[PhraseScore]
    seam_score: float
    seam_quality: str
    num_loops: int


@dataclass
class RenderResult:
    """Output from the rendering pipeline."""

    output_path: str
    final_duration: float
    target_delta: float


# ---------------------------------------------------------------------------
# Pydantic request / response models (used by the API layer)
# ---------------------------------------------------------------------------

class LoopRequest(BaseModel):
    input_path: str = Field(
        ...,
        description="Absolute path to the input audio file on this machine",
    )
    output_path: str = Field(
        ...,
        description="Absolute path where the output audio file will be written",
    )
    bpm: int = Field(..., gt=0, le=300, description="BPM of the track")
    target_length_secs: float = Field(
        ..., gt=0, description="Desired final duration in seconds"
    )


class PhraseScoreResponse(BaseModel):
    phrase: int
    start: float
    end: float
    mean_rms: float
    mean_flux: float
    mean_centroid: float
    score: float


class LoopResponse(BaseModel):
    output_path: str
    final_duration: float
    target_delta: float
    num_loops: int
    seam_score: float
    seam_quality: str
    phrase_scores: List[PhraseScoreResponse]


class ErrorResponse(BaseModel):
    error: str
    detail: str
