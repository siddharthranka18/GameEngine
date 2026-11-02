export type PrimitiveType =
  | 'Cube'
  | 'Sphere'
  | 'Plane'
  | 'Cylinder'
  | 'Torus'
  | 'PointLight'
  | 'SpotLight'
  | 'Empty';

export type BehaviorType = 'None' | 'Rotate' | 'Bob' | 'PlayerWASD';

export interface BehaviorData {
  type: BehaviorType;
  speed: number;
}

export interface LightData {
  intensity: number;
  distance: number;
  decay: number;
}

export type TransformMode = 'translate' | 'rotate' | 'scale';

export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  details?: string;
}

export interface TransformData {
  position: [number, number, number];
  rotation: [number, number, number]; // in degrees
  scale: [number, number, number];
}

export interface MaterialData {
  color: string;
  roughness: number;
  metalness: number;
  wireframe: boolean;
  opacity: number;
}

export interface GameObjectData {
  id: string;
  name: string;
  type: PrimitiveType;
  parentId: string | null;
  childIds: string[];
  visible: boolean;
  transform: TransformData;
  material: MaterialData;
  light?: LightData;
  behavior?: BehaviorData;
}

export interface CameraConfig {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface EnvironmentConfig {
  ambientLightColor: string;
  ambientIntensity: number;
  directionalLightColor: string;
  directionalIntensity: number;
  directionalPosition: [number, number, number];
  backgroundColor: string;
  showGrid: boolean;
  showAxes: boolean;
}

export interface SceneData {
  schemaVersion: number;
  id: string;
  projectId: string;
  name: string;
  rootObjectIds: string[];
  gameObjects: Record<string, GameObjectData>;
  camera: CameraConfig;
  environment: EnvironmentConfig;
  createdAt: number;
  updatedAt: number;
}

export interface RendererSettings {
  antialias: boolean;
  shadows: boolean;
  toneMapping: string;
  clearColor: string;
}

export interface ProjectConfig {
  buildTarget: string;
  renderer: RendererSettings;
  customSettings: Record<string, string>;
}

export interface ProjectData {
  schemaVersion: number;
  id: string;
  name: string;
  engineVersion: string;
  sceneIds: string[];
  startupSceneId: string;
  config: ProjectConfig;
  createdAt: number;
  updatedAt: number;
}

export enum EngineErrorCode {
  Success = 'Success',
  InvalidName = 'InvalidName',
  InvalidPath = 'InvalidPath',
  InvalidArgument = 'InvalidArgument',
  NotFound = 'NotFound',
  IOError = 'IOError',
  DuplicateId = 'DuplicateId',
  CircularHierarchy = 'CircularHierarchy',
  DeserializationFailed = 'DeserializationFailed',
  NoActiveProject = 'NoActiveProject',
  NoActiveScene = 'NoActiveScene',
  StorageUnavailable = 'StorageUnavailable',
}

export interface EngineResult<T = void> {
  success: boolean;
  data?: T;
  error?: {
    code: EngineErrorCode;
    message: string;
  };
}

export function ok<T>(data: T): EngineResult<T> {
  return { success: true, data };
}

export function okVoid(): EngineResult<void> {
  return { success: true };
}

export function fail<T = void>(code: EngineErrorCode, message: string): EngineResult<T> {
  return { success: false, error: { code, message } };
}
