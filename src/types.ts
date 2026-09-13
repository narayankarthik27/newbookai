export interface Book {
  isbn13: string;
  isbn10: string;
  title: string;
  subtitle: string;
  authors: string;
  categories: string;
  thumbnail: string;
  description: string;
  published_year: string | number;
  average_rating: number;
  num_pages: number;
  ratings_count: number;
  textual_representation?: string;
}

export interface Recommendation {
  book: Book;
  score: number; // 0 to 1 similarity
  distance: number; // raw distance
  rank: number;
  aiExplanation?: string;
  matchedKeywords?: string[];
}

export interface DatasetStats {
  totalBooks: number;
  totalCategories: number;
  categories: { name: string; count: number }[];
  averageRating: number;
  vectorDimensions: number;
  availableModels: string[];
}

export interface NotebookCellExplanation {
  cellIndex: number;
  title: string;
  purpose: string;
  originalCode: string;
  deepDive: string;
  keyTakeaways: string[];
}
