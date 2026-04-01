import { Suspense, useEffect, useMemo } from 'react';
import { useGameStore } from '@shared/store/useGameStore';
import { EventBus } from '@shared/events';
import { StructureDef } from '@shared/types';
import { initTerrain, getHeightAtPosition } from './terrain/TerrainGenerator';
import { TerrainSystem } from './terrain/TerrainChunk';
import { WaterSurface } from './water/WaterSurface';
import { Foam } from './water/Foam';
import { Skybox } from './sky/Skybox';
import { Sun } from './sky/Sun';
import { Atmosphere } from './sky/Atmosphere';
import { StructureBase } from './structures/StructureBase';
import { PlaybookStation } from './structures/PlaybookStation';
import { StockMarket } from './structures/StockMarket';
import { Junkyard } from './structures/Junkyard';
import { DriveinCinema } from './structures/DriveinCinema';
import { SchoolBus } from './structures/SchoolBus';
import { WorkshopHut } from './structures/WorkshopHut';
import { CRTMonitors } from './props/CRTMonitors';
import { WiringClusters } from './props/WiringClusters';
import { RetroElectronics } from './props/RetroElectronics';
import { Debris } from './props/Debris';
import { SignPosts } from './props/SignPosts';
import { GrassField } from './vegetation/GrassField';
import { Trees } from './vegetation/Trees';
import { Bushes } from './vegetation/Bushes';
import { Vines } from './vegetation/Vines';
import { WorldLighting } from './lighting/WorldLighting';
import { PointLights } from './lighting/PointLights';
import { Shadows } from './lighting/Shadows';
import {
  generateCRTPositions,
  generateWiringSegments,
  generateElectronicsPositions,
  generateDebrisData,
  generateSignPosts,
  generatePointLightPositions,
  generateVineAttachPoints,
} from './PropScatter';

// --- Structure Placement Data ---
const STRUCTURES: StructureDef[] = [
  {
    id: 'playbook_station',
    type: 'playbook_station',
    name: 'Playbook Station',
    position: [30, 0, -60],
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
    rotation: [0, -0.7, 0.05],
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

// Map structure type to component
function StructureRenderer({ def }: { def: StructureDef }) {
  switch (def.type) {
    case 'playbook_station':
      return <PlaybookStation def={def} />;
    case 'stock_market':
      return <StockMarket def={def} />;
    case 'junkyard':
      return <Junkyard def={def} />;
    case 'drivein_cinema':
      return <DriveinCinema def={def} />;
    case 'school_bus':
      return <SchoolBus def={def} />;
    case 'workshop_hut':
      return <WorkshopHut def={def} />;
    default:
      return null;
  }
}

export function Island() {
  const setLoaded = useGameStore((s) => s.setLoaded);
  const setLoadingProgress = useGameStore((s) => s.setLoadingProgress);

  // Initialize terrain on mount
  useEffect(() => {
    setLoadingProgress(10, 'terrain');
    initTerrain(42);
    setLoadingProgress(30, 'terrain');
  }, [setLoadingProgress]);

  // Generate prop scatter data (deterministic, memoized)
  const crtPositions = useMemo(() => generateCRTPositions(), []);
  const wiringSegments = useMemo(() => generateWiringSegments(), []);
  const electronicsPositions = useMemo(() => generateElectronicsPositions(), []);
  const debrisData = useMemo(() => generateDebrisData(), []);
  const signPostsData = useMemo(() => generateSignPosts(), []);
  const pointLightsData = useMemo(() => generatePointLightPositions(), []);
  const vineData = useMemo(() => generateVineAttachPoints(), []);

  // Mark loaded after first render
  useEffect(() => {
    setLoadingProgress(90, 'ready');
    const timer = setTimeout(() => {
      setLoaded(true);
      setLoadingProgress(100, 'ready');
      EventBus.emit({ type: 'GAME_READY' });
    }, 500);
    return () => clearTimeout(timer);
  }, [setLoaded, setLoadingProgress]);

  return (
    <group name="island">
      {/* Sky & Atmosphere (no physics, rendered behind everything) */}
      <Skybox />
      <Sun />
      <Atmosphere />

      {/* Terrain */}
      <Suspense fallback={null}>
        <TerrainSystem />
      </Suspense>

      {/* Water */}
      <WaterSurface />
      <Foam />

      {/* Structures */}
      <Suspense fallback={null}>
        <group name="structures">
          {STRUCTURES.map((def) => (
            <StructureRenderer key={def.id} def={def} />
          ))}
        </group>
      </Suspense>

      {/* Props */}
      <Suspense fallback={null}>
        <group name="props">
          <CRTMonitors positions={crtPositions} />
          <WiringClusters segments={wiringSegments} />
          <RetroElectronics positions={electronicsPositions} />
          <Debris
            tirePositions={debrisData.tirePositions}
            cratePositions={debrisData.cratePositions}
            barrelPositions={debrisData.barrelPositions}
          />
          <SignPosts signs={signPostsData} />
        </group>
      </Suspense>

      {/* Vegetation */}
      <Suspense fallback={null}>
        <group name="vegetation">
          <GrassField />
          <Trees />
          <Bushes />
          <Vines attachPoints={vineData} />
        </group>
      </Suspense>

      {/* Lighting */}
      <WorldLighting />
      <PointLights lights={pointLightsData} />
      <Shadows />
    </group>
  );
}
