import React, { useRef, useState } from 'react';
import {
  FolderPlus,
  FolderOpen,
  Save,
  Play,
  Square,
  Undo2,
  Redo2,
  Plus,
  Move,
  RotateCw,
  Maximize2,
  Download,
  Upload,
  Settings,
  Boxes,
  Eye,
} from 'lucide-react';
import { useEngineStore } from '../../store/engineStore';
import { PrimitiveType, TransformMode } from '../../core/types';

export const Toolbar: React.FC = () => {
  const {
    project,
    scene,
    isSceneDirty,
    transformMode,
    setTransformMode,
    isPlaying,
    togglePlay,
    undo,
    redo,
    undoStack,
    redoStack,
    addGameObject,
    saveProjectAndScene,
    exportProjectPackage,
    importProjectPackage,
    openModal,
  } = useEngineStore();

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportProjectPackage();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name || 'epstein-project'}.epstein.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        await importProjectPackage(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="h-12 bg-editor-header border-b border-editor-panelBorder flex items-center justify-between px-3 z-30 select-none">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Left: Branding and Project Controls */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 px-2 py-1 bg-editor-panel rounded border border-editor-panelBorder">
          <Boxes className="w-5 h-5 text-editor-accent" />
          <span className="font-bold tracking-wider text-xs uppercase text-white">EPSTEIN ENGINE</span>
        </div>

        <div className="h-5 w-px bg-editor-panelBorder mx-1" />

        {/* Project status */}
        <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-editor-bg text-xs">
          <span className="text-editor-textMuted">Project:</span>
          <span className="font-semibold text-white">{project ? project.name : 'No Project Open'}</span>
          {isSceneDirty && <span className="w-2 h-2 rounded-full bg-editor-warning" title="Unsaved changes" />}
        </div>

        {/* Project Buttons */}
        <button
          onClick={() => openModal('newProject')}
          title="New Project"
          className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded hover:bg-editor-hoverItem text-editor-text border border-transparent hover:border-editor-panelBorder transition"
        >
          <FolderPlus className="w-4 h-4 text-editor-accent" />
          <span className="hidden sm:inline">New</span>
        </button>

        <button
          onClick={() => openModal('openProject')}
          title="Open Project"
          className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded hover:bg-editor-hoverItem text-editor-text border border-transparent hover:border-editor-panelBorder transition"
        >
          <FolderOpen className="w-4 h-4 text-editor-warning" />
          <span className="hidden sm:inline">Open</span>
        </button>

        <button
          onClick={() => saveProjectAndScene()}
          title="Save Project and Scene"
          disabled={!project}
          className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded hover:bg-editor-hoverItem text-editor-text disabled:opacity-40 transition"
        >
          <Save className="w-4 h-4 text-editor-success" />
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>

      {/* Center: Transform Modes, Simulation, Undo/Redo */}
      <div className="flex items-center space-x-3">
        {/* Transform Tools */}
        <div className="flex items-center bg-editor-bg p-0.5 rounded border border-editor-panelBorder">
          <button
            onClick={() => setTransformMode('translate')}
            title="Translate (Move) [W]"
            className={`p-1.5 rounded transition ${
              transformMode === 'translate' ? 'bg-editor-accent text-white' : 'text-editor-textMuted hover:text-white'
            }`}
          >
            <Move className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTransformMode('rotate')}
            title="Rotate [E]"
            className={`p-1.5 rounded transition ${
              transformMode === 'rotate' ? 'bg-editor-accent text-white' : 'text-editor-textMuted hover:text-white'
            }`}
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTransformMode('scale')}
            title="Scale [R]"
            className={`p-1.5 rounded transition ${
              transformMode === 'scale' ? 'bg-editor-accent text-white' : 'text-editor-textMuted hover:text-white'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Play/Stop Simulation */}
        <button
          onClick={togglePlay}
          title={isPlaying ? 'Stop Simulation' : 'Play Simulation'}
          className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded transition ${
            isPlaying
              ? 'bg-editor-danger text-white hover:bg-red-600'
              : 'bg-editor-success text-white hover:bg-emerald-600'
          }`}
        >
          {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'Stop' : 'Play'}</span>
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center space-x-1">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded text-editor-textMuted hover:text-white disabled:opacity-30 transition"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded text-editor-textMuted hover:text-white disabled:opacity-30 transition"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Add GameObject, Export/Import, Settings */}
      <div className="flex items-center space-x-2">
        {/* Add GameObject Dropdown */}
        <div className="relative">
          <button
            onClick={() => setAddMenuOpen(!addMenuOpen)}
            disabled={!scene}
            className="flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded bg-editor-accent hover:bg-editor-accentHover text-white disabled:opacity-40 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Object</span>
          </button>

          {addMenuOpen && (
            <div
              className="absolute right-0 mt-1.5 w-44 bg-editor-panel border border-editor-panelBorder rounded shadow-xl py-1 z-50 text-xs"
              onMouseLeave={() => setAddMenuOpen(false)}
            >
              <div className="px-3 py-1 font-semibold text-editor-textMuted border-b border-editor-panelBorder uppercase tracking-wider text-[10px]">
                3D Primitives
              </div>
              {(['Cube', 'Sphere', 'Plane', 'Cylinder', 'Torus', 'Empty'] as PrimitiveType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    addGameObject(type);
                    setAddMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-editor-hoverItem flex items-center space-x-2 text-editor-text"
                >
                  <span className="w-2 h-2 rounded-full bg-editor-accent" />
                  <span>{type}</span>
                </button>
              ))}
              <div className="px-3 py-1 font-semibold text-editor-textMuted border-t border-b border-editor-panelBorder uppercase tracking-wider text-[10px] mt-1">
                Lighting
              </div>
              {(['PointLight', 'SpotLight'] as PrimitiveType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    addGameObject(type);
                    setAddMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-editor-hoverItem flex items-center space-x-2 text-editor-text"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>{type === 'PointLight' ? 'Point Light' : 'Spot Light'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export / Import */}
        <button
          onClick={handleExport}
          title="Export Project JSON"
          disabled={!project}
          className="p-1.5 rounded text-editor-textMuted hover:text-white hover:bg-editor-hoverItem disabled:opacity-40 transition"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import Project JSON"
          className="p-1.5 rounded text-editor-textMuted hover:text-white hover:bg-editor-hoverItem transition"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={() => openModal('settings')}
          title="Project Settings"
          disabled={!project}
          className="p-1.5 rounded text-editor-textMuted hover:text-white hover:bg-editor-hoverItem disabled:opacity-40 transition"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
