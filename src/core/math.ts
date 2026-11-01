import * as THREE from 'three';
import { TransformData } from './types';

/**
 * Converts degrees to radians.
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Converts radians to degrees.
 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Computes a 4x4 local transformation matrix from position, rotation (degrees), and scale.
 */
export function computeLocalMatrix(transform: TransformData): THREE.Matrix4 {
  const matrix = new THREE.Matrix4();
  const pos = new THREE.Vector3(...transform.position);
  const rot = new THREE.Euler(
    degToRad(transform.rotation[0]),
    degToRad(transform.rotation[1]),
    degToRad(transform.rotation[2]),
    'XYZ'
  );
  const scale = new THREE.Vector3(...transform.scale);
  matrix.compose(pos, new THREE.Quaternion().setFromEuler(rot), scale);
  return matrix;
}

/**
 * Decomposes a Three.js Matrix4 into TransformData (position, rotation in degrees, scale).
 */
export function decomposeMatrix(matrix: THREE.Matrix4): TransformData {
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  matrix.decompose(pos, quat, scale);

  const euler = new THREE.Euler().setFromQuaternion(quat, 'XYZ');
  return {
    position: [pos.x, pos.y, pos.z],
    rotation: [radToDeg(euler.x), radToDeg(euler.y), radToDeg(euler.z)],
    scale: [scale.x, scale.y, scale.z],
  };
}

/**
 * Multiplies parent world matrix by child local matrix to obtain child world matrix.
 */
export function multiplyMatrices(parentWorld: THREE.Matrix4, childLocal: THREE.Matrix4): THREE.Matrix4 {
  return new THREE.Matrix4().multiplyMatrices(parentWorld, childLocal);
}
