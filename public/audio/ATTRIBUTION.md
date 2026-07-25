# Audio attribution

Most WAV files in this directory were generated locally for Unit 4B.
They are original procedural synthesis: deterministic combinations of sine waves,
filtered-style noise, amplitude envelopes, and transient pulses produced with
Python's standard-library `wave` module.

Notable regenerated procedural cues:
- `heartbeat.wav` — clean bass lub-dub thump (no noise); played as one-shots at chase BPM
- `paper.wav` — short page-rustle for lease / notebook open
- `scare-stinger.wav` / `shriek.wav` — harsh scream jumpscares (replacing UFO-style tones)
- `church-bell.wav` — deep bell strike for the kitchen wake cutscene
- `static.wav` — radio/TV static crackle layered under the wake cutscene

## Kenney (CC0)

These samples are derived from Kenney assets (https://kenney.nl), licensed CC0:

- `player-step.wav` — single footstep sliced from the walking loop in
  [KenneyNL/Starter-Kit-FPS](https://github.com/KenneyNL/Starter-Kit-FPS) (`sounds/walking.ogg`)
- `entity-step.wav` — same source, pitch-shifted and filtered for a heavier chase cue
- `ui-click.wav` — `click3.wav` from Kenney UI Audio
  (https://kenney.nl/assets/ui-audio), via the CC0 mirror at
  [Calinou/kenney-ui-audio](https://github.com/Calinou/kenney-ui-audio)

Credit to Kenney (www.kenney.nl) is appreciated but not required.

## Voicemail

The landlord voicemail uses the browser's installed Web Speech API voice at
runtime; the spoken voice is not bundled or redistributed. `voicemail-bed.wav`
is only an original procedural telephone-line noise bed.

Procedural WAV assets in this folder are released with this project under CC0-1.0.
