import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Stats } from '@react-three/drei';
import { useGameStore } from '@shared/store/useGameStore';

import { Island } from '@world/Island';
import { PlayerEntity } from '@characters/player/PlayerEntity';
import { CameraController } from '@controls/CameraController';
import { PlayerController } from '@controls/PlayerController';
import { PhysicsWorld } from '@physics/PhysicsWorld';
import { HUD } from '@ui/HUD';
import { LoadingScreen } from '@ui/LoadingScreen';
import { PostProcessing } from '@rendering/PostProcessing';

function Scene() {
  return (
    <Physics gravity={[0, -20, 0]}>
      <ambientLight intensity={0.3} color="#FFD27F" />
      <directionalLight
        position={[50, 80, 30]}
        intensity={1.2}
        color="#FFE4B5"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />

      <PhysicsWorld />
      <Island />
      <PlayerEntity />
      <PlayerController />
      <CameraController />
    </Physics>
  );
}

export default function App() {
  const showFPS = useGameStore((s) => s.showFPS);
  const isLoaded = useGameStore((s) => s.isLoaded);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1A1612' }}>
      <Canvas
        shadows
        camera={{ fov: 55, near: 0.1, far: 500, position: [0, 5, 10] }}
        gl={{
          antialias: true,
          toneMapping: 3,
          toneMappingExposure: 1.1,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#D4A574', 80, 300]} />
        <color attach="background" args={['#2E1B4A']} />

        <Suspense fallback={null}>
          <Scene />
        </Suspense>

        <PostProcessing />
        {showFPS && <Stats />}
      </Canvas>

      {/* HTML UI Overlay */}
      {!isLoaded && <LoadingScreen />}
      <HUD />
    </div>
  );
}
