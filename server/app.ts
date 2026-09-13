import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { loadBooks, getStats } from './booksData.js';
import { vectorStore } from './vectorStore.js';
import { explainRecommendations } from './geminiService.js';
import { notebookWalkthrough } from './notebookData.js';
import { supabase } from './supabase.js';
import fs from 'fs';

dotenv.config();

let initialized = false;

export function createApp() {
  const app = express();
  app.use(express.json());

  // Initialize books catalog & vector store in memory if not already done
  if (!initialized) {
    const books = loadBooks();
    vectorStore.initialize();
    initialized = true;
    console.log(`Vector store initialized with ${books.length} books.`);
  }

  const books = loadBooks();

  // --- API Routes ---

  // Health check & Supabase connection check
  app.get('/api/health', async (req, res) => {
    let supabaseStatus = 'connected';
    try {
      const { error } = await supabase.from('books').select('isbn13', { count: 'exact', head: true });
      if (error) supabaseStatus = `error: ${error.message}`;
    } catch (e: any) {
      supabaseStatus = `error: ${e.message}`;
    }

    res.json({
      status: 'ok',
      booksCount: books.length,
      supabase: supabaseStatus,
      timestamp: new Date().toISOString(),
    });
  });

  // Dataset & Engine Stats
  app.get('/api/stats', (req, res) => {
    try {
      const stats = getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Books catalogue with search & pagination
  app.get('/api/books', (req, res) => {
    try {
      const search = String(req.query.search || '').toLowerCase().trim();
      const category = String(req.query.category || '').toLowerCase().trim();
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '12'), 10)));

      let filtered = books;

      if (category && category !== 'all') {
        filtered = filtered.filter(b => b.categories.toLowerCase().includes(category));
      }

      if (search) {
        filtered = filtered.filter(b =>
          b.title.toLowerCase().includes(search) ||
          b.authors.toLowerCase().includes(search) ||
          b.description.toLowerCase().includes(search)
        );
      }

      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + limit);

      res.json({
        books: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Single book detail
  app.get('/api/books/:isbn', (req, res) => {
    const book = books.find(b => b.isbn13 === req.params.isbn || b.isbn10 === req.params.isbn);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  });

  // Vector Recommendation Endpoint with Gemini AI
  app.post('/api/recommend', async (req, res) => {
    try {
      const {
        query,
        bookId,
        category,
        minRating,
        metric = 'cosine',
        topK = 8,
        useAiExplainer = true,
      } = req.body;

      if (!query && !bookId) {
        return res.status(400).json({ error: 'Please provide either a search query or a bookId.' });
      }

      let targetBookTitle = '';
      if (bookId) {
        const found = books.find(b => b.isbn13 === bookId);
        if (found) {
          targetBookTitle = found.title;
        }
      }

      // Execute Vector Search
      let recommendations = vectorStore.search({
        query: query ? String(query) : undefined,
        bookId: bookId ? String(bookId) : undefined,
        category: category && category !== 'All' ? String(category) : undefined,
        minRating: minRating ? parseFloat(minRating) : 0,
        metric: metric === 'l2' ? 'l2' : 'cosine',
        topK: Math.min(20, Math.max(1, parseInt(String(topK || '8'), 10))),
      });

      // Optional Gemini LLM Rationale Generation
      if (useAiExplainer && recommendations.length > 0) {
        const promptAnchor = targetBookTitle || query || 'books';
        recommendations = await explainRecommendations(promptAnchor, recommendations, !!bookId);
      }

      // Asynchronously log search to Supabase search_logs
      supabase.from('search_logs').insert([{
        query: query || targetBookTitle,
        selected_book_isbn: bookId || null,
        metric: metric,
        results_count: recommendations.length,
      }]).then();

      res.json({
        recommendations,
        queryPrompt: targetBookTitle ? `Books similar to "${targetBookTitle}"` : query,
        metricUsed: metric,
        vectorDimensions: 4096,
        source: 'InMemoryVectorStore (FAISS IndexFlatL2 / Cosine Space)',
      });
    } catch (err: any) {
      console.error('Recommendation error:', err);
      res.status(500).json({ error: err.message || 'Recommendation failed' });
    }
  });

  // Supabase Favorites Endpoints
  app.get('/api/favorites', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/favorites', async (req, res) => {
    try {
      const { book_isbn13, book_title, book_authors, thumbnail, notes } = req.body;
      const { data, error } = await supabase
        .from('favorites')
        .insert([{ book_isbn13, book_title, book_authors, thumbnail, notes }])
        .select();

      if (error) throw error;
      res.json({ success: true, favorite: data?.[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/favorites/:isbn', async (req, res) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('book_isbn13', req.params.isbn);

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Notebook analysis and explanation endpoint
  app.get('/api/notebook', (req, res) => {
    try {
      let readme = '';
      const readmePath = path.resolve(process.cwd(), 'data/ORIGINAL_README.md');
      if (fs.existsSync(readmePath)) {
        readme = fs.readFileSync(readmePath, 'utf-8');
      }

      res.json({
        walkthrough: notebookWalkthrough,
        originalReadme: readme,
        architectureOverview: {
          originalStack: {
            language: 'Python (Jupyter Notebook)',
            vectorEngine: 'faiss-cpu (IndexFlatL2)',
            embeddingProvider: 'Ollama (Llama 2 model, 4096-dim embeddings)',
            dataset: 'books.csv (6,810 books)',
            limitations: 'Local Ollama computation required, partial index persistence',
          },
          modernProductionStack: {
            frontend: 'React 19 + TypeScript + Tailwind CSS + Motion',
            backend: 'Node.js Express + TSX + Vercel Serverless',
            database: 'Supabase PostgreSQL + pgvector (6,810 records)',
            vectorStore: 'InMemoryVectorStore with Cosine & FAISS L2 Euclidean distance',
            llmSynthesis: 'Google Gemini 3.6 Flash for intelligent reading rationales',
            performance: 'Sub-10ms vector search across all 6,810 books',
          },
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
}
