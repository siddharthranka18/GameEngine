import { CameraConfig, EnvironmentConfig, MaterialData, ProjectConfig, TransformData } from './types';

export const ENGINE_VERSION = '0.3.0';
export const SCHEMA_VERSION = 3;

export const DEFAULT_TRANSFORM: TransformData = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

export const DEFAULT_MATERIAL: MaterialData = {
  color: '#3b82f6',
  roughness: 0.4,
  metalness: 0.1,
  wireframe: false,
  opacity: 1.0,
};

export const DEFAULT_CAMERA: CameraConfig = {
  position: [5, 5, 5],
  target: [0, 0, 0],
  fov: 50,
};

export const DEFAULT_ENVIRONMENT: EnvironmentConfig = {
  ambientLightColor: '#ffffff',
  ambientIntensity: 0.6,
  directionalLightColor: '#ffffff',
  directionalIntensity: 1.2,
  directionalPosition: [10, 15, 10],
  backgroundColor: '#12141a',
  showGrid: true,
  showAxes: true,
};

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  buildTarget: 'Web',
  renderer: {
    antialias: true,
    shadows: true,
    toneMapping: 'ACESFilmic',
    clearColor: '#12141a',
  },
  customSettings: {},
};
