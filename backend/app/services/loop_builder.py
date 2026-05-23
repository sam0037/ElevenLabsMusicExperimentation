"""
LoopBuilder
===========
Responsible for:
  - Generating equal-power fade curves
  - Crossfading two channel-first audio buffers
  - Building the full looped track from the base track
  - Applying entry / exit fades
  - Peak normalisation
  - Saving the final track to disk
"""

from __future__ import annotations

import numpy as np
import soundfile as sf

from app.core.config import CROSSFADE_PEAK_THRESHOLD, PEAK_NORMALIZE_TARGET
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class LoopBuilder:
    """Renders the final looped audio track."""

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def build_looped_track(
        self,
        base_track: np.ndarray,
        num_loops: int,
        fade_samples: int,
    ) -> np.ndarray:
        """
        Concatenate *num_loops* copies of *base_track* using overlap-add crossfades.

        Parameters
        ----------
        base_track   : shape (channels, samples)
        num_loops    : total number of loop iterations
        fade_samples : overlap length in samples (= 1 phrase)

        Returns
        -------
        Merged track shape (channels, samples)
        """
        logger.info("Building looped track...")

        output = base_track.copy()

        for i in range(1, num_loops):
            logger.info(f"Building loop {i + 1}/{num_loops}...")
            output = self.crossfade(output, base_track, fade_samples)

        logger.info(f"Merged track length = {output.shape[1]} samples")
        return output

    def crossfade(
        self,
        track_a: np.ndarray,
        track_b: np.ndarray,
        fade_samples: int,
    ) -> np.ndarray:
        """
        Overlap-add crossfade between two channel-first audio buffers.

        The last *fade_samples* of *track_a* fade out while the first
        *fade_samples* of *track_b* fade in; they are summed in the overlap
        region.

        Parameters
        ----------
        track_a / track_b : shape (channels, samples)
        fade_samples      : overlap region size in samples

        Returns
        -------
        Merged track shape (channels, samples)
        """
        logger.info(f"Crossfading tracks with overlap = {fade_samples} samples")

        self._validate_crossfade_inputs(track_a, track_b, fade_samples)

        fade_out, fade_in = self._equal_power_fades(fade_samples)
        fade_out = fade_out[np.newaxis, :]
        fade_in = fade_in[np.newaxis, :]

        a_head = track_a[:, :-fade_samples]
        a_tail = track_a[:, -fade_samples:]

        b_head = track_b[:, :fade_samples]
        b_rest = track_b[:, fade_samples:]

        overlap = a_tail * fade_out + b_head * fade_in

        overlap_peak = float(np.max(np.abs(overlap)))
        if overlap_peak > CROSSFADE_PEAK_THRESHOLD:
            logger.warning(
                f"Crossfade overlap unusually hot ({overlap_peak:.3f}), "
                f"applying local attenuation"
            )
            overlap = overlap * (CROSSFADE_PEAK_THRESHOLD / overlap_peak)

        merged = np.concatenate([a_head, overlap, b_rest], axis=1)

        peak_before = max(
            float(np.max(np.abs(a_tail))),
            float(np.max(np.abs(b_head))),
        )
        peak_overlap = float(np.max(np.abs(overlap)))
        mid_energy = float(np.mean(np.abs(overlap[:, fade_samples // 2])))

        logger.info(f"Crossfade midpoint energy = {mid_energy:.4f}")
        logger.info(
            f"Crossfade peak: before={peak_before:.3f}  overlap={peak_overlap:.3f}"
        )
        logger.info(f"Crossfade complete -> merged samples = {merged.shape[1]}")

        return merged

    def apply_entry_fade(self, track: np.ndarray, fade_samples: int) -> np.ndarray:
        """Equal-power fade-in from silence over the first *fade_samples* samples."""
        logger.info("Applying entry fade...")

        fade_samples = min(fade_samples, track.shape[1])
        _, fade_in = self._equal_power_fades(fade_samples)
        fade_in = fade_in[np.newaxis, :]

        logger.info(
            f"Entry fade: samples={fade_samples}  "
            f"start={fade_in[0, 0]:.3f}  end={fade_in[0, -1]:.3f}"
        )

        track = track.copy()
        track[:, :fade_samples] *= fade_in
        return track

    def apply_exit_fade(self, track: np.ndarray, fade_samples: int) -> np.ndarray:
        """Equal-power fade-out to silence over the last *fade_samples* samples."""
        logger.info("Applying exit fade...")

        fade_samples = min(fade_samples, track.shape[1])
        fade_out, _ = self._equal_power_fades(fade_samples)
        fade_out = fade_out[np.newaxis, :]

        logger.info(
            f"Exit fade: samples={fade_samples}  "
            f"start={fade_out[0, 0]:.3f}  end={fade_out[0, -1]:.3f}"
        )

        track = track.copy()
        track[:, -fade_samples:] *= fade_out
        return track

    def peak_normalize(
        self, track: np.ndarray, target_peak: float = PEAK_NORMALIZE_TARGET
    ) -> np.ndarray:
        """
        Normalize track so its peak amplitude equals *target_peak*.

        Skips normalization if the track is silent or already within 3 % of
        the target.
        """
        logger.info("Applying peak normalization...")

        pre_peak = float(np.max(np.abs(track)))
        logger.info(f"Pre-normalization peak = {pre_peak:.4f}")

        if pre_peak <= 1e-8:
            logger.warning("Track appears silent — skipping normalization")
            return track

        if pre_peak <= target_peak and pre_peak >= (target_peak * 0.97):
            logger.info(
                f"Peak already acceptable ({pre_peak:.4f}) — skipping normalization"
            )
            return track

        scale = target_peak / pre_peak
        logger.info(f"Normalization scale = {scale:.4f}")

        normalized = track * scale
        logger.info(
            f"Post-normalization peak = {float(np.max(np.abs(normalized))):.4f}"
        )
        return normalized

    def save(self, track: np.ndarray, sr: int, output_path: str) -> None:
        """
        Write *track* to *output_path*.

        soundfile expects:
          mono   -> (samples,)
          stereo -> (samples, channels)
        """
        logger.info(f"Saving output: {output_path}")

        if track.shape[0] == 1:
            out = track[0]
        else:
            out = np.transpose(track, (1, 0))

        sf.write(output_path, out, sr)
        logger.info("Save complete")

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _equal_power_fades(num_samples: int) -> tuple[np.ndarray, np.ndarray]:
        """
        Generate cosine (fade-out) and sine (fade-in) equal-power curves.

        Both curves are of length *num_samples* and span [1→0] and [0→1]
        respectively.
        """
        t = np.linspace(0, 1, num_samples)
        fade_out = np.cos((np.pi / 2) * t)
        fade_in = np.sin((np.pi / 2) * t)
        return fade_out, fade_in

    @staticmethod
    def _validate_crossfade_inputs(
        track_a: np.ndarray,
        track_b: np.ndarray,
        fade_samples: int,
    ) -> None:
        if track_a.shape[0] != track_b.shape[0]:
            raise ValueError(
                f"Channel mismatch: track_a has {track_a.shape[0]} channels, "
                f"track_b has {track_b.shape[0]} channels"
            )
        if track_a.shape[1] < fade_samples:
            raise ValueError(
                f"track_a ({track_a.shape[1]} samples) is shorter than "
                f"fade region ({fade_samples} samples)"
            )
        if track_b.shape[1] < fade_samples:
            raise ValueError(
                f"track_b ({track_b.shape[1]} samples) is shorter than "
                f"fade region ({fade_samples} samples)"
            )
