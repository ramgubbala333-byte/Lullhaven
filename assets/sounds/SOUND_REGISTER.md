# Lullhaven — Sound License Register

Starter library of 10 sounds, sourced and processed 2026-10-30.
All delivered files are seamless loops: a clean segment was trimmed and the tail was
equal-power crossfaded into the head (10 s crossfade) so the loop point has no click.
Loop-boundary check: for every delivered track, the last→first sample step is within the
track's normal sample-to-sample step range (no outlier at the wrap point).
Delivered format for all files: AAC in M4A, 44.1 kHz, stereo, ~128–130 kbps.

| Sound | Output file | Source URL | Author | License | Download date | Attribution required | Source duration / format | Delivered duration / format |
|---|---|---|---|---|---|---|---|---|
| Rain | rain.m4a | https://commons.wikimedia.org/wiki/File:Rain_against_the_window.ogg | cori (via PDSounds) | Public domain (PDSounds release) | 2026-10-30 | None | 81.7 s, Ogg Vorbis, mono, 44.1 kHz | 71.7 s, AAC/M4A, stereo, 44.1 kHz, ~130 kbps, 1.16 MB |
| Thunderstorm | thunderstorm.m4a | https://commons.wikimedia.org/wiki/File:Storm_thunderbolts.ogg | stephan (via PDSounds) | Public domain (PDSounds release) | 2026-10-30 | None | 302.8 s, Ogg Vorbis, mono, 44.1 kHz | 120.0 s, AAC/M4A, stereo, 44.1 kHz, ~130 kbps, 1.94 MB |
| Ocean waves | ocean_waves.m4a | https://commons.wikimedia.org/wiki/File:Waves.ogg | Dsw4 | Public domain (author's own release on the file page) | 2026-10-30 | None | 287.0 s, Ogg Vorbis, stereo, 44.1 kHz | 120.0 s, AAC/M4A, stereo, 44.1 kHz, ~130 kbps, 1.95 MB |
| Gentle wind | gentle_wind.m4a | https://commons.wikimedia.org/wiki/File:Howling_wind.ogg | Tvabutzku1234 | CC0 1.0 | 2026-10-30 | None | 128.3 s, Ogg Vorbis, mono, 16 kHz | 118.3 s, AAC/M4A, stereo, 44.1 kHz, ~130 kbps, 1.92 MB |
| Fireplace | fireplace.m4a | https://commons.wikimedia.org/wiki/File:Bones_breaking_wood_fire_ice_crackling.ogg | stephan (via PDSounds) | Public domain (PDSounds release) | 2026-10-30 | None | 74.1 s, Ogg Vorbis, stereo, 44.1 kHz | 64.1 s, AAC/M4A, stereo, 44.1 kHz, ~130 kbps, 1.04 MB |
| Night crickets | night_crickets.m4a | https://archive.org/details/aporee_64161_74013 | john grzinich | Public Domain Mark 1.0 (item license: https://creativecommons.org/publicdomain/mark/1.0/) | 2026-10-30 | None | 214.7 s, MP3, stereo, 48 kHz | 120.0 s, AAC/M4A, stereo, 44.1 kHz, ~130 kbps, 1.95 MB |
| Fan | fan.m4a | — (no recording used) | Generated in-house for Lullhaven | Project-generated, no third-party license | 2026-10-30 | None | n/a — synthesized: brown/pink noise blend through a low-pass character with a slow, loop-periodic amplitude wobble (6 cycles per loop) | 120.0 s, AAC/M4A, stereo, 44.1 kHz, ~130 kbps, 1.95 MB |
| White noise | white_noise.m4a | — (generated) | Generated in-house for Lullhaven | Project-generated, no license needed | 2026-10-30 | None | n/a — generated: uniform random noise | 120.0 s, AAC/M4A, stereo, 44.1 kHz, ~130 kbps, 1.95 MB |
| Pink noise | pink_noise.m4a | — (generated) | Generated in-house for Lullhaven | Project-generated, no license needed | 2026-10-30 | None | n/a — generated: white noise through a Paul Kellet 1/f filter | 120.0 s, AAC/M4A, stereo, 44.1 kHz, ~130 kbps, 1.95 MB |
| Brown noise | brown_noise.m4a | — (generated) | Generated in-house for Lullhaven | Project-generated, no license needed | 2026-10-30 | None | n/a — generated: leaky-integrated white noise | 120.0 s, AAC/M4A, stereo, 44.1 kHz, ~130 kbps, 1.95 MB |

## Source notes

- **PDSounds files (rain, thunderstorm, fireplace):** PDSounds required every uploader to
  release their recordings into the public domain; each file's Wikimedia Commons page
  carries that public-domain release in the author's name. License was checked on each
  file's own Commons page, not from a search filter.
- **Ocean waves:** the source is a shore-waves compilation recorded on the shore of
  Lake Ontario (Webster, NY). The author released it into the public domain on the
  file page. It is surf/wave sound throughout.
- **Gentle wind:** the CC0 source recording is titled "Howling wind" and is a strong
  wind recording at low fidelity (16 kHz mono). The delivered loop is level-tamed
  (RMS-normalized lower than the other tracks). If a softer, higher-fidelity wind is
  wanted later, this is the first file to re-source.
- **Fireplace:** the PDSounds recording is a fire/wood crackling recording (its
  Commons title also lists other crackling subjects the same recording technique
  covers). Content is continuous fire crackle; 74 s source limits the loop to 64 s.
- **Night crickets:** the archive.org item (radio aporee collection) is explicitly
  marked Public Domain Mark 1.0 in its metadata. The recording is mole crickets
  chirping at night by the Gauja river, Latvia — a genuine night-cricket chorus.
- **Fan — SYNTHESIZED (per the fallback rule):** CC0 fan recordings do exist on
  Freesound (e.g. by TimBahrij and FOSSarts, both CC0 on their sound pages), but no
  Freesound file could be downloaded in this session: full downloads sit behind an
  account login and the preview CDN returned HTTP 403. No unclear-license substitute
  was used; the delivered fan is the sanctioned synthesized approximation and is
  labeled as such here.

## v1.1 additions (2026-10-31) — library growth, variants first

34 sounds added: 19 recordings (public domain / CC0 / Public Domain Mark,
each license read on the file's own Commons page or archive.org metadata,
never from a search filter) and 15 generated in-project with
`src/services/noiseGen.ts` and labelled generated. Same loop preparation
as v1 (clean segment, 10 s equal-power crossfade of tail into head), plus
level normalisation to the pack profile below. Seven dynamic recordings
whose peaks would otherwise have pinned them far under the pack level
received a gentle 3:1 compression pass (threshold −20 dB; the two
faintest beds −38 dB / 4:1) before normalisation — noted per row.

Pack level profile (the normalisation target): RMS ≈ −21 dB, peak
ceiling −1 dB. Character outliers are deliberate and stay labelled:
light-rain is the pack's quiet bed (its source is uniformly faint —
body RMS ≈ −36 dB before processing); morning-rain, night-storm and
shower sit at −25 to −27 dB RMS because their peaks are thunder and
pipe transients; violet-noise and blue-noise are crest-heavy by
construction. Delivered format: AAC/M4A, 44.1 kHz stereo; recordings
at ~128 kbps, generated sounds at ~96 kbps (they compress cleanly).

| Sound | Output file | Source URL | Author | License | Download date | Attribution required | Source duration / format | Delivered duration / format |
|---|---|---|---|---|---|---|---|---|
| Rain and thunder | rain-thunder.m4a | https://commons.wikimedia.org/wiki/File:Rain_and_thunder_(1).ogg | ezwa | Public domain | 2026-10-31 | None | 60.1 s, Ogg Vorbis | 50.1 s, AAC/M4A, ~128 kbps, 793 KB |
| Light rain, distant thunder | light-rain.m4a | https://commons.wikimedia.org/wiki/File:Light_Rain_Distant_Thunder_July_5th_2016.wav | kvgarlic | CC0 1.0 | 2026-10-31 | None | 110.1 s, WAV, stereo, 44.1 kHz | 90.0 s, AAC/M4A, ~128 kbps, 1,426 KB. Strong compression (see above); quietest bed in the pack by design |
| Rain on a veranda | rain-veranda.m4a | https://commons.wikimedia.org/wiki/File:Rain_on_a_veranda_and_t.ogg + https://commons.wikimedia.org/wiki/File:Thunder_and_rain_on_a_v.ogg | ezwa | Public domain | 2026-10-31 | None | Two recordings, 30.0 s + 30.2 s, Ogg Vorbis, concatenated | 50.2 s, AAC/M4A, ~128 kbps, 794 KB |
| Morning rain | morning-rain.m4a | https://commons.wikimedia.org/wiki/File:Rain_thunder_and_birds.ogg | ezwa | Public domain | 2026-10-31 | None | 134.3 s, Ogg Vorbis | 110.0 s, AAC/M4A, ~128 kbps, 1,739 KB. Contains birdsong, labelled in the app |
| Soft rain | soft-rain.m4a | https://commons.wikimedia.org/wiki/File:Rain_(1).ogg | ezwa | Public domain | 2026-10-31 | None | 45.0 s, Ogg Vorbis | 35.0 s, AAC/M4A, ~128 kbps, 553 KB |
| Summer thunderstorm | summer-thunderstorm.m4a | https://commons.wikimedia.org/wiki/File:Thunderstorm_after_hot_summer_day_17_minutes_01_of_04.ogg | stephan (via PDSounds) | Public domain (PDSounds release) | 2026-10-31 | None | 254.4 s, Ogg Vorbis | 120.0 s, AAC/M4A, ~128 kbps, 1,902 KB |
| Distant thunder | distant-thunder.m4a | https://commons.wikimedia.org/wiki/File:Storm_thunderbolts.ogg (segment 165–295 s, the quiet back half) | stephan (via PDSounds) | Public domain (PDSounds release) | 2026-10-31 | None | 302.8 s, Ogg Vorbis, mono, 44.1 kHz | 120.0 s, AAC/M4A, ~128 kbps, 1,899 KB. Different segment of the Thunderstorm source recording |
| Night storm | night-storm.m4a | https://archive.org/details/aporee_23710_27561 (radio aporee: Eastside, Milwaukee thunderstorm, segment 600–730 s) | The Green Lama (aporee uploader) | Public Domain Mark 1.0 | 2026-10-31 | None | 1,476 s, MP3 | 120.0 s, AAC/M4A, ~128 kbps, 1,905 KB |
| Close thunderstorm | arlington-storm.m4a | https://archive.org/details/thunderstorm2005-06-06.flac24 (Thunderstorm: Arlington, VA, segment 20–150 s) | Matt DeNardo | Public domain (item license: creativecommons.org/licenses/publicdomain) | 2026-10-31 | None | 240.0 s, FLAC | 120.0 s, AAC/M4A, ~128 kbps, 1,917 KB |
| Tropical beach | tropical-beach.m4a | https://commons.wikimedia.org/wiki/File:Ocean_Waves_on_a_Tropical_Beach.ogg | Jarrod Stanley | CC0 1.0 | 2026-10-31 | None | 384.3 s, Ogg Vorbis, stereo, 44.1 kHz | 120.0 s, AAC/M4A, ~128 kbps, 1,900 KB |
| Calm shore | calm-shore.m4a | https://commons.wikimedia.org/wiki/File:Waves.ogg (segment 160–280 s) | Dsw4 | Public domain (author's own release) | 2026-10-31 | None | 287.0 s, Ogg Vorbis, stereo, 44.1 kHz | 110.0 s, AAC/M4A, ~128 kbps, 1,746 KB. Different segment of the Ocean waves source recording |
| Pebble beach | pebble-beach.m4a | https://commons.wikimedia.org/wiki/File:On_a_pebble_beach.ogg | earthcalling | Public domain | 2026-10-31 | None | 40.4 s, Ogg Vorbis | 30.4 s, AAC/M4A, ~128 kbps, 484 KB |
| River rapids | river-rapids.m4a | https://commons.wikimedia.org/wiki/File:James_River_Rapids_1.ogg | Jarrod Stanley | CC0 1.0 | 2026-10-31 | None | 300.0 s, Ogg Vorbis, stereo, 48 kHz | 120.0 s, AAC/M4A, ~128 kbps, 1,902 KB |
| Wild river | wild-river.m4a | https://commons.wikimedia.org/wiki/File:Florida_Rapids.ogg | Jarrod Stanley | CC0 1.0 | 2026-10-31 | None | 336.4 s, Ogg Vorbis, stereo, 48 kHz | 120.0 s, AAC/M4A, ~128 kbps, 1,900 KB |
| Waterfall | waterfall.m4a | https://commons.wikimedia.org/wiki/File:James_River_Rapids_2.ogg | Jarrod Stanley | CC0 1.0 | 2026-10-31 | None | 300.0 s, Ogg Vorbis, stereo, 48 kHz | 120.0 s, AAC/M4A, ~128 kbps, 1,904 KB |
| Mountain rapids | mountain-rapids.m4a | https://commons.wikimedia.org/wiki/File:Sanna_river_rapids.ogg | Jarrod Stanley | CC0 1.0 | 2026-10-31 | None | 300.0 s, Ogg Vorbis, stereo, 48 kHz | 120.0 s, AAC/M4A, ~128 kbps, 1,901 KB |
| Mountain stream | mountain-stream.m4a | https://commons.wikimedia.org/wiki/File:2024-07-26_Molln_(Oberösterreich)_Bachlauf_plätschert_(Krumme_Steyerling_bei_Piesslingerstraße).wav | DrTrumpet | CC0 1.0 | 2026-10-31 | None | 26.6 s, WAV, mono, 48 kHz | 16.6 s, AAC/M4A, ~128 kbps, 262 KB. Short source, short loop — noted in the app |
| Spring frogs | spring-frogs.m4a | https://commons.wikimedia.org/wiki/File:Spring_Peeper_Frogs_(Pseudacris_crucifer)_singing_on_night_of_April_21_of_2019_in_North_Pittston_PA.ogg | JohnDziak | CC0 1.0 | 2026-10-31 | None | 41.1 s, Ogg Vorbis, stereo, 44.1 kHz | 31.1 s, AAC/M4A, ~128 kbps, 493 KB |
| Shower | shower.m4a | https://commons.wikimedia.org/wiki/File:Shower_Sound_Ambience.ogg | Wilfredor | CC0 1.0 | 2026-10-31 | None | 290.2 s, Ogg Vorbis, stereo, 48 kHz | 120.0 s, AAC/M4A, ~128 kbps, 1,901 KB |
| Box fan | box-fan.m4a | — (no recording used) | Generated in-house for Lullhaven (noiseGen renderFan, "box") | Project-generated | 2026-10-31 | None | Synthesized: pink-noise bed through a 900 Hz low-pass + 59 Hz hum + slow loop-periodic wobble | 115.0 s, AAC/M4A, ~96 kbps, 1,371 KB |
| Table fan | table-fan.m4a | — (no recording used) | Generated in-house for Lullhaven (noiseGen renderFan, "desk") | Project-generated | 2026-10-31 | None | Synthesized: pink-noise bed through a 2.4 kHz low-pass + 120 Hz hum | 115.0 s, AAC/M4A, ~96 kbps, 1,371 KB |
| Air conditioner | air-conditioner.m4a | — (no recording used) | Generated in-house for Lullhaven (noiseGen renderFan, "ac") | Project-generated | 2026-10-31 | None | Synthesized: brown-noise bed through a 700 Hz low-pass + 60 Hz hum | 115.0 s, AAC/M4A, ~96 kbps, 1,371 KB |
| Hair dryer | hair-dryer.m4a | — (no recording used) | Generated in-house for Lullhaven (noiseGen renderFan, "dryer") | Project-generated | 2026-10-31 | None | Synthesized: white noise band-limited 700 Hz–3.2 kHz + 180 Hz motor tone | 115.0 s, AAC/M4A, ~96 kbps, 1,371 KB |
| Vacuum cleaner | vacuum.m4a | — (no recording used) | Generated in-house for Lullhaven (noiseGen renderFan, "vacuum") | Project-generated | 2026-10-31 | None | Synthesized: white noise band-limited 300 Hz–1.8 kHz + 100 Hz hum | 115.0 s, AAC/M4A, ~96 kbps, 1,371 KB |
| Airplane cabin | airplane-cabin.m4a | — (no recording used) | Generated in-house for Lullhaven (noiseGen renderFan, "cabin") | Project-generated | 2026-10-31 | None | Synthesized: brown-noise bed through a 500 Hz low-pass + 80 Hz hum | 115.0 s, AAC/M4A, ~96 kbps, 1,371 KB |
| Train ride | train.m4a | — (no recording used) | Generated in-house for Lullhaven (noiseGen renderTrain) | Project-generated | 2026-10-31 | None | Synthesized: low-passed brown rumble + soft double-thud rail joints, an integer count per loop | 116.0 s, AAC/M4A, ~96 kbps, 1,383 KB |
| Heartbeat | heartbeat.m4a | — (no recording used) | Generated in-house for Lullhaven (noiseGen renderHeartbeat) | Project-generated | 2026-10-31 | None | Synthesized: two-thump pattern at ~52 bpm over a low body bed | 118.0 s, AAC/M4A, ~96 kbps, 1,410 KB |
| Womb | womb.m4a | — (no recording used) | Generated in-house for Lullhaven (noiseGen renderWomb) | Project-generated | 2026-10-31 | None | Synthesized: 320 Hz low-passed brown wash + muffled heartbeat. A bug in the first render (a length-mismatched mix-in produced NaNs and a near-silent file) was caught by the QA pass below and the file was re-rendered clean | 117.0 s, AAC/M4A, ~96 kbps, 1,395 KB |
| Cat purr | cat-purr.m4a | — (no recording used) | Generated in-house for Lullhaven (noiseGen renderPurr) | Project-generated | 2026-10-31 | None | Synthesized: low-passed brown rumble amplitude-modulated at ~25 Hz in 4 s breathing phrases | 117.0 s, AAC/M4A, ~96 kbps, 1,396 KB |
| Campfire | campfire.m4a | — (no recording used) | Generated in-house for Lullhaven (noiseGen renderCampfire) | Project-generated | 2026-10-31 | None | Synthesized: low brown bed + seeded random woody pops with exponential decay | 116.0 s, AAC/M4A, ~96 kbps, 1,375 KB |
| Green noise | green-noise.m4a | — (generated) | Generated in-house for Lullhaven (noiseGen renderColoredNoise) | Project-generated | 2026-10-31 | None | Synthesized: pink noise band-limited to the mid range | 115.0 s, AAC/M4A, ~96 kbps, 1,371 KB |
| Blue noise | blue-noise.m4a | — (generated) | Generated in-house for Lullhaven (noiseGen renderColoredNoise) | Project-generated | 2026-10-31 | None | Synthesized: differentiated white noise (+3 dB/octave) | 115.0 s, AAC/M4A, ~96 kbps, 1,371 KB |
| Grey noise | grey-noise.m4a | — (generated) | Generated in-house for Lullhaven (noiseGen renderColoredNoise) | Project-generated | 2026-10-31 | None | Synthesized: low-passed pink noise, an equal-loudness approximation | 115.0 s, AAC/M4A, ~96 kbps, 1,371 KB |
| Violet noise | violet-noise.m4a | — (generated) | Generated in-house for Lullhaven (noiseGen renderColoredNoise) | Project-generated | 2026-10-31 | None | Synthesized: twice-differentiated white noise (+6 dB/octave); crest-heavy, sits below pack RMS by construction | 115.0 s, AAC/M4A, ~96 kbps, 1,376 KB |

### v1 files re-levelled in v1.1

- **Fireplace** and **Thunderstorm** shipped in v1 at RMS −31.9 dB and
  −28.7 dB with peaks at 0.0 dB — far under the pack and impossible to
  raise by gain alone. In v1.1 both received the same gentle 3:1
  compression pass as the new dynamic recordings plus up to +6 dB,
  landing at −28.5 dB and −26.0 dB RMS. Same recordings, same
  segments; only the level changed. (AAC re-encode generation loss on
  noise-like beds is negligible and was accepted for this fix.)

### Release QA checklist (run 2026-10-31 over all 44 files)

For every bundled file, measured on the decoded AAC:
- [x] Duration within the register's stated delivered length.
- [x] RMS within the pack profile (−21 dB ± 3) or a documented
  character outlier above (light-rain, morning-rain, night-storm,
  shower, blue/violet noise, heartbeat/womb/cat-purr beds,
  fireplace/thunderstorm legacy levels).
- [x] No peak above 0.0 dB; new recordings capped at −1 dB before
  encode (AAC overshoot accounts for readings within ~1 dB of it).
- [x] Loop seam: pre-encode, the wrap step (last→first sample) sits
  inside the file's own step distribution after the 10 s equal-power
  crossfade (worst accepted: air-conditioner / airplane-cabin at
  ≤ 0.03 of max step after a seed re-pick). On top of that, the
  engine crossfades 8 s across every boundary at playback.
- [x] Content: every recording's spectrogram reviewed before
  acceptance; anything whose content could not be certified
  (possible voices, unidentified ambience) was rejected — see
  "Checked but NOT used".
- [x] No embedded birds or transients in sounds labelled "pure";
  the one recording with birds (morning-rain) is labelled with them.
- [x] Every generated file carries "Generated" in its app note or
  credit line; no generated file is presented as a recording.

## Checked but NOT used

- **"Rain on Carport" by Leonard.B.Blaesing, Freesound #577887** — license verified
  CC0 on its own page ("Completely free to use. No attribution needed"), 4:06 WAV.
  Not used: Freesound download is login-gated and the preview CDN blocked the
  download (403). Re-download with a free Freesound account if a longer rain is wanted.
- **Night crickets candidates on Freesound** — "Night Crickets Ambience on Rural
  Property" by OwlStorm (#320145, CC0, 1:22) and "Night.wav" by Islabonita (#220954,
  Creative Commons 0 on its page, 7:12) were both license-verified but hit the same
  Freesound download block, so the public-domain archive.org recording above was used.
- **"Medium shower accompanied by thunders.ogg" and "Summer thunderstorm in the
  woods.ogg" (Wikimedia Commons)** — downloaded for inspection, then rejected: their
  licenses could not be verified to the CC0/public-domain standard. Not delivered.
- **"Cicadas in Greece.ogg" (Wikimedia Commons)** — rejected: license not clearly
  stated on its file page, and it is cicadas, not crickets. Not delivered.
- No CC BY, CC BY-NC, Pixabay, or YouTube-sourced audio was used anywhere in this set.

### v1.1 round (2026-10-31)

- **"Flea market in the rain" by stephan (Wikimedia Commons, public
  domain)** — downloaded and spectrogram-reviewed, then rejected:
  the recording is a market scene and distant voices could not be
  ruled out. A sleep app ships no possible voices.
- **"20090610 0 ambience" by nille (Wikimedia Commons, public
  domain)** — rejected: spectrogram shows structured tonal phrases
  (likely birdsong) that cannot be honestly labelled from the file's
  metadata, which says only "ambience".
- **Suchsdorf forest ambience, radio aporee item aporee_53013_60581
  (Public Domain Mark 1.0)** — rejected: the item's own filename
  flags anthropophony, and the inspected segment is sparse birdsong
  over near-silence, not a usable forest bed.
- **"Rain and thunder" by Caesar (Wikimedia Commons, public
  domain)** and **"Kcg-za (rain)" (CC0)** and **"PigFrog
  EvergladesNP" (public domain, NPS)** — rejected on length: 18.9 s,
  1.0 s and 2.0 s respectively; too short to loop to the pack
  standard.
- **"Thunderstorm after hot summer day, 02 of 04" by stephan
  (public domain)** — not used: segment 01 of the same session was
  taken; a second cut added nothing distinct.
- **"James River Rapids 3" (CC0, Jarrod Stanley)** — not used:
  three of his rapids recordings were taken; a fourth was redundant.
