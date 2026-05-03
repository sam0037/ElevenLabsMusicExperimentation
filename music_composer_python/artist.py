from dataclasses import dataclass
import json

@dataclass
class ArtistRederingHints:
    tempo_strategy: str
    layering_strategy: str
    melody_density: str
    loop_behavior: str
    texture_curve_preference: str

@dataclass
class ArtistAdaptationRules:
    reduce_percussion_if_deep: bool
    increase_drone_if_down: bool

@dataclass
class ArtistStyle:
    name: str
    timbre_bias: list[str]
    rhythm: str
    ornamentation: str
    harmonic_behavior: str
    scale_system: str
    adaptation_rules: ArtistAdaptationRules

@dataclass
class ArtistPersona:
    harmonic_system: str
    temporal_system: str
    melodic_grammar: str
    density: str
    evolution: str
    energy: str

@dataclass
class ArtistProfile:
    id: str
    name: str
    theme: str
    theme_description: str
    description: str
    feels_like: list[str]
    best_for: list[str]
    persona: ArtistPersona
    style: ArtistStyle
    rendering_hints: ArtistRederingHints

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "theme": self.theme,
            "theme_description": self.theme_description,
            "description": self.description,
            "feels_like": self.feels_like,
            "best_for": self.best_for,
            "persona": {
                "harmonic_system": self.persona.harmonic_system,
                "temporal_system": self.persona.temporal_system,
                "melodic_grammar": self.persona.melodic_grammar,
                "density": self.persona.density,
                "evolution": self.persona.evolution,
                "energy": self.persona.energy
            },
            "style": {
                "name": self.style.name,
                "timbre_bias": self.style.timbre_bias,
                "rhythm": self.style.rhythm,
                "ornamentation": self.style.ornamentation,
                "harmonic_behavior": self.style.harmonic_behavior,
                "scale_system": self.style.scale_system,
                "adaptation_rules": {
                    "reduce_percussion_if_deep": self.style.adaptation_rules.reduce_percussion_if_deep,
                    "increase_drone_if_down": self.style.adaptation_rules.increase_drone_if_down
                }
            },
            "rendering_hints": {
                "tempo_strategy": self.rendering_hints.tempo_strategy,
                "layering_strategy": self.rendering_hints.layering_strategy,
                "melody_density": self.rendering_hints.melody_density,
                "loop_behavior": self.rendering_hints.loop_behavior,
                "texture_curve_preference": self.rendering_hints.texture_curve_preference
            }
        }

def get_artist_profile(artist_id: str) -> ArtistProfile:
    # Load the artist profile from the corresponding JSON file
    with open(f'../src/music_theory/artists/{artist_id}.json', 'r') as f:
        data = json.load(f)

    # Parse the JSON data into an ArtistProfile instance
    profile = ArtistProfile(
        id=data['id'],
        name=data['name'],
        theme=data['theme'],
        theme_description=data['theme_description'],
        description=data['description'],
        feels_like=data['feels_like'],
        best_for=data['best_for'],
        persona=ArtistPersona(**data['persona']),
        style=ArtistStyle(
            name=data['style']['name'],
            timbre_bias=data['style']['timbre_bias'],
            rhythm=data['style']['rhythm'],
            ornamentation=data['style']['ornamentation'],
            harmonic_behavior=data['style']['harmonic_behavior'],
            scale_system=data['style']['scale_system'],
            adaptation_rules=ArtistAdaptationRules(**data['style']['adaptation_rules'])
        ),
        rendering_hints=ArtistRederingHints(**data['rendering_hints'])
    )

    return profile