import React, { useState } from 'react';
import { VideoProject } from '../types/index.ts';
import { 
  Film, 
  Trash2, 
  Edit2, 
  Download, 
  ExternalLink, 
  Check, 
  X, 
  Search, 
  Clock, 
  HardDrive 
} from 'lucide-react';

interface ProjectLibraryProps {
  projects: VideoProject[];
  onSelectProject: (p: VideoProject) => void;
  onDeleteProject: (id: string) => Promise<void>;
  onRenameProject: (id: string, newTitle: string) => Promise<void>;
  onNewVideo: () => void;
}

export const ProjectLibrary: React.FC<ProjectLibraryProps> = ({
  projects,
  onSelectProject,
  onDeleteProject,
  onRenameProject,
  onNewVideo,
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt.toLowerCase().includes(search.toLowerCase())
  );

  const startRename = (p: VideoProject) => {
    setEditingId(p.id);
    setEditTitle(p.title);
  };

  const saveRename = async (id: string) => {
    if (editTitle.trim()) {
      await onRenameProject(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this project and remove all its video clips from disk storage?')) {
      setIsDeleting(id);
      try {
        await onDeleteProject(id);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Film className="h-5 w-5 text-cyan-400" />
            Project Library & Media Storage
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your custom-duration generations, inspect verified video metrics, and download rendered files.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title or prompt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#0f172a] pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={onNewVideo}
            className="rounded-lg bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap"
          >
            + Create New
          </button>
        </div>
      </div>

      {/* Storage policy notice */}
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0f172a]/70 px-4 py-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>Storage Policy: Local persistent media cache. Projects remain intact until deleted.</span>
        </div>
        <span className="font-mono tabular-nums text-slate-300">
          {projects.length} {projects.length === 1 ? 'Project' : 'Projects'} Saved
        </span>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
          <Film className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No projects found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'No video project matches your search criteria.' : 'Create your first custom-duration video in the Studio.'}
          </p>
          <button
            onClick={onNewVideo}
            className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            Start First Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const isCompleted = project.status === 'completed';
            const isEditing = editingId === project.id;
            const sizeMB = project.finalVideoSize
              ? (project.finalVideoSize / (1024 * 1024)).toFixed(1)
              : null;

            return (
              <div
                key={project.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-xs hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  {/* Title & Rename */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded border border-cyan-500 bg-[#090d16] px-2 py-0.5 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => saveRename(project.id)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-slate-400 hover:text-slate-300"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate text-sm">
                          {project.title}
                        </h4>
                        <button
                          onClick={() => startRename(project)}
                          className="text-slate-500 hover:text-slate-300 p-0.5"
                          title="Rename project"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                        : project.status === 'failed'
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                        : 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Metadata strip (zero-pill discipline: unboxed text with typographic dots) */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2.5">
                    <span className="flex items-center gap-1 font-mono text-cyan-300">
                      <Clock className="h-3 w-3" />
                      {project.actualDuration ? `${project.actualDuration.toFixed(1)}s` : `${project.requestedDuration}s`}
                    </span>
                    <span className="text-slate-700">·</span>
                    <span>{project.aspectRatio}</span>
                    <span className="text-slate-700">·</span>
                    <span className="capitalize">{project.style}</span>
                    {sizeMB && (
                      <>
                        <span className="text-slate-700">·</span>
                        <span className="font-mono">{sizeMB}MB</span>
                      </>
                    )}
                  </div>

                  {/* Prompt excerpt */}
                  <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed mb-3">
                    {project.prompt}
                  </p>

                  {/* Video preview / placeholder */}
                  {project.finalVideoUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden bg-black aspect-video border border-slate-800 flex items-center justify-center">
                      <video
                        src={project.finalVideoUrl}
                        className="h-full w-full object-cover"
                        preload="metadata"
                      />
                    </div>
                  )}
                </div>

                {/* Card Action footer */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs mt-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {project.finalVideoUrl && (
                      <a
                        href={project.finalVideoUrl}
                        download={`video_${project.id}.mp4`}
                        className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Download MP4"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => onSelectProject(project)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-slate-200 hover:text-white transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </button>

                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={isDeleting === project.id}
                      className="p-1.5 rounded-md hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
