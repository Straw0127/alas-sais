# ALAS-SAIS — Game Blueprint (summary)

Status: awaiting approval. The full blueprint lives in the team's Claude doc; this is the repo copy.

## Concept

Miguel "Migo" Dalisay, 19, is sent to San Lucio to watch his late grandmother's house for five nights before it's sold. His aunt's rules arrive by text: lock up by midnight, don't leave the TV on, don't open the back curtain, and don't leave before the 6 AM church bell. Lola Pilar kept a 41-year promise (*panata*) to hold four restless things inside the house each night. She's gone, and the house is choosing a new keeper.

**Format:** strict 2D first-person, like Sister Location. Fixed pre-rendered views for each area, 2–3 look directions, animated walk transitions, no player body.

## Areas

| Area | Rule | Key objects |
| --- | --- | --- |
| Bedroom | Doors and breath | Door (open/close/hold), bulb, bed hide, capiz window |
| Living room | Light | CRT TV, light switch, plastic-covered sofa hide |
| Kitchen | Noise | Cabinets (hide), fridge, breaker box, bottle caps, asin jar |
| Curtain room | Silence and looking | Curtain (open/peek/hold), flashlight, Lola's altar |

## Entities

Each entity is rooted in Filipino folklore:

| Entity | Folklore root | Look |
| --- | --- | --- |
| Kumot | Batibat / bangungot | Old woman under a white lamay shroud, long white hair, rosary |
| Malikmata | Tiyanak | Baby-sized, old man's face, needle teeth, crawls out of the TV |
| Kalansing | Aswang (the cook) | Crawling, utensils and knives, stitched sack head, long tongue |
| Silip | Manananggal | Severed upper body, bat wings, entrails, cracked capiz mask |


| | Kumot | Malikmata | Kalansing | Silip |
| --- | --- | --- | --- | --- |
| Area | Bedroom | Living room | Kitchen | Garden / curtain |
| Cue | Slipper scuffs, wheeze, handle rattle | TV static swells, VHS warble, giggle | Metal clinking, sniffing, knife taps | **Silence** (crickets stop), glass fog, nail taps |
| Counter | Hold the door, or hide + hold breath | TV off; if out: lights off, hide, still | Quiet movement; hide in cabinet, stay still; throw asin (salt) | Flash her back; if at the glass, keep the curtain shut |

The full if/else logic is in [FLOW.md](FLOW.md).

## Nights

| Night | Length | Kumot | Malikmata | Kalansing | Silip | Extra |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 6 min | 3→6 | – | – | – | Tutorial texts |
| 2 | 7 min | 5→8 | 3→6 | – | – | |
| 3 | 8 min | 6→9 | 5→8 | 3→6 | – | 1 blackout |
| 4 | 8.5 min | 8→11 | 7→10 | 6→9 | 3→7 | 2 blackouts, fake retreats |
| 5 | 9 min + finale | 11→15 | 10→14 | 9→13 | 8→13 | Rain, finale at 5:30 |
| 6 (secret) | 9 min | 14→20 | 14→20 | 14→20 | 14→20 | Needs all 8 tapes |

AI: each entity rolls 1–20 every 3–6 s against its level to advance a state. A guaranteed warning window never drops below 3 s. All numbers live in `nights.json`.

Endings: **A "Umaga"** (survive Night 5) and **B "Paglaya"** (secret: all 8 tapes + Night 6). After Ending A, the "Panata" custom night unlocks.

## Tech plan (updated for mobile)

- **Engine: HTML5 + JavaScript** (Canvas/DOM with pre-rendered images, Web Audio). Chosen because the game must be playable on phones, testable from a phone, and published to itch.io from a phone.
- **Controls:** tap to interact, swipe to look, hold buttons for door/curtain/breath. Keyboard + mouse on PC.
- **Art:** pre-rendered 3D (Blender, Cycles) of a poor provincial Filipino house (hollow blocks, open GI roof, tabla, sawali, kulambo, plastic wardrobes), lit and dark variants of every view, entities as separate layers, frame-rendered animations for walking, running, doors, curtains and hiding.
- **Audio:** original synthesized sound pack (MP3 for iOS/Android compatibility), 4 volume buses.
- **Languages:** English and Filipino from one translation table.
- **Saves:** browser storage (night reached, endings, tapes, settings).
- **Targets:** mid-range Android phone and Intel Pentium Silver laptop, 30 FPS minimum. To be verified on real devices.
- **Publishing:** GitHub Actions zips the build and uploads it to itch.io (HTML, "play in browser"). The optional Windows download is the same build wrapped as a desktop app.
