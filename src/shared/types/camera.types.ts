import * as THREE from 'three';

export type CameraMode = 'follow' | 'orbit' | 'cinematic' | 'fixed' | 'interior';

export interface CameraState {
  mode: CameraMode;
  position: THREE.Vector3Tuple;
  lookAt: THREE.Vector3Tuple;
  fov: number;
  nearPlane: number;
  farPlane: number;
  followDistance: number;
  followHeight: number;
  followSmoothing: number;
  isTransitioning: boolean;
  transitionDuration: number;
}
