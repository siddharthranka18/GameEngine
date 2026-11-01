import React from 'react';
import {
  Sliders,
  Move,
  RotateCw,
  Maximize2,
  Palette,
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Info,
} from 'lucide-react';
import { useEngineStore } from '../../store/engineStore';
import { TransformSystem } from '../../services/transformSystem';

export const Inspector: React.FC = () => {
  const {
    scene,
    selectedId,
    renameGameObject,
    updateTransform,
    updateMaterial,
    setVisibility,
    reparentGameObject,
    removeGameObject,
  } = useEngineStore();

  const selectedObj = selectedId && scene ? scene.gameObjects[selectedId] : null;

  if (!scene) {
    return (
      <aside className="w-80 bg-editor-panel border-l border-editor-panelBorder p-4 text-xs text-editor-textMuted flex flex-col justify-center items-center text-center">
        <Sliders className="w-8 h-8 opacity-30 mb-2" />
        <p>No active scene.</p>
      </aside>
    );
  }

  if (!selectedObj) {
    return (
      <aside className="w-80 bg-editor-panel border-l border-editor-panelBorder p-4 text-xs text-editor-textMuted flex flex-col justify-center items-center text-center">
        <Info className="w-8 h-8 opacity-30 mb-2 text-editor-accent" />
        <p className="font-medium text-editor-text">No Object Selected</p>
        <p className="mt-1 text-[11px]">
          Select an entity in the Scene Hierarchy or click directly in the 3D Viewport to inspect and edit its properties.
        </p>
      </aside>
    );
  }

  // Handle position/rotation/scale changes
  const handleCoordChange = (
    field: 'position' | 'rotation' | 'scale',
    axisIndex: number,
    value: string
  ) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const current = [...selectedObj.transform[field]] as [number, number, number];
    current[axisIndex] = num;
    updateTransform(selectedObj.id, { [field]: current });
  };

  // Check which objects would cause cycles if selected as parent
  const candidateParents = Object.values(scene.gameObjects).filter(
    (o) => o.id !== selectedObj.id
  );

  return (
    <aside className="w-80 bg-editor-panel border-l border-editor-panelBorder flex flex-col text-xs select-none overflow-y-auto z-10">
      {/* Header / Identity */}
      <div className="p-3 border-b border-editor-panelBorder bg-editor-header">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-editor-activeItem text-editor-accent">
            {selectedObj.type}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setVisibility(selectedObj.id, !selectedObj.visible)}
              className="p-1 hover:text-white text-editor-textMuted"
              title={selectedObj.visible ? 'Hide Object' : 'Show Object'}
            >
              {selectedObj.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => removeGameObject(selectedObj.id)}
              className="p-1 hover:text-editor-danger text-editor-textMuted"
              title="Delete Object"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Editable Name */}
        <input
          type="text"
          value={selectedObj.name}
          onChange={(e) => renameGameObject(selectedObj.id, e.target.value)}
          className="w-full bg-editor-bg border border-editor-panelBorder rounded px-2 py-1 text-sm font-semibold text-white outline-none focus:border-editor-accent transition"
        />

        <div className="mt-1 flex items-center justify-between text-[10px] text-editor-textMuted font-mono">
          <span>ID: {selectedObj.id.slice(0, 8)}...</span>
          <button
            onClick={() => navigator.clipboard?.writeText(selectedObj.id)}
            title="Copy Full UUID"
            className="hover:text-white"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Transform Section */}
      <div className="p-3 border-b border-editor-panelBorder">
        <div className="flex items-center space-x-1.5 font-semibold text-white mb-2">
          <Move className="w-3.5 h-3.5 text-editor-accent" />
          <span>Transform</span>
        </div>

        {/* Position */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-[11px] text-editor-textMuted mb-1">
            <span>Position</span>
            <span className="text-[10px]">X / Y / Z</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['X', 'Y', 'Z'] as const).map((axis, i) => (
              <div key={`pos-${axis}`} className="flex items-center bg-editor-bg border border-editor-panelBorder rounded px-1.5 py-0.5">
                <span className="text-[10px] font-bold text-red-400 w-3">{axis}</span>
                <input
                  type="number"
                  step="0.1"
                  value={Number(selectedObj.transform.position[i].toFixed(2))}
                  onChange={(e) => handleCoordChange('position', i, e.target.value)}
                  className="w-full bg-transparent text-right text-xs text-white outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rotation */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-[11px] text-editor-textMuted mb-1">
            <span>Rotation (&deg;)</span>
            <span className="text-[10px]">X / Y / Z</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['X', 'Y', 'Z'] as const).map((axis, i) => (
              <div key={`rot-${axis}`} className="flex items-center bg-editor-bg border border-editor-panelBorder rounded px-1.5 py-0.5">
                <span className="text-[10px] font-bold text-emerald-400 w-3">{axis}</span>
                <input
                  type="number"
                  step="1"
                  value={Number(selectedObj.transform.rotation[i].toFixed(1))}
                  onChange={(e) => handleCoordChange('rotation', i, e.target.value)}
                  className="w-full bg-transparent text-right text-xs text-white outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-editor-textMuted mb-1">
            <span>Scale</span>
            <span className="text-[10px]">X / Y / Z</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['X', 'Y', 'Z'] as const).map((axis, i) => (
              <div key={`scl-${axis}`} className="flex items-center bg-editor-bg border border-editor-panelBorder rounded px-1.5 py-0.5">
                <span className="text-[10px] font-bold text-blue-400 w-3">{axis}</span>
                <input
                  type="number"
                  step="0.1"
                  value={Number(selectedObj.transform.scale[i].toFixed(2))}
                  onChange={(e) => handleCoordChange('scale', i, e.target.value)}
                  className="w-full bg-transparent text-right text-xs text-white outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hierarchy & Parent Selector */}
      <div className="p-3 border-b border-editor-panelBorder">
        <div className="flex items-center space-x-1.5 font-semibold text-white mb-2">
          <Layers className="w-3.5 h-3.5 text-editor-warning" />
          <span>Hierarchy & Parenting</span>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[11px] text-editor-textMuted">Parent Object:</label>
          <select
            value={selectedObj.parentId || ''}
            onChange={(e) => {
              const val = e.target.value;
              reparentGameObject(selectedObj.id, val ? val : null);
            }}
            className="bg-editor-bg border border-editor-panelBorder rounded px-2 py-1 text-xs text-white outline-none focus:border-editor-accent"
          >
            <option value="">(None - Root Object)</option>
            {candidateParents.map((candidate) => {
              const causesCycle = TransformSystem.wouldCreateCycle(
                selectedObj.id,
                candidate.id,
                scene.gameObjects
              );
              return (
                <option
                  key={candidate.id}
                  value={candidate.id}
                  disabled={causesCycle}
                >
                  {candidate.name} {causesCycle ? '(Circular - Invalid)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {selectedObj.childIds.length > 0 && (
          <div className="mt-2 text-[11px] text-editor-textMuted">
            <span>Children ({selectedObj.childIds.length}): </span>
            <span className="text-white">
              {selectedObj.childIds
                .map((cid) => scene.gameObjects[cid]?.name || cid)
                .join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Material & Appearance (if applicable) */}
      {selectedObj.type !== 'Empty' && (
        <div className="p-3 border-b border-editor-panelBorder">
          <div className="flex items-center space-x-1.5 font-semibold text-white mb-2">
            <Palette className="w-3.5 h-3.5 text-editor-accent" />
            <span>Material & Color</span>
          </div>

          {/* Color Picker */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-editor-textMuted">Base Color</span>
            <div className="flex items-center space-x-1.5">
              <input
                type="color"
                value={selectedObj.material.color}
                onChange={(e) => updateMaterial(selectedObj.id, { color: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border border-editor-panelBorder bg-transparent"
              />
              <span className="font-mono text-[10px] text-white uppercase">
                {selectedObj.material.color}
              </span>
            </div>
          </div>

          {/* Roughness */}
          <div className="mb-2">
            <div className="flex justify-between text-[11px] text-editor-textMuted mb-0.5">
              <span>Roughness</span>
              <span>{selectedObj.material.roughness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedObj.material.roughness}
              onChange={(e) =>
                updateMaterial(selectedObj.id, { roughness: parseFloat(e.target.value) })
              }
              className="w-full accent-editor-accent h-1 bg-editor-bg rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Metalness */}
          <div className="mb-2">
            <div className="flex justify-between text-[11px] text-editor-textMuted mb-0.5">
              <span>Metalness</span>
              <span>{selectedObj.material.metalness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedObj.material.metalness}
              onChange={(e) =>
                updateMaterial(selectedObj.id, { metalness: parseFloat(e.target.value) })
              }
              className="w-full accent-editor-accent h-1 bg-editor-bg rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Wireframe Toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-editor-textMuted">Wireframe Mode</span>
            <input
              type="checkbox"
              checked={selectedObj.material.wireframe}
              onChange={(e) =>
                updateMaterial(selectedObj.id, { wireframe: e.target.checked })
              }
              className="rounded accent-editor-accent cursor-pointer"
            />
          </div>
        </div>
      )}
    </aside>
  );
};
