
from dataclasses import dataclass

@dataclass
class Section:
    id: str
    name: str
    description: str
    intro_track_length_seconds: float
    main_track_length_seconds: float
    outro_track_length_seconds: float
    tool_id: str