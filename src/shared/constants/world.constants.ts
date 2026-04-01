export const WORLD = {
  // -- Island Dimensions --
  ISLAND_SIZE: 200,
  CHUNK_SIZE: 50,
  CHUNK_RESOLUTION: 64,

  // -- Terrain Generation --
  HEIGHT_SCALE: 15,
  NOISE_OCTAVES: 6,
  NOISE_LACUNARITY: 2.0,
  NOISE_PERSISTENCE: 0.5,
  WATER_LEVEL: 0.5,

  // -- LOD --
  LOD_DISTANCES: [60, 120, 200],
  MAX_CHUNKS_LOADED: 16,

  // -- Rendering --
  SHADOW_MAP_SIZE: 2048,
  SHADOW_CAMERA_SIZE: 80,
  FAR_PLANE: 500,
  FOG_NEAR: 80,
  FOG_FAR: 300,

  // -- Grass --
  GRASS_DENSITY: 0.7,
  GRASS_RENDER_DISTANCE: 40,
  GRASS_BLADE_HEIGHT: 0.4,
  GRASS_BLADE_WIDTH: 0.05,

  // -- Time (visual only, not real-time) --
  DEFAULT_HOUR: 16.5,
} as const;
