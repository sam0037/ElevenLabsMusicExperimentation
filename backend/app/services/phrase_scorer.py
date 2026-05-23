"""
PhraseScorer
============
Responsible for:
  - Validating track length against phrase boundaries
  - Scoring each phrase by energy / activity / brightness
  - Computing the seam compatibility score (head vs tail)
  - Computing the musical timing grid from BPM
"""

from __future__ import annotations

import math
from typing import List, Tuple

import numpy as np

from app.core.config import (
    EXIT_WINDOW_PHRASES,
    MIN_PHRASES,
    PHRASE_SCORE_WEIGHT_CENTROID,
    PHRASE_SCORE_WEIGHT_FLUX,
    PHRASE_SCORE_WEIGHT_RMS,
    SEAM_QUALITY_ACCEPTABLE,
    SEAM_QUALITY_EXCELLENT,
    SEAM_QUALITY_GOOD,
    SEAM_SCORE_WEIGHT_CENTROID,
    SEAM_SCORE_WEIGHT_FLUX,
    SEAM_SCORE_WEIGHT_RMS,
)
from app.core.logging_config import get_logger
from app.models.audio import AudioFeatures, FeatureEnvelope, PhraseScore, TimingGrid

logger = get_logger(__name__)


class PhraseScorer:
    """Analyses musical phrase structure and scores each phrase."""

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def compute_timing_grid(self, bpm: float) -> TimingGrid:
        """Return beat / bar / phrase durations for 4/4 time."""
        beat_sec = 60.0 / bpm
        bar_sec = beat_sec * 4
        phrase_sec = bar_sec * 4

        logger.info(f"Beat duration   = {beat_sec:.3f} sec")
        logger.info(f"Bar duration    = {bar_sec:.3f} sec")
        logger.info(f"Phrase duration = {phrase_sec:.3f} sec")

        return TimingGrid(
            bpm=bpm,
            beat_sec=beat_sec,
            bar_sec=bar_sec,
            phrase_sec=phrase_sec,
        )

    def validate_track(self, duration: float, phrase_sec: float) -> int:
        """
        Ensure the track length aligns to phrase boundaries and meets the
        minimum phrase count requirement.

        Returns the number of phrases in the track.
        """
        ratio = duration / phrase_sec

        if not np.isclose(ratio, round(ratio), atol=1e-2):
            raise ValueError(
                f"Track duration ({duration:.3f} sec) is not aligned to phrase "
                f"duration ({phrase_sec:.3f} sec). "
                f"Ratio = {ratio:.4f}"
            )

        num_phrases = int(round(ratio))

        if num_phrases < MIN_PHRASES:
            raise ValueError(
                f"Track must contain at least {MIN_PHRASES} phrases; "
                f"found {num_phrases}"
            )

        logger.info(f"Phrase count = {num_phrases}")
        return num_phrases

    def score_phrases(
        self,
        duration: float,
        phrase_sec: float,
        features: AudioFeatures,
    ) -> Tuple[List[PhraseScore], List[PhraseScore]]:
        """
        Compute per-phrase feature statistics and produce a ranked exit list.

        Returns
        -------
        (phrase_scores, ranked_exits)
            phrase_scores  : scores in track order
            ranked_exits   : sorted ascending by score (best exit candidates first)
        """
        logger.info("Computing phrase scores...")

        num_phrases = int(round(duration / phrase_sec))
        phrase_scores: List[PhraseScore] = []

        for i in range(num_phrases):
            start = i * phrase_sec
            end = (i + 1) * phrase_sec

            mean_rms = self._region_mean(features.rms, start, end)
            mean_flux = self._region_mean(features.flux, start, end)
            mean_centroid = self._region_mean(features.centroid, start, end)

            score = (
                PHRASE_SCORE_WEIGHT_RMS * mean_rms
                + PHRASE_SCORE_WEIGHT_FLUX * mean_flux
                + PHRASE_SCORE_WEIGHT_CENTROID * mean_centroid
            )

            phrase_scores.append(
                PhraseScore(
                    phrase=i + 1,
                    start=start,
                    end=end,
                    mean_rms=mean_rms,
                    mean_flux=mean_flux,
                    mean_centroid=mean_centroid,
                    score=score,
                )
            )

            logger.info(
                f"Phrase {i + 1}: score={score:.4f} | "
                f"rms={mean_rms:.3f}  flux={mean_flux:.3f}  centroid={mean_centroid:.3f}"
            )

        ranked_exits = sorted(phrase_scores, key=lambda p: p.score)

        logger.info("Candidate exits ranked (lowest score first):")
        for p in ranked_exits:
            logger.info(f"  Phrase {p.phrase} -> score={p.score:.4f}")

        return phrase_scores, ranked_exits

    def compute_seam_score(
        self,
        duration: float,
        phrase_sec: float,
        features: AudioFeatures,
    ) -> Tuple[float, str]:
        """
        Measure how well the track tail can loop into the track head by
        comparing feature envelopes of the first and last phrases.

        Returns
        -------
        (seam_score, seam_quality)
        """
        logger.info("Computing seam score (head vs tail)...")

        head_rms = self._extract_region(features.rms, 0, phrase_sec)
        tail_rms = self._extract_region(features.rms, duration - phrase_sec, duration)

        head_flux = self._extract_region(features.flux, 0, phrase_sec)
        tail_flux = self._extract_region(features.flux, duration - phrase_sec, duration)

        head_centroid = self._extract_region(features.centroid, 0, phrase_sec)
        tail_centroid = self._extract_region(features.centroid, duration - phrase_sec, duration)

        min_len = min(
            len(head_rms), len(tail_rms),
            len(head_flux), len(tail_flux),
            len(head_centroid), len(tail_centroid),
        )

        if min_len == 0:
            logger.warning("Seam feature regions are empty — assigning worst seam score")
            return 1.0, "poor"

        rms_diff = float(np.mean(np.abs(head_rms[:min_len] - tail_rms[:min_len])))
        flux_diff = float(np.mean(np.abs(head_flux[:min_len] - tail_flux[:min_len])))
        centroid_diff = float(
            np.mean(np.abs(head_centroid[:min_len] - tail_centroid[:min_len]))
        )

        seam_score = (
            SEAM_SCORE_WEIGHT_RMS * rms_diff
            + SEAM_SCORE_WEIGHT_FLUX * flux_diff
            + SEAM_SCORE_WEIGHT_CENTROID * centroid_diff
        )

        seam_quality = self._classify_seam(seam_score)

        logger.info(f"Seam score   = {seam_score:.4f}  ({seam_quality})")
        logger.info(
            f"Seam diffs   -> rms={rms_diff:.4f}  "
            f"flux={flux_diff:.4f}  centroid={centroid_diff:.4f}"
        )

        return seam_score, seam_quality

    def compute_loop_count(
        self, track_length: float, phrase_sec: float, target_length: float
    ) -> int:
        """
        Compute the number of loop iterations required.

        Each additional loop gains (track_length - phrase_sec) seconds because
        the fade region overlaps by one phrase.
        """
        fade_sec = phrase_sec
        effective_loop_gain = track_length - fade_sec

        if target_length <= track_length:
            loops = 1
        else:
            loops = math.ceil(
                (target_length - track_length) / effective_loop_gain
            ) + 1

        logger.info(f"Effective loop gain = {effective_loop_gain:.2f} sec")
        logger.info(f"Num loops required  = {loops}")

        return loops

    def select_exit_point(
        self,
        merged_duration: float,
        phrase_sec: float,
        target_length: float,
        phrase_scores: List[PhraseScore],
    ) -> float:
        """
        Choose the best phrase boundary exit >= target_length within the merged track.

        Selection rules:
        1. Only consider phrase boundaries >= target_length.
        2. Search window: target → target + EXIT_WINDOW_PHRASES phrases.
        3. Rank by (score asc, boundary asc) and pick the best.
        4. Fall back to the nearest boundary if window is empty.
        """
        logger.info("Selecting final exit point...")

        total_phrases = int(round(merged_duration / phrase_sec))
        if total_phrases <= 0:
            raise ValueError("Merged track produced invalid phrase count")

        logger.info(f"Merged phrase count = {total_phrases}")

        base_count = len(phrase_scores)
        candidates = []

        for i in range(total_phrases):
            boundary = (i + 1) * phrase_sec
            if boundary >= target_length:
                score = phrase_scores[i % base_count].score
                candidates.append(
                    {"phrase": i + 1, "boundary": boundary, "score": score}
                )

        if not candidates:
            raise ValueError("No valid exit candidates found in merged track")

        window_end = target_length + EXIT_WINDOW_PHRASES * phrase_sec
        windowed = [c for c in candidates if c["boundary"] <= window_end]

        if not windowed:
            windowed = [min(candidates, key=lambda c: c["boundary"])]

        ranked = sorted(windowed, key=lambda c: (c["score"], c["boundary"]))

        logger.info("Candidate exits in merged track:")
        for c in ranked:
            logger.info(
                f"  Phrase {c['phrase']} -> boundary={c['boundary']:.2f}s  "
                f"score={c['score']:.4f}"
            )

        selected = ranked[0]
        logger.info(f"Selected exit = {selected['boundary']:.2f} sec")

        return float(selected["boundary"])

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _mask(envelope: FeatureEnvelope, start: float, end: float) -> np.ndarray:
        return (envelope.times >= start) & (envelope.times < end)

    def _region_mean(
        self, envelope: FeatureEnvelope, start: float, end: float
    ) -> float:
        mask = self._mask(envelope, start, end)
        return float(np.mean(envelope.values[mask])) if np.any(mask) else 0.0

    def _extract_region(
        self, envelope: FeatureEnvelope, start: float, end: float
    ) -> np.ndarray:
        mask = self._mask(envelope, start, end)
        return envelope.values[mask]

    @staticmethod
    def _classify_seam(score: float) -> str:
        if score < SEAM_QUALITY_EXCELLENT:
            return "excellent"
        if score < SEAM_QUALITY_GOOD:
            return "good"
        if score < SEAM_QUALITY_ACCEPTABLE:
            return "acceptable"
        return "poor"
