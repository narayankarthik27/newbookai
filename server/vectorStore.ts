import { Book, Recommendation } from '../src/types.js';
import { loadBooks } from './booksData.js';

interface VectorDocument {
  index: number;
  book: Book;
  terms: Map<number, number>; // termId -> weight
  norm: number; // Euclidean norm for cosine similarity
}

export class InMemoryVectorStore {
  private docs: VectorDocument[] = [];
  private termToId: Map<string, number> = new Map();
  private idToTerm: string[] = [];
  private docFrequencies: number[] = [];
  private initialized = false;

  private stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
    'by', 'can', 'did', 'do', 'does', 'doing', 'don', 'down', 'during', 'each', 'few', 'for',
    'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself',
    'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just',
    'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once',
    'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 's', 'same', 'she',
    'should', 'so', 'some', 'such', 't', 'than', 'that', 'the', 'their', 'theirs', 'them',
    'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
    'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which',
    'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours'
  ]);

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter(w => w.length > 2 && !this.stopWords.has(w));
  }

  public initialize(): void {
    if (this.initialized) return;

    const books = loadBooks();
    const docTermFreqs: Map<number, number>[] = [];

    // Phase 1: Collect vocabulary and term frequencies across textual representations
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      // Include title, authors, categories, and description with weighting
      const tokensTitle = this.tokenize(book.title);
      const tokensAuthors = this.tokenize(book.authors);
      const tokensCats = this.tokenize(book.categories);
      const tokensDesc = this.tokenize(book.description);

      const tfMap = new Map<number, number>();

      const addTokens = (tokens: string[], weightMultiplier: number) => {
        for (const token of tokens) {
          let termId = this.termToId.get(token);
          if (termId === undefined) {
            termId = this.idToTerm.length;
            this.termToId.set(token, termId);
            this.idToTerm.push(token);
            this.docFrequencies.push(0);
          }
          tfMap.set(termId, (tfMap.get(termId) || 0) + weightMultiplier);
        }
      };

      addTokens(tokensTitle, 3.0);
      addTokens(tokensCats, 2.5);
      addTokens(tokensAuthors, 2.0);
      addTokens(tokensDesc, 1.0);

      // Increment document frequency for each unique term in this doc
      for (const termId of tfMap.keys()) {
        this.docFrequencies[termId] = (this.docFrequencies[termId] || 0) + 1;
      }

      docTermFreqs.push(tfMap);
    }

    const totalDocs = books.length;

    // Phase 2: Compute TF-IDF weights and vector norms
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      const tfMap = docTermFreqs[i];
      const weightedTerms = new Map<number, number>();
      let sumSq = 0;

      for (const [termId, tf] of tfMap.entries()) {
        const df = this.docFrequencies[termId] || 1;
        // Smoothed IDF
        const idf = Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5));
        // Sublinear TF scaling
        const weight = (1 + Math.log(tf)) * idf;
        weightedTerms.set(termId, weight);
        sumSq += weight * weight;
      }

      const norm = Math.sqrt(sumSq) || 1;

      this.docs.push({
        index: i,
        book,
        terms: weightedTerms,
        norm,
      });
    }

    this.initialized = true;
    console.log(`Vector Store initialized: ${this.docs.length} books, ${this.idToTerm.length} dimensional vocabulary.`);
  }

  public search(params: {
    query?: string;
    bookId?: string;
    category?: string;
    minRating?: number;
    metric?: 'cosine' | 'l2';
    topK?: number;
  }): Recommendation[] {
    if (!this.initialized) {
      this.initialize();
    }

    const {
      query = '',
      bookId = '',
      category = '',
      minRating = 0,
      metric = 'cosine',
      topK = 8,
    } = params;

    let queryVector: Map<number, number> = new Map();
    let queryNorm = 1;
    let queryTermsList: string[] = [];
    let excludedBookIndex = -1;

    // Case 1: Search by favorite book ID (as in Nathan's notebook cell 14)
    if (bookId) {
      const targetDoc = this.docs.find(d => d.book.isbn13 === bookId || String(d.index) === bookId);
      if (targetDoc) {
        queryVector = targetDoc.terms;
        queryNorm = targetDoc.norm;
        excludedBookIndex = targetDoc.index;
        queryTermsList = this.tokenize(targetDoc.book.title + ' ' + targetDoc.book.categories);
      }
    }

    // Case 2: Natural language text query
    if (query && queryVector.size === 0) {
      const tokens = this.tokenize(query);
      queryTermsList = tokens;
      const tfMap = new Map<number, number>();
      for (const t of tokens) {
        const id = this.termToId.get(t);
        if (id !== undefined) {
          tfMap.set(id, (tfMap.get(id) || 0) + 1);
        }
      }

      let sumSq = 0;
      for (const [id, count] of tfMap.entries()) {
        const df = this.docFrequencies[id] || 1;
        const idf = Math.log(1 + (this.docs.length - df + 0.5) / (df + 0.5));
        const weight = (1 + Math.log(count)) * idf;
        queryVector.set(id, weight);
        sumSq += weight * weight;
      }
      queryNorm = Math.sqrt(sumSq) || 1;
    }

    // If query vector is empty, return top rated books
    if (queryVector.size === 0) {
      let filtered = this.docs.filter(d => d.index !== excludedBookIndex);
      if (category && category !== 'All') {
        filtered = filtered.filter(d => d.book.categories.toLowerCase().includes(category.toLowerCase()));
      }
      if (minRating > 0) {
        filtered = filtered.filter(d => d.book.average_rating >= minRating);
      }
      return filtered
        .sort((a, b) => b.book.average_rating - a.book.average_rating)
        .slice(0, topK)
        .map((doc, idx) => ({
          book: doc.book,
          score: 0.5,
          distance: 1.0,
          rank: idx + 1,
          matchedKeywords: [],
        }));
    }

    const queryTermIds = Array.from(queryVector.keys());
    const candidates: { doc: VectorDocument; score: number; distance: number; matchedWords: string[] }[] = [];

    for (const doc of this.docs) {
      if (doc.index === excludedBookIndex) continue;

      if (category && category !== 'All' && !doc.book.categories.toLowerCase().includes(category.toLowerCase())) {
        continue;
      }
      if (minRating > 0 && doc.book.average_rating < minRating) {
        continue;
      }

      // Compute dot product between sparse vectors
      let dotProduct = 0;
      const matchedWords: string[] = [];

      for (const termId of queryTermIds) {
        const docWeight = doc.terms.get(termId);
        if (docWeight !== undefined) {
          const qWeight = queryVector.get(termId)!;
          dotProduct += qWeight * docWeight;
          matchedWords.push(this.idToTerm[termId]);
        }
      }

      if (dotProduct <= 0 && matchedWords.length === 0) continue;

      // Cosine similarity: dotProduct / (normA * normB)
      const cosineSim = Math.min(1.0, Math.max(0.0, dotProduct / (queryNorm * doc.norm)));

      // Euclidean L2 distance approximation from normalized unit vectors:
      // ||u - v||^2 = ||u||^2 + ||v||^2 - 2 * (u . v) = 2 - 2 * cosineSim
      const l2Distance = Math.sqrt(Math.max(0, 2 - 2 * cosineSim));

      const finalScore = metric === 'cosine' ? cosineSim : Math.max(0, 1 - (l2Distance / 2));

      candidates.push({
        doc,
        score: +finalScore.toFixed(4),
        distance: +(metric === 'l2' ? l2Distance : 1 - cosineSim).toFixed(4),
        matchedWords: matchedWords.slice(0, 6),
      });
    }

    // Sort descending by score
    candidates.sort((a, b) => b.score - a.score);

    return candidates.slice(0, topK).map((item, idx) => ({
      book: item.doc.book,
      score: item.score,
      distance: item.distance,
      rank: idx + 1,
      matchedKeywords: item.matchedWords,
    }));
  }

  public getBookByIndex(index: number): Book | undefined {
    return this.docs[index]?.book;
  }

  public getBookByIsbn(isbn: string): Book | undefined {
    return this.docs.find(d => d.book.isbn13 === isbn || d.book.isbn10 === isbn)?.book;
  }
}

export const vectorStore = new InMemoryVectorStore();
