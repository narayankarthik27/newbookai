import { NotebookCellExplanation } from '../src/types.js';

export const notebookWalkthrough: NotebookCellExplanation[] = [
  {
    cellIndex: 1,
    title: 'Cell 1: Environment & Pandas Setup',
    purpose: 'Import tabular data manipulation library to load and inspect the books catalog.',
    originalCode: `import pandas as pd`,
    deepDive: `Nathan initializes pandas to load the book dataset into a DataFrame. In this architecture, structured metadata (title, author, ratings, description) is read into memory before being formatted for semantic indexing.`,
    keyTakeaways: [
      'Sets up baseline Python data analysis environment',
      'Loads dataset containing 6,810 book entries',
    ],
  },
  {
    cellIndex: 2,
    title: 'Cell 2: Loading books.csv',
    purpose: 'Read the raw 6,810 book records from CSV into a Pandas DataFrame.',
    originalCode: `df = pd.read_csv('books.csv')
df`,
    deepDive: `The dataset contains 12 attributes including isbn13, title, subtitle, authors, categories, thumbnail, description, published_year, average_rating, and num_pages. This rich metadata serves as the foundational corpus for the recommender.`,
    keyTakeaways: [
      '6,810 records spanning dozens of literary genres',
      'Captures both qualitative descriptions and quantitative metrics like average ratings and page counts',
    ],
  },
  {
    cellIndex: 3,
    title: 'Cell 3: Constructing Textual Representation',
    purpose: 'Synthesizing disparate tabular columns into a unified semantic document per book.',
    originalCode: `def textual_representation(row):
    textual_representation = f"""Title: {row['title']}
Author: {row['authors']}
Category: {row['categories']}
Description: {row['description']}
Publication Year: {row['published_year']}
Average Rating: {row['average_rating']}
Number of Pages: {row['num_pages']}"""
    return textual_representation`,
    deepDive: `Embedding models take unstructured strings rather than separate database columns. By structuring each book into a single formatted multi-line string containing Title, Author, Category, Description, and Metadata, the vector model can capture relational semantics (e.g. associating Agatha Christie with detective fiction and high average ratings).`,
    keyTakeaways: [
      'Transforms multi-column tabular data into a unified textual format',
      'Preserves explicit attribute names so embedding models recognize field semantics',
    ],
  },
  {
    cellIndex: 7,
    title: 'Cell 7: Applying Representation to Corpus',
    purpose: 'Batch processing every book into a textual representation column.',
    originalCode: `df['textual_representation'] = df.apply(textual_representation, axis=1)`,
    deepDive: `Executes the transformation over all 6,810 rows in the dataframe, preparing the input array for vectorization.`,
    keyTakeaways: [
      'Generates 6,810 standardized text documents ready for vectorization',
    ],
  },
  {
    cellIndex: 8,
    title: 'Cell 8: Initializing FAISS Vector Store & Matrices',
    purpose: 'Creating the high-dimensional Vector Index using Meta’s FAISS library.',
    originalCode: `import faiss
import requests
import numpy as np

dim = 4096 # Dimension of the embeddings because thats the dimensionality response we get from olamma2
index = faiss.IndexFlatL2(dim)  # L2 distance index
X = np.zeros((len(df['textual_representation']), dim), dtype=np.float32)`,
    deepDive: `FAISS (Facebook AI Similarity Search) is an open-source library optimized for dense vector clustering and similarity search. Nathan chooses IndexFlatL2 with dimension 4096, which matches the output vector dimension of Ollama Llama 2 embeddings. IndexFlatL2 performs exact brute-force Euclidean distance search across all vectors.`,
    keyTakeaways: [
      'Dimension = 4096 (Ollama / Llama 2 embedding size)',
      'IndexFlatL2 computes Euclidean distance: D(u, v) = sum((u_i - v_i)^2)',
      'Allocates a 6,810 x 4096 32-bit floating point matrix X',
    ],
  },
  {
    cellIndex: 9,
    title: 'Cell 9: Embedding via Local Ollama API & Index Ingestion',
    purpose: 'Querying local LLM endpoint to generate dense vector embeddings.',
    originalCode: `for i, representation in enumerate(df['textual_representation']):
    if i % 100 == 0:
        print(f"Processing row {i} of {len(df['textual_representation'])}")
        response = requests.post('http://localhost:11434/api/embeddings',
                             json={
                                 'model' : 'llama2',
                                 'prompt' : representation
                             })
    embedding = response.json()['embedding']
    X[i] = np.array(embedding, dtype=np.float32)
    index.add(X)  # Add embeddings to the index`,
    deepDive: `In this loop, Nathan queries a local Ollama instance running Llama 2 via HTTP POST to /api/embeddings. Note: in cell 9 of the notebook, index.add(X) was inside the loop, and because embedding 6,810 items with a 7B model locally is computationally expensive, Nathan noted in README that the index file was partial. Our production web app provides real-time vector search across the entire 6,810 book catalog!`,
    keyTakeaways: [
      'Uses local LLM Ollama server for private offline embeddings',
      'Highlights the computational challenge of embedding large corpora locally',
      'Demonstrates the transition from local batch embedding to cloud vector search',
    ],
  },
  {
    cellIndex: 10,
    title: 'Cell 10-12: Serializing & Persisting the Vector Index',
    purpose: 'Saving and reading the FAISS vector index to/from disk.',
    originalCode: `faiss.write_index(index, 'index')  # Save the index to a file
index = faiss.read_index('index')  # Load the index from a file`,
    deepDive: `Persisting the compiled vector index avoids the costly re-embedding process on application restarts. Once serialized, querying a FAISS index takes microseconds.`,
    keyTakeaways: [
      'Fast disk-based serialization for production reuse',
      'Zero retraining needed when querying pre-indexed books',
    ],
  },
  {
    cellIndex: 14,
    title: 'Cell 14: Choosing a Favorite Book Query',
    purpose: 'Selecting a target anchor book to find semantic matches for.',
    originalCode: `favorite_book = df.iloc[4533]
favorite_book`,
    deepDive: `Nathan picks row index 4533 from the dataset as the reference book. In our interactive web application, users can search or select ANY of the 6,810 books in real-time or type custom natural language descriptions.`,
    keyTakeaways: [
      'Demonstrates Book-to-Book collaborative/content similarity search',
      'Extracts the textual representation of the user-selected favorite book',
    ],
  },
  {
    cellIndex: 15,
    title: 'Cell 15-16: Vectorizing the Query',
    purpose: 'Converting the selected book or query into the exact same 4096-d vector space.',
    originalCode: `response = requests.post('http://localhost:11434/api/embeddings',
                            json={
                                'model' : 'llama2',
                                'prompt' : favorite_book['textual_representation']
                            })
embedding = np.array([response.json()['embedding']], dtype=np.float32)`,
    deepDive: `For similarity search to function, the search query MUST be projected into the identical vector space as the indexed documents using the same embedding model.`,
    keyTakeaways: [
      'Projects target into high-dimensional latent semantic space',
      'Ensures dimensional and normalization alignment',
    ],
  },
  {
    cellIndex: 17,
    title: 'Cell 17: FAISS Nearest Neighbor Search',
    purpose: 'Searching the vector index for the top-10 nearest neighbors.',
    originalCode: `D, I = index.search(embedding, 10)  # Search for the 10 nearest neighbors`,
    deepDive: `FAISS searches the 4096-dimensional space and returns two arrays: D (distances to the nearest items) and I (integer row indices of the nearest items). Smaller distance D means higher semantic similarity.`,
    keyTakeaways: [
      'Sub-millisecond nearest neighbor search',
      'D = array of Euclidean distances, I = array of row indices',
    ],
  },
  {
    cellIndex: 18,
    title: 'Cell 18-19: Unpacking & Displaying Recommendations',
    purpose: 'Retrieving the matched books from DataFrame indices and printing recommendations.',
    originalCode: `best_matches = np.array(df['textual_representation'])[I.flatten()]
for match in best_matches:
    print(match)
    print('-' * 80)`,
    deepDive: `Maps the resulting indices back to the original metadata, displaying the top recommendations. In our modern full-stack web application, this is enriched with Gemini LLM rationale, cover art, interactive filters, and vector distance visualization!`,
    keyTakeaways: [
      'Maps vector coordinates back to human-readable titles, authors, and synopses',
      'Completed the end-to-end LLM + Vector Store recommendation loop',
    ],
  },
];
