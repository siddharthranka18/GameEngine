import React, { useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { useEngineStore } from '../../store/engineStore';

export const NewProjectModal: React.FC = () => {
  const { activeModal, closeModal, createProject, isProjectLoading } = useEngineStore();
  const [name, setName] = useState('My 3D Game');
  const [error, setError] = useState('');

  if (activeModal !== 'newProject') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name cannot be empty');
      return;
    }
    const success = await createProject(name.trim());
    if (success) {
      closeModal();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-editor-panel border border-editor-panelBorder rounded-lg shadow-2xl w-full max-w-md overflow-hidden text-xs">
        {/* Header */}
        <div className="p-3 border-b border-editor-panelBorder bg-editor-header flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderPlus className="w-4 h-4 text-editor-accent" />
            <span className="font-semibold text-white uppercase tracking-wider text-xs">Create New Project</span>
          </div>
          <button onClick={closeModal} className="text-editor-textMuted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-editor-textMuted mb-1 font-medium">Project Name</label>
            <input
              type="text"
              value={name}
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Dungeon Crawler"
              className="w-full bg-editor-bg border border-editor-panelBorder rounded px-3 py-2 text-white outline-none focus:border-editor-accent"
            />
            {error && <p className="text-editor-danger text-[11px] mt-1">{error}</p>}
          </div>

          <div className="p-3 rounded bg-editor-bg/60 border border-editor-panelBorder text-editor-textMuted text-[11px] space-y-1">
            <p className="font-medium text-white">Project Initialization:</p>
            <p>&bull; Initializes a default scene with camera, lighting, and a 3D Cube.</p>
            <p>&bull; Persists automatically in browser IndexedDB.</p>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-editor-panelBorder">
            <button
              type="button"
              onClick={closeModal}
              className="px-3 py-1.5 rounded text-editor-textMuted hover:text-white hover:bg-editor-hoverItem"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProjectLoading}
              className="px-4 py-1.5 rounded bg-editor-accent hover:bg-editor-accentHover text-white font-semibold disabled:opacity-40 transition"
            >
              {isProjectLoading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
