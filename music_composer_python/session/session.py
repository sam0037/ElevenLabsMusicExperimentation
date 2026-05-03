
from dataclasses import dataclass
from music_composer_python.session.section import Section
from music_composer_python.session.session_global_parameters import SessionGlobalParameters

@dataclass
class Session:
    id: str
    name: str
    description: str
    sections: list[Section]
    global_parameters: SessionGlobalParameters