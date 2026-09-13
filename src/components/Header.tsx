import React from 'react';
import { BookOpen, BrainCircuit, Database, Sparkles, Compass } from 'lucide-react';
import { DatasetStats } from '../types';

interface HeaderProps {
  activeTab: 'recommend' | 'explainer' | 'dataset' | 'favorites';
  setActiveTab: (tab: 'recommend' | 'explainer' | 'dataset' | 'favorites') => void;
  stats: DatasetStats | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stats,
}) => {
  return (
    <header className="border-b border-neutral-800/80 bg-neutral-900/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shadow-amber-500/10">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-display">
                  Book Recommender
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                  LLM + Vector Store
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Supabase Live
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Built from Nathan Cordeiro’s project &bull; 6,810 Books Vectorized
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center p-1 bg-neutral-950/80 border border-neutral-800 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            <button
              id="tab-recommend"
              onClick={() => setActiveTab('recommend')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === 'recommend'
                  ? 'bg-amber-500 text-neutral-950 shadow font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommendation Studio</span>
            </button>

            <button
              id="tab-favorites"
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === 'favorites'
                  ? 'bg-emerald-500 text-neutral-950 shadow font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase Saved</span>
            </button>

            <button
              id="tab-explainer"
              onClick={() => setActiveTab('explainer')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === 'explainer'
                  ? 'bg-amber-500 text-neutral-950 shadow font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Architecture Guide</span>
            </button>

            <button
              id="tab-dataset"
              onClick={() => setActiveTab('dataset')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === 'dataset'
                  ? 'bg-amber-500 text-neutral-950 shadow font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Dataset Catalog ({stats ? stats.totalBooks.toLocaleString() : '6,810'})</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
