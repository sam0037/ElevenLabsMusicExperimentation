
import json
from music_template_generator import generate_music_template
from meditation_tool import get_all_meditation_tools, MeditationTool
from meditation_tool_to_music_generator import meditation_tool_to_music
import os
from pathlib import Path

if __name__ == "__main__":
    meditation_tools: list[MeditationTool] = get_all_meditation_tools()

    # List all tools and ask user to select one
    print("Available Meditation Tools:")
    for i, tool in enumerate(meditation_tools):
        print(f"{i + 1}. {tool.id} ({tool.tool_type}) - {tool.description}")
    selection = int(input("Select a meditation tool by number: ")) - 1
    selected_tool = meditation_tools[selection]

    # Generate music parameters from the selected meditation tool
    music_params = meditation_tool_to_music(selected_tool)
    feeling = music_params["feeling"]
    root = music_params["key"]
    tempo = music_params["tempo_bpm"]
    section_duration_ms = music_params["duration_4bar_ms"]/4.0
    print(f"Generated music parameters: Feeling={feeling}, Key={root}, Tempo={tempo} BPM, Section Duration={section_duration_ms} ms")

    output_dir = Path("./output")
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{selected_tool.id}_{feeling}_{root}_{tempo}_{section_duration_ms}_v1.json"
    filepath = output_dir / filename

    # Handle version naming for conflicts
    version = 1
    while filepath.exists():
        version += 1
        filepath = output_dir / f"{selected_tool.id}_{feeling}_{root}_{tempo}_{section_duration_ms}_v{version}.json"

    # Generate and save
    with open(filepath, "w") as f:
        json.dump(generate_music_template(feeling, root, tempo, section_duration_ms), f, indent=0)

    print(f"Saved to {filepath}")
    