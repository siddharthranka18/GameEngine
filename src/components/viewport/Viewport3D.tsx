import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useEngineStore } from '../../store/engineStore';
import { degToRad, radToDeg } from '../../core/math';

// Global keyboard state tracking for interactive playmode
const activeKeys: { [key: string]: boolean } = {};

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
    activeKeys[e.key.toLowerCase()] = true;
  });
  window.addEventListener('keyup', (e) => {
    activeKeys[e.key.toLowerCase()] = false;
  });
}

// Individual 3D Mesh & Light Component with recursive hierarchy rendering and simulation
const GameObjectNode: React.FC<{
  id: string;
  onSelect: (id: string, e: any) => void;
}> = ({ id, onSelect }) => {
  const { scene, selectedId, isPlaying } = useEngineStore();
  const obj = scene?.gameObjects[id];
  const groupRef = useRef<THREE.Group>(null);

  const initialPos = useRef<[number, number, number] | null>(null);
  const initialRot = useRef<[number, number, number] | null>(null);

  if (!obj || !obj.visible) return null;

  const isSelected = selectedId === id;

  const position: [number, number, number] = obj.transform.position;
  const rotation: [number, number, number] = [
    degToRad(obj.transform.rotation[0]),
    degToRad(obj.transform.rotation[1]),
    degToRad(obj.transform.rotation[2]),
  ];
  const scale: [number, number, number] = obj.transform.scale;

  // Track initial transforms to reset on stop simulation
  useEffect(() => {
    if (!isPlaying) {
      if (groupRef.current) {
        groupRef.current.position.set(...position);
        groupRef.current.rotation.set(...rotation);
      }
      initialPos.current = [...position];
      initialRot.current = [...rotation];
    }
  }, [isPlaying, position[0], position[1], position[2], rotation[0], rotation[1], rotation[2]]);

  // Simulation Game Loop behavior runner
  useFrame((state, delta) => {
    if (!isPlaying || !groupRef.current) return;
    const behavior = obj.behavior;
    if (!behavior || behavior.type === 'None') return;

    const speed = behavior.speed || 1;

    if (behavior.type === 'Rotate') {
      groupRef.current.rotation.y += delta * speed * 2;
    } else if (behavior.type === 'Bob') {
      const baseY = (initialPos.current ? initialPos.current[1] : position[1]);
      groupRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * speed * 2.5) * 0.4;
    } else if (behavior.type === 'PlayerWASD') {
      const moveSpeed = speed * 4 * delta;
      if (activeKeys['w'] || activeKeys['arrowup']) groupRef.current.position.z -= moveSpeed;
      if (activeKeys['s'] || activeKeys['arrowdown']) groupRef.current.position.z += moveSpeed;
      if (activeKeys['a'] || activeKeys['arrowleft']) groupRef.current.position.x -= moveSpeed;
      if (activeKeys['d'] || activeKeys['arrowright']) groupRef.current.position.x += moveSpeed;
    }
  });

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
        return <boxGeometry args={[1, 0.05, 1]} />;
      case 'Cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'Torus':
        return <torusGeometry args={[0.5, 0.2, 16, 32]} />;
      default:
        return null;
    }
  };

  const isLight = obj.type === 'PointLight' || obj.type === 'SpotLight';

  return (
    <group
      ref={groupRef}
      name={obj.name}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {/* 1. Point Light */}
      {obj.type === 'PointLight' ? (
        <group onClick={handleClick}>
          <pointLight
            castShadow
            color={obj.material.color}
            intensity={obj.light?.intensity ?? 5}
            distance={obj.light?.distance ?? 15}
            decay={obj.light?.decay ?? 2}
          />
          {/* Visual lightbulb helper */}
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color={obj.material.color} wireframe />
          </mesh>
        </group>
      ) : obj.type === 'SpotLight' ? (
        /* 2. Spot Light */
        <group onClick={handleClick}>
          <spotLight
            castShadow
            color={obj.material.color}
            intensity={obj.light?.intensity ?? 8}
            distance={obj.light?.distance ?? 20}
            angle={Math.PI / 4}
            penumbra={0.3}
            decay={obj.light?.decay ?? 2}
          />
          {/* Visual cone helper */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.25, 0.5, 16]} />
            <meshBasicMaterial color={obj.material.color} wireframe />
          </mesh>
        </group>
      ) : obj.type !== 'Empty' ? (
        /* 3. Standard 3D Primitives */
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
        /* 4. Empty Transform Node */
        <axesHelper args={[0.6]} onClick={handleClick} />
      )}

      {/* Selected object visual indicator */}
      {isSelected && obj.type !== 'Empty' && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(isLight ? 0.6 : 1.02, isLight ? 0.6 : 1.02, isLight ? 0.6 : 1.02)]} />
          <lineBasicMaterial color={isLight ? '#fbbf24' : '#60a5fa'} linewidth={2} />
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

// Real-time Performance & Profiler Metrics Collector
const MetricsCollector: React.FC<{
  onUpdate: (metrics: { fps: number; drawCalls: number; triangles: number }) => void;
}> = ({ onUpdate }) => {
  const { gl } = useThree();
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    if (now - lastTime.current >= 400) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
      frameCount.current = 0;
      lastTime.current = now;
      onUpdate({
        fps,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
      });
    }
  });

  return null;
};

// Main 3D Viewport Component
export const Viewport3D: React.FC = () => {
  const { scene, selectedId, selectObject, isPlaying } = useEngineStore();
  const [isGizmoDragging, setIsGizmoDragging] = useState(false);
  const [metrics, setMetrics] = useState({ fps: 60, drawCalls: 0, triangles: 0 });

  const env = scene?.environment;

  return (
    <div className="flex-1 h-full w-full relative bg-[#0b0c10] overflow-hidden select-none">
      {/* Top Left: Viewport Camera and Simulation Status */}
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

      {/* Top Right: Performance & Profiling HUD */}
      <div className="absolute top-3 right-3 z-20 flex items-center space-x-2 bg-editor-panel/85 backdrop-blur border border-editor-panelBorder px-2.5 py-1 rounded text-xs text-editor-text font-mono shadow-md">
        <span className="text-emerald-400 font-bold">{metrics.fps} FPS</span>
        <span className="text-editor-panelBorder">|</span>
        <span className="text-editor-textMuted">{metrics.triangles.toLocaleString()} tris</span>
        <span className="text-editor-panelBorder">|</span>
        <span className="text-editor-textMuted">{metrics.drawCalls} calls</span>
      </div>

      {/* Bottom Left: Navigation Hints */}
      <div className="absolute bottom-3 left-3 z-20 text-[11px] text-editor-textMuted bg-editor-panel/75 backdrop-blur px-2 py-1 rounded border border-editor-panelBorder">
        Left Click: Select / Gizmo &bull; Right Click + Drag: Orbit &bull; Middle Click / Scroll: Pan / Zoom
        {isPlaying && <span className="ml-2 text-editor-accent font-medium">&bull; WASD / Arrows: Control PlayerWASD entities</span>}
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
        <MetricsCollector onUpdate={setMetrics} />

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

        {/* Active Transform Gizmo (hidden during live play simulation for clean preview) */}
        {!isPlaying && <ActiveGizmo setIsGizmoDragging={setIsGizmoDragging} />}
      </Canvas>
    </div>
  );
};
