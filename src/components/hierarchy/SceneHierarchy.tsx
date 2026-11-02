import React, { useState } from 'react';
import {
  FolderTree,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Box,
  Circle,
  Square,
  Cylinder,
  Disc,
  Lightbulb,
  Sun,
  MoreVertical,
  Plus,
  CornerDownRight,
} from 'lucide-react';
import { useEngineStore } from '../../store/engineStore';
import { GameObjectData, PrimitiveType } from '../../core/types';

export const SceneHierarchy: React.FC = () => {
  const {
    scene,
    selectedId,
    selectObject,
    removeGameObject,
    renameGameObject,
    setVisibility,
    addGameObject,
    reparentGameObject,
  } = useEngineStore();

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  if (!scene) {
    return (
      <aside className="w-64 bg-editor-panel border-r border-editor-panelBorder flex flex-col p-4 text-center justify-center text-editor-textMuted text-xs">
        <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p>No active scene.</p>
        <p className="mt-1">Create or open a project to load a scene.</p>
      </aside>
    );
  }

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(collapsedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCollapsedIds(next);
  };

  const startRename = (obj: GameObjectData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(obj.id);
    setEditingName(obj.name);
  };

  const submitRename = (id: string) => {
    if (editingName.trim()) {
      renameGameObject(id, editingName.trim());
    }
    setEditingId(null);
  };

  const getIconForType = (type: PrimitiveType) => {
    switch (type) {
      case 'Cube':
        return <Box className="w-3.5 h-3.5 text-blue-400" />;
      case 'Sphere':
        return <Circle className="w-3.5 h-3.5 text-red-400" />;
      case 'Plane':
        return <Square className="w-3.5 h-3.5 text-slate-400" />;
      case 'Torus':
        return <Disc className="w-3.5 h-3.5 text-purple-400" />;
      case 'PointLight':
        return <Lightbulb className="w-3.5 h-3.5 text-amber-400" />;
      case 'SpotLight':
        return <Sun className="w-3.5 h-3.5 text-yellow-400" />;
      case 'Cylinder':
        return <Cylinder className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Empty':
      default:
        return <CornerDownRight className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  // Recursive tree node renderer
  const renderObjectNode = (id: string, depth = 0) => {
    const obj = scene.gameObjects[id];
    if (!obj) return null;

    if (search && !obj.name.toLowerCase().includes(search.toLowerCase())) {
      // Check if any child matches search
      const hasMatchingChild = obj.childIds.some((cid) =>
        scene.gameObjects[cid]?.name.toLowerCase().includes(search.toLowerCase())
      );
      if (!hasMatchingChild) return null;
    }

    const isSelected = selectedId === id;
    const hasChildren = obj.childIds.length > 0;
    const isCollapsed = collapsedIds.has(id);

    return (
      <div key={id} className="flex flex-col">
        <div
          onClick={() => selectObject(id)}
          onDoubleClick={(e) => startRename(obj, e)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 cursor-pointer transition text-xs border-l-2 ${
            isSelected
              ? 'bg-editor-activeItem border-editor-accent text-white font-medium'
              : 'border-transparent text-editor-text hover:bg-editor-hoverItem'
          }`}
        >
          {/* Left item details */}
          <div className="flex items-center space-x-1.5 overflow-hidden">
            {hasChildren ? (
              <button
                onClick={(e) => toggleCollapse(id, e)}
                className="p-0.5 text-editor-textMuted hover:text-white"
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            {getIconForType(obj.type)}

            {editingId === id ? (
              <input
                type="text"
                value={editingName}
                autoFocus
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => submitRename(id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename(id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="bg-editor-bg text-white px-1 py-0.5 rounded border border-editor-accent outline-none text-xs w-32"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={`truncate ${!obj.visible ? 'opacity-40 italic' : ''}`}>{obj.name}</span>
            )}
          </div>

          {/* Right item actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
            {/* Visibility Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVisibility(id, !obj.visible);
              }}
              title={obj.visible ? 'Hide Object' : 'Show Object'}
              className="p-1 hover:text-white text-editor-textMuted"
            >
              {obj.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Quick Add Child */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                addGameObject('Cube', `Child Cube`, id);
              }}
              title="Add Child Cube"
              className="p-1 hover:text-editor-accent text-editor-textMuted"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Rename */}
            <button
              onClick={(e) => startRename(obj, e)}
              title="Rename"
              className="p-1 hover:text-white text-editor-textMuted"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeGameObject(id);
              }}
              title="Delete Object"
              className="p-1 hover:text-editor-danger text-editor-textMuted"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Children nodes */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {obj.childIds.map((childId) => renderObjectNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-editor-panel border-r border-editor-panelBorder flex flex-col select-none overflow-hidden z-10">
      {/* Hierarchy Header */}
      <div className="p-2.5 border-b border-editor-panelBorder flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FolderTree className="w-4 h-4 text-editor-accent" />
          <span className="font-semibold text-xs tracking-wider uppercase text-white">Scene Hierarchy</span>
        </div>
        <span className="text-[10px] text-editor-textMuted font-mono">
          {Object.keys(scene.gameObjects).length} objs
        </span>
      </div>

      {/* Search box */}
      <div className="p-2 border-b border-editor-panelBorder bg-editor-header">
        <input
          type="text"
          placeholder="Filter objects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-editor-bg border border-editor-panelBorder rounded px-2 py-1 text-xs text-white placeholder-editor-textMuted outline-none focus:border-editor-accent transition"
        />
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto py-1">
        {scene.rootObjectIds.length === 0 ? (
          <div className="p-4 text-center text-xs text-editor-textMuted">
            <p>Scene is empty.</p>
            <p className="mt-1">Click "Add Object" in toolbar to begin.</p>
          </div>
        ) : (
          scene.rootObjectIds.map((rootId) => renderObjectNode(rootId, 0))
        )}
      </div>
    </aside>
  );
};
