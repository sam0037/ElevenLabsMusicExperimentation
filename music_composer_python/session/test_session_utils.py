from music_composer_python.session.session import Session
from music_composer_python.session.section import Section
from music_composer_python.session.session_global_parameters import SessionGlobalParameters

def get_sample_session_1() -> Session:
    return Session(
        id="session_001",
        name="Morning Meditation",
        description="A calming session to start your day.",
        sections=[
            Section(
                id="section_001",
                name="Introduction",
                description="Guided breathing exercise.",
                intro_track_length_seconds=60,
                main_track_length_seconds=0,
                outro_track_length_seconds=0,
                tool_id="breathing_exercise"
            ),
            Section(
                id="section_002",
                name="Main Practice",
                description="Ambient music for meditation.",
                intro_track_length_seconds=0,
                main_track_length_seconds=600,
                outro_track_length_seconds=0,
                tool_id="ambient_music"
            ),
            Section(
                id="section_003",
                name="Closing",
                description="Guided gratitude reflection.",
                intro_track_length_seconds=0,
                main_track_length_seconds=120,
                outro_track_length_seconds=0,
                tool_id="gratitude_reflection"
            )
        ],
        global_parameters=SessionGlobalParameters(
            key="C",
            artist_id="artist_001",
            ambient_track_id="rain_001",
            fade_in_seconds=5.0,
            fade_out_seconds=5.0
        )
    )