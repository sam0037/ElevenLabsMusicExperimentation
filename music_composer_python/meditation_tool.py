from dataclasses import dataclass
import json

'''
{
  "somatic_tools": [
    {
      "id": "PHYSIOLOGICAL_SIGH",
      "nervous_system_direction": "strong_down",
      "description": "A double inhale followed by a long exhale that rapidly reduces stress and emotional activation.",
      "preferred_music_styles": ["Classic Calm Ambient", "Deep Drone Meditation"],
      "tempo_range_bpm": [48, 60],
      "texture_density": "very_low"
    },
  ],
  "psychology_tools": [
    {
      "id": "SELF_COMPASSION_PAUSE",
      "nervous_system_direction": "down",
      "description": "Practice to reduce self-criticism and threat response through kindness.",
      "preferred_music_styles": ["Classic Calm Ambient", "Gentle Harp Meditation"],
      "tempo_range_bpm": [50, 65],
      "texture_density": "low"
    },
  ]
}
'''

@dataclass
class MeditationTool:
    id: str
    nervous_system_direction: str
    description: str
    preferred_music_styles: list
    tempo_range_bpm: tuple
    texture_density: str
    tool_type: str  # "somatic" or "psychology"

    def to_dict(self):
        return {
            "id": self.id,
            "nervous_system_direction": self.nervous_system_direction,
            "description": self.description,
            "preferred_music_styles": self.preferred_music_styles,
            "tempo_range_bpm": self.tempo_range_bpm,
            "texture_density": self.texture_density,
            "tool_type": self.tool_type
        }

def get_meditation_tool_by_id(tool_id: str) -> MeditationTool | None:
    tools = get_all_meditation_tools()
    for tool in tools:
        if tool.id == tool_id:
            return tool
    return None

def get_all_meditation_tools() -> list[MeditationTool]:
    
    # Read the meditation tools from the JSON file and return a list of MeditationTool instances
    with open('./meditation_tool.json', 'r') as f:
        data = json.load(f)

    tools = []
    for tool in data['somatic_tools']:
        tools.append(MeditationTool(
            id=tool['id'],
            nervous_system_direction=tool['nervous_system_direction'],
            description=tool['description'],
            preferred_music_styles=tool['preferred_music_styles'],
            tempo_range_bpm=tuple(tool['tempo_range_bpm']),
            texture_density=tool['texture_density'],
            tool_type='somatic'
        ))

    for tool in data['psychology_tools']:
        tools.append(MeditationTool(
            id=tool['id'],
            nervous_system_direction=tool['nervous_system_direction'],
            description=tool['description'],
            preferred_music_styles=tool['preferred_music_styles'],
            tempo_range_bpm=tuple(tool['tempo_range_bpm']),
            texture_density=tool['texture_density'],
            tool_type='psychology'
        ))

    return tools