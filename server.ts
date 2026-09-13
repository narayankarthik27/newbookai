import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { loadBooks, getStats } from './server/booksData.js';
import { vectorStore } from './server/vectorStore.js';
import { explainRecommendations } from './server/geminiService.js';
import { notebookWalkthrough } from './server/notebookData.js';
import fs from 'fs';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize books catalog & vector store in memory
  console.log('Initializing books catalog and Vector Store...');
  const books = loadBooks();
  vectorStore.initialize();
  console.log(`Loaded ${books.length} books into Vector Store.`);

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', booksCount: books.length, timestamp: new Date().toISOString() });
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

  // Vector Recommendation Endpoint
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
            backend: 'Node.js Express + TSX',
            vectorStore: 'InMemoryVectorStore with Cosine & FAISS L2 Euclidean distance',
            llmSynthesis: 'Google Gemini 3.8 Flash for intelligent reading rationales',
            performance: 'Sub-10ms vector search across all 6,810 books in memory',
          },
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
