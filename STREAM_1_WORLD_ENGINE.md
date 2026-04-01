# STREAM 1 — WORLD ENGINE & ENVIRONMENT
## Dreamwell World: Retro-Robot Junkyard Island

> **Prerequisites**: Phase 0 must be complete. All shared types, constants, store slices, and placeholder components must exist and compile.
>
> **File Ownership**: This stream ONLY touches files in:
> - `src/world/**`
> - `src/shaders/**`
> - `src/rendering/**`
>
> **DO NOT** modify any files in `src/shared/`, `src/characters/`, `src/physics/`, `src/controls/`, `src/audio/`, `src/ui/`, `src/systems/`, `src/data/`.
>
> **Communication with other streams**: Use the shared Zustand store (`useGameStore`) and `EventBus` for cross-stream data. Import types from `@shared/types` and constants from `@shared/constants`.
>
> **Estimated build time**: 2–4 hours with Claude Code Agent Teams.
>
> **Agent Teams suggestion**: Within this Stream, you can spawn Agent Teams:
> - Agent A: Terrain system (terrain/, shaders/terrain.*)
> - Agent B: Water + Sky (water/, sky/, shaders/water.*)
> - Agent C: Structures (structures/)
> - Agent D: Props + Vegetation + Lighting (props/, vegetation/, lighting/, rendering/)
>
> Run Agent A first (terrain is needed by others), then B/C/D in parallel.

---

## AESTHETIC DIRECTIVE

This is NOT Animal Crossing. This is NOT bright and bubbly. The vibe is:

**"Retro-futuristic junkyard workshop on a warm, overgrown island at golden hour."**

Think: cluttered wooden desks covered in vintage electronics, CRT monitors stacked haphazardly, exposed wiring draped like vines, rusted satellite dishes, broken-down vehicles repurposed as shelters. Everything bathed in warm amber/golden light with deep shadows. Film grain. Vignette. The color palette is:

- **Terrain**: Warm sand (#D4A574), dark earth (#3E2723), dry grass (#9B8B5E), oxidized copper patches (#4A7C6F)
- **Structures**: Aged wood (#8B6914), rust (#A0522D), concrete (#6D6359)
- **Water**: Muted teal (#5B8C7A shallow), dark green-black (#1A3A3A deep)
- **Sky**: Golden hour amber (#FFD27F) fading to dusk purple (#2E1B4A) at horizon
- **Fog**: Warm sand tone (#D4A574)
- **Lighting**: Primary directional = warm golden (#FFE4B5), ambient = low warm (#FFD27F at 0.3), point lights = desk lamps (warm orange #FF6B35)

Low-poly geometry is fine — but make it feel WARM and LIVED-IN, not sterile.

---

## TASK 1: TERRAIN SYSTEM

### 1.1 Terrain Generator (`src/world/terrain/TerrainGenerator.ts`)

Build a procedural terrain generator using simplex noise.

**Requirements**:
- Accept an `IslandConfig` and `TerrainConfig` from shared types
- Generate a heightmap as `Float32Array` for a given chunk
- Use multi-octave simplex noise (6 octaves, lacunarity 2.0, persistence 0.5)
- Apply an island mask: multiply height by a radial falloff so edges drop to water level. Use `1 - smoothstep(0.6, 1.0, distFromCenter)` where distFromCenter is normalized 0–1 from island center
- Generate a splatmap (RGBA Float32Array) based on height + slope:
  - R channel = sand (low elevation, near water)
  - G channel = grass (mid elevation, gentle slope)
  - B channel = dirt/rock (high elevation or steep slope)
  - A channel = path/concrete (manually defined areas around structures — use distance-to-structure-position checks)
- Export a function `generateChunkHeightmap(config, chunkX, chunkZ)` → `TerrainChunkData`
- Export a function `getHeightAtPosition(x, z)` → `number` (bilinear interpolation of heightmap, used by physics/characters)
- The heightmap should create a natural island shape: higher in the middle, with some hills and valleys, sloping down to beaches at the edges. Include a few flat plateaus for structure placement.

**Key terrain features to shape**:
- A large flat area in the north for the **Playbook Station** (elevated plateau)
- A sunken bowl in the east for the **Stock Market** (like a trading pit)
- A sprawling flat zone in the south for the **Junkyard** (largest area)
- A gentle hill in the west for the **Drive-in Cinema** (natural amphitheater slope)
- A road/path network connecting all structures (flattened paths through terrain)
- Beach edges all around with gentle sand slopes into water
- A few scattered small hills for visual interest

```ts
// Structure placement positions (world coordinates, Y will be derived from heightmap)
export const STRUCTURE_POSITIONS = {
  playbook_station: [30, 0, -60] as const,    // North plateau
  stock_market: [70, 0, 10] as const,         // East sunken area
  junkyard: [-10, 0, 60] as const,            // South sprawl
  drivein_cinema: [-65, 0, -20] as const,     // West hillside
  school_bus: [15, 0, 40] as const,           // Near junkyard
  workshop_hut_1: [-30, 0, -30] as const,     // Scattered
  workshop_hut_2: [50, 0, -40] as const,
  dock: [85, 0, 50] as const,                 // East shore
  lighthouse: [-80, 0, -70] as const,         // Northwest point
};
```

### 1.2 Terrain Material (`src/world/terrain/TerrainMaterial.ts`)

Create a custom `ShaderMaterial` for terrain rendering using texture splatting.

**Requirements**:
- Vertex shader (`src/shaders/terrain.vert.glsl`):
  - Standard MVP transform
  - Pass UV, world position, and normal to fragment shader
  - Slight vertex displacement for micro-detail (optional: small noise displacement)
- Fragment shader (`src/shaders/terrain.frag.glsl`):
  - Accept uniforms: `uSplatmap` (DataTexture from splatmap), `uTime`
  - For each RGBA channel, blend a different procedural color/pattern:
    - R (sand): Warm sandy color with subtle noise variation, `mix(#D4A574, #C49B6A, noise)`
    - G (grass): Warm green-yellow, `mix(#6B8E23, #9B8B5E, noise)` with patchy variation
    - B (dirt/rock): Dark earth with rocky highlights, `mix(#3E2723, #6D6359, noise)`
    - A (path): Concrete-like flat tone, `mix(#6D6359, #8B8070, noise)`
  - Add subtle noise-based color variation across the entire surface (prevents flat look)
  - Add height-based color influence: higher = more exposed rock, lower = more sand
  - Apply fog factor (distance-based, matching the scene fog color `#D4A574`)
  - Add subtle fake cloud shadows: `sin(worldPos.x * 0.02 + uTime * 0.1) * sin(worldPos.z * 0.02 + uTime * 0.08)` modulating brightness by ~5%

### 1.3 Terrain Mesh Component (`src/world/terrain/TerrainMesh.tsx`)

R3F component that renders the terrain.

**Requirements**:
- Generate geometry from heightmap data: create a `PlaneGeometry`, then displace vertices Y using the heightmap
- Apply the custom `TerrainMaterial`
- Enable shadow receiving (`receiveShadow`)
- Add collision geometry for Rapier: use `<RigidBody type="fixed"><HeightfieldCollider>` from `@react-three/rapier`
- Memoize geometry generation (don't regenerate every frame)

### 1.4 Terrain Chunk + LOD (`src/world/terrain/TerrainChunk.tsx`)

Chunk-based terrain with LOD switching.

**Requirements**:
- Each chunk is `CHUNK_SIZE` (50 units) square
- LOD 0: Full resolution (64x64 vertices)
- LOD 1: Half resolution (32x32)
- LOD 2: Quarter resolution (16x16)
- Switch LOD based on distance from camera (use `LOD_DISTANCES` from constants)
- Use React Three Fiber's `useFrame` to check distance each frame and swap geometry
- Only render chunks within the camera frustum (basic frustum culling)
- Track active chunks in the Zustand store via `setActiveChunks()`

---

## TASK 2: WATER SYSTEM

### 2.1 Water Surface (`src/world/water/WaterSurface.tsx`)

A large plane surrounding the island at `WATER_LEVEL` height.

**Requirements**:
- Plane geometry: 400x400 units (extends well beyond island), subdivided for vertex animation
- Position at Y = `WORLD.WATER_LEVEL * WORLD.HEIGHT_SCALE` (= 0.5 * 15 = 7.5)
- Apply custom `WaterMaterial`
- Semi-transparent (to see the terrain slope into water)
- Do NOT receive or cast shadows (performance)

### 2.2 Water Material (`src/world/water/WaterMaterial.ts`)

Custom shader for stylized water.

**Vertex shader** (`src/shaders/water.vert.glsl`):
- Animate vertices with layered sine waves:
  ```glsl
  float wave1 = sin(position.x * 0.3 + uTime * 0.8) * 0.15;
  float wave2 = sin(position.z * 0.4 + uTime * 0.6) * 0.1;
  float wave3 = sin((position.x + position.z) * 0.2 + uTime * 1.2) * 0.08;
  displaced.y += wave1 + wave2 + wave3;
  ```
- Pass world position to fragment

**Fragment shader** (`src/shaders/water.frag.glsl`):
- Base color: blend between shallow (#5B8C7A) and deep (#1A3A3A) based on depth (distance from shore / terrain intersection)
- Animated surface pattern: two layers of scrolling noise creating caustic-like patterns
- Specular highlight: fake sun reflection based on view angle and wave normal
- Subtle color variation using noise
- Transparency: alpha ~0.75 near shore, ~0.9 far from shore
- Foam: white band near terrain intersection (where water meets land)
- Apply fog

### 2.3 Foam Effect (`src/world/water/Foam.tsx`)

Shore foam where water meets terrain.

**Requirements**:
- Generate foam positions along the shoreline (where heightmap crosses water level)
- Use instanced meshes or particle system for small white foam patches
- Animate foam: gentle bobbing, occasional spawn/fade
- Keep it subtle — small white patches that appear and dissolve

---

## TASK 3: SKY & ATMOSPHERE

### 3.1 Skybox (`src/world/sky/Skybox.tsx`)

Gradient sky dome.

**Requirements**:
- Use a large sphere (or hemisphere) with a custom shader
- Gradient: bottom = warm golden (#FFD27F), middle = soft blue (#87CEEB faded), top = dusk purple (#2E1B4A)
- Add procedural cloud shapes: flat, layered noise shapes scrolling slowly across the sky
- Clouds should be warm-tinted (not pure white — more like #FFE8CC)
- Apply time-of-day influence (read `timeOfDay` from store) — shift colors warmer at low sun, cooler at high sun

### 3.2 Sun (`src/world/sky/Sun.tsx`)

Visual sun disc (separate from the directional light).

**Requirements**:
- A glowing sprite/billboard positioned to match the directional light angle
- Warm golden color with soft glow
- Size scales slightly with camera distance
- Position derived from `timeOfDay` store value

### 3.3 Atmosphere (`src/world/sky/Atmosphere.tsx`)

Fog and atmospheric effects.

**Requirements**:
- Manage Three.js scene fog dynamically based on time of day and quality settings
- Golden hour: denser, warmer fog
- Read quality preset: on low quality, increase fog density (hides distant objects = fewer draws)
- Export a component that updates fog parameters via `useFrame`

---

## TASK 4: STRUCTURES

Each structure is a procedurally generated low-poly building made from Three.js primitives (boxes, cylinders, planes). NO external 3D models — everything is code-generated geometry.

### 4.1 Structure Base (`src/world/structures/StructureBase.tsx`)

Shared logic for all structures.

**Requirements**:
- Accept a `StructureDef` from shared types
- Position on terrain using `getHeightAtPosition()` to snap to ground
- Add Rapier colliders (box colliders for walls)
- Emit `STRUCTURE_ENTERED` / `STRUCTURE_EXITED` events when player crosses interaction radius
- Show interaction icon when player is within range (emit to UI via event bus)
- Support interior mode: when `enterable` is true and player enters, switch camera to interior mode

### 4.2 Playbook Station (`src/world/structures/PlaybookStation.tsx`)

**Description**: A large workshop building on the north plateau. Think "retro mission control" — a raised wooden/metal platform with a roof, covered in old computer terminals, screens, and analog gauges. The "command center" where campaigns are managed.

**Geometry**:
- Base platform: Large box (12x0.5x8), wooden plank texture (procedural stripes shader)
- Walls: 3 walls (open front), box geometry, aged wood color with rust patches
- Roof: Angled planes forming a corrugated metal roof (slightly tilted, imperfect)
- Interior details:
  - Long desk (box) with multiple CRT monitors (small boxes with emissive screen faces)
  - Analog gauge cluster on back wall (cylinders with colored segments)
  - A large central screen (plane with emissive material, showing a grid pattern)
  - Hanging cables from ceiling (thin cylinders / lines)
  - Filing cabinets (boxes) along one wall
- Exterior details:
  - Antenna array on roof (thin cylinders + small dish)
  - Steps leading up to platform (box steps)
  - Sign: "PLAYBOOK STATION" (use a plane with canvas texture or just a simple box placeholder)
- Point lights inside: warm desk lamp glow (2-3 point lights, warm orange, low intensity)

### 4.3 Stock Market (`src/world/structures/StockMarket.tsx`)

**Description**: A sunken, open-air trading pit in the east. Rustic influencer stock market. Like a broken-down stock exchange floor but outdoors. Multiple levels of wooden platforms with old ticker screens.

**Geometry**:
- Sunken pit: The terrain already dips here; add circular wooden platform tiers stepping down (concentric box rings, each lower than the last)
- Central podium: Tall box with a large screen showing a "ticker" (emissive plane, scrolling text would be nice but static pattern is fine)
- Surrounding desks: Semicircular arrangement of small desks (boxes) each with a small CRT monitor
- Ticker boards: Tall rectangular planes around the perimeter showing "stock prices" (static patterns are fine)
- Overhead cables: Thin lines strung between wooden poles, with hanging light bulbs (small emissive spheres)
- Scattered papers/debris on the ground (small flat planes at ground level)
- Weathered wooden fencing around the perimeter
- Old bell on a stand (cylinder + sphere) — the "market bell"

### 4.4 Junkyard (`src/world/structures/Junkyard.tsx`)

**Description**: The largest area in the south. A sprawling collection of piled tech junk, scrap metal, old electronics. The core aesthetic of the world.

**Geometry**:
- Multiple scrap piles: Randomized clusters of boxes, cylinders, and planes at various rotations to look like heaped junk
- Old satellite dishes: Large cylinders tilted at angles
- Tire stacks: Torus geometries stacked (or cylinder rings)
- Rusty car shells: Simplified box-based car shapes (no wheels, just body shells), half-buried
- Shipping containers: Large colored boxes (rust red, faded blue) with slightly open doors
- Chain-link fence sections: Grid of thin lines/planes along some edges
- Central clearing: A relatively flat area with a workbench and tools
- Scattered small props: circuit boards (flat planes), keyboards, cables
- A few trees/bushes growing through the junk (vegetation piercing through)
- Warm lighting: a few standing lamps (tall cylinders with emissive spheres on top)

### 4.5 Drive-in Cinema (`src/world/structures/DriveinCinema.tsx`)

**Description**: A walk-in drive-in cinema on the west hillside. The terrain slopes naturally here, creating an amphitheater. A big screen at the bottom of the slope.

**Geometry**:
- The Big Screen: A large white/light gray plane (10x6 units) mounted on two thick poles. This is the cinema screen. It should have an emissive material that can optionally display content. For now, make it glow with a warm amber tint and show a simple static pattern (horizontal scan lines)
- Screen frame: Dark metal border (thin boxes framing the screen)
- Seating area: Rows of old car hoods/benches (boxes at varying heights on the slope). Some are rusted car bodies (simplified), some are wooden benches
- Projection booth: A small elevated box structure behind the seating with a "projector" (cylinder pointing at screen with a light cone)
- Speaker poles: Thin cylinders with small box speakers along the sides
- Concession stand: A small wooden counter structure to one side
- Scattered popcorn containers (tiny cylinders on ground — optional detail)
- String lights overhead: Thin lines between poles with small emissive spheres

### 4.6 School Bus (`src/world/structures/SchoolBus.tsx`)

**Description**: A broken-down school bus near the junkyard. The player can run inside it. It's been repurposed as a makeshift workspace/shelter.

**Geometry**:
- Bus body: Elongated box (8x2.5x2.5), slightly tilted (one corner sunk into ground)
- Color: Faded yellow (#B8A038) with rust patches (mix materials or vertex colors)
- Windows: Cutout regions (or darker inset planes) along both sides. Some "broken" (missing glass = open holes)
- Wheels: Cylinders, 2 of 4 are flat/missing
- Door: An open door at the front (angled plane)
- Interior (enterable!):
  - Rows of bus seats (small boxes), some overturned, some removed
  - A makeshift desk at the back (box with CRT monitor)
  - Hanging wires from the ceiling
  - Old books/papers scattered (flat planes)
  - A mattress (flat padded box) on some seats — someone lives here!
  - Small point light inside (warm glow through windows)
- Exterior:
  - Graffiti suggestion: a few colored patches on the side (colored planes overlaid)
  - Weeds/grass growing around and under it
  - A flat tire pile next to it
- Bus should have colliders: exterior walls block movement, the open door allows entry
- When player enters, emit `STRUCTURE_ENTERED` with id `'school_bus'`, camera switches to interior mode

### 4.7 Workshop Hut (`src/world/structures/WorkshopHut.tsx`)

**Description**: Small NPC workshop buildings scattered around the island. Each robot NPC has their own hut. Simple structures: 4 walls, a door, a roof, a desk inside.

**Geometry** (parameterized — reuse for multiple instances):
- Base: Square platform (4x0.2x4)
- Walls: 4 box walls with a doorway cutout in front
- Roof: Two angled planes meeting at a ridge (A-frame)
- Door: A hinged plane (slightly open)
- Interior: Desk, chair, lamp, a few props
- Exterior: Small porch area, sign with NPC name
- Accept a `variant` prop that changes colors and interior prop arrangement
- Position snaps to terrain height

---

## TASK 5: PROPS

### 5.1 CRT Monitors (`src/world/props/CRTMonitors.tsx`)

Instanced CRT monitor stacks scattered around the world.

**Requirements**:
- Procedural CRT: Box body (0.4x0.35x0.3), smaller screen plane on front with emissive glow
- Screen colors cycle through: green, amber, cyan (from `PALETTE.SCREEN_*`)
- Some monitors are on (emissive screen), some off (dark screen)
- Use `InstancedMesh` for performance — can scatter 50-100 across the island
- Accept position array, generate random rotations/stacking
- Some stacked 2-3 high, some solo, some on desks, some on ground

### 5.2 Wiring Clusters (`src/world/props/WiringClusters.tsx`)

Hanging and draped wires/cables.

**Requirements**:
- Generate cable paths using catenary curves (or simplified sine-wave draping between two points)
- Use `TubeGeometry` with small radius (0.01-0.02)
- Colors: black, red, yellow, blue insulation
- Cluster 5-10 cables together with slight random offsets
- Place between structure points (building corners, poles, posts)
- Some hanging from ceilings, some draped on ground

### 5.3 Retro Electronics (`src/world/props/RetroElectronics.tsx`)

Scattered vintage tech props.

**Requirements**:
- Keyboard: Flat box (0.3x0.02x0.12) with tiny raised keys (instanced small cubes)
- Circuit board: Flat green plane with tiny colored rectangles (components)
- Cassette tape: Small box with two cylinder reels
- All using `InstancedMesh` for performance
- Scatter these around desks and on the ground near structures

### 5.4 Furniture (`src/world/props/Furniture.tsx`)

Desks, chairs, shelves.

**Requirements**:
- Desk: Table-shaped boxes (top plane + 4 leg boxes), aged wood color
- Chair: Box seat + back + 4 legs, some tilted/overturned
- Shelf: Tall box frame with horizontal shelves, items on shelves (small boxes)
- Workbench: Thick-topped desk with vise (box+cylinder), tools hanging on back board
- All instanced where possible

### 5.5 Debris (`src/world/props/Debris.tsx`)

Ground-level scatter.

**Requirements**:
- Tires: Torus geometry, dark rubber color, scattered around junkyard
- Crates: Wooden box crates in various sizes
- Barrels: Cylinder geometry, rusty metal colors, some on sides
- Random rotation and slight ground embedding for natural feel
- Use instanced meshes with random transforms

### 5.6 Sign Posts (`src/world/props/SignPosts.tsx`)

Directional and label signs.

**Requirements**:
- Post: Thin tall cylinder
- Sign: Box or plane at top, angled
- Text: Use canvas texture to render text onto the sign (or just colored blocks suggesting text)
- Signs point toward nearby structures: "JUNKYARD →", "STOCK MARKET ←", etc.
- Weathered look: slightly tilted, imperfect

---

## TASK 6: VEGETATION

### 6.1 Grass Field (`src/world/vegetation/GrassField.tsx`)

Instanced grass blades across grassy areas.

**Requirements** (Reference: Coastal World used Bruno Simon's approach):
- Generate grass blade positions from the terrain splatmap (only where G channel > threshold)
- Each blade: Triangle geometry (3 vertices: base-left, base-right, tip)
- Use instanced rendering for thousands of blades
- Vertex shader animates blades with wind: `sin(worldPos.x * 0.5 + uTime * 2.0 + instanceOffset)` tilting the tip
- When player is nearby (pass player position as uniform), blades push away: offset tip in direction away from player, scaled by inverse distance
- Grass color: warm green-yellow (#6B8E23 to #9B8B5E), with random per-instance color variation
- Respect quality settings: reduce count and render distance on lower presets
- Fade out grass at the render distance boundary (alpha fade or scale-to-zero)

### 6.2 Trees (`src/world/vegetation/Trees.tsx`)

Low-poly procedural trees.

**Requirements**:
- Trunk: CylinderGeometry, brown color, slight random lean
- Canopy: 2-3 stacked cone geometries (IcosahedronGeometry deformed), warm green with yellow tints
- Random variation: height, lean angle, canopy size, canopy color
- Place ~20-30 trees across the island in the grassy areas (avoid structure zones)
- Some dead trees (trunk only, no canopy) in the junkyard area
- Cast shadows
- Use instanced meshes where possible

### 6.3 Bushes (`src/world/vegetation/Bushes.tsx`)

Small undergrowth.

**Requirements**:
- Sphere geometry (IcosahedronGeometry for organic look), green with variation
- Smaller than trees, scattered more densely
- Some near structure bases (growing into buildings)
- Instanced for performance

### 6.4 Vines (`src/world/vegetation/Vines.tsx`)

Hanging vines on structures.

**Requirements**:
- Thin cylinder geometry draped down structure walls
- Green color, some with small leaf accents (tiny planes)
- Attach to structure edges and hang down
- Subtle wind sway animation in vertex shader

---

## TASK 7: LIGHTING

### 7.1 World Lighting (`src/world/lighting/WorldLighting.tsx`)

Main scene lighting setup.

**Requirements**:
- Primary directional light: Already in App.tsx, but this component fine-tunes it
- Read `timeOfDay` from store and adjust:
  - Light angle (rotate around the scene)
  - Light color (more orange at sunrise/sunset, whiter at noon)
  - Light intensity
  - Shadow properties
- Hemisphere light: sky color top (#FFD27F), ground color bottom (#3E2723), intensity 0.2
- Ambient fill: very low intensity warm light to prevent pitch-black shadows

### 7.2 Point Lights (`src/world/lighting/PointLights.tsx`)

Interior and accent lights.

**Requirements**:
- Desk lamp point lights inside structures (warm orange #FF6B35, intensity 0.5, distance 5)
- CRT monitor screen glow (ambient light contribution — very small point lights at monitor faces)
- String light bulbs at cinema (small warm point lights along string paths)
- Each point light should have a visible light source mesh (small emissive sphere)
- Performance: max ~20-30 active point lights. Cull distant ones.
- Consider using a simple distance check to only render point lights near the player

### 7.3 Shadows (`src/world/lighting/Shadows.tsx`)

Shadow configuration.

**Requirements**:
- Configure shadow camera frustum based on player position (follow the player with the shadow camera)
- Quality-adaptive shadow map size (read from quality settings)
- Soft shadows via PCFSoftShadowMap
- Only key structures and large props cast shadows (trees, structures, bus)
- Performance: limit shadow casters to objects near the player

---

## TASK 8: RENDERING & POST-PROCESSING

### 8.1 Quality Manager (`src/rendering/QualityManager.ts`)

Dynamic quality scaling.

**Requirements** (Reference: Coastal World scaled quality based on FPS):
- Track FPS over a rolling window (last 60 frames)
- If average FPS drops below 30: step down quality preset
- If average FPS stays above 55 for 10 seconds: step up quality preset
- Quality presets control (via store):
  - `renderScale`: Canvas pixel ratio (0.5–2.0)
  - `shadowMapSize`: 512/1024/2048/4096
  - `grassDensity`: 0–1
  - `grassRenderDistance`: 15–50
  - `npcRenderDistance`: 20–80
  - `enablePostProcessing`: on/off
  - `enableParticles`: on/off
  - `maxChunksLoaded`: 4–16
- Emit `QUALITY_CHANGED` event when preset changes
- Expose as a hook: `useQualityManager()` that runs inside `useFrame`

### 8.2 Chunk Manager (`src/rendering/ChunkManager.ts`)

Manages which terrain chunks are loaded/visible.

**Requirements**:
- Based on player position, determine which chunks should be active
- Frustum culling: use the camera frustum to skip chunks behind the player
- Manage chunk loading/unloading with a distance-based priority
- Update store with active chunk IDs
- Limit max loaded chunks from quality settings

### 8.3 Post Processing (`src/rendering/PostProcessing.tsx`)

Film grain and vignette.

**Requirements**:
- The film grain and vignette are ALREADY in CSS (global.css from Phase 0) — this is intentional and follows Coastal World's approach (CSS effects run off the main thread)
- This component handles any WebGL-level post-processing that might be added:
  - Optional subtle bloom on emissive surfaces (CRT screens, light bulbs)
  - Use `@react-three/postprocessing` with `EffectComposer` and `Bloom`
  - Only enable if quality preset allows it
  - Keep it minimal — the CSS grain/vignette does most of the mood work
- If quality is 'low' or 'very-low', render null (no post-processing)

---

## TASK 9: ISLAND ASSEMBLY

### 9.1 Island Component (`src/world/Island.tsx`)

The root component that assembles everything.

**Requirements**:
- This replaces the placeholder `Island` component from Phase 0
- Compose all terrain chunks, water, sky, structures, props, vegetation, and lighting
- Loading sequence:
  1. Generate terrain heightmaps for all chunks
  2. Place structures at their defined positions (snap to terrain height)
  3. Scatter props around structures and across the island
  4. Generate vegetation from splatmap data
  5. Set up lighting
  6. Update loading progress in store at each step
  7. When complete, emit `GAME_READY` event and set `isLoaded: true`
- Use `<Suspense>` boundaries around heavy sub-trees for progressive loading
- Export terrain height query function for other systems to use

### 9.2 Structure Placement Data

Define all structure instances with their positions, rotations, and configurations:

```ts
// Inside Island.tsx or a separate placement file
const STRUCTURES: StructureDef[] = [
  {
    id: 'playbook_station',
    type: 'playbook_station',
    name: 'Playbook Station',
    position: [30, 0, -60],  // Y will be derived from terrain
    rotation: [0, -0.3, 0],
    scale: [1, 1, 1],
    enterable: true,
    interactionRadius: 8,
    boundingBox: { min: [-6, 0, -4], max: [6, 5, 4] },
  },
  {
    id: 'stock_market',
    type: 'stock_market',
    name: 'Influencer Stock Market',
    position: [70, 0, 10],
    rotation: [0, 0.5, 0],
    scale: [1, 1, 1],
    enterable: false,
    interactionRadius: 12,
    boundingBox: { min: [-8, -3, -8], max: [8, 4, 8] },
  },
  {
    id: 'junkyard',
    type: 'junkyard',
    name: 'The Junkyard',
    position: [-10, 0, 60],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    enterable: false,
    interactionRadius: 20,
    boundingBox: { min: [-15, 0, -15], max: [15, 3, 15] },
  },
  {
    id: 'drivein_cinema',
    type: 'drivein_cinema',
    name: 'The Drive-In',
    position: [-65, 0, -20],
    rotation: [0, 0.8, 0],
    scale: [1, 1, 1],
    enterable: false,
    interactionRadius: 15,
    boundingBox: { min: [-8, 0, -6], max: [8, 8, 6] },
  },
  {
    id: 'school_bus',
    type: 'school_bus',
    name: 'The Bus',
    position: [15, 0, 40],
    rotation: [0, -0.7, 0.05],  // Slight tilt
    scale: [1, 1, 1],
    enterable: true,
    interactionRadius: 4,
    boundingBox: { min: [-4, 0, -1.3], max: [4, 2.5, 1.3] },
  },
  {
    id: 'workshop_hut_sentinel',
    type: 'workshop_hut',
    name: "Sentinel's Workshop",
    position: [-30, 0, -30],
    rotation: [0, 0.4, 0],
    scale: [1, 1, 1],
    enterable: true,
    interactionRadius: 4,
    boundingBox: { min: [-2, 0, -2], max: [2, 3, 2] },
    metadata: { npcId: 'sentinel', variant: 0 },
  },
  {
    id: 'workshop_hut_oracle',
    type: 'workshop_hut',
    name: "Oracle's Den",
    position: [50, 0, -40],
    rotation: [0, -0.6, 0],
    scale: [1, 1, 1],
    enterable: true,
    interactionRadius: 4,
    boundingBox: { min: [-2, 0, -2], max: [2, 3, 2] },
    metadata: { npcId: 'oracle', variant: 1 },
  },
];
```

---

## TASK 10: PROP SCATTERING

### 10.1 Prop Scatter System

Create a function that procedurally scatters props around the island based on rules:

**Near structures**: Denser prop placement (monitors, keyboards, wiring) within 10-15 units of structure positions
**Junkyard zone**: Maximum density — tire stacks, car shells, barrels, crates, everything
**Paths**: Sign posts at intersections
**Random scatter**: A light scattering of debris across grassy areas
**Exclusion zones**: No props inside structure interiors, no props on steep slopes or in water

Use seeded random (based on island seed) so scatter is deterministic.

Each prop instance gets a `PropDef` stored in an array. The prop components read from this array and render using instanced meshes.

---

## COMPLETION CRITERIA

When Stream 1 is complete:

- [ ] The island renders with procedural terrain (hills, valleys, beaches, plateau, pit)
- [ ] Water surrounds the island with animated waves and foam
- [ ] Sky shows a golden hour gradient with clouds
- [ ] All 7+ structures are built and placed on the terrain
- [ ] The school bus interior is accessible (camera can view inside)
- [ ] Props are scattered across the island (CRT monitors, wiring, electronics, furniture, debris)
- [ ] Grass covers appropriate areas with wind animation
- [ ] Trees and bushes are placed around the island
- [ ] Lighting creates a warm golden hour atmosphere
- [ ] Quality manager dynamically adjusts settings based on FPS
- [ ] No TypeScript errors
- [ ] Performance target: 30+ FPS on mid-range hardware at 'medium' quality

---

> After Stream 1 is complete, the world exists but is static — no player movement, no NPCs, no game systems. Stream 2 adds the characters and physics. Stream 3 adds the UI and game logic.
