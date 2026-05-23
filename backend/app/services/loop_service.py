"""
LoopService
===========
Top-level orchestrator that wires together AudioAnalyzer, PhraseScorer,
and LoopBuilder to produce a final looped track from a request.
"""

from __future__ import annotations

import os

from app.core.logging_config import get_logger
from app.models.audio import (
    AnalysisResult,
    LoopRequest,
    LoopResponse,
    PhraseScoreResponse,
    RenderResult,
)
from app.services.audio_analyzer import AudioAnalyzer
from app.services.loop_builder import LoopBuilder
from app.services.phrase_scorer import PhraseScorer

logger = get_logger(__name__)


class LoopService:
    """Orchestrates the full track-loop-extension pipeline."""

    def __init__(self) -> None:
        self._analyzer = AudioAnalyzer()
        self._scorer = PhraseScorer()
        self._builder = LoopBuilder()

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def generate(self, request: LoopRequest) -> LoopResponse:
        """
        Run the full pipeline for *request* and return a structured response.

        Raises
        ------
        FileNotFoundError
            If the input file does not exist.
        ValueError
            If the track fails validation or no exit candidates are found.
        """
        self._validate_paths(request.input_path, request.output_path)

        logger.info("===== Track Loop Extension – start =====")

        analysis = self._analyse(request)
        render = self._render(request, analysis)

        logger.info("===== Track Loop Extension – complete =====")

        return LoopResponse(
            output_path=render.output_path,
            final_duration=render.final_duration,
            target_delta=render.target_delta,
            num_loops=analysis.num_loops,
            seam_score=analysis.seam_score,
            seam_quality=analysis.seam_quality,
            phrase_scores=[
                PhraseScoreResponse(
                    phrase=p.phrase,
                    start=p.start,
                    end=p.end,
                    mean_rms=p.mean_rms,
                    mean_flux=p.mean_flux,
                    mean_centroid=p.mean_centroid,
                    score=p.score,
                )
                for p in analysis.phrase_scores
            ],
        )

    # ------------------------------------------------------------------
    # Private pipeline stages
    # ------------------------------------------------------------------

    def _analyse(self, request: LoopRequest) -> AnalysisResult:
        """Stage 1 – load audio and run all analysis."""

        audio = self._analyzer.load(request.input_path)
        timing = self._scorer.compute_timing_grid(request.bpm)

        self._scorer.validate_track(audio.duration, timing.phrase_sec)

        features = self._analyzer.extract_features(audio)

        phrase_scores, ranked_exits = self._scorer.score_phrases(
            audio.duration, timing.phrase_sec, features
        )

        seam_score, seam_quality = self._scorer.compute_seam_score(
            audio.duration, timing.phrase_sec, features
        )

        num_loops = self._scorer.compute_loop_count(
            audio.duration, timing.phrase_sec, request.target_length_secs
        )

        return AnalysisResult(
            timing=timing,
            audio=audio,
            features=features,
            phrase_scores=phrase_scores,
            ranked_exits=ranked_exits,
            seam_score=seam_score,
            seam_quality=seam_quality,
            num_loops=num_loops,
        )

    def _render(self, request: LoopRequest, analysis: AnalysisResult) -> RenderResult:
        """Stage 2 – build looped track, trim, fade, normalise, and save."""

        sr = analysis.audio.sr
        phrase_sec = analysis.timing.phrase_sec
        fade_samples = int(phrase_sec * sr)

        merged = self._builder.build_looped_track(
            analysis.audio.render_audio,
            analysis.num_loops,
            fade_samples,
        )

        merged_duration = merged.shape[1] / sr
        logger.info(f"Merged duration before trimming = {merged_duration:.2f} sec")

        exit_sec = self._scorer.select_exit_point(
            merged_duration,
            phrase_sec,
            request.target_length_secs,
            analysis.phrase_scores,
        )

        exit_sample = int(exit_sec * sr)
        trimmed = merged[:, :exit_sample]

        trimmed = self._builder.apply_entry_fade(trimmed, fade_samples)
        trimmed = self._builder.apply_exit_fade(trimmed, fade_samples)
        trimmed = self._builder.peak_normalize(trimmed)

        self._builder.save(trimmed, sr, request.output_path)

        final_duration = trimmed.shape[1] / sr
        target_delta = final_duration - request.target_length_secs

        logger.info(f"Final duration = {final_duration:.2f} sec")
        logger.info(f"Target delta   = {target_delta:.2f} sec")

        return RenderResult(
            output_path=request.output_path,
            final_duration=final_duration,
            target_delta=target_delta,
        )

    # ------------------------------------------------------------------
    # Path validation
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_paths(input_path: str, output_path: str) -> None:
        if not os.path.isabs(input_path):
            raise ValueError(f"input_path must be absolute: {input_path!r}")
        if not os.path.isfile(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path!r}")

        if not os.path.isabs(output_path):
            raise ValueError(f"output_path must be absolute: {output_path!r}")

        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.isdir(output_dir):
            raise ValueError(
                f"Output directory does not exist: {output_dir!r}"
            )
