import React, { useState } from 'react';
import { Settings, X, Plus, Trash2 } from 'lucide-react';
import { useEngineStore } from '../../store/engineStore';

export const SettingsModal: React.FC = () => {
  const { activeModal, closeModal, project, scene, updateProjectConfig } = useEngineStore();

  const [buildTarget, setBuildTarget] = useState(project?.config.buildTarget || 'Web');
  const [startupSceneId, setStartupSceneId] = useState(project?.startupSceneId || '');
  const [antialias, setAntialias] = useState(project?.config.renderer.antialias ?? true);
  const [shadows, setShadows] = useState(project?.config.renderer.shadows ?? true);
  const [clearColor, setClearColor] = useState(project?.config.renderer.clearColor || '#12141a');

  // Custom key/value settings
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [customSettings, setCustomSettings] = useState<Record<string, string>>(
    project?.config.customSettings || {}
  );

  if (activeModal !== 'settings' || !project) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProjectConfig({
      buildTarget,
      renderer: {
        antialias,
        shadows,
        toneMapping: 'ACESFilmic',
        clearColor,
      },
      customSettings,
    });
    closeModal();
  };

  const handleAddCustom = () => {
    if (customKey.trim()) {
      setCustomSettings({
        ...customSettings,
        [customKey.trim()]: customValue.trim(),
      });
      setCustomKey('');
      setCustomValue('');
    }
  };

  const handleRemoveCustom = (key: string) => {
    const next = { ...customSettings };
    delete next[key];
    setCustomSettings(next);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-editor-panel border border-editor-panelBorder rounded-lg shadow-2xl w-full max-w-lg overflow-hidden text-xs flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-3 border-b border-editor-panelBorder bg-editor-header flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-editor-accent" />
            <span className="font-semibold text-white uppercase tracking-wider text-xs">Project Settings</span>
          </div>
          <button onClick={closeModal} className="text-editor-textMuted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* General Config */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[10px] border-b border-editor-panelBorder pb-1">
              General Configuration
            </h4>

            <div>
              <label className="block text-editor-textMuted mb-1">Build Target Platform</label>
              <select
                value={buildTarget}
                onChange={(e) => setBuildTarget(e.target.value)}
                className="w-full bg-editor-bg border border-editor-panelBorder rounded px-3 py-1.5 text-white outline-none focus:border-editor-accent"
              >
                <option value="Web">Web (HTML5 / WebGL)</option>
                <option value="Windows">Windows Desktop</option>
                <option value="macOS">macOS</option>
                <option value="Linux">Linux</option>
              </select>
            </div>

            <div>
              <label className="block text-editor-textMuted mb-1">Startup Scene</label>
              <select
                value={startupSceneId}
                onChange={(e) => setStartupSceneId(e.target.value)}
                className="w-full bg-editor-bg border border-editor-panelBorder rounded px-3 py-1.5 text-white outline-none focus:border-editor-accent"
              >
                {project.sceneIds.map((sid) => (
                  <option key={sid} value={sid}>
                    {scene?.id === sid ? `${scene.name} (Current)` : sid}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Renderer Settings */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[10px] border-b border-editor-panelBorder pb-1">
              Graphics & Viewport Renderer
            </h4>

            <div className="flex items-center justify-between">
              <span className="text-editor-textMuted">Enable Antialiasing</span>
              <input
                type="checkbox"
                checked={antialias}
                onChange={(e) => setAntialias(e.target.checked)}
                className="rounded accent-editor-accent cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-editor-textMuted">Real-Time Shadow Maps</span>
              <input
                type="checkbox"
                checked={shadows}
                onChange={(e) => setShadows(e.target.checked)}
                className="rounded accent-editor-accent cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-editor-textMuted">Viewport Clear Color</span>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={clearColor}
                  onChange={(e) => setClearColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-editor-panelBorder bg-transparent"
                />
                <span className="font-mono text-[10px] text-white uppercase">{clearColor}</span>
              </div>
            </div>
          </div>

          {/* Custom Settings */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[10px] border-b border-editor-panelBorder pb-1">
              Custom Key-Value Properties
            </h4>

            <div className="space-y-1 max-h-28 overflow-y-auto">
              {Object.entries(customSettings).length === 0 ? (
                <p className="text-editor-textMuted italic text-[11px]">No custom properties set.</p>
              ) : (
                Object.entries(customSettings).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between bg-editor-bg p-1.5 rounded border border-editor-panelBorder">
                    <span className="font-mono font-medium text-white">{k}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-editor-textMuted">{v}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustom(k)}
                        className="text-editor-danger hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                placeholder="Key"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="flex-1 bg-editor-bg border border-editor-panelBorder rounded px-2 py-1 text-white outline-none"
              />
              <input
                type="text"
                placeholder="Value"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="flex-1 bg-editor-bg border border-editor-panelBorder rounded px-2 py-1 text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="p-1 rounded bg-editor-accent hover:bg-editor-accentHover text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-editor-panelBorder">
            <button
              type="button"
              onClick={closeModal}
              className="px-3 py-1.5 rounded text-editor-textMuted hover:text-white hover:bg-editor-hoverItem"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-editor-accent hover:bg-editor-accentHover text-white font-semibold transition"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
