/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RecommendationStudio } from './components/RecommendationStudio';
import { ArchitectureExplainer } from './components/ArchitectureExplainer';
import { DatasetExplorer } from './components/DatasetExplorer';
import { BookDetailModal } from './components/BookDetailModal';
import { FavoritesManager } from './components/FavoritesManager';
import { Book, DatasetStats } from './types';
import { Github, Database, Cpu, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'recommend' | 'explainer' | 'dataset' | 'favorites'>('recommend');
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);
  const [selectedAnchorBook, setSelectedAnchorBook] = useState<Book | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load dataset stats:', err));
  }, []);

  const handleFindSimilarFromAnywhere = (book: Book) => {
    setSelectedAnchorBook(book);
    setActiveTab('recommend');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d0e] text-neutral-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'recommend' && (
          <RecommendationStudio
            stats={stats}
            onSelectBookForDetail={(book) => setSelectedBookForDetail(book)}
            selectedAnchorBook={selectedAnchorBook}
            setSelectedAnchorBook={setSelectedAnchorBook}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesManager
            onSelectBookForDetail={(book) => setSelectedBookForDetail(book)}
            onFindSimilar={handleFindSimilarFromAnywhere}
          />
        )}

        {activeTab === 'explainer' && (
          <ArchitectureExplainer />
        )}

        {activeTab === 'dataset' && (
          <DatasetExplorer
            stats={stats}
            onSelectBookForDetail={(book) => setSelectedBookForDetail(book)}
            onFindSimilar={handleFindSimilarFromAnywhere}
          />
        )}
      </main>

      {/* Book Detail Modal */}
      {selectedBookForDetail && (
        <BookDetailModal
          book={selectedBookForDetail}
          onClose={() => setSelectedBookForDetail(null)}
          onFindSimilar={handleFindSimilarFromAnywhere}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950/60 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center space-x-2">
            <span>Replicating & extending</span>
            <a
              href="https://github.com/NathanCordeiro/book-recommender-with-llm-and-vectorstore"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:text-amber-300 font-mono inline-flex items-center space-x-1"
            >
              <span>NathanCordeiro/book-recommender-with-llm-and-vectorstore</span>
            </a>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span className="flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-neutral-400" />
              <span>6,810 Books</span>
            </span>
            <span className="flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              <span>4,096-dim FAISS Space</span>
            </span>
            <span className="flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini 3.8 Flash</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
