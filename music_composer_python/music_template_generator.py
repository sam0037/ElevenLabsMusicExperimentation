
from emotional_space import FEELINGS
from emotional_space_functions import (
    generate_trajectory,
    get_mode_color,
    get_chord_quality,
    get_percussion,
    get_layers,
    map_expression
)
from musical_functions import (
    build_scale,
    get_degree_note,
    build_chord,
    apply_mode_color_to_chord,
    resolve_drone
)
from select_instruments import select_instruments

def generate_music_template(feeling, key, tempo = 60,section_duration_ms = 16000, dump_debug=False):
    # We have 4 sections per plan, so we would have duration = 4*section_duration_ms for the whole piece
    # if the total_duration_ms is less than 2 minutes then multiply the section_duration_ms accordingly to reach at least 2 minutes total duration
    total_duration_ms = 4 * section_duration_ms
    if total_duration_ms < 120000:
        multiplier = 120000 / total_duration_ms
        section_duration_ms = int(section_duration_ms * multiplier)

    config = FEELINGS[feeling]
    states = generate_trajectory(config["region"])

    base_mode = config["base_mode"]
    progression = config["progression"]

    base_scale = build_scale(key, base_mode)

    sections = []

    for i, s in enumerate(states):
        degree = progression[i]

        mode_color = get_mode_color(s.v, s.t)

        base_scale = build_scale(key, base_mode)
        color_scale = build_scale(key, mode_color)

        quality = get_chord_quality(s)
        chord_data = build_chord(base_scale, degree, quality)

        _, idx = get_degree_note(base_scale, degree)

        colored_notes = apply_mode_color_to_chord(
            chord_data["notes"],
            idx,
            base_scale,
            color_scale
        )

        chord = {
            "name": chord_data["name"],
            "notes": colored_notes
        }

        drone_type = "root" if i in [0, 3] else "root+fifth"
        drone = resolve_drone(base_scale, degree, drone_type)

        bass, _ = get_degree_note(base_scale, degree)

        instrument_plan = select_instruments(s, feeling_hint=feeling, dump_debug=dump_debug)

        sections.append({
            "section": f"s{i+1}",
            "instrumental": True,
            "lines": [],
            "degree": degree,
            "modeColor": mode_color,
            "chord": chord,
            "drone": drone,
            "bass": bass,
            "layers": get_layers(s.d),
            "percussion": get_percussion(s.a),
            "brightness": round(s.b, 2),
            "density": round(s.d, 2),
            "movement": round(s.m, 2),
            "expression": map_expression(s),
            "instruments": instrument_plan,
            "duration_ms": section_duration_ms
        })

    return {
        "name": f"{feeling}_{key}_{tempo}_{section_duration_ms}",
        "instrumental_only": True,
        "loopable": True,
        "feeling": feeling,
        "key": key,
        "bpm": tempo,
        "timeSignature": "4/4",
        "harmony": {
            "modeBase": base_mode,
            "scale": base_scale,
            "progression": progression
        },
        "sections": sections
    }