import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useEngineStore } from '../../store/engineStore';
import { GameObjectData, PrimitiveType } from '../../core/types';
import { degToRad, radToDeg } from '../../core/math';

// Individual 3D Mesh Component with recursive hierarchy rendering
const GameObjectNode: React.FC<{
  id: string;
  onSelect: (id: string, e: any) => void;
}> = ({ id, onSelect }) => {
  const { scene, selectedId } = useEngineStore();
  const obj = scene?.gameObjects[id];
  const groupRef = useRef<THREE.Group>(null);

  if (!obj || !obj.visible) return null;

  const isSelected = selectedId === id;

  const position: [number, number, number] = obj.transform.position;
  const rotation: [number, number, number] = [
    degToRad(obj.transform.rotation[0]),
    degToRad(obj.transform.rotation[1]),
    degToRad(obj.transform.rotation[2]),
  ];
  const scale: [number, number, number] = obj.transform.scale;

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect(id, e);
  };

  const renderGeometry = () => {
    switch (obj.type) {
      case 'Cube':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'Sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'Plane':
        return <boxGeometry args={[1, 0.05, 1]} />; // Slightly extruded plane for easy picking & shadows
      case 'Cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'Empty':
      default:
        return null;
    }
  };

  return (
    <group
      ref={groupRef}
      name={obj.name}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {obj.type !== 'Empty' ? (
        <mesh
          onClick={handleClick}
          castShadow
          receiveShadow
        >
          {renderGeometry()}
          <meshStandardMaterial
            color={obj.material.color}
            roughness={obj.material.roughness}
            metalness={obj.material.metalness}
            wireframe={obj.material.wireframe}
            transparent={obj.material.opacity < 1}
            opacity={obj.material.opacity}
          />
        </mesh>
      ) : (
        // Empty object indicator: small 3-axis helper
        <axesHelper args={[0.6]} onClick={handleClick} />
      )}

      {/* Selected object visual indicator */}
      {isSelected && obj.type !== 'Empty' && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1.02, 1.02, 1.02)]} />
          <lineBasicMaterial color="#60a5fa" linewidth={2} />
        </lineSegments>
      )}

      {/* Recursively render child GameObjects */}
      {obj.childIds.map((childId) => (
        <GameObjectNode key={childId} id={childId} onSelect={onSelect} />
      ))}
    </group>
  );
};

// Interactive Gizmo Controller attached to selected object
const ActiveGizmo: React.FC<{
  setIsGizmoDragging: (dragging: boolean) => void;
}> = ({ setIsGizmoDragging }) => {
  const { scene, selectedId, transformMode, updateTransform } = useEngineStore();
  const selectedObj = selectedId ? scene?.gameObjects[selectedId] : null;
  const transformRef = useRef<any>(null);

  if (!selectedObj || !selectedObj.visible) return null;

  // Compute current world position or local transform
  const pos: [number, number, number] = selectedObj.transform.position;
  const rot: [number, number, number] = [
    degToRad(selectedObj.transform.rotation[0]),
    degToRad(selectedObj.transform.rotation[1]),
    degToRad(selectedObj.transform.rotation[2]),
  ];
  const scl: [number, number, number] = selectedObj.transform.scale;

  const handleGizmoChange = () => {
    if (!transformRef.current || !selectedId) return;
    const target = transformRef.current.object;
    if (!target) return;

    const newPos: [number, number, number] = [target.position.x, target.position.y, target.position.z];
    const newRot: [number, number, number] = [
      radToDeg(target.rotation.x),
      radToDeg(target.rotation.y),
      radToDeg(target.rotation.z),
    ];
    const newScl: [number, number, number] = [target.scale.x, target.scale.y, target.scale.z];

    updateTransform(selectedId, {
      position: newPos,
      rotation: newRot,
      scale: newScl,
    });
  };

  return (
    <TransformControls
      ref={transformRef}
      mode={transformMode}
      size={0.75}
      position={pos}
      rotation={rot}
      scale={scl}
      onObjectChange={handleGizmoChange}
      onMouseDown={() => setIsGizmoDragging(true)}
      onMouseUp={() => setIsGizmoDragging(false)}
    />
  );
};

// Main 3D Viewport Component
export const Viewport3D: React.FC = () => {
  const { scene, selectedId, selectObject, isPlaying } = useEngineStore();
  const [isGizmoDragging, setIsGizmoDragging] = useState(false);

  const env = scene?.environment;

  return (
    <div className="flex-1 h-full w-full relative bg-[#0b0c10] overflow-hidden select-none">
      {/* Viewport Overlay Controls */}
      <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 bg-editor-panel/85 backdrop-blur border border-editor-panelBorder px-2.5 py-1 rounded text-xs text-editor-text">
        <span className="font-semibold text-white">Camera:</span>
        <span className="text-editor-textMuted">Perspective</span>
        <span className="text-editor-panelBorder">|</span>
        <span className="text-editor-textMuted">R3F WebGL2</span>
        {isPlaying && (
          <span className="px-1.5 py-0.5 rounded bg-editor-success/20 text-editor-success font-medium animate-pulse">
            LIVE SIMULATION
          </span>
        )}
      </div>

      <div className="absolute bottom-3 left-3 z-20 text-[11px] text-editor-textMuted bg-editor-panel/75 backdrop-blur px-2 py-1 rounded border border-editor-panelBorder">
        Left Click: Select / Gizmo &bull; Right Click + Drag: Orbit &bull; Middle Click / Scroll: Pan / Zoom
      </div>

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{
          position: scene?.camera.position || [5, 5, 5],
          fov: scene?.camera.fov || 50,
        }}
        onPointerMissed={() => selectObject(null)}
      >
        {/* Background color */}
        <color attach="background" args={[env?.backgroundColor || '#12141a']} />

        {/* Orbit Camera Controls (disabled while manipulating gizmo) */}
        <OrbitControls makeDefault enabled={!isGizmoDragging} />

        {/* Lighting */}
        <ambientLight
          color={env?.ambientLightColor || '#ffffff'}
          intensity={env?.ambientIntensity ?? 0.6}
        />
        <directionalLight
          castShadow
          color={env?.directionalLightColor || '#ffffff'}
          intensity={env?.directionalIntensity ?? 1.2}
          position={env?.directionalPosition || [10, 15, 10]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* 3D Grid Helper */}
        {env?.showGrid !== false && (
          <Grid
            infiniteGrid
            cellSize={1}
            cellThickness={0.6}
            cellColor="#2a2e39"
            sectionSize={5}
            sectionThickness={1.2}
            sectionColor="#3b82f6"
            fadeDistance={40}
            fadeStrength={1.5}
          />
        )}

        {/* Coordinate Axes */}
        {env?.showAxes !== false && <axesHelper args={[2]} />}

        {/* Render Scene Graph Hierarchies */}
        {scene?.rootObjectIds.map((rootId) => (
          <GameObjectNode
            key={rootId}
            id={rootId}
            onSelect={(id) => selectObject(id)}
          />
        ))}

        {/* Active Transform Gizmo */}
        <ActiveGizmo setIsGizmoDragging={setIsGizmoDragging} />
      </Canvas>
    </div>
  );
};
