import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Star, Sparkles, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Book, DatasetStats } from '../types';

interface DatasetExplorerProps {
  stats: DatasetStats | null;
  onSelectBookForDetail: (book: Book) => void;
  onFindSimilar: (book: Book) => void;
}

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({
  stats,
  onSelectBookForDetail,
  onFindSimilar,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBooks = async (p = page, q = search, cat = category) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/books?page=${p}&limit=12&search=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`
      );
      const data = await res.json();
      setBooks(data.books || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch books catalogue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(1, search, category);
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBooks(1, search, category);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchBooks(newPage, search, category);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white font-display">
            Book Corpus Catalog
          </h2>
          <p className="text-xs text-neutral-400">
            Showing {total.toLocaleString()} books indexed in vector space from Nathan Cordeiro's <code className="text-amber-400 font-mono">books.csv</code>.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, author, keyword..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700/80 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2.5 py-2 bg-neutral-950 border border-neutral-700/80 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-amber-500 max-w-[140px] truncate"
          >
            <option value="all">All Genres</option>
            {stats?.categories.slice(0, 20).map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-xl transition-all flex-shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Book Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-400">Querying books catalog...</p>
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.map((book) => (
            <div
              key={book.isbn13}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 flex flex-col justify-between transition-all group"
            >
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-16 h-24 rounded bg-neutral-800 overflow-hidden flex-shrink-0 border border-neutral-700/60 shadow">
                    {book.thumbnail ? (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-neutral-800">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-amber-400/80 font-medium block uppercase tracking-wider truncate">
                      {book.categories || 'Literature'}
                    </span>
                    <h4 className="text-xs font-bold text-white font-display line-clamp-2 leading-tight group-hover:text-amber-300 transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {book.authors || 'Unknown'}
                    </p>
                    <div className="flex items-center space-x-1 text-amber-400 text-[11px] mt-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{book.average_rating > 0 ? book.average_rating.toFixed(2) : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                  {book.description || 'No description available for this volume.'}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 mt-3 flex items-center gap-2">
                <button
                  onClick={() => onSelectBookForDetail(book)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium transition-colors text-center cursor-pointer"
                >
                  Details
                </button>
                <button
                  onClick={() => onFindSimilar(book)}
                  className="py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 border border-amber-500/30 text-[11px] font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Similar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-neutral-900/50 border border-neutral-800 rounded-2xl">
          <p className="text-sm text-neutral-400">No books found matching search filters.</p>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          <span className="text-xs text-neutral-400">
            Page {page} of {totalPages} ({total.toLocaleString()} total books)
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-neutral-300 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
