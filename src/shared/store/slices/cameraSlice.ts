import { StateCreator } from 'zustand';
import { CameraMode } from '../../types';

export interface CameraSlice {
  cameraMode: CameraMode;
  cameraPosition: [number, number, number];
  cameraLookAt: [number, number, number];
  cameraFov: number;
  followDistance: number;
  followHeight: number;
  isTransitioning: boolean;

  setCameraMode: (mode: CameraMode) => void;
  setCameraPosition: (pos: [number, number, number]) => void;
  setCameraLookAt: (target: [number, number, number]) => void;
  setCameraFov: (fov: number) => void;
  setFollowDistance: (dist: number) => void;
  setFollowHeight: (height: number) => void;
  setTransitioning: (transitioning: boolean) => void;
}

export const createCameraSlice: StateCreator<CameraSlice> = (set) => ({
  cameraMode: 'follow',
  cameraPosition: [0, 5, 10],
  cameraLookAt: [0, 0, 0],
  cameraFov: 55,
  followDistance: 6,
  followHeight: 3.5,
  isTransitioning: false,

  setCameraMode: (mode) => set({ cameraMode: mode }),
  setCameraPosition: (pos) => set({ cameraPosition: pos }),
  setCameraLookAt: (target) => set({ cameraLookAt: target }),
  setCameraFov: (fov) => set({ cameraFov: fov }),
  setFollowDistance: (dist) => set({ followDistance: dist }),
  setFollowHeight: (height) => set({ followHeight: height }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
});
