import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { Book, DatasetStats } from '../src/types.js';

let cachedBooks: Book[] | null = null;
let cachedStats: DatasetStats | null = null;

function buildTextualRepresentation(row: any): string {
  return `Title: ${row.title || 'Unknown Title'}
Author: ${row.authors || 'Unknown Author'}
Category: ${row.categories || 'Uncategorized'}
Description: ${row.description || 'No description available'}
Publication Year: ${row.published_year || 'Unknown'}
Average Rating: ${row.average_rating || 'N/A'}
Number of Pages: ${row.num_pages || 'N/A'}`;
}

export function loadBooks(): Book[] {
  if (cachedBooks) return cachedBooks;

  const csvPath = path.resolve(process.cwd(), 'data/books.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`books.csv not found at ${csvPath}`);
    return [];
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  });

  cachedBooks = records.map((row: any, index: number) => {
    const avgRating = parseFloat(row.average_rating) || 0;
    const numPages = parseInt(row.num_pages, 10) || 0;
    const ratingsCount = parseInt(row.ratings_count, 10) || 0;
    const isbn13 = (row.isbn13 && row.isbn13 !== '0') ? String(row.isbn13) : `custom-${index}`;
    const isbn10 = String(row.isbn10 || '');
    const title = String(row.title || 'Untitled');
    const authors = String(row.authors || 'Unknown');
    const categories = String(row.categories || 'Fiction');
    const description = String(row.description || '');

    // Thumbnail URL fallback or cleanup
    let thumbnail = String(row.thumbnail || '');
    if (thumbnail.startsWith('http://')) {
      thumbnail = thumbnail.replace('http://', 'https://');
    }

    const textualRep = buildTextualRepresentation({
      title,
      authors,
      categories,
      description,
      published_year: row.published_year,
      average_rating: avgRating,
      num_pages: numPages,
    });

    return {
      isbn13,
      isbn10,
      title,
      subtitle: String(row.subtitle || ''),
      authors,
      categories,
      thumbnail,
      description,
      published_year: row.published_year || '',
      average_rating: avgRating,
      num_pages: numPages,
      ratings_count: ratingsCount,
      textual_representation: textualRep,
    };
  });

  return cachedBooks;
}

export function getStats(): DatasetStats {
  if (cachedStats) return cachedStats;

  const books = loadBooks();
  const categoryMap = new Map<string, number>();
  let ratingSum = 0;
  let ratedCount = 0;

  for (const book of books) {
    const cats = book.categories.split(';').map(c => c.trim()).filter(Boolean);
    for (const cat of (cats.length ? cats : ['Uncategorized'])) {
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }
    if (book.average_rating > 0) {
      ratingSum += book.average_rating;
      ratedCount++;
    }
  }

  const sortedCategories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  cachedStats = {
    totalBooks: books.length,
    totalCategories: categoryMap.size,
    categories: sortedCategories.slice(0, 30),
    averageRating: ratedCount ? +(ratingSum / ratedCount).toFixed(2) : 0,
    vectorDimensions: 4096, // As used in Nathan Cordeiro's notebook with Llama2 / 768 in Gemini
    availableModels: ['Gemini 3.8 Flash (LLM)', 'Gemini Text-Embedding', 'FAISS L2 Flat / Cosine'],
  };

  return cachedStats;
}
