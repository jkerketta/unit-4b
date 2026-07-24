# "Unit 4B" — PSX-Style Apartment Horror Game: Design Spec

**Date:** 2026-07-24
**Status:** Approved
**Source prompt:** `psx-horror-game-prompt.md`

## 1. Experience Target

A short (10–15 minute) first-person PSX-style horror game in the spirit of Chilla's Art / Puppet Combo. Two acts:

- **Act 1 — Calm (~7 min):** mundane exploration. Unpack boxes, read the lease, discover the hidden hatch. Deliberately almost boring — the contrast IS the horror.
- **Act 2 — Chase (~4 min):** sustained chase/stealth sequence through the same apartment. Reach the front door and escape.

Single confined location, 2–4 scripted jumpscares, low-poly PS1 aesthetic. Prioritize atmosphere and a working core loop over content volume.

## 2. Locked Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Art source | **Fully procedural** — Three.js primitives + canvas-generated textures. No downloaded models. |
| Audio source | **Free CC0 SFX** (freesound.org et al.) + **TTS voicemail** run through a lo-fi phone filter |
| Hidden door | **Rug hatch** — trapdoor under the living-room rug, gated by one box-shove step |
| V1 mechanics | **Hide spot (under bed) + heartbeat** proximity audio are IN. CRT filter toggleable. Affine texture mapping OUT. |
| Workflow | Docs lookup during build, manual playtest at each milestone |
| Architecture | **Single persistent scene, phase-driven** via zustand store; UI as DOM overlays |
| Entity look | **Tall thin man** — ~2.6m pale humanoid, elongated limbs, featureless smooth head |

## 3. Story

The player just signed a lease for Unit 4B — good price, landlord closed unusually fast. First night, while unpacking, they find a hatch under the living-room rug that isn't on the floor plan. It descends into a windowless concrete room that shouldn't exist between floors — the previous tenant clearly used it to hide something. Entering it wakes something that's been living in the walls, and it wants the player out.

**Story delivery (environmental only, no exposition dumps):**

- Lease paperwork with a redacted previous-tenant name and an odd clause: *"Tenant agrees the unit floor plan is as provided."*
- Notes/photos/personal effects in the secret room hinting at why the last tenant vanished.
- One landlord voicemail mid-chase: *"If you found the room... just leave the keys under the mat."*

**Win:** reach the front door after the chase begins, hold `E` for 2s to work the deadbolt, escape.
**Lose:** caught by the entity → jumpscare → game over → retry from checkpoint (set at the moment the hatch is first opened, so Act 1 is never replayed).

## 4. Floor Plan

One ~11×9m unit. Boxy rooms enable cheap AABB collision and a clean room-graph for AI.

```
                N
   ┌──────────┬─────────┬──────────┐
   │ BATHROOM │ BEDROOM │          │
   │  (2×2.5) │ (3×3.5) │ KITCHEN  │
   ├────┬─────┴───┬─────┤ (3×2.5)  │
   │    │ HALLWAY │     ├─────┬────┘
   │    ├─────────┘     │     │
   │    │ LIVING ROOM   │ ENTRY├─ FRONT DOOR (escape)
   │    │ (4.5×4)       │(2×2) │
   │    │  ▓ rug+hatch  │     │
   └────┴───────────────┴─────┘

   below LIVING ROOM (impossible space):
   SECRET ROOM (4×3, concrete, dirt floor, ladder access)
```

- **Living room:** moving boxes, couch, tube TV, rug over hatch
- **Kitchen:** lease documents on counter, fridge (ambient hum), phone (voicemail beat)
- **Bedroom:** bed (**hide spot: under bed**), closet, black painted-shut window
- **Bathroom:** mirror, dripping tap — atmosphere only
- **Secret room:** cot, candles, photos, notebook pages. Deliberately unexplained impossible space.

## 5. Tech Stack

- Vite + React + TypeScript
- React Three Fiber + `@react-three/drei`
- Three.js (renderer)
- zustand (all game state)
- howler (audio)
- `@react-three/postprocessing` (dither/CRT passes)
- vitest (logic unit tests only)

**No physics engine.** Collision is custom capsule-vs-AABB. AI navigation is a hardcoded room-graph with BFS. No new major dependencies beyond this list without asking.

## 6. Architecture

**One persistent `<Canvas>`** that never unmounts. The zustand store is the single source of truth:

```ts
phase: 'title' | 'calm' | 'chase' | 'win' | 'gameover'
objectives: { id: string; label: string; complete: boolean }[]
player: { position: [number,number,number]; stamina: number; hidden: boolean }
entity: { state: 'dormant'|'alert'|'search'|'chase'|'attack'; room: string; targetRoom: string }
flags: { leaseRead: boolean; rugNoticed: boolean; hatchOpen: boolean; voicemailPlayed: boolean }
checkpoint: Snapshot | null   // taken at hatchOpen
```

All UI (title, HUD, pause, death, win) is DOM overlays. The title screen is a slow camera drift through the dark apartment — no separate scene.

The `phase` flag gates everything: entity mounts only in `chase`, audio layers crossfade, HUD swaps from objective prompts to urgency.

## 7. PSX Render Pipeline (built at M2 — gates all art decisions)

1. **Low-res target:** scene renders to a `480×270` WebGLRenderTarget (NearestFilter min+mag, no mipmaps), upscaled via fullscreen quad with point sampling — real pixelation.
2. **Vertex snap:** `onBeforeCompile` injection on every material — `gl_Position` snapped to a coarse screen-space grid → authentic geometry wobble.
3. **Vertex-lit look:** MeshLambertMaterial / vertex colors only. No PBR, no normal maps, no realtime shadows (fake blob-shadow discs under props).
4. **FogExp2:** aggressive dark fog — hides hallway ends and the secret room's far wall.
5. **Dither pass:** custom ShaderPass — Bayer 4×4 ordered dithering + color quantization (~32 levels/channel).
6. **CRT-lite pass:** subtle scanlines + slight chromatic aberration at edges. Toggleable, kept faint.

## 8. Core Systems

### 8.1 Player Controller
- WASD + mouse look (PointerLockControls), walk 2.6 m/s, sprint 4.5 m/s.
- Stamina 100: sprint drains 20/s, regen 10/s after 1s delay.
- Interact: center-screen raycast, 2m range, `E` key, prompt shows contextual label.
- Collision: capsule (r=0.3, h=1.7) vs wall AABBs, custom resolver.

### 8.2 Act 1 Objective Chain
1. *Unpack your boxes* — 3 box interacts in the living room (teaches controls).
2. *Look over the lease* — kitchen counter; redacted tenant name; the floor-plan clause.
3. *That sound…* — walking over the rug plays a hollow creak → objective *"Check under the rug"*.
4. Rug blocked by a box → shove it (the single puzzle step) → pull rug → hatch revealed.
5. *See what's down there* — descend ladder → **Scare #1** → `phase` flips to `chase` as the player climbs back out.

### 8.3 Hidden Door Mechanic
Rug + hatch entity with `hatchOpen` flag. Reveal gated by one step (shove box). Opening the hatch sets the **checkpoint** (player position, objectives, flags snapshot).

### 8.4 Entity AI (mounts only when `phase === 'chase'`)
Explicit state machine:
- **alert** (2s): shriek, knows player's room.
- **chase:** BFS room-graph path toward player, 3.4 m/s (faster than walk, slower than sprint). Straight-line steering within a room.
- **search:** on losing sight + hearing, walks 1.6 m/s between last-known room and neighbors.
- **attack:** proximity < 1.2m → jumpscare → `gameover`.
- **Hearing:** player sprint emits noise events (~6m radius through walls); entity investigates.
- **Line of sight:** raycast against wall AABBs.
- **Hide spot rule:** hiding unseen → entity searches, then patrols. Hiding while seen → entity pulls the player out (caught).

### 8.5 Jumpscares (3)
1. **Secret room discovery (scripted):** on reading the notebook, candle light cuts, whisper stinger, entity silhouette at far end for 0.5s, gone. Entity still not active.
2. **Wake glimpse (scripted):** climbing out of the hatch, the entity crosses the hallway doorway at full height, despawns → AI spawns in `alert`.
3. **Catch (dynamic):** camera snaps to entity face, fullscreen flash + shake + stinger → `gameover`.

Each scare < 1s visual. Sound design sells it.

### 8.6 Audio
- **Calm layer:** room tone, fridge hum, distant traffic. Crossfades OUT on phase flip — the silence sells it.
- **Chase layer:** low drone; entity footsteps (heavy, wet reverb, audible through walls = proximity cue); heartbeat (rate + volume scale with entity distance); stingers.
- **Diegetic:** unpacking thuds, hatch creak, ladder, phone ring, deadbolt.
- **Voicemail:** ~30s into chase, kitchen phone rings. Answering is a risky detour. Plays TTS voicemail through phone EQ. If never answered, it plays as the death-screen stinger.

### 8.7 UI/UX
- Minimal HUD: objective card (journal-style, typewriter font on paper texture) in Act 1; "GET OUT" urgency in Act 2; interact prompt bottom-center; thin stamina bar that fades in when not full.
- Title screen: drifting camera through dark apartment, "UNIT 4B" logo, Start / Controls / Credits, ambient drone.
- Pause (Esc): resume / controls / restart.
- Death screen: "IT FOUND YOU" + Retry (restores checkpoint).
- Win screen: escape time + credits line.

## 9. Procedural Art Approach

Everything from primitives + canvas-generated textures (wood floor, stained wallpaper, carpet, concrete). NearestFilter makes 64×64 canvases read as authentic PS1. Props: box-tower moving boxes, slab couch, tube TV, cot, candles (flickering point light). Entity: ~2.6m stretched-capsule figure, elongated limbs, matte off-white, head subtly too smooth; bone-less limb pivot animation; vertex jitter does half the scaring for free.

## 10. Build Milestones

| # | Milestone | Done when |
|---|---|---|
| M1 | Scaffold + store + FPS controller | Walk around empty greybox room, pointer lock works |
| M2 | PSX pipeline | Vertex wobble, pixelation, dither, fog visible |
| M3 | Apartment greybox + collision | Full floor plan walkable, walls solid, hatch hole exists |
| M4 | Act 1 loop | Objectives → lease → rug → hatch → secret room → Scare #1 → checkpoint. No AI |
| M5 | Entity + phase transition | Chase/search/attack in greybox, room-graph pathing, catch → gameover → retry |
| M6 | Scares #2/#3 + hide + heartbeat + win | Full Act 2 playable end-to-end, win via front door |
| M7 | Audio pass | All layers + voicemail in |
| M8 | Art pass | Textures, props, entity model, lighting |
| M9 | Title/menus/polish + playtest | Shippable demo |

Every milestone ends with a runnable, playable build. Light vitest coverage on pure logic only (phase transitions, objective chain, BFS pathing, AI state machine); visuals verified by manual playtest.

## 11. Constraints

- Small, testable increments; game runs after every task.
- No over-engineering the AI (no navmesh, no A* grids).
- One static apartment, one static secret room. No shifting geometry. No scope creep.
- Hidden-door puzzle stays one simple step.
- Ask before new major dependencies.
- Git: feature branch per milestone, conventional commits, PR + merge into main per milestone, push after each commit.
