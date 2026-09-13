import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, BookOpen, ExternalLink, Sparkles, Database, CheckCircle, RefreshCw } from 'lucide-react';
import { Book } from '../types';

interface FavoriteRecord {
  id: string;
  book_isbn13: string;
  book_title: string;
  book_authors: string;
  thumbnail: string;
  notes?: string;
  created_at: string;
}

interface FavoritesManagerProps {
  onSelectBookForDetail: (book: Book) => void;
  onFindSimilar: (book: Book) => void;
}

export const FavoritesManager: React.FC<FavoritesManagerProps> = ({
  onSelectBookForDetail,
  onFindSimilar,
}) => {
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/favorites');
      const data = await res.json();
      setFavorites(data || []);
    } catch (err) {
      console.error('Failed to load favorites from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleDelete = async (isbn: string) => {
    setDeletingId(isbn);
    try {
      await fetch(`/api/favorites/${isbn}`, { method: 'DELETE' });
      setFavorites(prev => prev.filter(f => f.book_isbn13 !== isbn));
    } catch (err) {
      console.error('Failed to delete favorite:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenBook = async (isbn: string) => {
    try {
      const res = await fetch(`/api/books/${isbn}`);
      if (res.ok) {
        const book: Book = await res.json();
        onSelectBookForDetail(book);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecommendFromSaved = async (isbn: string) => {
    try {
      const res = await fetch(`/api/books/${isbn}`);
      if (res.ok) {
        const book: Book = await res.json();
        onFindSimilar(book);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Database className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Supabase Cloud Database & Bookmarks</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Live synchronization with Supabase PostgreSQL (Project ID: <code className="text-emerald-300 font-mono">ehpfkvqiqksmppnodwdq</code>). 
            Saved reading lists are persisted across sessions and cloud deployments.
          </p>
        </div>

        <button
          onClick={fetchFavorites}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh from Supabase</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-neutral-400 text-sm">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-3" />
          <p>Loading bookmarks from Supabase...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30">
          <Bookmark className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
          <h3 className="text-base font-semibold text-neutral-300">No bookmarks saved yet</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
            Browse the Recommendation Studio or Dataset Explorer to bookmark books and save them directly into your Supabase database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => (
            <div
              key={fav.id || fav.book_isbn13}
              className="group p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div className="flex gap-3">
                {fav.thumbnail ? (
                  <img
                    src={fav.thumbnail}
                    alt={fav.book_title}
                    className="w-16 h-24 object-cover rounded-lg border border-neutral-800 shrink-0 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-24 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-neutral-100 line-clamp-2 leading-snug">
                    {fav.book_title}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                    {fav.book_authors}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-400/80 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Synced in Supabase</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenBook(fav.book_isbn13)}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-200 font-medium transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleRecommendFromSaved(fav.book_isbn13)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[11px] text-amber-300 font-medium border border-amber-500/30 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Find Similar</span>
                </button>
                <button
                  onClick={() => handleDelete(fav.book_isbn13)}
                  disabled={deletingId === fav.book_isbn13}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors ml-auto"
                  title="Remove from Supabase"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
