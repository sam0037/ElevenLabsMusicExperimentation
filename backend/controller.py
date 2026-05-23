#!/usr/bin/env python3
"""
Loop Track Controller
=====================
CLI client for the Loop Track Extension API.

Usage examples
--------------
# Start the API server first:
#   cd backend && uvicorn app.main:app --reload --port 8000

# Generate a looped track:
python controller.py generate \\
    --input  /abs/path/to/input.wav \\
    --output /abs/path/to/output.wav \\
    --bpm    80 \\
    --target 900

# Use a different server address:
python controller.py generate \\
    --input  /abs/path/to/input.wav \\
    --output /abs/path/to/output.wav \\
    --bpm    80 \\
    --target 900 \\
    --server http://localhost:8000

# Check server health:
python controller.py health
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import textwrap

import httpx

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
DEFAULT_SERVER = "http://localhost:8000"
REQUEST_TIMEOUT = 600  # seconds – audio processing can be slow


# ---------------------------------------------------------------------------
# Command handlers
# ---------------------------------------------------------------------------

def cmd_generate(args: argparse.Namespace) -> int:
    """POST /api/loop/generate and pretty-print the result."""

    input_path = os.path.abspath(args.input)
    output_path = os.path.abspath(args.output)

    payload = {
        "input_path": input_path,
        "output_path": output_path,
        "bpm": args.bpm,
        "target_length_secs": args.target,
    }

    print("\n[controller] Sending request to loop service...")
    print(f"  input_path         : {input_path}")
    print(f"  output_path        : {output_path}")
    print(f"  bpm                : {args.bpm}")
    print(f"  target_length_secs : {args.target}s")
    print(f"  server             : {args.server}\n")

    url = f"{args.server.rstrip('/')}/api/loop/generate"

    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            response = client.post(url, json=payload)
    except httpx.ConnectError:
        print(
            f"[error] Could not connect to server at {args.server!r}.\n"
            "Make sure the API server is running:\n\n"
            "  cd backend && uvicorn app.main:app --reload --port 8000\n",
            file=sys.stderr,
        )
        return 1
    except httpx.TimeoutException:
        print(
            "[error] Request timed out. "
            f"The server did not respond within {REQUEST_TIMEOUT}s.",
            file=sys.stderr,
        )
        return 1

    if response.status_code == 200:
        data = response.json()
        print("[controller] Loop generation complete!\n")
        print(f"  output_path    : {data['output_path']}")
        print(f"  final_duration : {data['final_duration']:.2f} sec")
        print(f"  target_delta   : {data['target_delta']:+.2f} sec")
        print(f"  num_loops      : {data['num_loops']}")
        print(f"  seam_score     : {data['seam_score']:.4f}")
        print(f"  seam_quality   : {data['seam_quality']}")
        print(f"\n  Phrase scores ({len(data['phrase_scores'])} phrases):")
        for p in data["phrase_scores"]:
            print(
                f"    Phrase {p['phrase']:>2}  "
                f"[{p['start']:.1f}s – {p['end']:.1f}s]  "
                f"score={p['score']:.4f}  "
                f"rms={p['mean_rms']:.3f}  "
                f"flux={p['mean_flux']:.3f}  "
                f"centroid={p['mean_centroid']:.3f}"
            )

        if args.json:
            print("\n--- JSON response ---")
            print(json.dumps(data, indent=2))

        return 0

    # Error response
    try:
        err = response.json()
        detail = err.get("detail", response.text)
    except Exception:
        detail = response.text

    print(
        f"[error] Server returned HTTP {response.status_code}:\n  {detail}",
        file=sys.stderr,
    )
    return 1


def cmd_health(args: argparse.Namespace) -> int:
    """GET /health and report server status."""

    url = f"{args.server.rstrip('/')}/health"

    try:
        with httpx.Client(timeout=10) as client:
            response = client.get(url)
    except httpx.ConnectError:
        print(
            f"[error] Could not connect to server at {args.server!r}.",
            file=sys.stderr,
        )
        return 1

    if response.status_code == 200:
        print(f"[controller] Server at {args.server!r} is healthy: {response.json()}")
        return 0

    print(
        f"[error] Server returned HTTP {response.status_code}: {response.text}",
        file=sys.stderr,
    )
    return 1


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="controller",
        description=textwrap.dedent(
            """\
            Loop Track Extension – CLI Controller

            Talks to the running FastAPI server to generate looped audio tracks.
            Both --input and --output accept relative or absolute file paths;
            they are always resolved to absolute paths before being sent to the API.
            """
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "--server",
        default=DEFAULT_SERVER,
        metavar="URL",
        help=f"Base URL of the API server (default: {DEFAULT_SERVER})",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # --- generate ---
    gen = subparsers.add_parser(
        "generate",
        help="Generate a looped track",
        description="Extend a base audio track to the requested duration.",
    )
    gen.add_argument(
        "--input", "-i",
        required=True,
        metavar="PATH",
        help="Path to the input .wav file",
    )
    gen.add_argument(
        "--output", "-o",
        required=True,
        metavar="PATH",
        help="Path where the output .wav file will be written",
    )
    gen.add_argument(
        "--bpm", "-b",
        required=True,
        type=int,
        metavar="BPM",
        help="Tempo of the track in beats per minute",
    )
    gen.add_argument(
        "--target", "-t",
        required=True,
        type=float,
        metavar="SECS",
        help="Desired total duration in seconds",
    )
    gen.add_argument(
        "--json",
        action="store_true",
        help="Also print the raw JSON response",
    )

    # --- health ---
    subparsers.add_parser(
        "health",
        help="Check API server health",
    )

    return parser


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    handlers = {
        "generate": cmd_generate,
        "health": cmd_health,
    }

    sys.exit(handlers[args.command](args))


if __name__ == "__main__":
    main()
