from dataclasses import dataclass, field
from typing import Dict, Tuple

@dataclass(frozen=True)
class InstrumentProfile:
    name: str
    category: str
    tags: Tuple[str, ...] = ()
    base_weight: float = 1.0
    targets: Dict[str, float] = field(default_factory=dict)
    weights: Dict[str, float] = field(default_factory=dict)