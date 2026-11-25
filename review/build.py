"""Builds the ALAS-SAIS asset review page (index.html) from the lists below."""
import html, os
H = html.escape

ROOMS = [
    ('ext_house', 'Main menu: the house from the gate', 'Hollow blocks below, tabla above, GI roof. Someone stands in the red window.'),
    ('bedroom_empty', 'Bedroom: door view', 'Start room. A single bulb on an exposed wire, kulambo over the bed, plastic wardrobe, Huling Hapunan on the wall.'),
    ('bedroom_kumot', 'Bedroom: Kumot in the doorway', "Too tall for the door frame, she bends under it to look in."),
    ('bedroom_closed', 'Bedroom: door closed', 'The state while you hold the door shut.'),
    ('bedroom_window', 'Bedroom: capiz window', "Finale: the manananggal's shadow on the capiz shells."),
    ('bedroom_blackout', 'Bedroom: blackout', 'Night 5 finale. Flashlight only.'),
    ('under_empty', 'Under the bed: hiding view', 'Low camera, bed slats overhead.'),
    ('under_kumot', "Under the bed: she's in the room", 'Hold your breath. Batibat steals it.'),
    ('hallway_empty', 'Hallway', 'Family photos, one turned face-down. Listen here.'),
    ('hallway_kumot', 'Hallway: something at the end', 'Every trip between rooms passes through here.'),
    ('living_empty', 'Living room: lights off', 'CRT static, santo figures, monobloc chairs, bare hollow blocks, GI roof.'),
    ('living_lights', 'Living room: lights on', "Fluorescent tube. Safe, unless it's already out."),
    ('living_malik', 'Living room: the tiyanak is out', 'It crawled out of the TV. Lights off, hide behind the sofa, do not move.'),
    ('kitchen_empty', 'Kitchen', 'Sawali walls, empty utensil rail, galon, batya and tabo, the asin jar.'),
    ('kitchen_kal', 'Kitchen: the aswang in the doorway', "Don't run. Hide in the cabinet, or throw salt."),
    ('cabinet_kal', 'Inside the cabinet', 'Hiding view through the slats. Stay still.'),
    ('curtain_closed', 'Curtain room: closed', "An old bedsheet on a string. Lola's altar. Listen for the crickets."),
    ('curtain_silip', 'Outside the curtain: manananggal in the yard', 'Stage 3 of 4. Flashlight on her to push her back.'),
    ('curtain_glass', 'Outside the curtain: at the glass', 'Stage 4. Handprints and fog. Keep it shut.'),
]
ENTS = [
    ('kumot', 'KUMOT', 'BEDROOM · BATIBAT', 'Rooted in the Ilocano Batibat behind bangungot. An old woman under a white lamay shroud, long white hair, a rosary in her grey fingers. She sits on sleepers and steals their breath.'),
    ('malikmata', 'MALIKMATA', 'LIVING ROOM · TIYANAK', 'A tiyanak: baby-sized, with an old man\'s wrinkled face and needle teeth. It cries through the TV static to lure you, then crawls out of the screen.'),
    ('kalansing', 'KALANSING', 'KITCHEN · ASWANG', 'The aswang who worked as the family cook. Blind, crawling, hung with ladles, cans and knives. A long tongue through the stitched rice sack. Hunts by smell and sound. Asin (salt) drives her back.'),
    ('silip', 'SILIP', 'CURTAIN · MANANANGGAL', 'A manananggal: her upper body has split from her legs, bat wings spread, entrails hanging. A cracked capiz mask, long wet hair. She peeks through windows. Light drives her back.'),
]
ANIMS = [
    ('walk', 'Walk: bedroom to hallway', 'Head-bob, through the doorway.', 'bedroom_empty'),
    ('run', 'Run', 'Same path, faster, blurred. Louder, and the aswang hears it.', 'bedroom_empty'),
    ('door', 'Door opening and closing', 'Bedroom door, 12 frames each way.', 'bedroom_closed'),
    ('hidebed', 'Hide under the bed', 'Crouch, look down, slide under.', 'under_empty'),
    ('cabinet', 'Hide in the cabinet', 'Crouch, crawl in, the slats close.', 'cabinet_kal'),
    ('curtain', 'Curtain opening', 'The bedsheet slides along the string.', 'curtain_closed'),
]
SOUNDS = [
    ('ambience', 'AMBIENCE', 'Use headphones and start at low volume. The jumpscare sounds further down are loud on purpose.', [
        ('amb_house', 'House at night (loop)', 'Rain on the GI roof, electric fan, low drone, random wood creaks.', True),
        ('amb_garden', 'Yard outside the curtain (loop)', 'Crickets, frogs, wind in the mango tree. When this goes silent, she is moving.', True),
        ('rain_heavy', 'Heavy rain and thunder (loop)', 'Night 5. Masks the silence cue.', True),
        ('amb_menu', 'Main menu drone (loop)', 'Detuned low drone with slowed, tuned metal hits.', True),
        ('heartbeat', 'Heartbeat', 'Plays when something is close to you.', False),
        ('bell_6am', '6:00 AM church bell', 'Night survived.', False),
        ('rooster_dawn', 'Rooster at dawn', 'With the 6 AM bell.', False)]),
    ('night', 'FILIPINO NIGHT SOUNDS', '', [
        ('tuko_gecko', 'Tuko (tokay gecko)', 'The house gecko in the dark. It goes quiet before something happens.', False),
        ('dog_howl', 'Dog howling far away', "Aso umaalulong. Plays before an entity's first move of the night.", False),
        ('tricycle_far', 'Tricycle passing far away', 'The last normal sound of the night.', False),
        ('distant_scream', 'Distant scream', 'Rare random event.', False),
        ('fluorescent_hum', 'Fluorescent tube hum and flicker (loop)', 'Living room lights on.', True),
        ('clock_tick', 'Wall clock ticking', 'Living room.', False)]),
    ('cues', 'ENTITY WARNING CUES', '', [
        ('scuffs_far', 'Kumot: slipper scuffs (far)', 'Hallway, muffled. She is coming.', False),
        ('scuffs_near', 'Kumot: slipper scuffs (near)', 'Right outside the door.', False),
        ('wheeze', 'Kumot: wet wheeze', 'Inhale, exhale, throat rattle.', False),
        ('lullaby_hum', 'Kumot: hummed lullaby', 'Original melody, later nights.', False),
        ('handle_rattle', 'Kumot: door handle rattle', 'Hold the door now.', False),
        ('static_swell', 'Malikmata: static swell', 'The TV turning itself on. 8 seconds to switch it off.', False),
        ('vhs_glitch', 'Malikmata: VHS glitch', 'Tape warble and stutter. It is out.', False),
        ('giggle', 'Malikmata: giggle', "Bit-crushed child's giggle.", False),
        ('clinks', 'Kalansing: metal clinking', 'Utensils swinging, getting closer.', False),
        ('sniff', 'Kalansing: sniffing', 'Hunting by smell.', False),
        ('knife_taps', 'Kalansing: knife taps', 'Tapping the cabinet doors one by one.', False),
        ('nail_taps', 'Silip: fingernails on the glass', 'Keep the curtain closed.', False),
        ('whisper', 'Silip: whisper', 'Under her jumpscare.', False)]),
    ('player', 'PLAYER AND INTERACTION', '', [
        ('steps_walk_wood', 'Walking: wood floor', 'Bedroom and hallway.', False),
        ('steps_run_wood', 'Running: wood floor', 'Louder, with heavy breathing.', False),
        ('steps_walk_cement', 'Walking: cement floor', 'Kitchen and sala.', False),
        ('breath_hold_gasp', 'Holding breath, then gasping', 'Under the bed. Strain and heartbeat build. Gasp too early and she hears.', False),
        ('door_creak', 'Door creak', 'Opening slowly.', False),
        ('door_slam', 'Door slam', 'Closing fast. Loud.', False),
        ('cabinet_open', 'Cabinet door opening', 'Getting in.', False),
        ('cabinet_close', 'Cabinet door closing', 'Shut from the inside.', False),
        ('curtain_rings', 'Curtain pulled', 'The bedsheet along the string.', False),
        ('plastic_crinkle', 'Plastic sofa cover', 'Moving behind the sofa gives you away.', False),
        ('kulambo_rustle', 'Kulambo rustle', 'Touching the mosquito net.', False),
        ('light_switch', 'Light switch', 'Click and bulb thunk.', False),
        ('flashlight_click', 'Flashlight click', 'On and off.', False),
        ('tv_static', 'TV static (loop)', 'CRT hiss with whine and crackle.', True),
        ('power_down', 'Blackout', 'Power dies, bulb buzzes out.', False),
        ('breaker', 'Breaker reset', 'Kitchen breaker box.', False),
        ('phone_text', 'Text from Tita Cora', 'Night-start instructions.', False),
        ('glass_shatter', 'Glass shatter', 'Used in the manananggal jumpscare.', False)]),
    ('scares', 'JUMPSCARE SOUNDS', 'Loud. Lower your volume first.', [
        ('jumpscare_kumot', 'Kumot', 'Reversed inhale, door creak, layered shriek, sub boom.', False),
        ('jumpscare_malikmata', 'Malikmata', 'Static blast, bit-crushed scream, VHS stutter.', False),
        ('jumpscare_kalansing', 'Kalansing', 'Avalanche of clattering metal, guttural scream.', False),
        ('jumpscare_silip', 'Silip', 'Whisper, glass shatters, high scream.', False)]),
]

def fig(k, t, d):
    return f'<figure><a href="img/{k}.jpg"><img loading="lazy" src="img/{k}.jpg" alt="{H(t)}"></a><figcaption><b>{H(t)}</b><span>{H(d)}</span></figcaption></figure>'

css = open(os.path.join(os.path.dirname(__file__), 'style.css')).read()
nsounds = sum(len(s[3]) for s in SOUNDS)
out = [f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ALAS-SAIS — Asset Review</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Special+Elite&family=Inter:wght@400;600&display=swap">
<style>{css}</style></head><body>
<header><h1>ALAS-SAIS</h1><p class="sub">Asset review: 3D renders, animations and a {nsounds}-sound pack, before we build the game.</p></header>
<nav><div><a href="#rooms">ROOMS</a><a href="#entities">ENTITIES</a><a href="#jumpscares">JUMPSCARES</a><a href="#anim">ANIMATIONS</a>''' +
       ''.join(f'<a href="#{s[0]}">{s[1].split(" ")[0]}</a>' for s in SOUNDS) + '</div></nav><main>']
out.append('<h2 id="rooms">ROOMS</h2><p class="lead">Pre-rendered 3D (Blender, Cycles), like Sister Location, with a film-grade pass. A poor provincial Filipino house: hollow blocks and an open GI roof, tabla, sawali, cracked cement, kulambo, plastic wardrobes, monobloc chairs, Huling Hapunan on the wall. Tap an image for full size.</p><div class="grid">')
out += [fig(*r) for r in ROOMS]
out.append('</div><h2 id="entities">ENTITIES</h2><p class="lead">Each one comes from Filipino folklore and keeps its game name and rules.</p><div class="grid">')
out += [f'<figure><a href="img/hero_{k}.jpg"><img loading="lazy" src="img/hero_{k}.jpg" alt="{H(n)}"></a><figcaption><b>{n} <span class="tag">{H(tag)}</span></b><span>{H(d)}</span></figcaption></figure>' for k, n, tag, d in ENTS]
out.append('</div><h2 id="jumpscares">JUMPSCARE FRAMES</h2><p class="lead">The close-up key frame of each jumpscare. In-game they get a push-in, shake, flash and distortion, synced to the sounds below.</p><div class="grid">')
out += [fig('scare_' + k, n.title(), tag.split('·')[1].strip().title()) for k, n, tag, d in ENTS]
out.append('</div><h2 id="anim">ANIMATIONS</h2><p class="lead">Rendered frame by frame from the same 3D scenes.</p><div class="grid">')
base = os.path.dirname(os.path.abspath(__file__))
have = [a for a in ANIMS if os.path.exists(os.path.join(base, 'anim', a[0] + '.mp4'))]
if not have: out.append('<p class="lead">Rendering now. They will appear here in the next update.</p>')
out += [f'<figure><video src="anim/{k}.mp4" autoplay loop muted playsinline poster="img/{p}.jpg"></video><figcaption><b>{H(t)}</b><span>{H(d)}</span></figcaption></figure>' for k, t, d, p in have]
out.append('</div>')
for sid, title, warn, items in SOUNDS:
    out.append(f'<h2 id="{sid}">{title}</h2>' + (f'<p class="warn">{H(warn)}</p>' if warn else '') + '<div class="sounds">')
    out += [f'<div class="snd"><b>{H(t)}</b><span>{H(d)}</span><audio controls preload="none"{" loop" if lp else ""} src="sfx/{f}.mp3"></audio></div>' for f, t, d, lp in items]
    out.append('</div>')
out.append('</main><footer>All images rendered in Blender and all sounds synthesized from scratch for ALAS-SAIS. No third-party or FNAF assets are used.</footer></body></html>')
open(os.path.join(os.path.dirname(__file__), 'index.html'), 'w').write('\n'.join(out))
print('ok', nsounds)
