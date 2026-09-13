import React from 'react';
import { X, Star, Calendar, BookOpen, Layers, Sparkles, Hash } from 'lucide-react';
import { Book } from '../types';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onFindSimilar: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onFindSimilar,
}) => {
  if (!book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 sticky top-0 bg-neutral-900/90 backdrop-blur z-10">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold text-neutral-300">Book Specification</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Thumbnail */}
            <div className="w-36 sm:w-44 flex-shrink-0 mx-auto sm:mx-0">
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700 shadow-md">
                {book.thumbnail ? (
                  <img
                    src={book.thumbnail}
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-neutral-500 bg-neutral-800/80">
                    <BookOpen className="w-10 h-10 mb-2 opacity-50" />
                    <span className="text-xs">No Cover</span>
                  </div>
                )}
              </div>
            </div>

            {/* Core Info */}
            <div className="flex-1 space-y-3">
              <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {book.categories || 'Literature'}
              </span>

              <h2 className="text-2xl font-bold text-white font-display leading-tight">
                {book.title}
              </h2>
              {book.subtitle && (
                <p className="text-sm text-neutral-400 italic -mt-1">
                  {book.subtitle}
                </p>
              )}

              <p className="text-sm text-neutral-300 font-medium">
                by <span className="text-amber-300">{book.authors || 'Unknown'}</span>
              </p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-neutral-800 text-xs">
                <div>
                  <span className="text-neutral-500 block mb-0.5">Rating</span>
                  <div className="flex items-center space-x-1 text-amber-400 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{book.average_rating > 0 ? book.average_rating.toFixed(2) : 'N/A'}</span>
                    <span className="text-neutral-500 font-normal">({book.ratings_count.toLocaleString()})</span>
                  </div>
                </div>

                <div>
                  <span className="text-neutral-500 block mb-0.5">Published</span>
                  <span className="text-neutral-300 font-medium">{book.published_year || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-neutral-500 block mb-0.5">Pages</span>
                  <span className="text-neutral-300 font-medium">{book.num_pages || 'N/A'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="btn-modal-find-similar"
                  onClick={() => {
                    onFindSimilar(book);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Find Nearest Vector Neighbors to This Book</span>
                </button>
              </div>
            </div>
          </div>

          {/* Synopsis */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-200">Synopsis</h3>
            <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/80">
              {book.description || 'No detailed synopsis available for this title in the catalog.'}
            </p>
          </div>

          {/* Textual Representation (As used in Nathan's Notebook) */}
          {book.textual_representation && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-200 flex items-center space-x-1.5">
                  <Hash className="w-4 h-4 text-amber-400" />
                  <span>Textual Representation fed into Vector Space</span>
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">
                  main.ipynb Cell 3 Format
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-amber-200/80 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {book.textual_representation}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
