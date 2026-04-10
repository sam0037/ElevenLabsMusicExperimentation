# 🎼 Meditative Music Generation Framework (Formal Summary)

This document captures the **complete conceptual, mathematical, and implementation framework** for generating meditative music from emotional inputs. It is designed to be **portable**, **LLM-friendly**, and **directly implementable**.

---

# 1. Problem Definition

A meditative session is a **loopable musical structure** that:

* Starts with an emotional intent
* Sustains a **single emotional feeling**
* Evolves internally across time
* Remains **harmonically stable**
* Is **procedurally generatable**

---

# 2. Structural Model

## Session

```math
S = \{s_1, s_2, s_3, s_4\}
```

* Each section = **16 bars = 64 seconds**
* Total loop = **256 seconds**
* Loop constraint:

```math
s_4 \rightarrow s_1 \quad \text{(seamless)}
```

---

# 3. Emotional Modeling

## 3.1 Emotional Basis Vectors

Each emotional state is represented as:

```math
es = (v, a, b, t, d, m)
```

Where:

| Symbol | Dimension  | Range   |
| ------ | ---------- | ------- |
| v      | Valence    | [-1, 1] |
| a      | Arousal    | [0, 1]  |
| b      | Brightness | [0, 1]  |
| t      | Tension    | [0, 1]  |
| d      | Density    | [0, 1]  |
| m      | Movement   | [0, 1]  |

---

## 3.2 Emotional Region (Feeling)

Each **feeling F** is defined as a bounded region:

```math
R(F) = \{ (v,a,b,t,d,m) \mid v \in [v_{min}, v_{max}], ... \}
```

Example: **Dark**

```math
v \in [-0.7, -0.3]  
b \in [0.0, 0.3]  
t \in [0.4, 0.8]
```

---

## 3.3 Emotional Trajectory

Each feeling is expressed as:

```math
P(F) = \{es_1, es_2, es_3, es_4\}
```

Where:

| State | Role      |
| ----- | --------- |
| es₁   | Entry     |
| es₂   | Deepening |
| es₃   | Peak      |
| es₄   | Release   |

Constraint:

```math
\forall i,\ es_i \in R(F)
```

---

# 4. Harmony Model

## 4.1 Global Harmony

Defined once per session:

```json
"harmony": {
  "modeBase": "Aeolian",
  "scale": [...],
  "progression": ["i", "VI", "III", "VII"]
}
```

---

## 4.2 Key Principles

### ✅ Fixed Progression

```text
i → VI → III → VII
```

### ✅ Section Mapping

```math
s_i \rightarrow \text{progression}[i]
```

---

## 4.3 Mode System

* **modeBase** → harmonic foundation
* **modeColor** → local modal variation

---

# 5. Mode Color (Critical Concept)

## Definition

```text
modeColor = controlled modal deviation
```

NOT:

* key change ❌
* scale replacement ❌

BUT:

* interval modification ✅

---

## Example

C Aeolian vs C Phrygian:

| Degree | Aeolian | Phrygian |
| ------ | ------- | -------- |
| 2      | D       | Db       |

---

## Rule

```math
\text{modeColor} = \text{replace interval, not append}
```

---

# 6. Chord Generation

## 6.1 Base Chord

From base scale:

```math
Chord = \{1, 3, 5\}
```

Extensions:

| Quality | Effect           |
| ------- | ---------------- |
| minor   | b3               |
| sus2    | replace 3 with 2 |
| add9    | add 2            |

---

## 6.2 Mode Color Application

Let:

```math
s_b = \text{base second}
s_c = \text{color second}
```

Then:

```math
Chord' =
\begin{cases}
\text{replace } s_b \rightarrow s_c & \text{if } s_b \in Chord \\
\text{add } s_c & \text{otherwise}
\end{cases}
```

---

# 7. Musical Layers

## 7.1 Harmony Layer

* chord progression
* modal coloring

## 7.2 Texture Layer

* drone
* pad
* melody

## 7.3 Rhythm Layer

* percussion
* note triggering

---

# 8. Parameter Mapping (Core Engine)

## 8.1 Brightness (b)

Controls:

```math
\text{cutoff} = 200 + 7800 \cdot b
```

Also affects:

* register
* harmonic richness

---

## 8.2 Density (d)

```math
layers = 1 + \lfloor 4d \rfloor
```

Controls:

* number of layers
* polyphony

---

## 8.3 Movement (m)

```math
note\_density = 1 + 8m
lfo = 0.05 + 5m
```

Controls:

* rhythm
* modulation
* melodic activity

---

## 8.4 Arousal (a)

Controls:

* percussion level

---

## 8.5 Tension (t)

Controls:

* chord extensions
* dissonance

---

## 8.6 Valence (v)

Controls:

* mode selection
* chord polarity

---

# 9. Drone & Bass Rules

## Drone

```math
Drone =
\begin{cases}
[root] \\
[root, fifth] \\
[root, fifth, octave]
\end{cases}
```

## Constraint

```text
Drone uses base scale ONLY
```

---

## Bass

```math
Bass = root(degree)
```

---

# 10. Expression Layer

Each section includes:

```json
"expression": {
  "filterCutoffHz": ...,
  "noteDensity": ...,
  "layersCount": ...,
  "lfoRateHz": ...,
  "register": ...
}
```

---

# 11. Full Pipeline

```text
Feeling
→ Emotional Region R(F)
→ Trajectory P(F)
→ Degree Mapping
→ Base Chord
→ Mode Color Injection
→ Absolute Notes
→ Expression Mapping
→ JSON Output
→ MIDI / Audio (next stage)
```

---

# 12. Final Output Structure

```json
{
  "feeling": "...",
  "key": "...",
  "harmony": {
    "modeBase": "...",
    "progression": [...]
  },
  "sections": [
    {
      "degree": "...",
      "modeColor": "...",
      "chord": {
        "notes": [...]
      },
      "drone": [...],
      "bass": "...",
      "expression": {...}
    }
  ]
}
```

---

# 13. Critical Design Principles

### 1. Single Emotion Constraint

```math
\forall es_i \in R(F)
```

---

### 2. Harmony Stability

* progression fixed
* base mode fixed

---

### 3. Mode Color = Interval Replacement

NOT additive

---

### 4. Separation of Concerns

| Layer      | Responsibility   |
| ---------- | ---------------- |
| Harmony    | emotion identity |
| Expression | emotional motion |
| Texture    | sonic richness   |

---

### 5. Loopability

```math
s_4 \rightarrow s_1
```

Requires:

* reduced tension
* reduced density
* harmonic soft landing

---

# 14. System Capabilities

This framework supports:

* deterministic generation
* LLM reasoning
* MIDI rendering
* real-time synthesis
* emotion-driven composition

---

# 15. Next Extensions

* Melody generator (modeColor-driven)
* Voice leading engine
* MIDI export (pretty_midi)
* Audio synthesis layer

---

# ✅ Final Insight

```text
Emotion is not a label.
It is a trajectory in a constrained multidimensional space,
projected onto harmony, texture, and time.
```

---
