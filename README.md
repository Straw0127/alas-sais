# ALAS-SAIS — Five Nights in Lola Pilar's House

*Limang Gabi sa Bahay ni Lola Pilar*

A 2D first-person survival horror game. Keep a five-night vigil in your late grandmother's provincial house. Survive from 12:00 to 6:00 AM against four entities, each with its own rules. The game is inspired by the room-to-room survival style of *Five Nights at Freddy's: Sister Location*, with original characters, story, art and sound.

> **Status: Phase 2, pre-production.** The blueprint, gameplay flow, 3D renders and sound pack are here for review. **No game code yet.** Development starts after the design is approved.

## What's in this repo

| Folder | Contents |
| --- | --- |
| `docs/BLUEPRINT.md` | Game design summary: story, entities, mechanics, nights, tech plan |
| `docs/FLOW.md` | Gameplay if/else flow for the night loop and all four entities (renders on GitHub) |
| `assets/renders/` | Pre-rendered 3D room views, entity renders and jumpscare key frames (JPEG) |
| `assets/audio/` | Original horror sound pack: ambience, footsteps, entity cues, jumpscares (MP3) |
| `review/` | A phone-friendly review page to view every image and play every sound |
| `tools/blender/` | Python scripts that build and render every scene in Blender (`pip install bpy`) |
| `tools/sfx/` | Python script that synthesizes every sound from scratch (numpy + scipy + ffmpeg) |

## The four entities

| Entity | Folklore root | Area | Counter |
| --- | --- | --- | --- |
| **Kumot** | Batibat | Bedroom | Close and hold the door, or hide under the bed and hold your breath |
| **Malikmata** | Tiyanak | Living room | Switch the TV off. If it's out: lights off, hide behind the sofa, don't move |
| **Kalansing** | Aswang | Kitchen | Move quietly. Hide in the cabinet and stay still, or throw asin |
| **Silip** | Manananggal | Outside the curtain | When the crickets stop, flash her back. If she's at the glass, keep the curtain shut |

## Planned platforms

- **itch.io, play in browser.** HTML5, works on phones (touch controls) and PCs.
- **Windows download.** Target: Intel Pentium Silver laptops, 30 FPS on Low.
- English and Filipino.

## itch.io deployment

Every push to `main` that changes `review/` or `game/` is uploaded to **straw0127.itch.io/alas-sais** by GitHub Actions (`.github/workflows/itch.yml`). One-time setup, all doable from a phone:

1. itch.io → **Create new project**. Title `ALAS-SAIS`, project URL `alas-sais`, Kind of project **HTML**. Save it as a **Draft**.
2. itch.io → **Settings → API keys** → Generate new API key. Copy it.
3. GitHub → this repo → **Settings → Secrets and variables → Actions → New repository secret**. Name `BUTLER_API_KEY`, paste the key.
4. Actions tab → **Deploy to itch.io** → Run workflow (or just push).
5. On itch.io, open the project's **Edit** page. Under Uploads, tick **This file will be played in the browser** for the `html` upload, then save.

Until the game is built, the upload is the asset review page.

## Regenerating the assets

```bash
pip install bpy numpy scipy        # Blender 5.x as a Python module
cd tools/blender && python3 bedroom.py -- out/bedroom_kumot.png 40 --kumot
cd tools/sfx && python3 sfx.py     # writes out/*.mp3 (needs ffmpeg)
```

## Credits

Design, 3D scenes and sound synthesis created for ALAS-SAIS. No third-party or FNAF assets are used.

## How to play — Chapter 1: Lola's Bedroom (mobile first)

You never leave the bedroom. Tap places in the room to move there; everything is done by touching the scene.

| Where | What to do |
|---|---|
| **Door** | Walk up and *listen*. If something is breathing on the other side, press and HOLD the door until the footsteps go away. |
| **Window** | Keep the curtain closed (the wind can blow it open). Double-tap the curtain to open it, tap to close it. If she grabs it, HOLD it. |
| **Aparador** | When you hear crawling or the door creaks, press and hold anywhere to shine the flashlight until it shuts again. |
| **Bed** | If she gets inside, hide under the bed. When the blanket lifts, press and hold anywhere to stop breathing. |

Each night is about 4 minutes (12:00 to 6:00 AM). Night 5 has a brownout at 4:00 AM.

Before Night 1, Tita Cora calls (voice in Tagalog, subtitles in English or Filipino). Each night starts with a short warning call.

Progress: Chapter 1 (5 nights) → Chapter 2 (5 nights) → Chapter 3 (7 nights) → Custom Night. Chapters 2 and 3 are coming in the next updates.

Made by Straw0127.
