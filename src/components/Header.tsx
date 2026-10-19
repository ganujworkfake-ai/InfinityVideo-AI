import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Plus, Download, Smartphone } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'library' | 'providers' | 'docs';
  setActiveTab: (tab: 'studio' | 'library' | 'providers' | 'docs') => void;
  onNewVideo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onNewVideo }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Brand title wordmark */}
          <button
            onClick={() => setActiveTab('studio')}
            className="flex items-center gap-2 text-left whitespace-nowrap shrink-0 group focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-sm shadow-cyan-500/20">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m10 15 5-3-5-3v6Z"/>
                <path d="M18 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"/>
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              InfinityVideo <span className="font-semibold text-cyan-400">AI</span>
            </span>
          </button>

          {/* Zone 2: Navigation Links (4-5 items, clean unboxed text with hover underline) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <button
              onClick={() => setActiveTab('studio')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'studio'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Video Studio
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'library'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Project Library
            </button>
            <button
              onClick={() => setActiveTab('providers')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'providers'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Engine Providers
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'docs'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Architecture & Docs
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action + PWA install affordance */}
          <div className="flex items-center gap-3 shrink-0">
            {/* PWA Install Button if available */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
                title="Install InfinityVideo AI to home screen"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                Install App
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                Install iOS
              </button>
            )}

            <button
              onClick={onNewVideo}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 active:scale-[0.98] transition-all shadow-sm shadow-cyan-500/20 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              New Video
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="flex md:hidden border-t border-slate-800/60 px-4 py-2 gap-4 text-xs font-medium overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('studio')}
            className={`whitespace-nowrap shrink-0 ${activeTab === 'studio' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
          >
            Studio
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`whitespace-nowrap shrink-0 ${activeTab === 'library' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
          >
            Library
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`whitespace-nowrap shrink-0 ${activeTab === 'providers' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
          >
            Providers
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`whitespace-nowrap shrink-0 ${activeTab === 'docs' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
          >
            Docs
          </button>
        </div>
      </header>

      {/* iOS Safari PWA Installation Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Install on iPhone / iPad</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              1. Tap the <strong className="text-slate-200">Share</strong> icon at the bottom of Safari.<br />
              2. Scroll down and select <strong className="text-slate-200">Add to Home Screen</strong>.<br />
              3. Launch directly from your home screen for full standalone experience.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
};
