# Eleven Labs API Samples

## Generate Music Using Prompt

```
import http.client

conn = http.client.HTTPSConnection("api.elevenlabs.io")

payload = "{\n\t\"prompt\": \"{\\\"tonal_centre\\\":\\\"A minor\\\",\\\"time_signature\\\":\\\"4/4\\\",\\\"tempo_bpm\\\":60,\\\"loopable\\\":true,\\\"duration_ms\\\":30000,\\\"texture_complexity\\\":{\\\"curve_id\\\":\\\"CURVE_ACTIVATION\\\",\\\"description\\\":\\\"Gradually increasing density\\\"},\\\"meditation_tool\\\":{\\\"id\\\":\\\"CONSCIOUS_CONNECTED_BREATHING\\\",\\\"nervous_system_direction\\\":\\\"strong_up\\\",\\\"description\\\":\\\"Continuous connected breathing intensifying emotional awareness.\\\",\\\"texture_density\\\":\\\"medium\\\"},\\\"chord_progression\\\":{\\\"key\\\":\\\"A minor\\\",\\\"progression_loop\\\":[\\\"Am(add9)\\\",\\\"G\\\",\\\"Fmaj7\\\",\\\"Em\\\"],\\\"description\\\":\\\"A breathwork-oriented modal loop starting with grounding tonic (Am add9), moving through descending emotional release (G → Fmaj7), and resolving through a subtle inward pull (Em) that naturally cycles back to Am. The extensions maintain spaciousness suitable for sustained breathing cycles.\\\"},\\\"instrument_progression\\\":[{\\\"time_range\\\":\\\"0s-6s\\\",\\\"active_instruments\\\":[\\\"earth_bass\\\",\\\"glass_pad\\\"],\\\"description\\\":\\\"Low earthy drone and spacious crystalline pad establish grounding and emotional safety for the start of the breathing cycle.\\\"},{\\\"time_range\\\":\\\"6s-12s\\\",\\\"active_instruments\\\":[\\\"earth_bass\\\",\\\"glass_pad\\\",\\\"seed_rattle\\\"],\\\"description\\\":\\\"Soft organic rattles introduce subtle rhythmic motion, hinting at the circular rhythm of connected breathing.\\\"},{\\\"time_range\\\":\\\"12s-18s\\\",\\\"active_instruments\\\":[\\\"earth_bass\\\",\\\"glass_pad\\\",\\\"seed_rattle\\\",\\\"shamanic_drum\\\"],\\\"description\\\":\\\"Slow drum pulses reinforce the somatic rhythm of inhalation and exhalation, helping deepen the breathwork state.\\\"},{\\\"time_range\\\":\\\"18s-24s\\\",\\\"active_instruments\\\":[\\\"earth_bass\\\",\\\"glass_pad\\\",\\\"seed_rattle\\\",\\\"shamanic_drum\\\",\\\"native_flute\\\"],\\\"description\\\":\\\"Breathy flute phrases emerge, mirroring rising and falling breath arcs and supporting emotional expression.\\\"},{\\\"time_range\\\":\\\"24s-30s\\\",\\\"active_instruments\\\":[\\\"earth_bass\\\",\\\"glass_pad\\\",\\\"seed_rattle\\\",\\\"shamanic_drum\\\",\\\"native_flute\\\",\\\"overtone_sing\\\"],\\\"description\\\":\\\"Overtone chanting expands the harmonic field, creating a ceremonial peak moment before seamlessly looping.\\\"}],\\\"instruments\\\":{\\\"melody\\\":[{\\\"name\\\":\\\"native_flute\\\",\\\"description\\\":\\\"Native American style flute producing soft haunting melodic lines.\\\"}],\\\"percussion\\\":[{\\\"name\\\":\\\"shamanic_drum\\\",\\\"description\\\":\\\"Slow repetitive drum used in trance and breathwork.\\\"},{\\\"name\\\":\\\"seed_rattle\\\",\\\"description\\\":\\\"Natural seed rattles producing organic textures.\\\"}],\\\"bass\\\":{\\\"name\\\":\\\"earth_bass\\\",\\\"description\\\":\\\"Low earthy rumbling tone simulating natural resonance.\\\"},\\\"chord\\\":{\\\"name\\\":\\\"glass_pad\\\",\\\"description\\\":\\\"Shimmering synthetic pad with crystalline overtones.\\\"},\\\"extra\\\":{\\\"name\\\":\\\"overtone_sing\\\",\\\"description\\\":\\\"Human overtone chanting producing harmonic resonance.\\\"}}}\",\n    \"music_length_ms\": 10000,\n    \"model_id\": \"music_v1\",\n    \"force_instrumental\": true,\n    \"respect_sections_durations\": false,\n    \"store_for_inpainting\": false,\n    \"sign_with_c2pa\": false\n}"

headers = {
    'Content-Type': "application/json",
    'xi-api-key': "sk_some_eleven_labs_key"
    }

conn.request("POST", "/v1/music", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

## Generate Music Using Composition PLan

```
import http.client

conn = http.client.HTTPSConnection("api.elevenlabs.io")

payload = "{\n    \"composition_plan\": \n\t\n\t\n\t{\n\t\"positive_global_styles\": [\n\t\t\"meditation\",\n\t\t\"instrumental\",\n\t\t\"calm\",\n\t\t\"ambient\",\n\t\t\"loopable\",\n\t\t\"60 bpm\",\n\t\t\"minimal\",\n\t\t\"Indian classical\",\n\t\t\"drone\",\n\t\t\"soothing\",\n\t\t\"A minor\"\n\t],\n\t\"negative_global_styles\": [\n\t\t\"loud\",\n\t\t\"energetic\",\n\t\t\"vocal\",\n\t\t\"complex melody\",\n\t\t\"heavy percussion\",\n\t\t\"fast tempo\"\n\t],\n\t\"sections\": [\n\t\t{\n\t\t\t\"section_name\": \"Part 1\",\n\t\t\t\"positive_local_styles\": [\n\t\t\t\t\"very gentle tabla strokes\",\n\t\t\t\t\"slow rhythmic pulse\"\n\t\t\t],\n\t\t\t\"negative_local_styles\": [\n\t\t\t\t\"percussion\",\n\t\t\t\t\"melody\",\n\t\t\t\t\"vocals\",\n\t\t\t\t\"rhythm\"\n\t\t\t],\n\t\t\t\"duration_ms\": 30000,\n\t\t\t\"lines\": []\n\t\t}\n\t]\n}\n\t\n\t\n\t\n\t,\n    \"model_id\": \"music_v1\",\n    \"seed\": 0,\n    \"force_instrumental\": false,\n    \"respect_sections_durations\": true,\n    \"store_for_inpainting\": false,\n    \"sign_with_c2pa\": false\n}\n"

headers = {
    'Content-Type': "application/json",
    'xi-api-key': "sk_some_eleven_labs_key"
    }

conn.request("POST", "/v1/music", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

## Generate Composition Plan Using Prompt

```
import http.client

conn = http.client.HTTPSConnection("api.elevenlabs.io")

payload = "{\n\t\"prompt\": \"{\\\"tonal_centre\\\":\\\"A minor\\\",\\\"time_signature\\\":\\\"4/4\\\",\\\"tempo_bpm\\\":60,\\\"instrumental\\\":true,\\\"loopable\\\":true,\\\"duration_ms\\\":30000,\\\"texture_complexity\\\":{\\\"curve_id\\\":\\\"CURVE_STABLE\\\",\\\"description\\\":\\\"Stable texture across session\\\"},\\\"meditation_tool\\\":{\\\"id\\\":\\\"BHRAMARI\\\",\\\"nervous_system_direction\\\":\\\"down\\\",\\\"description\\\":\\\"A humming exhale that increases vagal tone and quiets mental noise.\\\",\\\"texture_density\\\":\\\"low\\\"},\\\"chord_progression\\\":{\\\"key\\\":\\\"A minor\\\",\\\"progression_loop\\\":[\\\"Am\\\",\\\"Am(add9)\\\"],\\\"description\\\":\\\"A minimal tonic drone harmony centered on A minor. The sustained Am foundation supports the humming vibration of Bhramari breathing while occasional add9 color tones create subtle harmonic movement without disturbing the meditative stillness.\\\"},\\\"instrument_progression\\\":[{\\\"time_range\\\":\\\"0s-8s\\\",\\\"active_instruments\\\":[\\\"tanpura_drone\\\"],\\\"description\\\":\\\"The tanpura establishes a steady harmonic drone, creating a stable sonic field that supports the internal humming vibration of Bhramari breathing.\\\"},{\\\"time_range\\\":\\\"8s-16s\\\",\\\"active_instruments\\\":[\\\"tanpura_drone\\\",\\\"tabla_soft\\\"],\\\"description\\\":\\\"Very gentle tabla strokes introduce a slow rhythmic pulse that mirrors the natural breathing cycle.\\\"},{\\\"time_range\\\":\\\"16s-24s\\\",\\\"active_instruments\\\":[\\\"tanpura_drone\\\",\\\"tabla_soft\\\",\\\"finger_cymbals_soft\\\"],\\\"description\\\":\\\"Light finger cymbal taps add subtle shimmering accents, enhancing attentional focus without increasing stimulation.\\\"},{\\\"time_range\\\":\\\"24s-30s\\\",\\\"active_instruments\\\":[\\\"tanpura_drone\\\",\\\"tabla_soft\\\",\\\"finger_cymbals_soft\\\"],\\\"description\\\":\\\"The texture remains stable, maintaining a calm rhythmic and harmonic environment that supports sustained humming exhalations before the loop resets.\\\"}],\\\"instruments\\\":{\\\"percussion\\\":[{\\\"name\\\":\\\"tabla_soft\\\",\\\"description\\\":\\\"Very lightly played tabla patterns.\\\"},{\\\"name\\\":\\\"finger_cymbals_soft\\\",\\\"description\\\":\\\"Very light metallic taps producing delicate chimes.\\\"}],\\\"bass\\\":{\\\"name\\\":\\\"tanpura_drone\\\",\\\"description\\\":\\\"Indian classical drone instrument sustaining harmonic resonance.\\\"}}}\"\n}"

headers = {
    'Content-Type': "application/json",
    'xi-api-key': "sk_some_eleven_labs_key"
    }

conn.request("POST", "/v1/music/plan", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```

Sample Response
```
{
	"positive_global_styles": [
		"meditation",
		"instrumental",
		"calm",
		"soothing",
		"ambient",
		"minimalist",
		"drone",
		"Indian classical",
		"loopable",
		"60 bpm",
		"A minor"
	],
	"negative_global_styles": [
		"loud",
		"fast tempo",
		"complex harmony",
		"vocals",
		"energetic",
		"jarring"
	],
	"sections": [
		{
			"section_name": "Part 1 - Drone",
			"positive_local_styles": [
				"tanpura drone",
				"steady harmonic field",
				"A minor drone",
				"minimal"
			],
			"negative_local_styles": [
				"percussion",
				"melody",
				"abrupt changes"
			],
			"duration_ms": 8000,
			"lines": []
		},
		{
			"section_name": "Part 2 - Rhythm",
			"positive_local_styles": [
				"tanpura drone",
				"soft tabla",
				"gentle rhythmic pulse",
				"slow rhythm mirroring breathing"
			],
			"negative_local_styles": [
				"loud drums",
				"fast rhythm",
				"cymbal sounds"
			],
			"duration_ms": 8000,
			"lines": []
		},
		{
			"section_name": "Part 3 - Accents",
			"positive_local_styles": [
				"tanpura drone",
				"soft tabla",
				"soft finger cymbals",
				"light shimmering accents",
				"subtle metallic taps"
			],
			"negative_local_styles": [
				"harsh cymbals",
				"vocals",
				"dynamic shifts"
			],
			"duration_ms": 8000,
			"lines": []
		},
		{
			"section_name": "Part 4 - Sustain",
			"positive_local_styles": [
				"tanpura drone",
				"soft tabla",
				"soft finger cymbals",
				"stable texture",
				"calm rhythmic environment",
				"sustained feel"
			],
			"negative_local_styles": [
				"new instruments",
				"fade out",
				"increase in volume"
			],
			"duration_ms": 6000,
			"lines": []
		}
	]
}
```