import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
  BookOpen,
  ArrowRight,
  Star,
  Layers,
  ChevronDown,
  Info,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Book, Recommendation, DatasetStats } from '../types';

interface RecommendationStudioProps {
  stats: DatasetStats | null;
  onSelectBookForDetail: (book: Book) => void;
  selectedAnchorBook: Book | null;
  setSelectedAnchorBook: (book: Book | null) => void;
}

const PRESET_PROMPTS = [
  'Deep philosophical fiction about self-discovery and the meaning of life',
  'Mind-bending sci-fi exploration of artificial intelligence and consciousness',
  'Atmospheric gothic murder mystery with dark family secrets',
  'Epic fantasy with deep lore, political intrigue, and ancient magic',
  'Inspiring non-fiction stories of human resilience and discovery',
];

export const RecommendationStudio: React.FC<RecommendationStudioProps> = ({
  stats,
  onSelectBookForDetail,
  selectedAnchorBook,
  setSelectedAnchorBook,
}) => {
  const [searchMode, setSearchMode] = useState<'prompt' | 'book'>('prompt');
  const [query, setQuery] = useState('');
  const [metric, setMetric] = useState<'cosine' | 'l2'>('cosine');
  const [topK, setTopK] = useState(8);
  const [category, setCategory] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [useAiExplainer, setUseAiExplainer] = useState(true);

  // Book selection state for 'book' mode
  const [bookSearchText, setBookSearchText] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<Book[]>([]);
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [queryPrompt, setQueryPrompt] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  // Search books for anchor selector
  const handleSearchAnchorBooks = async (text: string) => {
    setBookSearchText(text);
    if (!text.trim() || text.length < 2) {
      setBookSearchResults([]);
      return;
    }
    setIsSearchingBooks(true);
    try {
      const res = await fetch(`/api/books?search=${encodeURIComponent(text)}&limit=6`);
      const data = await res.json();
      setBookSearchResults(data.books || []);
    } catch (err) {
      console.error('Failed to search books:', err);
    } finally {
      setIsSearchingBooks(false);
    }
  };

  // Run Recommendation
  const handleRecommend = async (customQuery?: string) => {
    const activeQuery = customQuery !== undefined ? customQuery : query;

    if (searchMode === 'prompt' && !activeQuery.trim()) {
      return;
    }
    if (searchMode === 'book' && !selectedAnchorBook) {
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();

    try {
      const bodyPayload = {
        query: searchMode === 'prompt' ? activeQuery : undefined,
        bookId: searchMode === 'book' && selectedAnchorBook ? selectedAnchorBook.isbn13 : undefined,
        metric,
        topK,
        category: category !== 'All' ? category : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        useAiExplainer,
      };

      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      setRecommendations(data.recommendations || []);
      setQueryPrompt(data.queryPrompt || activeQuery);
      setHasSearched(true);
      setResponseTime(Math.round(performance.now() - startTime));
    } catch (err) {
      console.error('Recommendation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Control Panel */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-6 relative z-10">
          {/* Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                Vector Recommendation Engine
              </h2>
              <p className="text-xs text-neutral-400">
                Embed your reading desires into high-dimensional space or calculate nearest neighbors to a favorite book.
              </p>
            </div>

            <div className="flex items-center p-1 bg-neutral-950 border border-neutral-800 rounded-xl self-start">
              <button
                id="mode-prompt"
                onClick={() => setSearchMode('prompt')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  searchMode === 'prompt'
                    ? 'bg-amber-500 text-neutral-950 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Semantic Query</span>
              </button>

              <button
                id="mode-book"
                onClick={() => setSearchMode('book')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  searchMode === 'book'
                    ? 'bg-amber-500 text-neutral-950 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Match a Favorite Book (Cell 14)</span>
              </button>
            </div>
          </div>

          {/* Mode A: Natural Language Prompt Search */}
          {searchMode === 'prompt' ? (
            <div className="space-y-3">
              <div className="relative">
                <input
                  id="input-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRecommend()}
                  placeholder="Describe the themes, mood, tone, or story you crave (e.g. 'thought-provoking sci-fi with philosophical questions')..."
                  className="w-full pl-11 pr-32 py-3.5 bg-neutral-950 border border-neutral-700/80 focus:border-amber-500 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
                />
                <Search className="w-5 h-5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />

                <button
                  id="btn-recommend-submit"
                  onClick={() => handleRecommend()}
                  disabled={isLoading || !query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-neutral-950 font-semibold text-xs flex items-center space-x-1.5 transition-all shadow cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{isLoading ? 'Vector Searching...' : 'Recommend'}</span>
                </button>
              </div>

              {/* Quick Inspiration Chips */}
              <div className="flex items-center flex-wrap gap-2 pt-1">
                <span className="text-[11px] text-neutral-500 font-medium">Try inspiration:</span>
                {PRESET_PROMPTS.map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(promptText);
                      handleRecommend(promptText);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-700/50 hover:border-amber-500/30 transition-all text-left"
                  >
                    {promptText.length > 40 ? promptText.slice(0, 40) + '...' : promptText}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Mode B: Book-to-Book Similarity Search (Nathan's Cell 14 Favorite Book) */
            <div className="space-y-3">
              <div className="relative">
                <input
                  id="input-anchor-book"
                  type="text"
                  value={bookSearchText}
                  onChange={(e) => handleSearchAnchorBooks(e.target.value)}
                  placeholder="Type a book title or author to select as your seed anchor (e.g. 'Gilead', 'Agatha Christie', '1984')..."
                  className="w-full pl-11 pr-4 py-3.5 bg-neutral-950 border border-neutral-700/80 focus:border-amber-500 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <BookOpen className="w-5 h-5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Search dropdown results */}
              {bookSearchResults.length > 0 && (
                <div className="p-2 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 shadow-lg max-h-56 overflow-y-auto">
                  {bookSearchResults.map((b) => (
                    <button
                      key={b.isbn13}
                      onClick={() => {
                        setSelectedAnchorBook(b);
                        setBookSearchResults([]);
                        setBookSearchText('');
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-neutral-800/80 flex items-center space-x-3 transition-colors text-xs"
                    >
                      <div className="w-7 h-10 bg-neutral-800 rounded overflow-hidden flex-shrink-0">
                        {b.thumbnail ? (
                          <img src={b.thumbnail} alt={b.title} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-neutral-200 truncate">{b.title}</div>
                        <div className="text-neutral-500 truncate">{b.authors} &bull; {b.categories}</div>
                      </div>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Anchor Display */}
              {selectedAnchorBook && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-14 rounded bg-neutral-800 overflow-hidden flex-shrink-0 border border-amber-500/30">
                      {selectedAnchorBook.thumbnail ? (
                        <img src={selectedAnchorBook.thumbnail} alt={selectedAnchorBook.title} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block">
                        Seed Anchor Book (Target)
                      </span>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {selectedAnchorBook.title}
                      </h4>
                      <p className="text-xs text-neutral-400">
                        by {selectedAnchorBook.authors} &bull; {selectedAnchorBook.categories}
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-recommend-anchor-submit"
                    onClick={() => handleRecommend()}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs flex items-center space-x-1.5 shadow cursor-pointer transition-all flex-shrink-0"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Find Nearest Neighbors</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hyperparameters & Vector Store Controls */}
          <div className="pt-3 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
            {/* Metric Selector */}
            <div className="space-y-1">
              <label className="text-neutral-400 font-medium flex items-center space-x-1">
                <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                <span>Vector Distance Metric</span>
              </label>
              <select
                id="select-metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value as 'cosine' | 'l2')}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700/80 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
              >
                <option value="cosine">Cosine Similarity (Angular)</option>
                <option value="l2">FAISS IndexFlatL2 (Euclidean)</option>
              </select>
            </div>

            {/* Top-K Selector */}
            <div className="space-y-1">
              <label className="text-neutral-400 font-medium flex items-center space-x-1">
                <Layers className="w-3 h-3 text-amber-400" />
                <span>Nearest Neighbors (Top-K)</span>
              </label>
              <select
                id="select-topk"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700/80 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500 text-[11px]"
              >
                <option value="4">Top 4 Results</option>
                <option value="6">Top 6 Results</option>
                <option value="8">Top 8 Results (Default)</option>
                <option value="12">Top 12 Results</option>
                <option value="16">Top 16 Results</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <label className="text-neutral-400 font-medium">Category Filter</label>
              <select
                id="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700/80 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500 text-[11px]"
              >
                <option value="All">All Categories</option>
                {stats?.categories.slice(0, 15).map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Min Rating */}
            <div className="space-y-1">
              <label className="text-neutral-400 font-medium">Min Avg Rating</label>
              <select
                id="select-min-rating"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700/80 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500 text-[11px]"
              >
                <option value="0">Any Rating</option>
                <option value="3.5">3.5+ Stars</option>
                <option value="3.8">3.8+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="4.2">4.2+ Stars</option>
              </select>
            </div>

            {/* AI Explanations Toggle */}
            <div className="space-y-1 flex flex-col justify-end">
              <label
                className="flex items-center space-x-2 py-1.5 px-2.5 bg-neutral-950 border border-neutral-800 rounded-lg cursor-pointer hover:border-neutral-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={useAiExplainer}
                  onChange={(e) => setUseAiExplainer(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 bg-neutral-900 border-neutral-700"
                />
                <span className="text-[11px] text-neutral-300 font-medium flex items-center space-x-1 truncate">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Gemini LLM Explainer</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header / Meta Banner */}
      {hasSearched && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <span className="text-xs text-neutral-400">Recommendations for:</span>
            <h3 className="text-lg font-bold text-white font-display">
              "{queryPrompt}"
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400">
            <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">
              Metric: {metric === 'cosine' ? 'Cosine Similarity' : 'FAISS IndexFlatL2'}
            </span>
            {responseTime !== null && (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                ⚡ {responseTime}ms
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm text-neutral-300 font-medium">
            Projecting query into 4096-dim vector space & ranking nearest neighbors...
          </p>
          <p className="text-xs text-neutral-500">
            Executing FAISS distance calculations across 6,810 book vectors
          </p>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {recommendations.map((rec) => (
            <div
              key={rec.book.isbn13 + '-' + rec.rank}
              className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/5 group"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between text-xs">
                  <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 font-mono font-bold flex items-center justify-center text-[11px] border border-neutral-700">
                    #{rec.rank}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-[11px] font-semibold">
                    {metric === 'cosine'
                      ? `${(rec.score * 100).toFixed(1)}% match`
                      : `d = ${rec.distance.toFixed(3)}`}
                  </span>
                </div>

                {/* Book Cover & Title */}
                <div className="flex gap-3">
                  <div className="w-20 h-28 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0 border border-neutral-700/80 shadow">
                    {rec.book.thumbnail ? (
                      <img
                        src={rec.book.thumbnail}
                        alt={rec.book.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-neutral-800">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-amber-400/90 font-medium uppercase tracking-wider truncate block">
                      {rec.book.categories || 'Literature'}
                    </span>
                    <h4 className="text-sm font-bold text-white font-display line-clamp-2 leading-tight group-hover:text-amber-300 transition-colors">
                      {rec.book.title}
                    </h4>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {rec.book.authors}
                    </p>
                    <div className="flex items-center space-x-1 text-amber-400 text-xs mt-1.5 font-semibold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{rec.book.average_rating > 0 ? rec.book.average_rating.toFixed(2) : 'N/A'}</span>
                      <span className="text-neutral-500 font-normal text-[10px]">
                        ({rec.book.published_year})
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI / Vector Rationale */}
                {rec.aiExplanation && (
                  <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-[11px] text-neutral-300 leading-relaxed">
                    <div className="flex items-center space-x-1 text-amber-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Reading Rationale</span>
                    </div>
                    {rec.aiExplanation}
                  </div>
                )}

                {/* Matched Keywords */}
                {rec.matchedKeywords && rec.matchedKeywords.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1">
                    <span className="text-[10px] text-neutral-500">Vector terms:</span>
                    {rec.matchedKeywords.slice(0, 3).map((w, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/50"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-800/60 mt-3 flex items-center gap-2">
                <button
                  onClick={() => onSelectBookForDetail(rec.book)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors text-center cursor-pointer"
                >
                  View Details
                </button>
                <button
                  onClick={() => {
                    setSelectedAnchorBook(rec.book);
                    setSearchMode('book');
                    handleRecommend();
                  }}
                  title="Use as seed anchor to find books similar to this one"
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-400 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : hasSearched ? (
        <div className="p-12 text-center bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-2">
          <Info className="w-8 h-8 text-neutral-500 mx-auto" />
          <p className="text-sm text-neutral-300 font-medium">
            No books found matching this vector query and filters.
          </p>
          <p className="text-xs text-neutral-500">
            Try loosening category or minimum rating filters, or using broader search terms.
          </p>
        </div>
      ) : (
        /* Initial Empty State / Welcome Guide */
        <div className="p-8 bg-neutral-900/40 border border-neutral-800/60 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="text-sm font-semibold text-white">Semantic Latent Space</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Traditional search requires exact word matches. Vector embeddings map themes, mood, and genre into a continuous 4096-dimensional space.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="text-sm font-semibold text-white">FAISS Distance & Cosine</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Toggle between Cosine Similarity (angle of direction) and Euclidean L2 distance (exact FAISS IndexFlatL2 distance as used in Nathan's notebook).
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="text-sm font-semibold text-white">Gemini LLM Reasoning</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Once vector neighbors are retrieved, Google Gemini 3.8 Flash synthesizes personalized reading rationales explaining why each book fits your taste.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
