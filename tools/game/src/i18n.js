/* ALAS-SAIS — English / Filipino text */
var STR = {
  en: {
    title_sub: "Five Nights in Lola Pilar's House",
    loading: 'Loading', tap_start: 'Tap to start', headphones: 'Headphones recommended. Listen before you look.',
    new_game: 'New Game', cont: 'Continue', nights: 'Night Selection', settings: 'Settings', credits: 'Credits', quit: 'Exit Game',
    night_n: 'Night {n}', night_names: ['The First Encounter', 'Something Is Inside', 'No Place Is Safe', 'The House Is Awake', 'The Final Night'],
    locked: 'Locked', back: 'Back', resume: 'Resume', restart: 'Restart Night', main_menu: 'Main Menu', paused: 'Paused',
    language: 'Language', graphics: 'Graphics', low: 'Low', medium: 'Medium', high: 'High',
    master: 'Master', sfx: 'Sound effects', amb: 'Ambience', music: 'Music', captions: 'Sound captions', reduced: 'Reduced intensity',
    fullscreen: 'Fullscreen', on: 'On', off: 'Off',
    go_hall: 'Hallway', h_door: 'HOLD the door to keep it shut · double-tap to open it', h_curtain: 'HOLD the curtain shut · double-tap to open it',
    h_light: 'Hold on the dark to use the flashlight', h_breath: 'HOLD anywhere to hold your breath', h_run: 'Running is fast but loud', run_on: 'RUN', run_off: 'WALK',
    ph_calling: 'INCOMING CALL', ph_answer: 'Answer', ph_decline: 'Decline', ph_mute: 'End call', ph_live: 'ON CALL', ph_ended: 'CALL ENDED', ph_who: 'Tita Cora',
    a_close_short: 'Close', a_lights: 'Light switch', a_salt_jar: 'Asin', a_door: 'Door',
    rooms: { bedroom: 'Bedroom', hall: 'Hallway', living: 'Living room', kitchen: 'Kitchen', curtain: 'Curtain' },
    run: 'Run', walk: 'Walk',
    a_door_close: 'Close door', a_door_open: 'Open door', a_hold_door: 'HOLD DOOR', a_hide_bed: 'Hide under bed', a_hide_cab: 'Hide in cabinet',
    a_hide_sofa: 'Hide behind sofa', a_unhide: 'Get out', a_breath: 'HOLD BREATH', a_tv: 'Turn off TV', a_lights_on: 'Lights on', a_lights_off: 'Lights off',
    a_curtain_open: 'Open curtain', a_curtain_close: 'Close curtain', a_hold_curtain: 'HOLD CURTAIN', a_light: 'FLASHLIGHT', a_salt: 'Throw asin ({n})', a_breaker: 'Reset breaker',
    begin: 'Tap to begin', survived: 'You survived', time_survived: 'Time survived', next: 'Continue',
    caught: 'caught you.', retry: 'Retry Night', rotate: 'Turn your phone sideways', play_anyway: 'Play anyway',
    who: { kumot: 'KUMOT', malik: 'MALIKMATA', kal: 'KALANSING', silip: 'SILIP' },
    hint: {
      kumot: 'When the handle rattles, close the door and HOLD it. If she gets in, hide under the bed and hold your breath when the blanket moves.',
      malik: 'When the TV turns on by itself, switch it off fast. If it is already out: lights off, hide, and do not move.',
      kal: 'Do not run. When the metal clinks get close, throw asin or hide in the cabinet and do not touch anything.',
      silip: 'When the crickets go quiet, check the curtain and hold the flashlight on her. If she is at the glass, keep the curtain shut and HOLD it.'
    },
    new_threat: 'New', intro_rules: {
      1: ['kumot'], 2: ['malik'], 3: ['kal'], 4: ['silip'], 5: []
    },
    final_night: 'All four are awake. Survive until the bell.',
    end_title: 'UMAGA', end_text: 'The bell rings over San Lucio. You walk out into the morning light. Your phone buzzes: "Salamat, Migo. Kita tayo mamayang gabi." The vow is yours now.',
    thanks: 'Thank you for playing.', exit_text: 'You can close this tab now.',
    credits_text: 'ALAS-SAIS\nDesign, story, 3D scenes, sound and code: made with Claude for Straw0127\n\nAll images rendered in Blender (Cycles)\nAll sounds synthesized from scratch\nFonts: Oswald, Special Elite, Inter (SIL Open Font License)\n\nInspired by the room-to-room survival of Five Nights at Freddy\'s: Sister Location.\nAll characters, story, art and sound are original.\nEntities inspired by Filipino folklore: Batibat, Tiyanak, Aswang, Manananggal.',
    cap: {
      cap_scuffs_far: '[ slow slipper scuffs, far down the hallway ]', cap_scuffs_near: '[ slipper scuffs, close to the bedroom ]', cap_wheeze: '[ a wet wheeze outside the door ]',
      cap_rattle: '[ the door handle rattles ]', cap_scuffs_leave: '[ scuffs fading away ]', cap_hum: '[ an old woman humming, inside the room ]', cap_lift: '[ the mosquito net moves... ]',
      cap_static: '[ the TV turns on by itself: static ]', cap_cry: '[ a baby crying through the static ]', cap_vhs: '[ tape warble, something climbs out ]', cap_giggle: '[ a child giggles nearby ]',
      cap_clinks_far: '[ faint metal clinking in the kitchen ]', cap_clinks_near: '[ metal clinking, getting closer ]', cap_sniff: '[ sniffing ]', cap_kal_in: '[ she is in the kitchen ]', cap_taps: '[ tapping on the cabinet doors ]',
      cap_nails: '[ fingernails on the glass ]', crickets: '[ the crickets go silent ]', blackout: '[ the power dies ]', breaker: '[ power restored ]',
      kal_retreat: '[ she hisses at the salt and backs away ]', silip_back: '[ wings flap, she pulls back into the dark ]', malik_return: '[ the static fades, the TV goes dark ]',
      kumot_enter: '[ the door bursts open ]', battery_dead: '[ the flashlight dies ]', gasp: '[ you gasp for air ]', no_power: '[ no power ]'
    },
    texts: {
      1: ['Migo, lock up by midnight. Close the bedroom door. If you hear the handle, HOLD it shut.', 'If something comes in, get under the bed and don\'t breathe. I mean it.', 'Don\'t leave before the 6 AM bell. - Tita Cora'],
      2: ['Migo. Don\'t leave the TV on. If it turns on by itself, turn it off. Fast.', 'If you hear a baby crying in the sala... don\'t answer it. Lights off, hide.'],
      3: ['The kitchen. Walk, don\'t run. She hears everything.', 'There\'s asin by the stove. Throw it if she comes. The breaker is in there too.'],
      4: ['Don\'t open the back curtain at night unless you have to.', 'When the crickets stop, she is moving. Use the flashlight. If she\'s at the glass, keep it shut.'],
      5: ['Last night, Migo. They\'re all awake.', 'Survive until the bell. Please.']
    }
  },
  fil: {
    title_sub: 'Limang Gabi sa Bahay ni Lola Pilar',
    loading: 'Naglo-load', tap_start: 'I-tap para magsimula', headphones: 'Mas maganda kung naka-headphones. Makinig bago tumingin.',
    new_game: 'Bagong Laro', cont: 'Ituloy', nights: 'Pumili ng Gabi', settings: 'Settings', credits: 'Credits', quit: 'Umalis sa Laro',
    night_n: 'Gabi {n}', night_names: ['Ang Unang Pagkikita', 'May Nasa Loob', 'Walang Ligtas na Lugar', 'Gising na ang Bahay', 'Ang Huling Gabi'],
    locked: 'Naka-lock', back: 'Bumalik', resume: 'Ituloy', restart: 'Ulitin ang Gabi', main_menu: 'Main Menu', paused: 'Naka-pause',
    language: 'Wika', graphics: 'Graphics', low: 'Mababa', medium: 'Katamtaman', high: 'Mataas',
    master: 'Master', sfx: 'Sound effects', amb: 'Ambience', music: 'Musika', captions: 'Captions ng tunog', reduced: 'Bawas-takot (intensity)',
    fullscreen: 'Fullscreen', on: 'Bukas', off: 'Sarado',
    go_hall: 'Pasilyo', h_door: 'HAWAKAN nang matagal ang pinto · i-double tap para buksan', h_curtain: 'HAWAKAN nang matagal ang kurtina · i-double tap para buksan',
    h_light: 'Pindutin nang matagal ang dilim para sa flashlight', h_breath: 'PINDUTIN nang matagal kahit saan para pigilan ang hininga', h_run: 'Mabilis ang takbo pero maingay', run_on: 'TAKBO', run_off: 'LAKAD',
    ph_calling: 'TUMATAWAG', ph_answer: 'Sagutin', ph_decline: 'Tanggihan', ph_mute: 'Ibaba', ph_live: 'KAUSAP', ph_ended: 'TAPOS ANG TAWAG', ph_who: 'Tita Cora',
    a_close_short: 'Isara', a_lights: 'Switch ng ilaw', a_salt_jar: 'Asin', a_door: 'Pinto',
    rooms: { bedroom: 'Kwarto', hall: 'Pasilyo', living: 'Sala', kitchen: 'Kusina', curtain: 'Kurtina' },
    run: 'Takbo', walk: 'Lakad',
    a_door_close: 'Isara ang pinto', a_door_open: 'Buksan ang pinto', a_hold_door: 'HAWAKAN ANG PINTO', a_hide_bed: 'Magtago sa ilalim ng kama', a_hide_cab: 'Magtago sa kabinet',
    a_hide_sofa: 'Magtago sa likod ng sofa', a_unhide: 'Lumabas', a_breath: 'PIGILAN ANG HININGA', a_tv: 'Patayin ang TV', a_lights_on: 'Buksan ang ilaw', a_lights_off: 'Patayin ang ilaw',
    a_curtain_open: 'Buksan ang kurtina', a_curtain_close: 'Isara ang kurtina', a_hold_curtain: 'HAWAKAN ANG KURTINA', a_light: 'FLASHLIGHT', a_salt: 'Ihagis ang asin ({n})', a_breaker: 'I-reset ang breaker',
    begin: 'I-tap para magsimula', survived: 'Nakaligtas ka', time_survived: 'Tagal ng pagligtas', next: 'Ituloy',
    caught: 'ang nakahuli sa\'yo.', retry: 'Ulitin ang Gabi', rotate: 'Ipahiga ang phone mo', play_anyway: 'Laruin pa rin',
    who: { kumot: 'KUMOT', malik: 'MALIKMATA', kal: 'KALANSING', silip: 'SILIP' },
    hint: {
      kumot: 'Pag kumalansing ang hawakan ng pinto, isara at HAWAKAN. Pag nakapasok siya, magtago sa ilalim ng kama at pigilan ang hininga pag gumalaw ang kulambo.',
      malik: 'Pag kusang bumukas ang TV, patayin agad. Pag nakalabas na: patayin ang ilaw, magtago, at \'wag gagalaw.',
      kal: '\'Wag tatakbo. Pag malapit na ang kalansing, ihagis ang asin o magtago sa kabinet at \'wag hahawak ng kahit ano.',
      silip: 'Pag tumahimik ang mga kuliglig, silipin ang kurtina at itutok ang flashlight sa kanya. Pag nasa salamin na siya, isara at HAWAKAN ang kurtina.'
    },
    new_threat: 'Bago', intro_rules: { 1: ['kumot'], 2: ['malik'], 3: ['kal'], 4: ['silip'], 5: [] },
    final_night: 'Gising na silang apat. Mabuhay hanggang tumunog ang kampana.',
    end_title: 'UMAGA', end_text: 'Tumunog ang kampana sa San Lucio. Lumabas ka sa liwanag ng umaga. Nag-vibrate ang phone mo: "Salamat, Migo. Kita tayo mamayang gabi." Sa\'yo na ang panata.',
    thanks: 'Salamat sa paglalaro.', exit_text: 'Puwede mo nang isara ang tab na ito.',
    credits_text: 'ALAS-SAIS\nDisenyo, kuwento, 3D, tunog at code: ginawa kasama si Claude para kay Straw0127\n\nLahat ng larawan ay ni-render sa Blender (Cycles)\nLahat ng tunog ay ginawa mula sa simula\nFonts: Oswald, Special Elite, Inter (SIL Open Font License)\n\nHango sa room-to-room survival ng Five Nights at Freddy\'s: Sister Location.\nOrihinal ang lahat ng karakter, kuwento, larawan at tunog.\nMga nilalang na hango sa alamat ng Pilipinas: Batibat, Tiyanak, Aswang, Manananggal.',
    cap: {
      cap_scuffs_far: '[ mabagal na kaluskos ng tsinelas, malayo sa pasilyo ]', cap_scuffs_near: '[ kaluskos ng tsinelas, malapit na sa kwarto ]', cap_wheeze: '[ basang paghinga sa labas ng pinto ]',
      cap_rattle: '[ kumakalansing ang hawakan ng pinto ]', cap_scuffs_leave: '[ papalayong kaluskos ]', cap_hum: '[ may matandang humuhuni, nasa loob ng kwarto ]', cap_lift: '[ gumagalaw ang kulambo... ]',
      cap_static: '[ kusang bumukas ang TV: static ]', cap_cry: '[ may sanggol na umiiyak sa static ]', cap_vhs: '[ kumikislot na tape, may lumalabas ]', cap_giggle: '[ may batang humahagikgik sa malapit ]',
      cap_clinks_far: '[ mahinang kalansing ng bakal sa kusina ]', cap_clinks_near: '[ kalansing ng bakal, papalapit ]', cap_sniff: '[ may sumisinghot ]', cap_kal_in: '[ nasa kusina na siya ]', cap_taps: '[ kinakatok ang mga pinto ng kabinet ]',
      cap_nails: '[ mga kuko sa salamin ]', crickets: '[ tumahimik ang mga kuliglig ]', blackout: '[ nawalan ng kuryente ]', breaker: '[ bumalik ang kuryente ]',
      kal_retreat: '[ sumirit siya sa asin at umatras ]', silip_back: '[ pumagaspas ang pakpak, umatras siya sa dilim ]', malik_return: '[ nawala ang static, namatay ang TV ]',
      kumot_enter: '[ biglang bumukas ang pinto ]', battery_dead: '[ namatay ang flashlight ]', gasp: '[ napahingal ka ]', no_power: '[ walang kuryente ]'
    },
    texts: {
      1: ['Migo, mag-lock ka bago maghatinggabi. Isara mo ang pinto ng kwarto. Pag narinig mo ang hawakan, HAWAKAN mo.', 'Pag may pumasok, sa ilalim ka ng kama at \'wag kang hihinga. Seryoso ako.', '\'Wag kang aalis hangga\'t hindi tumutunog ang kampana ng alas-sais. - Tita Cora'],
      2: ['Migo. \'Wag mong iiwang bukas ang TV. Pag kusang bumukas, patayin mo. Bilisan mo.', 'Pag may narinig kang sanggol na umiiyak sa sala... \'wag mong sasagutin. Patayin ang ilaw, magtago.'],
      3: ['Ang kusina. Maglakad ka, \'wag tumakbo. Naririnig niya lahat.', 'May asin sa tabi ng kalan. Ihagis mo pag lumapit siya. Nandoon din ang breaker.'],
      4: ['\'Wag mong bubuksan ang kurtina sa likod tuwing gabi maliban kung kailangan.', 'Pag tumahimik ang kuliglig, gumagalaw siya. Gamitin ang flashlight. Pag nasa salamin na siya, \'wag mong bubuksan.'],
      5: ['Huling gabi na, Migo. Gising na silang lahat.', 'Mabuhay ka hanggang tumunog ang kampana. Pakiusap.']
    }
  }
};
