import * as THREE from 'three';

// -- Island --
export interface IslandConfig {
  id: string;
  name: string;
  seed: number;
  size: { width: number; depth: number };
  heightScale: number;
  position: THREE.Vector3Tuple;
  biome: BiomeType;
}

export type BiomeType = 'junkyard' | 'workshop' | 'market' | 'cinema' | 'docks';

// -- Terrain --
export interface TerrainChunkData {
  id: string;
  gridX: number;
  gridZ: number;
  heightmap: Float32Array;
  splatmap: Float32Array;
  resolution: number;
  lod: number;
}

export interface TerrainConfig {
  chunkSize: number;
  chunkResolution: number;
  lodDistances: number[];
  noiseOctaves: number;
  noiseLacunarity: number;
  noisePersistence: number;
}

// -- Structures --
export interface StructureDef {
  id: string;
  type: StructureType;
  name: string;
  position: THREE.Vector3Tuple;
  rotation: THREE.Vector3Tuple;
  scale: THREE.Vector3Tuple;
  enterable: boolean;
  interactionRadius: number;
  boundingBox: {
    min: THREE.Vector3Tuple;
    max: THREE.Vector3Tuple;
  };
  metadata?: Record<string, unknown>;
}

export type StructureType =
  | 'playbook_station'
  | 'stock_market'
  | 'junkyard'
  | 'drivein_cinema'
  | 'school_bus'
  | 'workshop_hut'
  | 'dock'
  | 'lighthouse';

// -- Props --
export interface PropDef {
  id: string;
  type: PropType;
  position: THREE.Vector3Tuple;
  rotation: THREE.Vector3Tuple;
  scale: THREE.Vector3Tuple;
  variant?: number;
  interactive: boolean;
}

export type PropType =
  | 'crt_monitor'
  | 'wiring_cluster'
  | 'retro_keyboard'
  | 'circuit_board'
  | 'desk'
  | 'chair'
  | 'shelf'
  | 'tire'
  | 'crate'
  | 'barrel'
  | 'sign_post'
  | 'lamp_post'
  | 'antenna'
  | 'satellite_dish'
  | 'toolbox'
  | 'generator';

// -- Lighting --
export interface TimeOfDay {
  hour: number;
  sunAngle: number;
  sunColor: string;
  ambientColor: string;
  ambientIntensity: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  shadowOpacity: number;
}

// -- Quality --
export type QualityPreset = 'ultra' | 'high' | 'medium' | 'low' | 'very-low';

export interface QualitySettings {
  preset: QualityPreset;
  renderScale: number;
  shadowMapSize: number;
  grassDensity: number;
  grassRenderDistance: number;
  npcRenderDistance: number;
  enablePostProcessing: boolean;
  enableParticles: boolean;
  maxChunksLoaded: number;
}
