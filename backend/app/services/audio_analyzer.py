"""
AudioAnalyzer
=============
Responsible for:
  - Loading audio from disk (mono + stereo)
  - Computing RMS envelope
  - Computing spectral flux
  - Computing spectral centroid
"""

import numpy as np
import librosa

from app.core.config import ANALYSIS_HOP_MS
from app.core.logging_config import get_logger
from app.models.audio import AudioData, AudioFeatures, FeatureEnvelope

logger = get_logger(__name__)


class AudioAnalyzer:
    """Loads and analyses audio tracks, producing normalised feature envelopes."""

    def __init__(self, hop_ms: int = ANALYSIS_HOP_MS) -> None:
        self.hop_ms = hop_ms

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def load(self, file_path: str) -> AudioData:
        """
        Load audio from *file_path*, preserving original channel layout for
        rendering while producing a mono mix for analysis.

        Returns
        -------
        AudioData
            mono_audio   : shape (samples,)
            render_audio : shape (channels, samples)
        """
        logger.info(f"Loading audio: {file_path}")

        audio, sr = librosa.load(file_path, sr=None, mono=False)

        if audio.ndim == 1:
            logger.info("Mono audio detected")
            mono_audio = audio
            render_audio = audio[np.newaxis, :]
        else:
            logger.info(f"Multi-channel audio detected: {audio.shape[0]} channels")
            render_audio = audio
            mono_audio = np.mean(audio, axis=0)

        duration = len(mono_audio) / sr

        logger.info(f"Sample rate  = {sr}")
        logger.info(f"Duration     = {duration:.2f} sec")

        return AudioData(
            mono_audio=mono_audio,
            render_audio=render_audio,
            sr=sr,
            duration=duration,
        )

    def extract_features(self, audio_data: AudioData) -> AudioFeatures:
        """Compute all three feature envelopes for a loaded track."""
        return AudioFeatures(
            rms=self._compute_rms(audio_data.mono_audio, audio_data.sr),
            flux=self._compute_spectral_flux(audio_data.mono_audio, audio_data.sr),
            centroid=self._compute_spectral_centroid(audio_data.mono_audio, audio_data.sr),
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _analysis_params(self, sr: int) -> tuple[int, int]:
        hop_length = int(sr * self.hop_ms / 1000)
        frame_length = hop_length * 2
        return frame_length, hop_length

    @staticmethod
    def _normalize(x: np.ndarray) -> np.ndarray:
        max_val = np.max(x)
        if max_val <= 1e-8:
            return np.zeros_like(x)
        return x / max_val

    def _compute_rms(self, audio: np.ndarray, sr: int) -> FeatureEnvelope:
        """RMS energy envelope sampled every ~hop_ms ms."""
        logger.info("Computing RMS envelope...")

        frame_length, hop_length = self._analysis_params(sr)

        rms = librosa.feature.rms(
            y=audio,
            frame_length=frame_length,
            hop_length=hop_length,
        )[0]

        rms = self._normalize(rms)
        times = librosa.frames_to_time(
            np.arange(len(rms)), sr=sr, hop_length=hop_length
        )

        return FeatureEnvelope(times=times, values=rms)

    def _compute_spectral_flux(self, audio: np.ndarray, sr: int) -> FeatureEnvelope:
        """
        Spectral flux — positive spectral changes between consecutive frames.
        Acts as a proxy for rhythmic activity / texture density.
        """
        logger.info("Computing spectral flux...")

        frame_length, hop_length = self._analysis_params(sr)

        S = np.abs(librosa.stft(audio, n_fft=frame_length, hop_length=hop_length))
        flux = np.sum(np.maximum(S[:, 1:] - S[:, :-1], 0), axis=0)
        flux = np.concatenate([[0], flux])
        flux = self._normalize(flux)

        times = librosa.frames_to_time(
            np.arange(len(flux)), sr=sr, hop_length=hop_length
        )

        return FeatureEnvelope(times=times, values=flux)

    def _compute_spectral_centroid(self, audio: np.ndarray, sr: int) -> FeatureEnvelope:
        """
        Spectral centroid — brightness estimate.
        Useful to distinguish regions with same loudness but different tonal colour.
        """
        logger.info("Computing spectral centroid...")

        frame_length, hop_length = self._analysis_params(sr)

        centroid = librosa.feature.spectral_centroid(
            y=audio,
            sr=sr,
            n_fft=frame_length,
            hop_length=hop_length,
        )[0]

        centroid = self._normalize(centroid)
        times = librosa.frames_to_time(
            np.arange(len(centroid)), sr=sr, hop_length=hop_length
        )

        return FeatureEnvelope(times=times, values=centroid)
