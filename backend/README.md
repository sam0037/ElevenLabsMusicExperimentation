# Loop Track Extension API

A Python backend that extends a base audio track to a desired duration by intelligently looping and crossfading musical phrases.

## Project Structure

```
backend/
├── requirements.txt
├── controller.py               # CLI client
└── app/
    ├── main.py                 # FastAPI entry point
    ├── core/
    │   ├── config.py           # Tunable constants
    │   └── logging_config.py   # Logging setup
    ├── models/
    │   └── audio.py            # Dataclasses (internal) + Pydantic models (API)
    ├── services/
    │   ├── audio_analyzer.py   # Load audio + extract RMS / flux / centroid features
    │   ├── phrase_scorer.py    # Timing grid, phrase scoring, seam score, exit selection
    │   ├── loop_builder.py     # Crossfade, loop assembly, fades, normalise, save
    │   └── loop_service.py     # Orchestrates the full pipeline
    └── api/routes/
        └── loop.py             # POST /api/loop/generate
```

## Setup

```bash
cd backend
pip install -r requirements.txt
```

## Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API docs are available at `http://localhost:8000/docs` once the server is running.

---

## API Reference

### `POST /api/loop/generate`

Extends a base `.wav` file to the requested duration.

**Request body**

| Field                | Type    | Required | Description                                          |
|----------------------|---------|----------|------------------------------------------------------|
| `input_path`         | string  | ✓        | Absolute path to the input `.wav` file               |
| `output_path`        | string  | ✓        | Absolute path where the output `.wav` will be saved  |
| `bpm`                | integer | ✓        | Tempo of the track in beats per minute               |
| `target_length_secs` | float   | ✓        | Desired total duration in seconds                    |

```bash
curl -X POST http://localhost:8000/api/loop/generate \
  -H "Content-Type: application/json" \
  -d '{
    "input_path":  "/absolute/path/to/input.wav",
    "output_path": "/absolute/path/to/output.wav",
    "bpm": 80,
    "target_length_secs": 900
  }'
```

**Response `200 OK`**

```json
{
  "output_path": "/absolute/path/to/output.wav",
  "final_duration": 912.0,
  "target_delta": 12.0,
  "num_loops": 19,
  "seam_score": 0.0821,
  "seam_quality": "excellent",
  "phrase_scores": [
    {
      "phrase": 1,
      "start": 0.0,
      "end": 12.0,
      "mean_rms": 0.312,
      "mean_flux": 0.271,
      "mean_centroid": 0.198,
      "score": 0.2782
    }
  ]
}
```

| Field            | Description                                               |
|------------------|-----------------------------------------------------------|
| `final_duration` | Actual duration of the output file in seconds             |
| `target_delta`   | `final_duration − target_length_secs` (positive = over)  |
| `num_loops`      | Number of loop iterations used                            |
| `seam_score`     | Head-vs-tail feature distance (lower = smoother loop)     |
| `seam_quality`   | `excellent` / `good` / `acceptable` / `poor`              |
| `phrase_scores`  | Per-phrase energy / activity scores used for exit selection |

**Error responses**

| Status | Condition                                                                   |
|--------|-----------------------------------------------------------------------------|
| `400`  | Invalid input (non-absolute path, track not aligned to phrase grid, etc.)   |
| `404`  | Input file not found                                                        |
| `500`  | Unexpected processing error                                                 |

---

### `GET /health`

```bash
curl http://localhost:8000/health
```

```json
{ "status": "ok" }
```

---

## CLI Controller

`controller.py` is a command-line client that talks to the running API server.

### Generate a looped track

```bash
python controller.py generate \
  --input  /absolute/path/to/input.wav \
  --output /absolute/path/to/output.wav \
  --bpm    80 \
  --target 900
```

Add `--json` to also print the raw JSON response:

```bash
python controller.py generate \
  --input  /absolute/path/to/input.wav \
  --output /absolute/path/to/output.wav \
  --bpm    80 \
  --target 900 \
  --json
```

### Check server health

```bash
python controller.py health
```

### Use a custom server address

```bash
python controller.py --server http://localhost:9000 generate \
  --input  /absolute/path/to/input.wav \
  --output /absolute/path/to/output.wav \
  --bpm    80 \
  --target 900
```

### All options

```
usage: controller [-h] [--server URL] {generate,health} ...

positional arguments:
  generate    Generate a looped track
  health      Check API server health

options:
  --server URL   Base URL of the API server (default: http://localhost:8000)

generate options:
  --input  PATH   Path to the input .wav file
  --output PATH   Path where the output .wav file will be written
  --bpm    BPM    Tempo in beats per minute
  --target SECS   Desired total duration in seconds
  --json          Also print the raw JSON response
```

---

## Track requirements

- Format: `.wav` (mono or stereo)
- Rhythm: 4/4 time
- BPM: must be known and accurate
- Duration: must be an exact multiple of the phrase length (`4 bars = 4 × (4 × 60/bpm)` seconds)
- Minimum: at least 2 phrases

**Example** — BPM 80:
- Beat = 0.75 s, Bar = 3.0 s, Phrase = 12.0 s
- Valid track durations: 24 s, 36 s, 48 s, …

---

## Design overview

- `AudioAnalyzer` — pure audio I/O and signal analysis
- `PhraseScorer` — all musical timing and scoring logic (timing grid, phrase scores, seam score, loop count, exit selection)
- `LoopBuilder` — pure DSP rendering (crossfades, fades, normalisation, file save)
- `LoopService` — thin orchestrator; the only class that knows the full pipeline order
- Both `input_path` and `output_path` are resolved to absolute paths in the controller before sending, and validated server-side against the local filesystem