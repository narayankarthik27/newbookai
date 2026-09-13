import { loadBooks } from './booksData.js';
import { supabase } from './supabase.js';

async function syncBooksToSupabase() {
  console.log('Loading books from local dataset...');
  const books = loadBooks();
  console.log(`Found ${books.length} books. Starting sync to Supabase...`);

  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < books.length; i += batchSize) {
    const batch = books.slice(i, i + batchSize).map(b => ({
      isbn13: b.isbn13,
      isbn10: b.isbn10,
      title: b.title,
      subtitle: b.subtitle,
      authors: b.authors,
      categories: b.categories,
      thumbnail: b.thumbnail,
      description: b.description,
      published_year: b.published_year,
      average_rating: b.average_rating || 0,
      num_pages: b.num_pages || 0,
      ratings_count: b.ratings_count || 0,
      textual_representation: b.textual_representation,
    }));

    const { error } = await supabase.from('books').upsert(batch, { onConflict: 'isbn13' });
    if (error) {
      console.error(`Error syncing batch ${i / batchSize + 1}:`, error.message);
    } else {
      inserted += batch.length;
      process.stdout.write(`\rSynced ${inserted} / ${books.length} books to Supabase`);
    }
  }

  console.log('\nSupabase books sync complete!');
}

syncBooksToSupabase().catch(err => {
  console.error('Failed to sync to Supabase:', err);
});
