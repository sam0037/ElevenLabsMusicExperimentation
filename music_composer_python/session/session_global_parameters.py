
from dataclasses import dataclass

@dataclass
class SessionGlobalParameters:
    key: str
    artist_id: str
    ambient_track_id: str
    fade_in_seconds: float
    fade_out_seconds: float
    